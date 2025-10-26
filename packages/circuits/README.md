# ZK-Snark Circuits

This directory contains the Zero-Knowledge circuits for the Siphon protocol. The circuits are written in [Circom](https://docs.circom.io/).

## Overview

The circuits are used to generate proofs for withdrawals from the Siphon vault. The proofs are used to verify that a user is allowed to withdraw a certain amount of funds without revealing the user's identity or transaction history.

## Circuits

### `withdrawal.circom`

This is the main circuit for generating withdrawal proofs. It takes the following inputs:

-   `withdrawnValue`: The amount to be withdrawn.
-   `stateRoot`: The root of the Merkle tree of commitments.
-   `newCommitment`: The new commitment for the remaining balance.
-   `nullifierHash`: The hash of the nullifier for the spent commitment.
-   `existingValue`: The value of the existing commitment.
-   `existingNullifier`: The nullifier of the existing commitment.
-   `existingSecret`: The secret of the existing commitment.
-   `newNullifier`: The new nullifier for the remaining balance.
-   `newSecret`: The new secret for the remaining balance.
-   `pathElements`: The path elements for the Merkle proof.
-   `pathIndices`: The path indices for the Merkle proof.

The circuit performs the following checks:

1.  Verifies the Merkle proof for the existing commitment.
2.  Verifies the nullifier hash to prevent double-spending.
3.  Checks that the withdrawn amount is not greater than the existing balance.
4.  Computes the new commitment for the remaining balance.

### `main.circom`

This circuit is a wrapper around the `Withdrawal` circuit. It exposes the public signals that are needed to verify the proof on-chain.

### `commitment.circom`

This circuit is used to compute a commitment from a secret and a nullifier. A commitment is a cryptographic hash that is used to represent a deposit in the Siphon vault. It takes the following inputs:

-   `value`: The value of the deposit.
-   `nullifier`: A random value used to prevent double-spending.
-   `secret`: A secret value known only to the user.

It outputs the `commitment` and the `nullifierHash`.

### `merkle_tree.circom`

This circuit is used to verify a Merkle proof. A Merkle proof is used to prove that a commitment is part of the Merkle tree of all commitments in the Siphon vault. It takes the following inputs:

-   `leaf`: The leaf of the Merkle tree to verify.
-   `pathElements`: The path elements for the Merkle proof.
-   `pathIndices`: The path indices for the Merkle proof.

It outputs the `root` of the Merkle tree.

## Dependencies

-   [circomlib](https://github.com/iden3/circomlib)
-   [circomlibjs](https://github.com/iden3/circomlibjs)
-   [snarkjs](https://github.com/iden3/snarkjs)

## Setup

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Compile the Circuits**:
    The following command will compile the `main.circom` file and create the `main.r1cs` and `main.wasm` files.
    ```bash
    circom main.circom --r1cs --wasm --output build
    ```

3.  **Generate the `circuit.zkey` file**:
    The `circuit.zkey` file is a proving key that is used to generate proofs. It is generated from the `.r1cs` file and a powers of tau file. You will need to download a appropriate powers of tau file depending upon number of constraints.
    Once you have a powers of tau file, you can generate the `circuit.zkey` file with the following command:
    ```bash
    snarkjs plonk setup build/main.r1cs powersOfTau.ptau circuit.zkey
    ```
    **Note**: The `circuit.zkey` file is not included in this repository because it is a large file (~70mb)

## Usage

Once you have compiled the circuits and generated the `circuit.zkey` file, you can use `snarkjs` to generate proofs. 

Please refer to the [snarkjs documentation](https://github.com/iden3/snarkjs) for instructions on how to generate proofs.
