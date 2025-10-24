pragma circom 2.0.0;
include "./commitment.circom";
include "./merkle_tree.circom";
include "circomlib/circuits/poseidon.circom";
include "circomlib/circuits/comparators.circom";

template Withdrawal(levels) {
    signal input withdrawnValue;
    signal input stateRoot;
    signal input newCommitment;
    signal input nullifierHash;
    
    signal input existingValue;
    signal input existingNullifier;
    signal input existingSecret;
    signal input newNullifier;
    signal input newSecret;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    
    // Compute existing commitment
    component existingPrecommitmentHasher = Poseidon(2);
    existingPrecommitmentHasher.inputs[0] <== existingNullifier;
    existingPrecommitmentHasher.inputs[1] <== existingSecret;
    
    component existingCommitmentHasher = Poseidon(2);
    existingCommitmentHasher.inputs[0] <== existingValue;
    existingCommitmentHasher.inputs[1] <== existingPrecommitmentHasher.out;
    signal existingCommitment <== existingCommitmentHasher.out;
    
    // Verify Merkle proof
    component merkleChecker = MerkleTreeChecker(levels);
    merkleChecker.leaf <== existingCommitment;
    for (var i = 0; i < levels; i++) {
        merkleChecker.pathElements[i] <== pathElements[i];
        merkleChecker.pathIndices[i] <== pathIndices[i];
    }
    merkleChecker.root === stateRoot;
    
    // Verify nullifier hash
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== existingNullifier;
    nullifierHasher.out === nullifierHash;
    
    // Check balance
    signal remainingValue <== existingValue - withdrawnValue;
    component withdrawnCheck = Num2Bits(256);
    withdrawnCheck.in <== withdrawnValue;
    component remainingCheck = Num2Bits(256);
    remainingCheck.in <== remainingValue;

    // Enforce withdrawnValue <= existingValue to prevent over-withdrawal
    component checkWithdrawalAmount = IsLessEq();
    checkWithdrawalAmount.in[0] <== withdrawnValue;
    checkWithdrawalAmount.in[1] <== existingValue;
    checkWithdrawalAmount.out === 1;
    
    // Ensure nullifiers different
    component nullifiersDifferent = IsZero();
    nullifiersDifferent.in <== existingNullifier - newNullifier;
    nullifiersDifferent.out === 0;
    
    // Compute new commitment
    component newPrecommitmentHasher = Poseidon(2);
    newPrecommitmentHasher.inputs[0] <== newNullifier;
    newPrecommitmentHasher.inputs[1] <== newSecret;
    
    component newCommitmentHasher = Poseidon(2);
    newCommitmentHasher.inputs[0] <== remainingValue;
    newCommitmentHasher.inputs[1] <== newPrecommitmentHasher.out;
    newCommitmentHasher.out === newCommitment;
}
