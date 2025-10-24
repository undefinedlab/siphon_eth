pragma circom 2.0.0;
include "circomlib/circuits/poseidon.circom";

template MerkleTreeChecker(levels) {
    signal input leaf;
    signal input pathElements[levels];
    signal input pathIndices[levels];
    signal output root;
    
    component hashers[levels];
    component selectors[levels];
    signal currentHash[levels + 1];
    currentHash[0] <== leaf;
    
    for (var i = 0; i < levels; i++) {
        selectors[i] = Selector();
        selectors[i].pathIndex <== pathIndices[i];
        selectors[i].sibling <== pathElements[i];
        selectors[i].current <== currentHash[i];
        
        hashers[i] = Poseidon(2);
        hashers[i].inputs[0] <== selectors[i].left;
        hashers[i].inputs[1] <== selectors[i].right;
        currentHash[i + 1] <== hashers[i].out;
    }
    root <== currentHash[levels];
}

template Selector() {
    signal input pathIndex;
    signal input sibling;
    signal input current;
    signal output left;
    signal output right;
    
    signal inv <== 1 - pathIndex;
    signal leftTemp1 <== inv * current;
    signal leftTemp2 <== pathIndex * sibling;
    left <== leftTemp1 + leftTemp2;
    
    signal rightTemp1 <== pathIndex * current;
    signal rightTemp2 <== inv * sibling;
    right <== rightTemp1 + rightTemp2;
}
