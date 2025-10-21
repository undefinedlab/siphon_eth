// Simplified withdrawal circuit for privacy vault
// This is a basic working circuit for demonstration

pragma circom 2.0.0;

include "./lib/poseidon.circom";
include "./lib/merkleTree.circom";

template WithdrawCircuit() {
    // Private inputs (all inputs are private by default in Circom 2)
    signal input secret;
    signal input nullifier;
    signal input pathElements[20];
    signal input pathIndices[20];
    
    // Public inputs
    signal input root;
    signal input nullifierHash;
    signal input recipient;
    signal input fee;
    
    // Verify commitment = Poseidon(nullifier, secret)
    component commitmentHasher = Poseidon2();
    commitmentHasher.in[0] <== nullifier;
    commitmentHasher.in[1] <== secret;
    signal commitment;
    commitment <== commitmentHasher.out;
    
    // Verify Merkle path from commitment to root
    component merkleVerifier = MerkleTreeVerifier(20);
    merkleVerifier.leaf <== commitment;
    for (var i = 0; i < 20; i++) {
        merkleVerifier.pathElements[i] <== pathElements[i];
        merkleVerifier.pathIndices[i] <== pathIndices[i];
    }
    merkleVerifier.root <== root;
    
    // Verify nullifierHash = Poseidon(nullifier)
    component nullifierHasher = Poseidon1();
    nullifierHasher.in <== nullifier;
    nullifierHasher.out === nullifierHash;
}

// Main component
component main = WithdrawCircuit();