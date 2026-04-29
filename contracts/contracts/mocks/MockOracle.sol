// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @title MockOracle
 * @notice Test oracle — accepts any proof that decodes to a valid (bytes32, string) pair.
 *         In production, replace with a TEE attestation verifier.
 */
contract MockOracle {
    bool public alwaysValid = true;

    function setAlwaysValid(bool _valid) external {
        alwaysValid = _valid;
    }

    function verifyProof(bytes calldata proof) external view returns (bool) {
        if (!alwaysValid) return false;
        // Proof must decode to (bytes32 newHash, string newURI) — same shape INFT expects
        if (proof.length < 64) return false;
        try this.decodeProof(proof) returns (bytes32, string memory) {
            return true;
        } catch {
            return false;
        }
    }

    function decodeProof(bytes calldata proof) external pure returns (bytes32, string memory) {
        return abi.decode(proof, (bytes32, string));
    }
}
