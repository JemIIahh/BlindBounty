// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title BlindEscrow
 * @notice Privacy-first escrow for encrypted task bounties.
 *         Task content is never stored on-chain — only encrypted blob hashes.
 *         Payment releases on TEE-verified evidence (0G Sealed Inference).
 */
contract BlindEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    // ── Types ──

    enum TaskStatus {
        Funded,     // Agent created task, funds locked
        Assigned,   // Worker selected, instructions decrypted for them
        Submitted,  // Worker submitted encrypted evidence
        Verified,   // Sealed Inference verified evidence
        Completed,  // Payment released
        Cancelled   // Agent cancelled, funds refunded
    }

    struct Task {
        address agent;          // who created and funded
        address worker;         // assigned worker (address(0) if unassigned)
        address token;          // payment token (USDC)
        uint256 amount;         // escrowed amount
        bytes32 taskHash;       // hash of encrypted task blob on 0G Storage
        bytes32 evidenceHash;   // hash of encrypted evidence blob
        TaskStatus status;
        string category;        // "photography", "verification", etc.
        string locationZone;    // approximate zone, not precise coords
        uint256 createdAt;
    }

    // ── State ──

    uint256 public nextTaskId = 1;
    mapping(uint256 => Task) public tasks;

    address public admin;
    address public treasury;
    address public verifier;    // 0G Sealed Inference callback address
    uint256 public feeBps = 1500; // 15% = 1500 basis points
    uint256 public constant MAX_FEE_BPS = 3000; // 30% hard cap

    // ── Events ──

    event TaskCreated(uint256 indexed taskId, address indexed agent, address token, uint256 amount, bytes32 taskHash, string category, string locationZone);
    event WorkerAssigned(uint256 indexed taskId, address indexed worker);
    event EvidenceSubmitted(uint256 indexed taskId, address indexed worker, bytes32 evidenceHash);
    event VerificationCompleted(uint256 indexed taskId, bool passed);
    event TaskCompleted(uint256 indexed taskId, uint256 workerPayout, uint256 platformFee);
    event TaskCancelled(uint256 indexed taskId, uint256 refundAmount);

    // ── Modifiers ──

    modifier onlyAdmin() {
        require(msg.sender == admin, "not admin");
        _;
    }

    modifier onlyAgent(uint256 taskId) {
        require(msg.sender == tasks[taskId].agent, "not agent");
        _;
    }

    modifier onlyWorker(uint256 taskId) {
        require(msg.sender == tasks[taskId].worker, "not worker");
        _;
    }

    modifier onlyVerifier() {
        require(msg.sender == verifier, "not verifier");
        _;
    }

    // ── Constructor ──

    constructor(address _treasury, address _verifier) {
        admin = msg.sender;
        treasury = _treasury;
        verifier = _verifier;
    }

    // ── Core Functions ──

    /**
     * @notice Agent creates a task and locks payment in escrow.
     * @param taskHash Hash of encrypted task blob stored on 0G Storage
     * @param token ERC-20 token address for payment
     * @param amount Payment amount to lock
     * @param category Task category for discovery
     * @param locationZone Approximate location zone (not precise)
     */
    function createTask(
        bytes32 taskHash,
        address token,
        uint256 amount,
        string calldata category,
        string calldata locationZone
    ) external nonReentrant returns (uint256 taskId) {
        require(amount > 0, "amount must be > 0");
        require(taskHash != bytes32(0), "empty task hash");

        taskId = nextTaskId++;

        tasks[taskId] = Task({
            agent: msg.sender,
            worker: address(0),
            token: token,
            amount: amount,
            taskHash: taskHash,
            evidenceHash: bytes32(0),
            status: TaskStatus.Funded,
            category: category,
            locationZone: locationZone,
            createdAt: block.timestamp
        });

        IERC20(token).safeTransferFrom(msg.sender, address(this), amount);

        emit TaskCreated(taskId, msg.sender, token, amount, taskHash, category, locationZone);
    }

    /**
     * @notice Agent assigns a worker to the task. Only possible while Funded.
     */
    function assignWorker(uint256 taskId, address worker) external onlyAgent(taskId) {
        Task storage t = tasks[taskId];
        require(t.status == TaskStatus.Funded, "task not funded");
        require(worker != address(0), "invalid worker");

        t.worker = worker;
        t.status = TaskStatus.Assigned;

        emit WorkerAssigned(taskId, worker);
    }

    /**
     * @notice Worker submits encrypted evidence hash. Only possible while Assigned.
     */
    function submitEvidence(uint256 taskId, bytes32 evidenceHash) external onlyWorker(taskId) {
        Task storage t = tasks[taskId];
        require(t.status == TaskStatus.Assigned, "task not assigned");
        require(evidenceHash != bytes32(0), "empty evidence hash");

        t.evidenceHash = evidenceHash;
        t.status = TaskStatus.Submitted;

        emit EvidenceSubmitted(taskId, msg.sender, evidenceHash);
    }

    /**
     * @notice Called by 0G Sealed Inference verifier after TEE verification.
     *         If passed, releases payment. If failed, stays in Submitted for retry or cancel.
     */
    function completeVerification(uint256 taskId, bool passed) external onlyVerifier nonReentrant {
        Task storage t = tasks[taskId];
        require(t.status == TaskStatus.Submitted, "task not submitted");

        t.status = TaskStatus.Verified;
        emit VerificationCompleted(taskId, passed);

        if (passed) {
            uint256 fee = (t.amount * feeBps) / 10_000;
            uint256 payout = t.amount - fee;

            t.status = TaskStatus.Completed;

            IERC20(t.token).safeTransfer(t.worker, payout);
            if (fee > 0) {
                IERC20(t.token).safeTransfer(treasury, fee);
            }

            emit TaskCompleted(taskId, payout, fee);
        }
    }

    /**
     * @notice Agent cancels task and gets full refund. Only before worker is assigned.
     */
    function cancelTask(uint256 taskId) external onlyAgent(taskId) nonReentrant {
        Task storage t = tasks[taskId];
        require(t.status == TaskStatus.Funded, "can only cancel funded tasks");

        t.status = TaskStatus.Cancelled;

        IERC20(t.token).safeTransfer(t.agent, t.amount);

        emit TaskCancelled(taskId, t.amount);
    }

    // ── Admin Functions ──

    function setTreasury(address _treasury) external onlyAdmin {
        treasury = _treasury;
    }

    function setVerifier(address _verifier) external onlyAdmin {
        verifier = _verifier;
    }

    function setFeeBps(uint256 _feeBps) external onlyAdmin {
        require(_feeBps <= MAX_FEE_BPS, "fee exceeds max");
        feeBps = _feeBps;
    }

    // ── View Functions ──

    function getTask(uint256 taskId) external view returns (Task memory) {
        return tasks[taskId];
    }
}
