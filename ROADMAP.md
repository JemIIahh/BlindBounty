# BlindBounty — Roadmap

> Single-page status tracker. Read this first every session.

## Current Phase: 5 — Frontend Adaptation

## Phase Overview

| Phase | Name | Status | Description |
|---|---|---|---|
| 0 | Scaffolding | ✅ | Project structure, docs, git, frontend copy |
| 1 | Smart Contracts | ✅ | Production-grade: 3 contracts, 87 tests, full security hardening |
| 2 | Backend API | ✅ | Express + TypeScript, all routes, middleware, security audit |
| 3 | 0G Storage Integration | ✅ | Encrypted upload/download, ECIES + AES-256-GCM, security audit |
| 4 | 0G Sealed Inference | ✅ | TEE-based evidence verification via 0G Compute broker |
| 5 | Frontend Adaptation | PENDING | Rebrand, privacy UI, connect to backend |
| 6 | End-to-End Testing | PENDING | Full flow: post → match → submit → verify → pay |
| 7 | Submission | PENDING | Demo video, X post, HackQuest form |

---

## Phase 0: Scaffolding ✅

| Task | Status | Notes |
|---|---|---|
| 0.1 Create project folder + git init | ✅ | `/Users/ram/Desktop/BlindBounty` |
| 0.2 Copy Execution Market dashboard | ✅ | `dashboard/` copied |
| 0.3 Create all .md files | ✅ | CLAUDE.md, ROADMAP.md, CHANGELOG.md, SPEC.md, ARCHITECTURE.md, GOTCHAS.md, SUBMISSION.md, 0G-RESOURCES.md |
| 0.4 Create folder structure | ✅ | contracts/, backend/, sdk/, scripts/, deployments/, docs/, landing/ |
| 0.5 Initial commit | ✅ | |

## Phase 1: Smart Contracts (0G Chain) ✅

| Task | Status | Notes |
|---|---|---|
| 1.1 Hardhat project setup | ✅ | Hardhat 2 + OZ + 0G testnet config |
| 1.2 BlindEscrow contract | ✅ | 18 tests: createTask, assignWorker, submitEvidence, completeVerification, cancelTask, admin |
| 1.3 TaskRegistry contract | ✅ | 10 tests: publishTask, closeTask, getOpenTasks (pagination), admin |
| 1.4 BlindReputation contract | ✅ | 12 tests: rate, recordDispute, getReputation, admin |
| 1.5 Unit tests | ✅ | 87 total tests after security hardening |
| 1.6 Deploy to 0G testnet | ✅ | 4 contracts deployed: MockERC20, BlindReputation, TaskRegistry, BlindEscrow. Addresses in `contracts/deployments/0g-testnet.json` |

## Phase 2: Backend API ✅

| Task | Status | Notes |
|---|---|---|
| 2.1 Express project setup | ✅ | TypeScript ESM, helmet, cors, rate-limit, zod validation |
| 2.2 Task endpoints | ✅ | GET /tasks, GET /tasks/:id, POST /tasks, POST /tasks/:id/apply, GET /tasks/:id/applications, POST /tasks/:id/assign, POST /tasks/:id/cancel |
| 2.3 Submission endpoints | ✅ | POST /submissions/submit, POST /submissions/verify, GET /submissions/:taskId |
| 2.4 Worker matching | ✅ | Apply to task (in-memory store), agent reviews applications |
| 2.5 Chain services | ✅ | ethers.js v6 provider, BlindEscrow/TaskRegistry/BlindReputation contract instances, unsigned tx builders |
| 2.6 Reputation endpoints | ✅ | GET /reputation/:address, GET /reputation/leaderboard |
| 2.7 Auth middleware | ✅ | SIWE (EIP-191 sig → JWT), X-API-Key for agents, timing-safe comparison |
| 2.8 Security hardening | ✅ | 21-issue audit: timing-safe auth, no keypair endpoint, path traversal protection, HKDF, input validation |

## Phase 3: 0G Storage Integration ✅

| Task | Status | Notes |
|---|---|---|
| 3.1 Install 0G TS SDK | ✅ | `@0gfoundation/0g-ts-sdk` with Indexer + MemData |
| 3.2 Encrypt-then-upload | ✅ | AES-256-GCM symmetric + ECIES (secp256k1 ECDH + HKDF + AES) |
| 3.3 Storage service | ✅ | Real 0G Storage via Indexer + local file fallback for dev |
| 3.4 Crypto service | ✅ | aesEncrypt/Decrypt, eciesEncrypt/Decrypt, generateKeyPair, sha256 |
| 3.5 Storage routes | ✅ | POST /storage/upload, GET /storage/:rootHash, POST /storage/crypto/hash |
| 3.6 Security audit | ✅ | 21 issues found and fixed (3 critical, 5 high, 7 medium, 6 low) |

## Phase 4: 0G Sealed Inference ✅

| Task | Status | Notes |
|---|---|---|
| 4.1 Install broker SDK | ✅ | `@0glabs/0g-serving-broker` v0.7.5 |
| 4.2 Verification service | ✅ | Broker setup, provider discovery, structured verification prompt, TEE attestation check |
| 4.3 Verification routes | ✅ | POST /verification/verify, GET /verification/providers, GET /verification/status |
| 4.4 Local fallback | ✅ | Auto-pass stub when 0G Compute not configured (dev mode) |
| 4.5 Config + env | ✅ | OG_COMPUTE_PRIVATE_KEY, OG_COMPUTE_RPC_URL, OG_COMPUTE_PROVIDER_ADDRESS |

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
