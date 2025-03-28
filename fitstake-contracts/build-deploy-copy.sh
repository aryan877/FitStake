#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${YELLOW}===================================${NC}"
echo -e "${YELLOW}   FitStake Contract Automation    ${NC}"
echo -e "${YELLOW}===================================${NC}"

# Check if the Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo -e "${RED}Error: Solana CLI is not installed.${NC}"
    echo "Please install Solana CLI first: https://docs.solana.com/cli/install-solana-cli-tools"
    exit 1
fi

# Set to devnet if not already
NETWORK=$(solana config get | grep "RPC URL" | grep -i devnet || echo "NOT_DEVNET")
if [[ $NETWORK == "NOT_DEVNET" ]]; then
    echo -e "${YELLOW}Setting Solana CLI to devnet...${NC}"
    solana config set --url https://api.devnet.solana.com
fi

# Ensure keypair.json exists
if [ ! -f "keypair.json" ]; then
    echo -e "${RED}Error: keypair.json not found${NC}"
    echo -e "Do you want to generate a new keypair? (y/n)"
    read -r generate_keypair
    
    if [[ "$generate_keypair" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Generating new keypair...${NC}"
        solana-keygen new -o keypair.json
    else
        echo "Please generate a keypair using 'solana-keygen new -o keypair.json'"
        exit 1
    fi
fi

# Get keypair public key
PUBKEY=$(solana-keygen pubkey keypair.json)
echo -e "${GREEN}Using keypair with pubkey: ${YELLOW}$PUBKEY${NC}"

# Check/fund keypair balance
BALANCE=$(solana balance $PUBKEY | grep SOL || echo "0 SOL")
echo -e "${GREEN}Current balance: ${YELLOW}$BALANCE${NC}"

if [[ $BALANCE == "0 SOL" ]]; then
    echo -e "${YELLOW}Your keypair has no SOL. You need SOL to deploy contracts.${NC}"
    echo -e "${YELLOW}Do you want to request SOL from devnet faucet? (y/n)${NC}"
    read -r request_sol
    
    if [[ "$request_sol" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Requesting SOL from devnet faucet...${NC}"
        solana airdrop 2 $PUBKEY
        sleep 2
        BALANCE=$(solana balance $PUBKEY | grep SOL)
        echo -e "${GREEN}New balance: ${YELLOW}$BALANCE${NC}"
    else
        echo -e "${BLUE}Please fund your keypair manually using:${NC}"
        echo -e "${BLUE}solana airdrop 2 $PUBKEY${NC}"
        exit 1
    fi
fi

# Step 1: Build the contract
echo -e "\n${GREEN}Step 1: Building the Solana contract...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completed successfully.${NC}"

# Check if IDL exists
if [ ! -f "target/idl/accountability.json" ]; then
    echo -e "${RED}Error: IDL file not found at target/idl/accountability.json${NC}"
    exit 1
fi

# Step 2: Deploy contract
echo -e "\n${GREEN}Step 2: Deploying the contract with keypair.json...${NC}"
npm run deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Deployment failed.${NC}"
    echo -e "${YELLOW}This could be due to insufficient SOL in your keypair.${NC}"
    echo -e "${YELLOW}Try running 'solana airdrop 2 $PUBKEY' and deploy again.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Contract deployed successfully.${NC}"

# Get the program ID
PROGRAM_ID=$(solana address -k target/deploy/accountability-keypair.json)
echo -e "\n${GREEN}Program ID: ${YELLOW}$PROGRAM_ID${NC}"

# Verify upgrade authority
echo -e "\n${GREEN}Verifying upgrade authority...${NC}"
AUTHORITY=$(solana program show $PROGRAM_ID --output json | grep -o '"authority": "[^"]*"' | cut -d'"' -f4)
if [[ "$AUTHORITY" == "$PUBKEY" ]]; then
    echo -e "${GREEN}✓ Your keypair is correctly set as the upgrade authority.${NC}"
else
    echo -e "${YELLOW}Warning: Upgrade authority is not set to your keypair.${NC}"
    echo -e "${YELLOW}Current authority: $AUTHORITY${NC}"
    echo -e "${YELLOW}Your keypair: $PUBKEY${NC}"
    
    # Set keypair as upgrade authority
    echo -e "${GREEN}Setting your keypair as the upgrade authority...${NC}"
    solana program set-upgrade-authority $PROGRAM_ID --new-upgrade-authority $PUBKEY
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to set upgrade authority.${NC}"
    else
        echo -e "${GREEN}✓ Successfully set your keypair as the upgrade authority.${NC}"
    fi
fi

# Step 3: Copy files
echo -e "\n${GREEN}Step 3: Copying IDL and keypair files...${NC}"
npm run copy-idl
npm run copy-keypair
echo -e "${GREEN}✓ Files copied successfully.${NC}"

# Update Anchor.toml with the program ID
echo -e "\n${GREEN}Updating Anchor.toml with program ID...${NC}"
sed -i '' "s/accountability = \"[^\"]*\"/accountability = \"$PROGRAM_ID\"/g" Anchor.toml
echo -e "${GREEN}✓ Updated Anchor.toml with program ID: ${YELLOW}$PROGRAM_ID${NC}"

echo -e "\n${GREEN}All tasks completed successfully!${NC}"
echo -e "${YELLOW}===================================${NC}"
echo -e "${YELLOW}       Process Completed           ${NC}"
echo -e "${YELLOW}===================================${NC}"

echo -e "\n${BLUE}Important Notes:${NC}"
echo -e "${BLUE}1. The keypair.json file has been copied to the backend for on-chain transactions${NC}"
echo -e "${BLUE}2. Keep your keypair.json secure - it contains your private key${NC}"
echo -e "${BLUE}3. For production, make sure to fund this keypair with enough SOL${NC}" 