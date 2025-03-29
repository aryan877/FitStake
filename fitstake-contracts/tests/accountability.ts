import * as anchor from "@project-serum/anchor";
import { Program } from "@project-serum/anchor";
import { Accountability } from "../target/types/accountability";

describe("accountability", () => {
  // Use the existing provider with the configured keypair
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Accountability as Program<Accountability>;

  let challengeAccount: anchor.web3.PublicKey;
  let vaultAccount: anchor.web3.PublicKey;
  let participantAccount: anchor.web3.PublicKey;

  const challengeId = "fitstake-test-" + Math.floor(Math.random() * 1000);
  const stakeAmount = new anchor.BN(1000000); // 1 SOL in lamports
  const startTime = new anchor.BN(Math.floor(Date.now() / 1000));
  const endTime = new anchor.BN(Math.floor(Date.now() / 1000) + 86400); // 24 hours
  const minParticipants = 2;
  const maxParticipants = 10;

  before(async () => {
    // Derive PDA for challenge account
    [challengeAccount] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("challenge"), Buffer.from(challengeId)],
      program.programId
    );

    // Derive PDA for vault account
    [vaultAccount] = await anchor.web3.PublicKey.findProgramAddress(
      [Buffer.from("vault"), challengeAccount.toBuffer()],
      program.programId
    );

    // Derive PDA for participant account
    [participantAccount] = await anchor.web3.PublicKey.findProgramAddress(
      [
        Buffer.from("participant"),
        challengeAccount.toBuffer(),
        provider.wallet.publicKey.toBuffer(),
      ],
      program.programId
    );
  });

  it("Creates a challenge", async () => {
    try {
      await program.methods
        .createChallenge(
          challengeId,
          stakeAmount,
          startTime,
          endTime,
          minParticipants,
          maxParticipants
        )
        .accounts({
          challenge: challengeAccount,
          authority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const challenge = await program.account.challenge.fetch(challengeAccount);

      // Basic validation
      console.assert(
        challenge.challengeId === challengeId,
        "Challenge ID mismatch"
      );
      console.assert(
        challenge.stakeAmount.toString() === stakeAmount.toString(),
        "Stake amount mismatch"
      );
      console.assert(
        challenge.participantCount === 0,
        "Participant count should be 0"
      );
    } catch (error) {
      console.error("Error creating challenge:", error);
      throw error;
    }
  });

  it("Allows a participant to join", async () => {
    try {
      await program.methods
        .joinChallenge()
        .accounts({
          challenge: challengeAccount,
          participant: participantAccount,
          vault: vaultAccount,
          participantAuthority: provider.wallet.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();

      const challenge = await program.account.challenge.fetch(challengeAccount);

      const participant = await program.account.participant.fetch(
        participantAccount
      );

      // Basic validation
      console.assert(
        challenge.participantCount === 1,
        "Participant count should be 1"
      );
      console.assert(
        challenge.totalStake.toString() === stakeAmount.toString(),
        "Total stake should match stake amount"
      );
      console.assert(
        participant.stakeAmount.toString() === stakeAmount.toString(),
        "Participant stake amount mismatch"
      );
      console.assert(
        participant.completed === false,
        "Participant should not be marked as completed"
      );
    } catch (error) {
      console.error("Error joining challenge:", error);
      throw error;
    }
  });
});
