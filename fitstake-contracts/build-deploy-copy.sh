#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Print header
echo -e "${YELLOW}===================================${NC}"
echo -e "${YELLOW}   FitStake Contract Deployment    ${NC}"
echo -e "${YELLOW}===================================${NC}"

# Clean up build artifacts but preserve keypair if it exists
echo -e "\n${YELLOW}Cleaning up previous deployment files...${NC}"
# Don't remove keypair.json anymore
# rm -f keypair.json
rm -rf target/deploy/*-keypair.json
rm -rf .anchor

# Set default program ID from lib.rs
PROGRAM_ID="5hTA47XZPkJK7d6JrCEcmUaDbt6bgxNjgUDbRBo593er"

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

# Check if keypair.json exists
if [ -f "keypair.json" ]; then
    echo -e "${GREEN}Using existing deployment keypair...${NC}"
else
    # Generate a new keypair for deployment
    echo -e "${GREEN}Generating new deployment keypair...${NC}"
    solana-keygen new -o keypair.json --no-bip39-passphrase --force
fi

# Get keypair public key
PUBKEY=$(solana-keygen pubkey keypair.json)
echo -e "${GREEN}Using keypair with pubkey: ${YELLOW}$PUBKEY${NC}"

# Check/fund keypair balance
BALANCE=$(solana balance $PUBKEY | grep SOL || echo "0 SOL")
echo -e "${GREEN}Current balance: ${YELLOW}$BALANCE${NC}"

MIN_SOL=1.5  # Set minimum SOL required for deployment
CURRENT_SOL=$(echo $BALANCE | grep -o '[0-9.]*')

if (( $(echo "$CURRENT_SOL < $MIN_SOL" | bc -l) )); then
    echo -e "${YELLOW}Requesting SOL from devnet faucet for deployment...${NC}"
    solana airdrop 5 $PUBKEY
    sleep 2
    BALANCE=$(solana balance $PUBKEY | grep SOL)
    echo -e "${GREEN}New balance: ${YELLOW}$BALANCE${NC}"
fi

# Step 1: Build the contract
echo -e "\n${GREEN}Step 1: Building the Solana contract...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completed successfully.${NC}"

# Get program keypair path
PROGRAM_KEYPAIR="target/deploy/accountability-keypair.json"
if [ ! -f "$PROGRAM_KEYPAIR" ]; then
    echo -e "${YELLOW}Program keypair doesn't exist. Creating it now...${NC}"
    
    # Backup existing Anchor.toml
    cp Anchor.toml Anchor.toml.bak
    
    # Create directory if it doesn't exist
    mkdir -p target/deploy
    
    # Create new program keypair
    echo -e "${YELLOW}Generating new program keypair...${NC}"
    solana-keygen new -o $PROGRAM_KEYPAIR --force --no-bip39-passphrase
    
    # Get the new program ID
    NEW_PROGRAM_ID=$(solana-keygen pubkey $PROGRAM_KEYPAIR)
    echo -e "${GREEN}Generated new program ID: ${YELLOW}$NEW_PROGRAM_ID${NC}"
    
    # Update Anchor.toml with the new program ID
    sed -i.bak "s/accountability = \"[^\"]*\"/accountability = \"$NEW_PROGRAM_ID\"/g" Anchor.toml
    rm -f Anchor.toml.bak
    
    echo -e "${YELLOW}IMPORTANT: You must update the program ID in lib.rs:${NC}"
    echo -e "${YELLOW}Open programs/accountability/src/lib.rs and change:${NC}"
    echo -e "${YELLOW}declare_id!(\"$PROGRAM_ID\"); to declare_id!(\"$NEW_PROGRAM_ID\");${NC}"
    
    # Ask user to confirm the change
    echo -e "${YELLOW}Have you updated the program ID in lib.rs? (y/n)${NC}"
    read -r updated_id
    
    if [[ "$updated_id" =~ ^[Yy]$ ]]; then
        echo -e "${GREEN}Proceeding with deployment...${NC}"
        PROGRAM_ID=$NEW_PROGRAM_ID
    else
        echo -e "${RED}Please update the program ID in lib.rs before continuing.${NC}"
        exit 1
    fi
fi

# Step 2: Deploy contract
echo -e "\n${GREEN}Step 2: Deploying the contract...${NC}"
export ANCHOR_WALLET=$(pwd)/keypair.json
export ANCHOR_PROVIDER_URL=https://api.devnet.solana.com

# Deploy the program
echo -e "${GREEN}Deploying program...${NC}"
solana program deploy \
    --program-id $PROGRAM_KEYPAIR \
    --keypair keypair.json \
    target/deploy/accountability.so

if [ $? -ne 0 ]; then
    echo -e "${RED}Deployment failed.${NC}"
    echo -e "${YELLOW}Possible issues:${NC}"
    echo -e "${YELLOW}1. Insufficient SOL in your keypair${NC}"
    echo -e "${YELLOW}2. Program ID mismatch between lib.rs and program keypair${NC}"
    exit 1
else
    echo -e "${GREEN}✓ Contract deployed successfully.${NC}"
fi

# Update the IDL file with the program ID
echo -e "\n${GREEN}Updating IDL file with program ID...${NC}"

# Make sure IDL exists
IDL_FILE="target/idl/accountability.json"
if [ ! -f "$IDL_FILE" ]; then
    echo -e "${RED}Error: IDL file not found at $IDL_FILE${NC}"
    exit 1
fi

# Update IDL with the program ID
node -e "
const fs = require('fs');
let idl = JSON.parse(fs.readFileSync('$IDL_FILE', 'utf8'));
if (!idl.metadata) idl.metadata = {};
idl.metadata.address = '$PROGRAM_ID';
fs.writeFileSync('$IDL_FILE', JSON.stringify(idl, null, 2));
" 2>/dev/null

if grep -q "$PROGRAM_ID" "$IDL_FILE"; then
    echo -e "${GREEN}✓ Successfully updated IDL with program ID.${NC}"
else
    echo -e "${RED}Failed to update IDL with program ID.${NC}"
    echo -e "${YELLOW}Please manually update the IDL file:${NC}"
    echo -e "${YELLOW}Add the following to $IDL_FILE:${NC}"
    echo -e "${YELLOW}\"metadata\": { \"address\": \"$PROGRAM_ID\" }${NC}"
fi

# Step 3: Copy files
echo -e "\n${GREEN}Step 3: Copying IDL and keypair files...${NC}"
npm run copy-idl
npm run copy-keypair
echo -e "${GREEN}✓ Files copied successfully.${NC}"

# Ensure Anchor.toml has the correct program ID
echo -e "\n${GREEN}Ensuring Anchor.toml has the correct program ID...${NC}"
if [ -f "Anchor.toml" ]; then
    sed -i.bak "s/accountability = \"[^\"]*\"/accountability = \"$PROGRAM_ID\"/g" Anchor.toml
    rm -f Anchor.toml.bak
    echo -e "${GREEN}✓ Updated Anchor.toml with program ID: ${YELLOW}$PROGRAM_ID${NC}"
else
    echo -e "${RED}Error: Anchor.toml not found${NC}"
fi

echo -e "\n${GREEN}All tasks completed successfully!${NC}"
echo -e "${YELLOW}===================================${NC}"
echo -e "${YELLOW}       Deployment Completed        ${NC}"
echo -e "${YELLOW}===================================${NC}"

echo -e "\n${BLUE}Important Information:${NC}"
echo -e "${BLUE}1. Program ID: ${PROGRAM_ID}${NC}"
echo -e "${BLUE}2. Wallet Authority: ${PUBKEY}${NC}"
echo -e "${BLUE}3. The keypair has been saved to keypair.json and copied to the backend.${NC}"
echo -e "${BLUE}4. The program ID in lib.rs MUST match: ${PROGRAM_ID}${NC}" 