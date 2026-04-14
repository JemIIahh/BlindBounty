// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title TaskRegistry
 * @notice On-chain index for task discovery. Stores only metadata — never content.
 *         Workers browse by category, location zone, and reward.
 *         Task instructions remain encrypted on 0G Storage.
 */
contract TaskRegistry {

    struct TaskMeta {
        uint256 taskId;
        address agent;
        string category;
        string locationZone;
        uint256 reward;
        uint256 createdAt;
        bool isOpen;
    }

    // ── State ──

    TaskMeta[] public taskList;
    mapping(uint256 => uint256) public taskIdToIndex; // taskId → index in taskList
    mapping(address => bool) public authorizedPublishers; // escrow contracts
    address public admin;

    // ── Events ──

    event TaskPublished(uint256 indexed taskId, string category, string locationZone, uint256 reward);
    event TaskClosed(uint256 indexed taskId);

    // ── Modifiers ──

    modifier onlyAdmin() {
        require(msg.sender == admin, "not admin");
        _;
    }

    modifier onlyAuthorized() {
        require(authorizedPublishers[msg.sender], "not authorized");
        _;
    }

    // ── Constructor ──

    constructor() {
        admin = msg.sender;
    }

    // ── Core Functions ──

    /**
     * @notice Publish task metadata for discovery. Called by BlindEscrow on task creation.
     */
    function publishTask(
        uint256 taskId,
        address agent,
        string calldata category,
        string calldata locationZone,
        uint256 reward
    ) external onlyAuthorized {
        uint256 index = taskList.length;
        taskIdToIndex[taskId] = index;

        taskList.push(TaskMeta({
            taskId: taskId,
            agent: agent,
            category: category,
            locationZone: locationZone,
            reward: reward,
            createdAt: block.timestamp,
            isOpen: true
        }));

        emit TaskPublished(taskId, category, locationZone, reward);
    }

    /**
     * @notice Close a task listing. Called when task is assigned, completed, or cancelled.
     */
    function closeTask(uint256 taskId) external onlyAuthorized {
        uint256 index = taskIdToIndex[taskId];
        require(index < taskList.length, "task not found");
        taskList[index].isOpen = false;
        emit TaskClosed(taskId);
    }

    // ── View Functions ──

    /**
     * @notice Get total number of tasks ever published.
     */
    function totalTasks() external view returns (uint256) {
        return taskList.length;
    }

    /**
     * @notice Get a page of open tasks. Returns up to `limit` tasks starting from `offset`.
     */
    function getOpenTasks(uint256 offset, uint256 limit) external view returns (TaskMeta[] memory) {
        // Count open tasks first
        uint256 openCount = 0;
        for (uint256 i = 0; i < taskList.length; i++) {
            if (taskList[i].isOpen) openCount++;
        }

        if (offset >= openCount) {
            return new TaskMeta[](0);
        }

        uint256 resultSize = limit;
        if (offset + limit > openCount) {
            resultSize = openCount - offset;
        }

        TaskMeta[] memory result = new TaskMeta[](resultSize);
        uint256 found = 0;
        uint256 skipped = 0;

        for (uint256 i = 0; i < taskList.length && found < resultSize; i++) {
            if (taskList[i].isOpen) {
                if (skipped >= offset) {
                    result[found] = taskList[i];
                    found++;
                } else {
                    skipped++;
                }
            }
        }

        return result;
    }

    // ── Admin Functions ──

    function authorizePublisher(address publisher) external onlyAdmin {
        authorizedPublishers[publisher] = true;
    }

    function revokePublisher(address publisher) external onlyAdmin {
        authorizedPublishers[publisher] = false;
    }
}
