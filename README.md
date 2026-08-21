# AegisDAO — AI-Assisted Governance & Risk-Analysis Platform

> ⚠️ **SECURITY DISCLAIMER**: **NOT AUDITED — DO NOT USE WITH REAL FUNDS.**
> This codebase is a security-conscious reference implementation designed for testnet deployment and demonstration purposes only.

---

## 🛡️ Architecture & Features

AegisDAO is an AI-assisted DAO governance platform featuring cryptographically authenticated threat auditing before proposals can be submitted on-chain:

1. **Cryptographic Oracle Attestation (Trust Model)**:
   - Backend evaluates proposal payloads via OpenAI `gpt-4o-mini` (or local rule-based heuristic fallback).
   - Computes `messageHash = keccak256(abi.encodePacked(title, amount, recipient, ipfsHash, safetyScore))`.
   - Signs `messageHash` with `ORACLE_PRIVATE_KEY` using EIP-191 `personal_sign`.
   - On-chain contract (`AegisDAO.sol` / `AegisGovernor.sol`) recovers the signer via `ECDSA.recover` and reverts with `InvalidOracleSignature` if the payload has been tampered with.

2. **OpenZeppelin v5 Smart Contracts**:
   - `AegisToken`: ERC20Votes governance token with snapshot-based voting power.
   - `AegisTimelock`: Enforces execution delay and role-based access control.
   - `AegisGovernor`: OpenZeppelin v5 Governor with `proposeWithAttestation`.
   - `AegisDAO`: Monolithic Section 4 spec contract with Checks-Effects-Interactions and `nonReentrant` execution.

3. **Backend API (`/api/analyze-proposal`)**:
   - In-memory token-bucket rate limiter (10 req/min, HTTP 429).
   - Input validation (Zod) enforcing 8,000 max character limit on proposal text.
   - Pinata IPFS JSON metadata pinning with mock CID fallback.

4. **Frontend & Design**:
   - Next.js 14 App Router with Tailwind CSS dark mode & glassmorphism aesthetics.
   - Wagmi v2 + RainbowKit v2 multi-chain wallet connection (Sepolia & Polygon Amoy).
   - Interactive SVG Risk Score Gauge with ARIA accessibility.
   - Demo Mode pre-filling synthetic malicious payloads (treasury drain exploits).

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js >= 18.x
- npm >= 9.x

### 2. Installation
```bash
git clone https://github.com/user/ai-blockchain.git
cd ai-blockchain
npm install
```

### 3. Environment Configuration
Copy `.env.example` to `.env.local` and configure keys:
```bash
cp .env.example .env.local
```

```env
# Network RPCs
NEXT_PUBLIC_DEFAULT_CHAIN=sepolia
NEXT_PUBLIC_SEPOLIA_RPC_URL=https://rpc.sepolia.org
NEXT_PUBLIC_AMOY_RPC_URL=https://rpc-amoy.polygon.technology

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id

# Backend AI Auditor & Oracle (Server-Side Only)
OPENAI_API_KEY=your_openai_api_key
PINATA_JWT=your_pinata_jwt_token
ORACLE_PRIVATE_KEY=0x_your_oracle_private_key_hex

# Deployment Key
DEPLOYER_PRIVATE_KEY=0x_your_deployer_private_key_hex
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📜 Contract Deployment & Verification

### 1. Run Local Hardhat Node
```bash
npm run hardhat:node
```

### 2. Run Contract Tests
```bash
npm run hardhat:test
```

### 3. Deploy to Testnet (Sepolia)
```bash
npm run hardhat:deploy:sepolia
```

### 4. Deploy to Testnet (Polygon Amoy)
```bash
npm run hardhat:deploy:amoy
```

### 5. Verify Contracts on Etherscan
```bash
npx hardhat verify --network sepolia <DEPLOYED_CONTRACT_ADDRESS> <CONSTRUCTOR_ARGS>
```

---

## 🧪 Testing

```bash
# Run Vitest unit tests (API, AI heuristics, components)
npm test

# Run Hardhat contract test suite
npm run hardhat:test
```

---

## 🔒 Known Limitations & Tradeoffs

1. **Single-Key Oracle Model**:
   - The reference oracle signs attestations using a single server-side EOA private key.
   - *Production Recommendation*: Replace the single EOA key with a threshold signature scheme (TSS), Gnosis Safe oracle multisig, or Chainlink Functions.

2. **Testnet-Only Scope**:
   - Smart contracts, voting delays, and timelocks are calibrated for testnet testing.

3. **In-Memory Rate Limiting**:
   - The demo rate limiter uses an in-memory token bucket. In multi-instance serverless deployments (Vercel Edge/Serverless), replace with Upstash Redis (`@upstash/ratelimit`).

---

## 📄 License & Disclaimer

Copyright (c) 2026 AegisDAO Team.

**DISCLAIMER**: THIS SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND. DO NOT USE IN PRODUCTION WITH REAL ASSETS.
