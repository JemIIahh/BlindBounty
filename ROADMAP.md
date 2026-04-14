# BlindBounty — Roadmap

> Single-page status tracker. Read this first every session.

## Current Phase: 0 — Scaffolding

## Phase Overview

| Phase | Name | Status | Description |
|---|---|---|---|
| 0 | Scaffolding | **IN PROGRESS** | Project structure, docs, git, frontend copy |
| 1 | Smart Contracts | PENDING | Escrow, reputation, task registry on 0G Chain |
| 2 | Backend API | PENDING | Task CRUD, submission flow, payment verification |
| 3 | 0G Storage Integration | PENDING | Encrypted task/evidence upload/download |
| 4 | 0G Sealed Inference | PENDING | TEE-based evidence verification |
| 5 | Frontend Adaptation | PENDING | Rebrand, privacy UI, connect to backend |
| 6 | End-to-End Testing | PENDING | Full flow: post → match → submit → verify → pay |
| 7 | Submission | PENDING | Demo video, X post, HackQuest form |

---

## Phase 0: Scaffolding

| Task | Status | Notes |
|---|---|---|
| 0.1 Create project folder + git init | ✅ | `/Users/ram/Desktop/BlindBounty` |
| 0.2 Copy Execution Market dashboard | ✅ | `dashboard/` copied |
| 0.3 Create all .md files | ✅ | CLAUDE.md, ROADMAP.md, CHANGELOG.md, SPEC.md, ARCHITECTURE.md, GOTCHAS.md, SUBMISSION.md, 0G-RESOURCES.md |
| 0.4 Create folder structure | ✅ | contracts/, backend/, sdk/, scripts/, deployments/, docs/, landing/ |
| 0.5 Initial commit | PENDING | |

## Phase 1: Smart Contracts (0G Chain)

| Task | Status | Notes |
|---|---|---|
| 1.1 Hardhat project setup | PENDING | Solidity, 0G Chain testnet config |
| 1.2 BlindEscrow contract | PENDING | Lock/release/cancel with encrypted task reference |
| 1.3 TaskRegistry contract | PENDING | On-chain task metadata (encrypted blob hash, category, reward) |
| 1.4 BlindReputation contract | PENDING | Anonymous reputation scores (no wallet-to-name linking) |
| 1.5 Unit tests | PENDING | Full coverage for all entry points |
| 1.6 Deploy to 0G testnet | PENDING | Verify on explorer |

## Phase 2: Backend API

| Task | Status | Notes |
|---|---|---|
| 2.1 Express/Fastify project setup | PENDING | TypeScript, env config |
| 2.2 Task endpoints | PENDING | POST /tasks (encrypted), GET /tasks (metadata only), GET /tasks/:id |
| 2.3 Submission endpoints | PENDING | POST /submissions (encrypted evidence ref), GET /submissions/:id |
| 2.4 Worker matching | PENDING | Apply to task, agent selects, decrypt instructions |
| 2.5 Payment verification | PENDING | Watch escrow events, confirm settlement |
| 2.6 Reputation endpoints | PENDING | Anonymous scores, no PII leakage |

## Phase 3: 0G Storage Integration

| Task | Status | Notes |
|---|---|---|
| 3.1 Install 0G TS SDK | PENDING | `@0gfoundation/0g-ts-sdk` |
| 3.2 Encrypt-then-upload for tasks | PENDING | ECIES encrypt → 0G Storage upload → return root hash |
| 3.3 Encrypt-then-upload for evidence | PENDING | Worker encrypts evidence → uploads to 0G Storage |
| 3.4 Selective decryption | PENDING | Only assigned worker can decrypt task; only agent can decrypt evidence |
| 3.5 Download + verify | PENDING | Retrieve from 0G Storage, verify merkle proof, decrypt |

## Phase 4: 0G Sealed Inference

| Task | Status | Notes |
|---|---|---|
| 4.1 Set up 0G Compute account | PENDING | Deposit tokens, fund provider |
| 4.2 Build verification prompt | PENDING | "Given this evidence, does it satisfy these requirements?" |
| 4.3 Sealed Inference API integration | PENDING | Send encrypted evidence to TEE, get signed PASS/FAIL |
| 4.4 On-chain verification callback | PENDING | TEE result triggers escrow release |

## Phase 5: Frontend Adaptation

| Task | Status | Notes |
|---|---|---|
| 5.1 Rebrand | PENDING | New name, colors, logo in theme.ts |
| 5.2 Task feed (anonymous) | PENDING | Category, location zone, reward — no instructions visible |
| 5.3 Task detail (encrypted) | PENDING | Decrypt only for assigned worker |
| 5.4 Submission flow | PENDING | Encrypted evidence upload UI |
| 5.5 Verification status | PENDING | Sealed Inference progress + result display |
| 5.6 Anonymous profiles | PENDING | Reputation score only, no wallet/name exposure |
| 5.7 Agent dashboard | PENDING | Post encrypted bounties, review sealed results |

## Phase 6: End-to-End Testing

| Task | Status | Notes |
|---|---|---|
| 6.1 Local full flow | PENDING | Agent → post → worker → apply → match → submit → verify → pay |
| 6.2 Testnet full flow | PENDING | Same on 0G testnet with real tokens |
| 6.3 Edge cases | PENDING | Cancel, dispute, timeout, insufficient funds |

## Phase 7: Submission

| Task | Status | Notes |
|---|---|---|
| 7.1 Demo video | PENDING | Screen recording of full flow |
| 7.2 X post | PENDING | Public post about BlindBounty (mandatory) |
| 7.3 HackQuest submission form | PENDING | Track 3, all links, description |
| 7.4 GitHub repo public | PENDING | Clean README, license |
