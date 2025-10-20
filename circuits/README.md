# Siphon ZK Circuits

This directory contains the zero-knowledge circuits for the Siphon privacy vault system.

## Overview

The circuits implement the core privacy mechanism using Groth16 zk-SNARKs:

- **withdraw.circom**: Main withdrawal circuit that proves knowledge of secret and nullifier
- **lib/poseidon.circom**: Poseidon hash function implementation for ZK-friendly hashing
- **lib/merkleTree.circom**: Merkle tree verification circuit

## Circuit Logic

### Withdraw Circuit

The withdrawal circuit proves:
1. **Commitment Knowledge**: Prover knows `secret` and `nullifier` such that `commitment = Poseidon(nullifier, secret)`
2. **Merkle Path**: The commitment exists in the Merkle tree at the given root
3. **Nullifier Hash**: `nullifierHash = Poseidon(nullifier)` (prevents double-spending)
4. **Valid Recipient**: Recipient address is non-zero
5. **Reasonable Fee**: Fee is less than 0.1 ETH

### Private Inputs
- `secret`: Random secret value
- `nullifier`: Random nullifier value
- `pathElements[20]`: Merkle path elements
- `pathIndices[20]`: Merkle path indices (0 = left, 1 = right)

### Public Inputs
- `root`: Current Merkle root
- `nullifierHash`: Hash of the nullifier
- `recipient`: Withdrawal recipient address
- `fee`: Withdrawal fee amount

## Prerequisites

Install the required tools:

```bash
# Install Circom compiler
npm install -g circom

# Install SnarkJS
npm install -g snarkjs

# Install circuit dependencies
npm install
```

## Building Circuits

### Linux/macOS
```bash
chmod +x build.sh
./build.sh
```

### Windows
```cmd
build.bat
```

### Manual Build Steps

1. **Compile Circuits**:
   ```bash
   circom circuits/withdraw.circom --r1cs --wasm --sym --c
   ```

2. **Generate Powers of Tau** (if not exists):
   ```bash
   snarkjs powersoftau new bn128 14 pot14_0000.ptau -v
   snarkjs powersoftau contribute pot14_0000.ptau pot14_0001.ptau --name="Siphon contribution" -v
   snarkjs powersoftau prepare phase2 pot14_0001.ptau pot14_final.ptau -v
   ```

3. **Generate Keys**:
   ```bash
   snarkjs groth16 setup withdraw.r1cs pot14_final.ptau withdraw_0000.zkey
   snarkjs zkey contribute withdraw_0000.zkey withdraw_0001.zkey --name="Siphon trusted setup" -v
   ```

4. **Export Verifier**:
   ```bash
   snarkjs zkey export verificationkey withdraw_0001.zkey verification_key.json
   snarkjs zkey export solidityverifier withdraw_0001.zkey verifier.sol
   ```

## Generated Files

After building, you'll have:

- `withdraw.r1cs`: R1CS constraint system
- `withdraw.wasm`: WASM witness generator
- `withdraw_0001.zkey`: Proving key
- `verification_key.json`: Verification key
- `verifier.sol`: Solidity verifier contract
- `proof.json`: Test proof (if --test-proof flag used)
- `public.json`: Public inputs (if --test-proof flag used)

## Testing

Generate a test proof:

```bash
# Linux/macOS
./build.sh --test-proof

# Windows
build.bat --test-proof
```

## Integration

The generated `verifier.sol` replaces the mock verifier in `contracts/Verifier.sol` and provides actual Groth16 proof verification.

## Security Notes

- The Powers of Tau ceremony should be performed in a secure environment
- The proving key should be kept secure and not shared
- The verification key is public and can be shared
- Always verify proofs before accepting them in production

## Troubleshooting

### Common Issues

1. **Circom not found**: Install circom globally with `npm install -g circom`
2. **SnarkJS not found**: Install snarkjs globally with `npm install -g snarkjs`
3. **Memory issues**: Increase Node.js memory limit with `--max-old-space-size=4096`
4. **Compilation errors**: Check circuit syntax and dependencies

### Performance

- Circuit compilation can take several minutes
- Key generation requires significant computational resources
- Consider using a powerful machine for production builds
