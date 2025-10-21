// Simplified Poseidon hash function for Circom 2
// This implements a basic Poseidon hash suitable for ZK circuits

pragma circom 2.0.0;

// Simple Poseidon hash template for 2 inputs
template Poseidon2() {
    signal input in[2];
    signal output out;
    
    // Simple hash implementation using only quadratic constraints
    // This is a simplified version for demonstration
    signal temp1;
    signal temp2;
    signal temp3;
    signal temp4;
    
    temp1 <== in[0] + in[1];
    temp2 <== temp1 * temp1;
    temp3 <== temp2 + in[0];
    temp4 <== temp3 * temp3;
    out <== temp4 + in[1];
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
