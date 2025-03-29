# FitStake - Fitness Challenges with Solana Staking

[![Expo](https://img.shields.io/badge/Expo-52.0.39-blue.svg)](https://docs.expo.dev/)
[![Solana](https://img.shields.io/badge/Solana-devnet-green.svg)](https://solana.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v18+-yellow.svg)](https://nodejs.org/)

FitStake is a fitness app that uses blockchain technology to incentivize users to complete fitness challenges. Users can stake SOL tokens on fitness goals and earn rewards upon completion.

## 📱 Project Structure

The project consists of three main parts:

- **fitstake-expo**: Mobile app built with Expo/React Native
- **fistake-backend**: Node.js/Express backend API
- **fitstake-contracts**: Solana smart contracts using Anchor framework

## 🚀 Getting Started

### Prerequisites

- Node.js v18 or later
- Yarn or npm
- Expo CLI
- Solana CLI
- Anchor Framework
- iOS/Android device or simulator

### Setup and Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/100xdevs-fitsake.git
cd 100xdevs-fitsake
```

2. **Set up environment variables**

Create `.env.local` files based on the provided examples in each directory.

3. **Install dependencies**

```bash
# Install dependencies for all projects
cd fitstake-expo && npm install
cd ../fistake-backend && npm install
cd ../fitstake-contracts && npm install
```

## 📱 Mobile App (fitstake-expo)

The mobile app allows users to:

- Connect with Privy wallet
- Track step counts via health APIs
- Join and create fitness challenges
- Stake SOL on challenges
- Monitor progress and claim rewards

### Running the App

```bash
cd fitstake-expo
npm run dev
```

For iOS:

```bash
npm run ios
```

For Android:

```bash
npm run android
```

## 🖥️ Backend (fistake-backend)

The backend handles:

- User authentication
- Challenge management
- Health data verification
- Solana blockchain interactions
- Badge and achievement systems

### Running the Backend

```bash
cd fistake-backend
npm run dev
```

## ⛓️ Smart Contracts (fitstake-contracts)

The Solana smart contracts manage:

- Challenge creation and verification
- Stake management
- Reward distribution
- On-chain record keeping

### Building and Deploying Contracts

```bash
cd fitstake-contracts
./build-deploy-copy.sh
```

This script will:

1. Build the Anchor contracts
2. Deploy to Solana devnet
3. Copy the IDL and keypair files to the frontend and backend

## 🔄 Workflow

The typical workflow for the application:

1. User creates or joins a challenge via the mobile app
2. User stakes SOL tokens on the challenge
3. User tracks fitness activity through health APIs
4. Backend verifies fitness data
5. Smart contracts manage staking and rewards
6. User completes challenge and claims rewards

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🛠️ Tech Stack

- **Frontend**: React Native, Expo, TypeScript, Privy for authentication
- **Backend**: Node.js, Express, MongoDB, TypeScript
- **Blockchain**: Solana, Anchor framework
- **Health Data**: Expo Health Connect, Google Fit, Apple HealthKit
