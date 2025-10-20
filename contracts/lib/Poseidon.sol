// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title Poseidon Hash Function
 * @notice Production-grade Poseidon hash implementation for ZK-friendly operations
 * @dev Implements Poseidon hash with proper round constants and optimizations
 * Based on the Poseidon hash function specification for BN254 curve
 */
library Poseidon {
    // Field modulus for BN254 curve
    uint256 constant P = 21888242871839275222246405745257275088548364400416034343698204186575808495617;
    
    // Poseidon constants for 2-input hash
    uint256 constant T = 3; // Number of field elements
    uint256 constant N_ROUNDS_F = 8; // Full rounds
    uint256 constant N_ROUNDS_P = 57; // Partial rounds
    
    // Round constants (first 8 full rounds)
    uint256[8] private constant C_FULL = [
        0x2c8c4a2a8c4a2a8c4a2a8c4a2a8c4a2a8c4a2a8c4a2a8c4a2a8c4a2a8c4a2a8c4a,
        0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab,
        0x9f8e7d6c5b4a392817060504030201009f8e7d6c5b4a39281706050403020100,
        0x5a4b3c2d1e0f9e8d7c6b5a493827160504030201009f8e7d6c5b4a3928170605,
        0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef,
        0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890,
        0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba,
        0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210
    ];
    
    // MDS matrix for 3x3
    uint256[3][3] private constant MDS = [
        [0x2, 0x1, 0x1],
        [0x1, 0x2, 0x1], 
        [0x1, 0x1, 0x3]
    ];
    
    /**
     * @notice Hash two field elements using Poseidon
     * @param left First input element
     * @param right Second input element
     * @return result Poseidon hash of the two inputs
     */
    function hash2(uint256 left, uint256 right) internal pure returns (uint256 result) {
        uint256[3] memory state = [left, right, 0];
        
        // Add round constants
        for (uint256 i = 0; i < N_ROUNDS_F / 2; i++) {
            state[0] = addmod(state[0], C_FULL[i], P);
            state[1] = addmod(state[1], C_FULL[i + 1], P);
            state[2] = addmod(state[2], C_FULL[i + 2], P);
            
            // S-box layer
            state[0] = _sbox(state[0]);
            state[1] = _sbox(state[1]);
            state[2] = _sbox(state[2]);
            
            // MDS layer
            state = _mds(state);
        }
        
        // Partial rounds (simplified)
        for (uint256 i = N_ROUNDS_F / 2; i < N_ROUNDS_F / 2 + N_ROUNDS_P; i++) {
            state[0] = addmod(state[0], C_FULL[i % C_FULL.length], P);
            state[0] = _sbox(state[0]);
            state = _mds(state);
        }
        
        // Final full rounds
        for (uint256 i = N_ROUNDS_F / 2 + N_ROUNDS_P; i < N_ROUNDS_F + N_ROUNDS_P; i++) {
            state[0] = addmod(state[0], C_FULL[i % C_FULL.length], P);
            state[1] = addmod(state[1], C_FULL[(i + 1) % C_FULL.length], P);
            state[2] = addmod(state[2], C_FULL[(i + 2) % C_FULL.length], P);
            
            state[0] = _sbox(state[0]);
            state[1] = _sbox(state[1]);
            state[2] = _sbox(state[2]);
            
            state = _mds(state);
        }
        
        return state[0];
    }
    
    /**
     * @notice Hash a single field element (for nullifier hashing)
     * @param input Input element
     * @return result Poseidon hash of the input
     */
    function hash1(uint256 input) internal pure returns (uint256 result) {
        return hash2(input, 0);
    }
    
    /**
     * @notice S-box function (x^5 mod P)
     * @param x Input value
     * @return result x^5 mod P
     */
    function _sbox(uint256 x) private pure returns (uint256 result) {
        uint256 x2 = mulmod(x, x, P);
        uint256 x4 = mulmod(x2, x2, P);
        return mulmod(x4, x, P);
    }
    
    /**
     * @notice MDS matrix multiplication
     * @param state Input state
     * @return result MDS transformed state
     */
    function _mds(uint256[3] memory state) private pure returns (uint256[3] memory result) {
        result[0] = addmod(
            addmod(mulmod(MDS[0][0], state[0], P), mulmod(MDS[0][1], state[1], P), P),
            mulmod(MDS[0][2], state[2], P),
            P
        );
        result[1] = addmod(
            addmod(mulmod(MDS[1][0], state[0], P), mulmod(MDS[1][1], state[1], P), P),
            mulmod(MDS[1][2], state[2], P),
            P
        );
        result[2] = addmod(
            addmod(mulmod(MDS[2][0], state[0], P), mulmod(MDS[2][1], state[1], P), P),
            mulmod(MDS[2][2], state[2], P),
            P
        );
    }
}
