pragma circom 2.0.0;
include "circomlib/circuits/poseidon.circom";

template GenerateCommitmentData() {
    signal input value;
    signal input nullifier;
    signal input secret;
    signal output commitment;
    signal output nullifierHash;
    
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHash <== nullifierHasher.out;
    
    component precommitmentHasher = Poseidon(2);
    precommitmentHasher.inputs[0] <== nullifier;
    precommitmentHasher.inputs[1] <== secret;
    
    component commitmentHasher = Poseidon(2);
    commitmentHasher.inputs[0] <== value;
    commitmentHasher.inputs[1] <== precommitmentHasher.out;
    commitment <== commitmentHasher.out;
}
