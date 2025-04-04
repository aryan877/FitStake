use anchor_lang::prelude::*;

// This is the program ID that uniquely identifies this Solana program on the blockchain
declare_id!("5hTA47XZPkJK7d6JrCEcmUaDbt6bgxNjgUDbRBo593er"); 

/* 
 * FitStake Accountability Smart Contract
 * 
 * This contract allows users to create fitness challenges, stake SOL,
 * and earn rewards for completing challenges. The contract supports:
 * - Creating challenges with customizable parameters
 * - Joining challenges by staking SOL
 * - Automated verification of challenge completion by trusted backend
 * - Distributing rewards to successful participants
 */

#[program]
pub mod accountability {
    use super::*;

    // Initialize a new challenge with specified parameters
    pub fn create_challenge(
        ctx: Context<CreateChallenge>,
        challenge_id: String,          // Unique identifier for the challenge
        stake_amount: u64,             // Amount each participant must stake (in lamports)
        start_time: i64,               // Unix timestamp when challenge starts
        end_time: i64,                 // Unix timestamp when challenge ends
        min_participants: u8,          // Minimum participants required to activate challenge
        max_participants: u8,          // Maximum allowed participants
    ) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        challenge.authority = ctx.accounts.authority.key();  // Challenge creator
        challenge.challenge_id = challenge_id;
        challenge.stake_amount = stake_amount;
        challenge.start_time = start_time;
        challenge.end_time = end_time;
        challenge.min_participants = min_participants;
        challenge.max_participants = max_participants;
        challenge.participant_count = 0;                     // Initialize with zero participants
        challenge.total_stake = 0;                           // Initialize with zero total stake
        challenge.is_active = false;                         // Challenge becomes active when min participants join
        challenge.is_completed = false;                      // Challenge is completed after end_time
        
        // Set the contract deployer (program ID) as the admin for all challenges
        // This ensures only the program owner can mark challenges as completed
        challenge.admin = *ctx.program_id;
        
        Ok(())
    }

    // Join a challenge by staking SOL
    pub fn join_challenge(ctx: Context<JoinChallenge>) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let participant = &mut ctx.accounts.participant;

        // Verify challenge isn't already completed
        require!(
            !challenge.is_completed,
            AccountingError::ChallengeCompleted
        );
        
        // Verify challenge has started
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time >= challenge.start_time,
            AccountingError::ChallengeNotStarted
        );
        
        // Verify challenge has room for more participants
        require!(
            challenge.participant_count < challenge.max_participants,
            AccountingError::MaxParticipantsReached
        );

        // Transfer SOL from participant's wallet to vault PDA
        let amount = challenge.stake_amount;
        let cpi_context = CpiContext::new(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.participant_authority.to_account_info(),
                to: ctx.accounts.vault.to_account_info(),
            },
        );
        anchor_lang::system_program::transfer(cpi_context, amount)?;

        // Record participant information
        participant.authority = ctx.accounts.participant_authority.key();
        participant.challenge = challenge.key();
        participant.stake_amount = challenge.stake_amount;
        participant.completed = false;  // Participant hasn't completed the challenge yet
        participant.claimed = false;    // Participant hasn't claimed rewards yet

        // Update challenge statistics
        challenge.participant_count += 1;
        challenge.total_stake += challenge.stake_amount;

        // Activate challenge if minimum participants threshold is reached
        if challenge.participant_count >= challenge.min_participants {
            challenge.is_active = true;
        }

        Ok(())
    }
    
    // Admin completes challenges for multiple participants at once
    pub fn admin_complete_challenges(
        ctx: Context<AdminCompleteChallenge>,
        participant_wallets: Vec<Pubkey>  // List of participant wallet addresses to mark as completed
    ) -> Result<()> {
        let challenge = &ctx.accounts.challenge;
        
        // Verify the caller is the program admin (contract deployer) set during challenge creation
        require!(
            ctx.accounts.admin.key() == challenge.admin,
            AccountingError::UnauthorizedAdmin
        );
        
        // Verify challenge is active and not completed
        require!(challenge.is_active, AccountingError::ChallengeNotActive);
        
        // Store the participant wallets in the challenge's completed list
        let completed_list = &mut ctx.accounts.completed_list;
        completed_list.wallets = participant_wallets;
        completed_list.challenge = challenge.key();
        completed_list.is_processed = false;
        
        Ok(())
    }

    // Distribute rewards to winners who completed the challenge
    pub fn claim_reward(ctx: Context<ClaimReward>) -> Result<()> {
        let challenge = &mut ctx.accounts.challenge;
        let participant = &mut ctx.accounts.participant;
        let completed_list = &ctx.accounts.completed_list;

        // Verify challenge has ended
        let current_time = Clock::get()?.unix_timestamp;
        require!(
            current_time >= challenge.end_time,
            AccountingError::ChallengeNotEnded
        );
        
        // Mark the challenge as completed if it hasn't been marked already
        if !challenge.is_completed {
            challenge.is_completed = true;
        }
        
        // Verify participant hasn't already claimed rewards
        require!(!participant.claimed, AccountingError::AlreadyClaimed);
        
        // Verify participant is in the completed list
        let participant_wallet = ctx.accounts.participant_authority.key();
        let is_completed = completed_list.wallets.iter().any(|wallet| *wallet == participant_wallet);
        require!(is_completed, AccountingError::NotCompleted);

        // Calculate reward amount (including a share of failed participants' stakes)
        let completed_count = completed_list.wallets.len() as u8;
        let reward_amount = calculate_reward(
            challenge.total_stake,
            completed_count,
            participant.stake_amount,
        );

        // Transfer SOL from vault to participant
        // Using bump seeds to authorize the PDA to sign
        let vault_bump = *ctx.bumps.get("vault").unwrap();
        let challenge_key = challenge.key();
        let seeds = &[b"vault", challenge_key.as_ref(), &[vault_bump]];
        let signer = &[&seeds[..]];

        // Create the CPI context with signer seeds
        let cpi_context = CpiContext::new_with_signer(
            ctx.accounts.system_program.to_account_info(),
            anchor_lang::system_program::Transfer {
                from: ctx.accounts.vault.to_account_info(),
                to: ctx.accounts.participant_authority.to_account_info(),
            },
            signer,
        );
        
        // Perform the transfer
        anchor_lang::system_program::transfer(cpi_context, reward_amount)?;

        // Mark participant as having claimed their reward
        participant.claimed = true;
        
        // Mark participant as completed
        participant.completed = true;
        
        Ok(())
    }
}

// Account structure for challenge creation
#[derive(Accounts)]
#[instruction(challenge_id: String)]
pub struct CreateChallenge<'info> {
    // Challenge account - stores all challenge data
    #[account(
        init,
        payer = authority,
        space = Challenge::LEN,
        seeds = [b"challenge", challenge_id.as_bytes()],
        bump
    )]
    pub challenge: Account<'info, Challenge>,
    
    // Authority is the creator of the challenge who pays for account creation
    #[account(mut)]
    pub authority: Signer<'info>,
    
    // Required for creating new accounts on Solana
    pub system_program: Program<'info, System>,
}

// Account structure for joining a challenge
#[derive(Accounts)]
pub struct JoinChallenge<'info> {
    // Challenge account - will be updated to track new participant
    #[account(mut)]
    pub challenge: Account<'info, Challenge>,
    
    // Participant account - stores participant's challenge data
    #[account(
        init,
        payer = participant_authority,
        space = Participant::LEN,
        seeds = [b"participant", challenge.key().as_ref(), participant_authority.key().as_ref()],
        bump
    )]
    pub participant: Account<'info, Participant>,
    
    // Vault account that holds staked SOL for this challenge (PDA)
    #[account(
        mut,
        seeds = [b"vault", challenge.key().as_ref()],
        bump
    )]
    /// CHECK: This is a PDA that acts as a SOL vault
    pub vault: UncheckedAccount<'info>,
    
    // Participant's wallet that signs the transaction and pays for account creation
    #[account(mut)]
    pub participant_authority: Signer<'info>,
    
    // Required for SOL transfers on Solana
    pub system_program: Program<'info, System>,
}

// Account structure for admin completing challenges
#[derive(Accounts)]
pub struct AdminCompleteChallenge<'info> {
    // Challenge account
    #[account(mut)]
    pub challenge: Account<'info, Challenge>,
    
    // CompletedList account - stores list of completed participants
    #[account(
        init,
        payer = admin,
        space = 8 + 32 + 4 + (32 * 256) + 1, // discriminator + challenge pubkey + vec len + max 256 pubkeys + bool
        seeds = [b"completed_list", challenge.key().as_ref()],
        bump
    )]
    pub completed_list: Account<'info, CompletedList>,
    
    // Admin wallet that signs the transaction
    #[account(mut)]
    pub admin: Signer<'info>,
    
    // Required for creating new accounts on Solana
    pub system_program: Program<'info, System>,
}

// Account structure for claiming rewards
#[derive(Accounts)]
pub struct ClaimReward<'info> {
    // Challenge account
    #[account(mut)]
    pub challenge: Account<'info, Challenge>,
    
    // Participant account - will be marked as having claimed rewards
    #[account(
        mut,
        seeds = [b"participant", challenge.key().as_ref(), participant_authority.key().as_ref()],
        bump
    )]
    pub participant: Account<'info, Participant>,
    
    // Completed list containing wallets of participants who completed the challenge
    #[account(
        seeds = [b"completed_list", challenge.key().as_ref()],
        bump
    )]
    pub completed_list: Account<'info, CompletedList>,
    
    // Vault account that holds the staked SOL and will send rewards
    #[account(
        mut,
        seeds = [b"vault", challenge.key().as_ref()],
        bump,
    )]
    /// CHECK: This is a PDA that acts as a SOL vault
    pub vault: UncheckedAccount<'info>,
    
    // Participant's wallet that signs the transaction and receives rewards
    #[account(mut)]
    pub participant_authority: Signer<'info>,
    
    // Required for SOL transfers on Solana
    pub system_program: Program<'info, System>,
}

// Challenge data structure
#[account]
pub struct Challenge {
    pub authority: Pubkey,          // Creator of the challenge
    pub admin: Pubkey,              // Program admin (contract deployer) with privileges to mark completions
    pub challenge_id: String,       // Unique identifier
    pub stake_amount: u64,          // Amount each participant must stake (in lamports)
    pub start_time: i64,            // Challenge start timestamp
    pub end_time: i64,              // Challenge end timestamp
    pub min_participants: u8,       // Minimum participants needed to activate
    pub max_participants: u8,       // Maximum allowed participants
    pub participant_count: u8,      // Current number of participants
    pub total_stake: u64,           // Total SOL staked in the challenge
    pub is_active: bool,            // Whether challenge is active
    pub is_completed: bool,         // Whether challenge is completed
}

// Participant data structure
#[account]
pub struct Participant {
    pub authority: Pubkey,          // Participant's wallet address
    pub challenge: Pubkey,          // Challenge this participant joined
    pub stake_amount: u64,          // Amount participant staked
    pub completed: bool,            // Whether participant completed the challenge
    pub claimed: bool,              // Whether participant claimed rewards
}

// CompletedList data structure - stores list of wallets that completed the challenge
#[account]
pub struct CompletedList {
    pub challenge: Pubkey,          // Challenge this list belongs to
    pub wallets: Vec<Pubkey>,       // List of wallet addresses that completed the challenge
    pub is_processed: bool,         // Whether this list has been processed
}

// Size constants for account allocation
impl Challenge {
    pub const LEN: usize = 8 +      // Account discriminator
        32 +                        // authority: Pubkey
        32 +                        // admin: Pubkey
        4 + 100 +                   // challenge_id: String (4 bytes for length + max 100 chars)
        8 +                         // stake_amount: u64
        8 +                         // start_time: i64
        8 +                         // end_time: i64
        1 +                         // min_participants: u8
        1 +                         // max_participants: u8
        1 +                         // participant_count: u8
        8 +                         // total_stake: u64
        1 +                         // is_active: bool
        1;                          // is_completed: bool
}

impl Participant {
    pub const LEN: usize = 8 +      // Account discriminator
        32 +                        // authority: Pubkey
        32 +                        // challenge: Pubkey
        8 +                         // stake_amount: u64
        1 +                         // completed: bool
        1;                          // claimed: bool
}

// Custom error codes with descriptive messages
#[error_code]
pub enum AccountingError {
    #[msg("Challenge is already completed")]
    ChallengeCompleted,
    #[msg("Maximum participants reached")]
    MaxParticipantsReached,
    #[msg("Challenge is not active")]
    ChallengeNotActive,
    #[msg("Challenge has not ended yet")]
    ChallengeNotEnded,
    #[msg("Challenge has not started yet")]
    ChallengeNotStarted,
    #[msg("Challenge is not completed")]
    ChallengeNotCompleted,
    #[msg("Participant has already completed the challenge")]
    AlreadyCompleted,
    #[msg("Participant has not completed the challenge")]
    NotCompleted,
    #[msg("Rewards already claimed")]
    AlreadyClaimed,
    #[msg("Unauthorized admin")]
    UnauthorizedAdmin,
}

// Calculate reward distribution
// This simple implementation divides the total stake equally among all participants
fn calculate_reward(total_stake: u64, completed_count: u8, _stake_amount: u64) -> u64 {
    if completed_count == 0 {
        return 0;
    }
    // Winners split the pool equally
    total_stake / completed_count as u64
}