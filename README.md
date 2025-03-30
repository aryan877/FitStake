# FitStake - Get Fit, Stake SOL, Earn Rewards

<img src="./fitstake.gif" alt="FitStake Demo" width="250"/>

[![Expo](https://img.shields.io/badge/Expo-52.0.39-blue.svg)](https://docs.expo.dev/)
[![Solana](https://img.shields.io/badge/Solana-devnet-green.svg)](https://solana.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-yellow.svg)](https://nodejs.org/)

## Overview

FitStake revolutionizes fitness motivation by combining exercise with cryptocurrency rewards. Users stake SOL tokens on fitness challenges, complete their goals, and earn rewards - all secured by blockchain technology.

## Value Proposition

- **Incentivized Fitness**: Convert physical activity into financial gains
- **Commitment Mechanism**: Financial stakes increase accountability and adherence to fitness goals
- **Community Building**: Compete and collaborate with friends or join public challenges
- **Blockchain Security**: Transparent and trustless reward distribution
- **Verifiable Activity**: Health data integration ensures honest reporting of fitness achievements

## Architecture

FitStake consists of three integrated components:

1. **Mobile Application (fitstake-expo)**

   - User interface built with React Native and Expo
   - Connects to device health APIs for activity tracking
   - Manages wallet integration and challenge participation

2. **Backend API (fistake-backend)**

   - Handles user authentication and session management
   - Verifies health data and processes challenge completions
   - Orchestrates blockchain interactions and database operations

3. **Smart Contracts (fitstake-contracts)**
   - Solana blockchain integration using Anchor framework
   - Manages stake escrow, challenge verification, and reward distribution
   - Provides on-chain record keeping of user achievements

## Technical Requirements

### Prerequisites

- Node.js v18 or later
- Yarn or npm package manager
- Expo CLI for mobile development
- Solana CLI tools (solana-cli, anchor)
- MongoDB instance (local or Atlas)
- iOS/Android device or simulator

### Development Environment Setup

1. **Repository Setup**

```bash
git clone https://github.com/aryan877/FitStake
cd FitStake
```

2. **Environment Configuration**

Create environment files in each project directory:

- `fitstake-expo/.env.local`
- `fistake-backend/.env`
- `fitstake-contracts/.env`

3. **Dependencies Installation**

```bash
# Install dependencies for all components
cd fitstake-expo && npm install
cd ../fistake-backend && npm install
cd ../fitstake-contracts && npm install
```

## Mobile Application Configuration

### Features

- Secure authentication via Privy wallet integration
- Real-time health data tracking and visualization
- Challenge discovery, creation, and participation
- Stake management and reward claiming
- Progress tracking and achievement display

### Health Data Integration

#### iOS Implementation

- Direct integration with Apple HealthKit
- Permissions requested at first launch
- Background step counting and activity metrics

#### Android Implementation

- Integration via Health Connect API
- Requirements for third-party app synchronization:
  - Install Health Connect application
  - Grant FitStake appropriate permissions
  - Configure primary fitness app to sync with Health Connect

### Environment Variables

Configure the mobile app with Privy authentication credentials:

```
EXPO_PUBLIC_PRIVY_APP_ID=your_privy_app_id
EXPO_PUBLIC_PRIVY_CLIENT_ID=your_privy_client_id
```

### Development Workflow

```bash
# Start development server
cd fitstake-expo
npm run dev

# Run on specific platform
npm run ios     # For iOS simulator
npm run android # For Android emulator
```

### Production Builds

For testing with native modules, create a development client:

```bash
# Install EAS build tools
npm install -g eas-cli

# Create development build
cd fitstake-expo
eas build --profile development --platform ios
# or
eas build --profile development --platform android
```

## Backend Service Implementation

### Core Functionalities

- User management and authentication verification
- Challenge creation, management, and verification
- Health data validation and verification
- Blockchain transaction orchestration
- Achievement and badge system management

### Environment Configuration

Required environment variables:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
PRIVY_APP_ID=your_privy_app_id
PRIVY_SECRET=your_privy_secret_key
PRIVY_VERIFICATION_KEY="-----BEGIN PUBLIC KEY-----
Your Privy verification public key goes here
-----END PUBLIC KEY-----"
```

Authentication credentials can be obtained by registering at [Privy.io](https://privy.io).

### Database Requirements

- MongoD
- Collections: users, challenges, badges

### Service Initialization

```bash
cd fistake-backend
npm run dev
```

### Scheduled Tasks and Automation

The backend implements several critical automated processes:

1. **Challenge Lifecycle Management**

   - Periodic verification of challenge completion (30-second intervals)
   - Automatic reward calculation and distribution
   - Stake refund processing for incomplete challenges

2. **User Achievement Processing**

   - Badge awarding based on milestone completion
   - Leaderboard position calculation and updates

3. **Blockchain Integration**
   - Smart contract interaction for trustless verification
   - Transaction signing and submission
   - Event monitoring and state synchronization

### Administrator Capabilities

Admin users have expanded privileges:

- Creation and management of public challenges
- System-wide announcement capabilities
- Challenge moderation and oversight

#### Administrator Management

Grant admin privileges:

```bash
cd fistake-backend
npm run make-admin <username or wallet address>
```

Remove admin privileges:

```bash
cd fistake-backend
npm run remove-admin <username or wallet address>
```

## Smart Contract Architecture

### Contract Functionality

The Solana smart contracts provide:

- Secure escrow for staked tokens
- Verifiable challenge creation and management
- Trustless reward calculation and distribution
- Permanent on-chain achievement records

### Deployment Process

```bash
cd fitstake-contracts
./build-deploy-copy.sh
```

This script performs:

1. Anchor program compilation
2. Devnet deployment
3. IDL and keypair generation
4. Configuration file distribution to frontend and backend

### Security Considerations

- All critical operations require proper authority signatures
- Time-locked contracts prevent premature withdrawals
- Oracle integration for external data verification
- Circuit breaker mechanisms for emergency situations

## Application Workflow

The typical user journey follows these steps:

1. **Account Creation and Setup**

   - User registers via mobile application
   - Connects Privy wallet for secure authentication
   - Grants health data access permissions

2. **Challenge Participation**

   - Discovers available challenges or creates new ones
   - Stakes SOL tokens as commitment
   - Invites friends or joins existing challenges

3. **Activity Tracking**

   - System monitors fitness activities via health APIs
   - Progress displayed in real-time on dashboard
   - Notifications for goal milestones and achievements

4. **Verification and Rewards**

   - Backend validates completed challenges
   - Smart contracts calculate and distribute rewards
   - Users claim rewards directly to their wallets

5. **Achievement Recognition**
   - Badges awarded for completed challenges
   - Profile statistics updated with accomplishments
   - Social sharing options for achievements

## Contributing

Contributions are welcome through the following methods:

- Feature implementation via pull requests
- Bug reports through GitHub issues
- Documentation improvements
- Testing and quality assurance

Please follow the established code style and include appropriate tests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Technology Stack

### Frontend Technologies

- React Native with Expo framework
- TypeScript for type safety
- Privy SDK for authentication
- Health Connect and HealthKit integrations

### Backend Stack

- Node.js runtime environment
- Express.js web framework
- MongoDB database system
- TypeScript programming language
- JWT-based authentication

### Blockchain Integration

- Solana blockchain infrastructure
- Anchor framework for smart contract development
- Web3.js for blockchain interactions
