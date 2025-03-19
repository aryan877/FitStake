# FitStake Accountability Contracts

This repository contains Solana smart contracts for the FitStake accountability platform. The contracts enable users to create fitness challenges, join with stake, and earn rewards for completing challenges.

## Features

- Create accountability challenges with custom parameters
- Join challenges by staking tokens
- Mark participants as having completed the challenge
- Distribute rewards to winners

## Prerequisites

- [Solana Tool Suite](https://docs.solana.com/cli/install-solana-cli-tools)
- [Anchor Framework](https://www.anchor-lang.com/docs/installation)
- Node.js and npm/yarn

## Setup

1. Install dependencies:

```bash
npm install
```

2. Build the program:

```bash
anchor build
```

3. Run tests:

```bash
anchor test
```

## Contract Structure

- `programs/accountability/src/lib.rs`: Main contract implementation
- `tests/accountability.ts`: Tests for the contract

## License

MIT
