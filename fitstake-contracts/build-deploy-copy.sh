#!/bin/bash

# Colors for terminal output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
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

# Step 1: Build the contract
echo -e "\n${GREEN}Step 1: Building the Solana contract...${NC}"
anchor build
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Build failed.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build completed successfully.${NC}"

# Step 2: Check if IDL exists
if [ ! -f "target/idl/accountability.json" ]; then
    echo -e "${RED}Error: IDL file not found at target/idl/accountability.json${NC}"
    exit 1
fi

# Step 3: Copy IDL file to Expo project
echo -e "\n${GREEN}Step 3: Copying IDL to Expo project...${NC}"
mkdir -p ../fitstake-expo/src/idl
cp target/idl/accountability.json ../fitstake-expo/src/idl/
if [ $? -ne 0 ]; then
    echo -e "${RED}Error: Failed to copy IDL file.${NC}"
    exit 1
fi
echo -e "${GREEN}✓ IDL file copied successfully.${NC}"

# Ask if user wants to deploy
echo -e "\n${YELLOW}Do you want to deploy the contract? (y/n)${NC}"
read -r deploy_answer

if [[ "$deploy_answer" =~ ^[Yy]$ ]]; then
    # Step 4: Deploy contract
    echo -e "\n${GREEN}Step 4: Deploying the contract...${NC}"
    anchor deploy
    if [ $? -ne 0 ]; then
        echo -e "${RED}Error: Deployment failed.${NC}"
        exit 1
    fi
    echo -e "${GREEN}✓ Contract deployed successfully.${NC}"
    
    # Record the program ID for reference
    program_id=$(solana address -k target/deploy/accountability-keypair.json)
    echo -e "\n${GREEN}Program ID: ${YELLOW}$program_id${NC}"
    echo -e "Use this ID in your app configuration if needed."
fi

echo -e "\n${GREEN}All tasks completed successfully!${NC}"
echo -e "${YELLOW}===================================${NC}"
echo -e "${YELLOW}       Process Completed           ${NC}"
echo -e "${YELLOW}===================================${NC}" 