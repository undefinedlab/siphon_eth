// Withdrawal circuit for privacy vault
// Proves knowledge of secret and nullifier without revealing them

pragma circom 2.0.0;

include "./lib/poseidon.circom";
include "./lib/merkleTree.circom";

template WithdrawCircuit() {
    // Private inputs
    signal private input secret;
    signal private input nullifier;
    signal private input pathElements[20];
    signal private input pathIndices[20];
    
    // Public inputs
    signal input root;
    signal input nullifierHash;
    signal input recipient;
    signal input fee;
    
    // Verify commitment = Poseidon(nullifier, secret)
    component commitmentHasher = Poseidon2();
    commitmentHasher.in[0] <== nullifier;
    commitmentHasher.in[1] <== secret;
    var commitment = commitmentHasher.out;
    
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
    
    // Verify recipient is non-zero
    recipient !== 0;
    
    // Verify fee is reasonable (less than 0.1 ETH)
    fee < 100000000000000000; // 0.1 ETH in wei
}

// Main component
component main = WithdrawCircuit();
