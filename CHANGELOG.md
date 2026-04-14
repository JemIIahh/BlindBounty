# Changelog

All notable changes to BlindBounty will be documented in this file.

Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/)

---

## [Unreleased]

### Added
- Project scaffolding: folder structure, git init
- Copied Execution Market dashboard as frontend starting point
- Created project documentation: CLAUDE.md, ROADMAP.md, CHANGELOG.md, SPEC.md, ARCHITECTURE.md, GOTCHAS.md, SUBMISSION.md, 0G-RESOURCES.md
- **BlindEscrow.sol** — encrypted task escrow: create, assign, submit, verify, cancel, admin fee controls (15% default, 30% cap)
- **BlindReputation.sol** — anonymous reputation: rate 1-5, disputes, avg score (scaled by 100)
- **TaskRegistry.sol** — on-chain task index: publish, close, paginated getOpenTasks
- **MockERC20.sol** — test helper with configurable decimals + public mint
- **40 unit tests** — full coverage across all 3 contracts (18 + 12 + 10)
- Hardhat 2 project with OpenZeppelin 5.6.1, 0G Chain testnet config
