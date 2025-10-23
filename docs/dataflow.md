## Basic Functionality & Dataflow
### Deposit: 
Deposit ETH/AltCoin from User to Syphon
- User:
```
secret = random();
nullifier = random();
precommitment = hash(nullifier, secret);

If ETH:
  syphon.deposit{value: amount}(precommitment);
Else If AltCoin:
  token_contract.approve(syphon_address, amount);
  syphon.deposit(amount, token_type, precommitment);
```
- Syphon:
```
commitment = hash(amount, precommitment, nonce); // nonce = incremental number for labeling purpose
merkle_tree.insert(commitment); // This is to record history of deposits

If ETH:
  // Nothing else to do
Else If AltCoin:
  token_contract.transferFrom(user_address, syphon_address, amount);

emit Deposited(commitment, nonce); // User stores nullifier, secret, nonce and amount
```


### Withdraw:
Withdraw ETH/AltCoin from Syphon to specified address
- User:
```
// Already Knows: nullifier, secret, nonce, amount
zkProof =  zk_circuit(amount, recipient, commitment, nullifier);
If ETH:
  syphon.withdraw(amount, recipient, commitment, nullifier, zkProof);
Else if AltCoin:
  syphon.withdraw(amount, token_type, recipient, commitment, nullifier, zkProof);
```
- Syphon:
```
verify(zkProof);
validate(nullifier); // Validate and record spent nullifier
merkle_tree.update(commitment); // May need new commitment if there are remaining balance

If ETH:
  recipient.call{value: amount}();
Else If AltCoin:
  token_contract.transfer(recipient, amount);

emit Withdrawn();
```

### Swap:
Swap X to Y, then send Y to specified address
- User:
```
// Already Knows: nullifier, secret, nonce, amount
zkProof =  zk_circuit(amount, recipient, commitment, nullifier);
syphon.swap(x_amount, x_type, y_amount, y_type, recipient, commitment, nullifier, zkProof);
```
- Syphon:
```
verify(zkProof);
validate(nullifier); // Validate and record spent nullifier
merkle_tree.update(commitment) // May need new commitment if there are remaining balance

// Syphon searches a DEX with the BEST exchange ratio among all networks (We need to figure out how to do this)
dex_address = getBestDex(x_type, y_type);
dex_address.swap(x_amount, x_type, y_amount, y_type);

If y_type == ETH:
  recipient.call{value: y_amount}();
Else If y_type == AltCoin:
  token_y_contract.transfer(recipient, y_amount);

emit Swapped();
```
