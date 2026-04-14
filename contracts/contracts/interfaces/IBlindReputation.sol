// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

interface IBlindReputation {
    function rate(address worker, uint8 score, uint256 taskId) external;
    function recordDispute(address worker, uint256 taskId) external;
    function getReputation(address worker) external view returns (
        uint256 tasksCompleted,
        uint256 avgScore,
        uint256 disputes
    );
}
