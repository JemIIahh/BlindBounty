// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title BlindReputation
 * @notice Anonymous reputation system. Scores are linked to wallet addresses
 *         but no name, location, or PII is stored on-chain.
 *         Only authorized raters (agents who completed tasks with a worker) can rate.
 */
contract BlindReputation {

    struct Reputation {
        uint256 tasksCompleted;
        uint256 totalScore;     // cumulative rating points (1-5 per task)
        uint256 disputes;
    }

    // ── State ──

    mapping(address => Reputation) public reputations;
    mapping(address => bool) public authorizedRaters; // escrow contracts that can call rate()
    address public admin;

    // ── Events ──

    event Rated(address indexed worker, address indexed rater, uint8 score);
    event DisputeRecorded(address indexed worker);
    event RaterAuthorized(address indexed rater);
    event RaterRevoked(address indexed rater);

    // ── Modifiers ──

    modifier onlyAdmin() {
        require(msg.sender == admin, "not admin");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedRaters[msg.sender], "not authorized rater");
        _;
    }

    // ── Constructor ──

    constructor() {
        admin = msg.sender;
    }

    // ── Core Functions ──

    /**
     * @notice Rate a worker after task completion. Score 1-5.
     *         Only callable by authorized contracts (BlindEscrow).
     */
    function rate(address worker, uint8 score) external onlyAuthorized {
        require(score >= 1 && score <= 5, "score must be 1-5");
        require(worker != address(0), "invalid worker");

        Reputation storage r = reputations[worker];
        r.tasksCompleted += 1;
        r.totalScore += score;

        emit Rated(worker, msg.sender, score);
    }

    /**
     * @notice Record a dispute against a worker.
     */
    function recordDispute(address worker) external onlyAuthorized {
        require(worker != address(0), "invalid worker");
        reputations[worker].disputes += 1;
        emit DisputeRecorded(worker);
    }

    // ── View Functions ──

    /**
     * @notice Get anonymous reputation for a worker.
     *         Returns stats only — no name, no location, no PII.
     */
    function getReputation(address worker) external view returns (
        uint256 tasksCompleted,
        uint256 avgScore,
        uint256 disputes
    ) {
        Reputation memory r = reputations[worker];
        tasksCompleted = r.tasksCompleted;
        avgScore = r.tasksCompleted > 0 ? (r.totalScore * 100) / r.tasksCompleted : 0; // scaled by 100
        disputes = r.disputes;
    }

    // ── Admin Functions ──

    function authorizeRater(address rater) external onlyAdmin {
        authorizedRaters[rater] = true;
        emit RaterAuthorized(rater);
    }

    function revokeRater(address rater) external onlyAdmin {
        authorizedRaters[rater] = false;
        emit RaterRevoked(rater);
    }
}
