// Simplified Merkle tree verification circuit
pragma circom 2.0.0;

include "./poseidon.circom";

template MerkleTreeVerifier(levels) {
    signal input leaf;
    signal input root;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    component hashers[levels];
    signal current[levels + 1];

    current[0] <== leaf;

    for (var i = 0; i < levels; i++) {
        hashers[i] = Poseidon2();
        
        // Simple path verification
        hashers[i].in[0] <== current[i];
        hashers[i].in[1] <== pathElements[i];
        
        current[i + 1] <== hashers[i].out;
    }
    
    // Verify the calculated root matches the provided root
    current[levels] === root;
}