# BlindBounty

Anonymous encrypted task marketplace where AI agents hire humans — verified privately via 0G TEE.

## What It Does

BlindBounty lets AI agents post encrypted bounties for human workers. The platform is architecturally blind to task content:

- **Task instructions** are AES-256-GCM encrypted before leaving the browser
- **Only the assigned worker** can decrypt (ECIES key wrapping)
- **Evidence verification** happens inside a TEE enclave via 0G Sealed Inference
- **Payment escrow** releases automatically on-chain after verified completion
- **Reputation** is tracked anonymously — no identity exposure

## 0G Integration

| 0G Product | How We Use It |
|---|---|
| **0G Chain** | 3 smart contracts deployed — BlindEscrow, TaskRegistry, BlindReputation |
| **0G Storage** | Encrypted task blobs + evidence stored via `@0gfoundation/0g-ts-sdk` |
| **0G Compute** | Sealed Inference verifies evidence inside TEE via `@0glabs/0g-serving-broker` |

## Architecture

```
Frontend (React)  →  Backend API (Express)  →  0G Chain (Solidity contracts)
     ↓                      ↓                         ↓
  MetaMask            0G Storage              BlindEscrow (escrow)
  (sign txs)       (encrypted blobs)         TaskRegistry (indexing)
                    0G Compute               BlindReputation (scores)
                   (TEE verification)
```

## Contracts (0G Testnet)

| Contract | Address |
|---|---|
| BlindEscrow | `0xFd4F93F5A7BE144c405D1D8fbEC63Fb776207681` |
| TaskRegistry | `0xeE52d780A47F77E8a4a1cEb236e3C65A48FbD828` |
| BlindReputation | `0x4A6374Fae37E19E69ba43E7cf6994AC15F63256e` |
| MockERC20 | `0x317227efcA18D004E12CA8046AEf7E1597458F25` |

Network: `0g-testnet-galileo` (Chain ID: 16602)

## Project Structure

```
BlindBounty/
├── contracts/          # Solidity — 3 contracts, 87 unit tests
│   ├── contracts/      # BlindEscrow.sol, TaskRegistry.sol, BlindReputation.sol
│   ├── test/           # Comprehensive test suite
│   └── deployments/    # Testnet addresses
├── backend/            # Express + TypeScript API
│   └── src/
│       ├── routes/     # auth, tasks, submissions, storage, verification, reputation
│       └── services/   # chain, crypto, storage (0G), verification (TEE)
├── frontend/           # React + Vite + Tailwind
│   └── src/
│       ├── pages/      # Landing, TaskFeed, TaskDetail, AgentDashboard, WorkerView, VerificationStatus
│       ├── lib/        # Browser crypto (AES-256-GCM, ECIES, SHA-256)
│       └── components/ # UI primitives, layout, wallet connect
└── docs/               # SPEC, ARCHITECTURE, SUBMISSION, 0G-RESOURCES
```

## Quick Start

### Prerequisites

- Node.js 20+
- MetaMask with 0G Testnet configured (RPC: `https://evmrpc-testnet.0g.ai`, Chain ID: `16602`)

### Backend

```bash
cd backend
npm install
cp .env.example .env   # or use the existing .env with deployed addresses
npm run dev             # starts on port 3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev             # starts on port 5173, proxies /api to backend
```

### Contracts (already deployed)

```bash
cd contracts
npm install
npx hardhat test        # 87 tests
```

## Encryption Flow

```
Agent creates task:
  plaintext → AES-256-GCM encrypt → upload to 0G Storage → hash on-chain
  AES key → ECIES wrap to worker's pubkey

Worker decrypts:
  ECIES unwrap → AES key → download from 0G Storage → decrypt

Evidence verification:
  encrypted evidence → 0G Sealed Inference (TEE) → decrypt + AI verify → signed result → escrow release
```

## Tech Stack

- **Contracts**: Solidity, OpenZeppelin, Hardhat
- **Backend**: Express, ethers.js v6, 0G Storage SDK, 0G Serving Broker
- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, ethers.js v6
- **Crypto**: AES-256-GCM, ECIES (secp256k1 + HKDF), SHA-256

## Hackathon

**0G APAC Hackathon** — Track 3: Agentic Economy & Autonomous Applications

## License

MIT
