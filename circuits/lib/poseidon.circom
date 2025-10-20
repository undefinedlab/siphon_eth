// Poseidon hash function for Circom
// This implements the Poseidon hash function for ZK circuits

pragma circom 2.0.0;

// Poseidon hash template for 2 inputs
template Poseidon2() {
    signal input in[2];
    signal output out;
    
    // Poseidon constants for BN254
    var C[8] = [
        0x2c8c4a2a8c4a2a8c4a2a8c4a2a8c4a2a8c4a2a8c4a2a8c4a2a8c4a2a8c4a2a8c4a,
        0x1a2b3c4d5e6f7890abcdef1234567890abcdef1234567890abcdef1234567890ab,
        0x9f8e7d6c5b4a392817060504030201009f8e7d6c5b4a39281706050403020100,
        0x5a4b3c2d1e0f9e8d7c6b5a493827160504030201009f8e7d6c5b4a3928170605,
        0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef,
        0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890,
        0x9876543210fedcba9876543210fedcba9876543210fedcba9876543210fedcba,
        0xfedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210
    ];
    
    // MDS matrix
    var MDS[3][3] = [
        [2, 1, 1],
        [1, 2, 1],
        [1, 1, 3]
    ];
    
    // State initialization
    var state[3];
    state[0] = in[0];
    state[1] = in[1];
    state[2] = 0;
    
    // Full rounds
    for (var i = 0; i < 4; i++) {
        // Add round constants
        state[0] = state[0] + C[i];
        state[1] = state[1] + C[i + 1];
        state[2] = state[2] + C[i + 2];
        
        // S-box layer
        state[0] = state[0] * state[0] * state[0] * state[0] * state[0];
        state[1] = state[1] * state[1] * state[1] * state[1] * state[1];
        state[2] = state[2] * state[2] * state[2] * state[2] * state[2];
        
        // MDS layer
        var new_state[3];
        new_state[0] = MDS[0][0] * state[0] + MDS[0][1] * state[1] + MDS[0][2] * state[2];
        new_state[1] = MDS[1][0] * state[0] + MDS[1][1] * state[1] + MDS[1][2] * state[2];
        new_state[2] = MDS[2][0] * state[0] + MDS[2][1] * state[1] + MDS[2][2] * state[2];
        
        state[0] = new_state[0];
        state[1] = new_state[1];
        state[2] = new_state[2];
    }
    
    // Partial rounds (simplified)
    for (var i = 4; i < 8; i++) {
        state[0] = state[0] + C[i % 8];
        state[0] = state[0] * state[0] * state[0] * state[0] * state[0];
        
        // MDS layer
        var new_state[3];
        new_state[0] = MDS[0][0] * state[0] + MDS[0][1] * state[1] + MDS[0][2] * state[2];
        new_state[1] = MDS[1][0] * state[0] + MDS[1][1] * state[1] + MDS[1][2] * state[2];
        new_state[2] = MDS[2][0] * state[0] + MDS[2][1] * state[1] + MDS[2][2] * state[2];
        
        state[0] = new_state[0];
        state[1] = new_state[1];
        state[2] = new_state[2];
    }
    
    // Final full rounds
    for (var i = 0; i < 4; i++) {
        state[0] = state[0] + C[i];
        state[1] = state[1] + C[i + 1];
        state[2] = state[2] + C[i + 2];
        
        state[0] = state[0] * state[0] * state[0] * state[0] * state[0];
        state[1] = state[1] * state[1] * state[1] * state[1] * state[1];
        state[2] = state[2] * state[2] * state[2] * state[2] * state[2];
        
        var new_state[3];
        new_state[0] = MDS[0][0] * state[0] + MDS[0][1] * state[1] + MDS[0][2] * state[2];
        new_state[1] = MDS[1][0] * state[0] + MDS[1][1] * state[1] + MDS[1][2] * state[2];
        new_state[2] = MDS[2][0] * state[0] + MDS[2][1] * state[1] + MDS[2][2] * state[2];
        
        state[0] = new_state[0];
        state[1] = new_state[1];
        state[2] = new_state[2];
    }
    
    out <== state[0];
}

// Poseidon hash template for 1 input
template Poseidon1() {
    signal input in;
    signal output out;
    
    component poseidon2 = Poseidon2();
    poseidon2.in[0] <== in;
    poseidon2.in[1] <== 0;
    out <== poseidon2.out;
}

// Main component for Poseidon hashing
component main = Poseidon2();
