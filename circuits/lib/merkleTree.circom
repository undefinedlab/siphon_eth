// Merkle tree verification circuit
// Verifies a Merkle path from leaf to root

pragma circom 2.0.0;

include "../lib/poseidon.circom";

// Merkle tree verification template
template MerkleTreeVerifier(treeDepth) {
    signal input leaf;
    signal input pathElements[treeDepth];
    signal input pathIndices[treeDepth];
    signal input root;
    
    // Verify path indices are binary
    for (var i = 0; i < treeDepth; i++) {
        pathIndices[i] * (pathIndices[i] - 1) === 0;
    }
    
    // Calculate Merkle path
    component hashers[treeDepth];
    var current = leaf;
    
    for (var i = 0; i < treeDepth; i++) {
        hashers[i] = Poseidon2();
        
        // If pathIndices[i] == 0, current is left child
        // If pathIndices[i] == 1, current is right child
        hashers[i].in[0] <== pathIndices[i] * pathElements[i] + (1 - pathIndices[i]) * current;
        hashers[i].in[1] <== pathIndices[i] * current + (1 - pathIndices[i]) * pathElements[i];
        
        current = hashers[i].out;
    }
    
    // Verify the calculated root matches the provided root
    current === root;
}

// Main component for testing
component main = MerkleTreeVerifier(20);
