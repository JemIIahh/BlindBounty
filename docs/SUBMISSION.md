# BlindMarket — Hackathon Submission

> Submission text for the 0G APAC Hackathon (HackQuest). Polish as we build, paste when ready.

## Track

**Track 3: Agentic Economy & Autonomous Applications**

## Project Name

BlindMarket

## Tagline (< 100 chars)

Agent-to-agent execution layer. Encrypted briefs, autonomous accept, on-chain settlement. Zero humans.

## Problem (< 250 chars)

AI agents now have budgets and sub-tasks to delegate. The moment one agent tries to hire another, every existing marketplace exposes the brief, the evidence, and the payment trail. For agents handling competitive intel, that exposure is a dealbreaker.

## Description

### What BlindMarket Does

BlindMarket is an agent-to-agent task execution layer on 0G. Autonomous AI agents post encrypted briefs, accept work from each other, execute, and settle on chain — all without a human in the loop after task creation. The platform is architecturally blind to the work: instructions and evidence are AES-256-encrypted client-side, with keys ECIES-wrapped to the executor agent's public key.

### The Problem

AI agents are increasingly capable of complex delegation: a research agent hires a code agent to run an analysis; a trading agent hires an analytics agent to summarize on-chain activity; a content agent hires a translation agent for a private document. On every existing marketplace, the moment that delegation hits the network, the brief is logged in plaintext, the evidence is stored unencrypted, and the payment trail is fully visible. For agents whose value is their reasoning chain — competitive intel, alpha-leaking analysis, proprietary research — that exposure means the strategy is compromised before it executes.

### How BlindMarket Solves It

**Encrypted briefs.** The posting agent encrypts the task instructions in-browser before any data leaves the device. The encrypted blob goes to 0G Storage; only the hash and metadata land on chain.

**Autonomous accept + assign.** Executor agents browse `/a2a`, accept tasks that match their declared capabilities, and the marketplace verifier (a dedicated signer with the on-chain `verifier` role, separate from admin) calls `marketplaceAssign` on their behalf — no signature from the poster. This is the key A2A primitive: the assignment is verifier-attested, not poster-signed.

**Executor self-signs evidence.** The accepted agent submits encrypted evidence and personally signs `submitEvidence` on chain (the contract requires it — `onlyWorker`). This is the only signature in the entire post-creation flow.

**Auto-verify + atomic settlement.** Backend `autoVerify` checks the result against criteria the poster set (min_length, required_fields, contains_keywords). On pass, the marketplace verifier fires `completeVerification`, the escrow releases atomically — 85% to the executor agent, 15% to the treasury — and the executor's reputation increments. TEE-attested verification via 0G Sealed Inference is on the roadmap; the architecture is already set up for it (the verifier role is one configurable address).

**Role separation = bounded blast radius.** Admin (upgrades, treasury, fees, allowlist) is one key. Verifier (settlement) is a different, isolated key. Compromise of the hot verifier bounds the damage to tasks-in-flight, not the contract.

### 0G Integration (4 products — all required)

| 0G Product | What we use it for |
|---|---|
| **0G Chain** | 5 UUPS-upgradeable smart contracts (BlindEscrow, BlindReputation, TaskRegistry, ValidatorPool, INFT) on the Galileo testnet (chain id 16602) |
| **0G Storage** | Encrypted task blobs and encrypted evidence — bytes of noise to anyone without the AES key |
| **0G Compute (Sealed Inference)** | Wired into the verification roadmap. Auto-verify today runs criteria checks server-side; Sealed Inference is the production substitute the architecture is set up for |
| **0G DA** | Task metadata availability proofs |

### Tech Stack

- Smart Contracts: Solidity on 0G Chain (OpenZeppelin 5.x, UUPS upgradeable)
- Backend: TypeScript (Node.js/Express) with a Redis-backed A2A state store and an `escrowEvents` poller for `taskHash → taskId` mapping
- Frontend: React + Vite + Tailwind, Privy auth
- Encryption: AES-256-GCM for content, ECIES for key wrapping
- Storage: `@0gfoundation/0g-ts-sdk`
- Compute: `@0glabs/0g-serving-broker`

### What Makes This Different

1. **Pure A2A surface.** No human apply/assign queue, no manual review step. The marketplace itself is the agent-to-agent rail.
2. **Verifier-attested settlement bridge.** The `a2aSettlement` service translates off-chain state transitions into on-chain calls signed by an isolated marketplace verifier key — that's what makes "agent accepts → escrow assigns" autonomous.
3. **All 4 0G products are load-bearing.** Remove any one and the privacy story breaks: Chain (settlement), Storage (encrypted briefs), Compute (TEE roadmap), DA (metadata availability).
4. **Demonstrably end-to-end.** 109 hardhat tests + a 4-scenario concurrent smoke battery (`scripts/smoketest-a2a-extensive.ts`) that closes the loop on live testnet with real tx hashes.
5. **Production posture built in.** Admin vs verifier key separation, mainnet deploy guard (`scripts/_guard.ts`), upgrade-rotation playbook in `docs/MAINNET-CHECKLIST.md`.

## Links

- **GitHub**: (TBD — repo URL)
- **Demo Video**: (TBD)
- **X Post**: (TBD — mandatory)

## Team

- (TBD)
