# CLAUDE.md — BlindMarket project memory

This file is auto-loaded into Claude Code's context every session for this project. Treat it as ground truth. Update it after every task so future sessions don't re-learn the same lessons.

## Project in one sentence

BlindMarket — an agent-to-agent execution layer where autonomous AI agents post encrypted briefs, accept work from each other, execute, and settle on chain — all without a human in the loop after task creation. Built on 0G for the APAC Hackathon (Track 3: Agentic Economy & Autonomous Applications).

> **Pivot note (May 2026):** This was originally framed as an A2H ("agents hire humans") marketplace. We pivoted to pure A2A after re-reading Track 3's brief — the surface is now agent-to-agent only. The H2H/H2A/A2H code paths still exist in the contracts (`assignWorker`, manual `/verify`, etc.) for the A2H roadmap but are NOT exposed in the UI. When in doubt about whether a feature is in scope: if it requires a human signer after task creation, it's not the A2A flow. The on-chain primitive that makes A2A work is `marketplaceAssign` (verifier-gated), added via UUPS upgrade.

## Source of truth documents (read in this order before any work)

0. **`ROADMAP.md`** — single-page "where are we, what's next" status tracker. Always read first.
1. **`SPEC.md`** — technical specification: contract interfaces, API endpoints, encryption schemes, data flows
2. **`ARCHITECTURE.md`** — system diagram + how components connect (0G Chain, Storage, Sealed Inference, DA, backend, frontend)
3. **`0G-RESOURCES.md`** — curated 0G documentation, SDK references, API examples
4. **`SUBMISSION.md`** — hackathon submission text (write early, polish as we build)

If anything in this file contradicts those docs, those docs win.

## What BlindMarket Is

An agent-to-agent execution layer. AI agents delegate sub-tasks to each other through an encrypted, settlement-attested rail. Privacy is the product, not a feature:

- **Task briefs are encrypted client-side** — only the accepted executor agent can decrypt them
- **Evidence is encrypted** — stored on 0G decentralized storage; auto-verify checks criteria server-side today, TEE-attested verification via 0G Sealed Inference is on the roadmap
- **Executor identity is wallet-only** — reputation scores visible, no PII
- **The platform is architecturally blind** — we never see task content or evidence
- **Settlement bridge** — backend marketplace verifier (isolated key, separate from admin) signs `marketplaceAssign` + `completeVerification` on chain. The poster signs nothing after `createTask`; the executor signs only `submitEvidence` (contract-enforced)

### How It Works (A2A flow)

1. Posting agent encrypts the brief in browser/runtime; encrypted blob → 0G Storage, hash → on-chain `createTask` (status: Funded)
2. Executor agents poll `/a2a`, accept by capability match
3. Backend `a2aSettlement` calls `marketplaceAssign(taskId, executor)` as the verifier (status: Assigned)
4. Executor decrypts the brief, runs its tool/LLM, encrypts the evidence, posts it to 0G Storage, and signs/broadcasts `submitEvidence` itself (status: Submitted)
5. Backend `autoVerify` checks the result against the criteria the poster set; on pass, the bridge calls `completeVerification(taskId, true)` (status: Completed)
6. Smart contract atomically releases: 85% to executor, 15% to treasury; executor reputation increments

### Hackathon Track

**Track 3: Agentic Economy & Autonomous Applications**
- "Building the financial and service layer for the AI era"
- "AI-driven marketplaces, Agent-as-a-Service platforms"
- "Micropayments, automated billing, and revenue-sharing"

### 0G Integration Points (all 4 required)

| 0G Product | How We Use It |
|---|---|
| **0G Chain** | Smart contracts (escrow, reputation, task registry) deployed on 0G's EVM L1 |
| **0G Storage** | Encrypted task blobs + encrypted evidence stored on decentralized storage |
| **0G Compute (Sealed Inference)** | Evidence verification inside TEE — AI model never sees raw data outside enclave |
| **0G DA** | Task metadata availability proofs |

## Hackathon Details

- **Hackathon**: 0G APAC Hackathon (HackQuest)
- **Prize Pool**: $150,000
- **Deadline**: May 9, 2026, 23:59 UTC+8
- **Requirement**: At least one 0G component must be integrated (we're using all 4)
- **Mandatory**: Publish at least one public project post on X and submit the link

## Operating rules

1. **Quality over speed.** Each task gets full implementation, self-audit, and commit.
2. **0G integration is non-negotiable.** Every feature must use at least one 0G product. No faking it with centralized fallbacks.
3. **Privacy by default.** If a feature exposes user data, it's a bug, not a feature.
4. **Self-audit after every task.** Before committing, re-read the diff, verify nothing was hallucinated.
5. **Update this file after every task.** Record what changed, what gotchas were hit.
6. **No scope creep.** If a task surfaces work not in the roadmap, STOP and flag it.
7. **Commit after every working milestone.** Linear history, conventional commits.

## Tech Stack

| Layer | Technology |
|---|---|
| **Smart Contracts** | Solidity on 0G Chain (EVM-compatible) |
| **Task Storage** | 0G Storage (encrypted blobs via TypeScript SDK) |
| **Evidence Verification** | 0G Compute / Sealed Inference (TEE-based) |
| **Data Availability** | 0G DA |
| **Encryption** | ECIES (Elliptic Curve Integrated Encryption) — encrypt to recipient's public key |
| **Backend** | TypeScript (Node.js/Express or Fastify) |
| **Frontend** | React 18 + TypeScript + Vite + Tailwind CSS (adapted from Execution Market dashboard) |
| **Payments** | USDC on 0G Chain + escrow contract |
| **Wallet** | MetaMask / any EVM wallet via ethers.js |

## Frontend Origin

The frontend is adapted from Execution Market's dashboard (our own project). Key changes needed:
- **Rebrand** — new name, colors, logo
- **Remove irrelevant screens** — no XMTP bot, no mobile app, no World ID
- **Add privacy-specific UI** — encrypted task cards, sealed verification status, anonymous profiles
- **Swap backend calls** — point to BlindMarket's API, not Execution Market's
- **Update wallet integration** — 0G Chain instead of Base/Polygon

## Project conventions

- Contract names: `BlindEscrow`, `BlindReputation`, `TaskRegistry`
- All state-changing functions require `msg.sender` auth checks
- Events emitted for every state change (for indexing)
- API routes: `/api/v1/tasks`, `/api/v1/submissions`, `/api/v1/reputation`
- Commit messages: conventional commits (`feat:`, `test:`, `fix:`, `docs:`, `chore:`)
- Environment variables: `.env` file, never committed

## Self-Audit Routing System

**MANDATORY: Run this routine BEFORE every commit and BEFORE starting any new task.**

### Pre-Task Audit (run BEFORE starting work)

```
1. READ ROADMAP.md — what phase are we in? What's the current task?
2. READ SPEC.md — does this task match the spec? If not, STOP and flag.
3. CHECK: Am I about to build something NOT in the roadmap? If yes → STOP, ask user.
4. CHECK: Does this task require a 0G product? Which one?
5. CHECK: Will this task expose any user data in plaintext? If yes → redesign before coding.
```

### During-Task Guards (check continuously)

```
GUARD 1 — SCOPE: Am I still working on the task I started? If I'm touching files
          outside the task scope, STOP and ask why.

GUARD 2 — PRIVACY: Every piece of data I'm storing/transmitting — is it encrypted?
          If not, is there a documented reason in SPEC.md?

GUARD 3 — 0G: Am I using a centralized fallback when a 0G product exists?
          Storage → must use 0G Storage, not S3/local.
          Verification → must use Sealed Inference, not direct API call.
          Chain → must deploy on 0G Chain, not Hardhat localhost.

GUARD 4 — DRIFT: Am I adding features not in the roadmap? "Nice to have" is scope creep.
          If it's truly needed, update ROADMAP.md FIRST, then build.

GUARD 5 — SECRETS: Am I hardcoding any private key, API key, or secret? → .env file only.
```

### Post-Task Audit (run BEFORE committing)

```
1. [ ] Does the diff ONLY touch files listed in the current task?
2. [ ] Does the feature use the 0G product specified in SPEC.md?
3. [ ] Is ALL user data encrypted before storage/transmission?
4. [ ] Zero hardcoded secrets or private keys in the diff?
5. [ ] No unused imports or dead code introduced?
6. [ ] Does the code match what SPEC.md says it should do?
7. [ ] Did I update ROADMAP.md task status to ✅?
8. [ ] Did I update CLAUDE.md "What's done" table?
9. [ ] Did I update CHANGELOG.md?
10. [ ] Is the commit message conventional and accurate?
11. [ ] If I hit a gotcha, did I add it to GOTCHAS.md?
```

### Course Correction Protocol

If at any point the agent (me) appears to be:
- Building something not in ROADMAP.md → **STOP. Read ROADMAP.md. Ask user.**
- Using centralized services instead of 0G → **STOP. Read 0G-RESOURCES.md. Fix.**
- Exposing plaintext user data → **STOP. Read SPEC.md encryption section. Fix.**
- Adding "improvements" nobody asked for → **STOP. Revert. Stay on task.**
- Skipping tests or audits for speed → **STOP. Quality over speed. Always.**

**The user has explicitly requested this auditing system. Respect it.**

## What's done

| Date | Task | Outcome | Notes |
|---|---|---|---|
| 2026-04-14 | Project scaffolding | ✅ | Folder structure, all .md files, dashboard copied from Execution Market |
| 2026-04-14 | Phase 1: Smart Contracts | ✅ | 3 contracts + MockERC20, 40 tests passing. Hardhat 2 + OZ 5.6.1. |
| 2026-04-14 | Phase 1 hardening: Production-grade rewrite | ✅ | Security audit → 12 issues found → full rewrite. 87 tests now. Added: deadlines, claimTimeout, disputes, token whitelist, pause, 2-step admin transfer, CEI enforcement, custom errors, per-task dedup, contract integration, existence tracking. |

## Gotchas learned

- Hardhat 3 (`npm install hardhat` pulls v3.3.0) requires ESM and a different toolbox. Stick with `hardhat@^2.22.0` + `@nomicfoundation/hardhat-toolbox@^5.0.0` and set `"type": "commonjs"` in package.json.
- Node.js 25.x is unsupported by Hardhat — prints warning but works fine.
- Hardhat 2 tsconfig needs `"rootDir": "."` and `"noEmit": true` plus `"include": ["./test", "./hardhat.config.ts"]` to avoid TS5011 rootDir errors.

## Open risks / things to verify

- 0G Sealed Inference API — need to verify if it supports custom verification logic or only LLM chat
- 0G Storage encryption — does the SDK support client-side encryption or do we need to encrypt before upload?
- 0G Chain testnet — need to get testnet tokens and verify contract deployment flow
- 0G DA integration — need to understand the API for posting data availability proofs
- Escrow contract gas costs on 0G Chain — unknown, need to benchmark
