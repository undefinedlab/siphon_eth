pragma circom 2.0.0;
include "./withdrawal.circom";

component main {public [withdrawnValue, stateRoot, newCommitment, nullifierHash]} = Withdrawal(32);
