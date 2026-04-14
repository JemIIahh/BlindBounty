// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface ITaskRegistry {
    function publishTask(
        uint256 taskId,
        address agent,
        string calldata category,
        string calldata locationZone,
        uint256 reward
    ) external;
    function closeTask(uint256 taskId) external;
    function totalTasks() external view returns (uint256);
}
