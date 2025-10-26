import { TokenInfo } from '@avail-project/nexus-core';
import { getNexusSDK } from './nexus';
import { buildPoseidon } from "circomlibjs";
import crypto from 'crypto';
import { prepareWithdrawalTransaction } from "./generateProof";
import { LeanIMT } from "@zk-kit/lean-imt";

export const sdk = getNexusSDK();

export async function generateCommitmentData(_chainId: number, _token: TokenInfo, _amount: string) {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // Generate secret and nullifier
    const secret = BigInt('0x' + crypto.randomBytes(32).toString('hex'));
    const nullifier = BigInt('0x' + crypto.randomBytes(32).toString('hex'));

    // Calculate precommitment
    const precommitment = F.toString(poseidon([nullifier, secret]));

    // Calculate commitment
    const parsedAmount = sdk.utils.parseUnits(_amount, _token.decimals).toString();
    const commitment = F.toString(poseidon([parsedAmount, precommitment]));

    // Package into commitment data
    const commitmentData = {
        secret: secret.toString(),
        nullifier: nullifier.toString(),
        precommitment: precommitment.toString(),
        commitment: commitment.toString(),
        amount: _amount 
    }
    
    return commitmentData;
}

export async function generateZKData(_chainId: number, _token: TokenInfo, _amount: string, _recipient: string) {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // Choose commitment to spend
    let storedDeposit = null;
    let spentDepositKey = null;
    for (let i = localStorage.length-1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${_chainId}-${_token.symbol}-`)) {
            const depositData = JSON.parse(localStorage.getItem(key) || '{}');
            if (depositData.commitment && depositData.amount >= _amount && !depositData.spent) {
                storedDeposit = depositData;
                spentDepositKey = key;
                break;
            }
        }
    }

    if (!storedDeposit || !storedDeposit.secret || !storedDeposit.nullifier || !storedDeposit.commitment || !storedDeposit.amount) {
        return { success: false, error: "No commitment history found" };;
    }

    const existingSecret = BigInt(storedDeposit.secret);
    const existingNullifier = BigInt(storedDeposit.nullifier);
    const existingCommitment = BigInt(storedDeposit.commitment);

    const existingValue = BigInt(sdk.utils.parseUnits(storedDeposit.amount, _token.decimals).toString());
    const withdrawnValue = BigInt(sdk.utils.parseUnits(_amount, _token.decimals).toString());

    // Generate new nullifier and secret for the change output (if any)
    const newSecret = F.toObject(poseidon([existingSecret, 1n]));
    const newNullifier = F.toObject(poseidon([existingNullifier, 1n]));
    const changeValue = existingValue - withdrawnValue;


    // Get all commitments from local storage to build a local Merkle tree
    const commitments: bigint[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${_chainId}-${_token.symbol}-`)) { // Assuming a naming convention for commitment keys
            const storedData = JSON.parse(localStorage.getItem(key) || '{}');
            if (storedData.commitment) {
                commitments.push(BigInt(storedData.commitment));
            }
        }
    }

    // Build a local Merkle tree
    const leanIMT = new LeanIMT((a, b) => {
        return poseidon([a, b]);
    });
    for (const c of commitments) {
        leanIMT.insert(c);
    }

    // Generate the Merkle proof
    // Find the index of the existing commitment in the tree
    const leafIndex = leanIMT.indexOf(existingCommitment);
    if (leafIndex === -1) {
        return { success: false, error: "Commitment not found in Merkle tree" };
    }

    // Generate the Merkle proof using the index (convert BigInt to number)
    const proof = leanIMT.generateProof(Number(leafIndex));
    const pathElements = proof.siblings;

    // Generate pathIndices array - each index indicates if sibling is on left (0) or right (1)
    const pathIndices = [];
    let currentIndex = Number(leafIndex);
    for (let i = 0; i < proof.siblings.length; i++) {
        pathIndices.push(currentIndex % 2);
        currentIndex = Math.floor(currentIndex / 2);
    }

    // Pad pathElements and pathIndices to match circuit depth (32)
    const TREE_DEPTH = 32;
    while (pathElements.length < TREE_DEPTH) {
        pathElements.push(0n);
        pathIndices.push(0);
    }

    // Ensure we don't exceed the tree depth
    if (pathElements.length > TREE_DEPTH) {
        return { success: false, error: `Merkle proof depth ${pathElements.length} exceeds circuit depth ${TREE_DEPTH}` };
    }

    // Prepare withdrawal transaction with ZK proof
    const withdrawalTxData = await prepareWithdrawalTransaction({
        existingValue: existingValue.toString(),
        existingNullifier: existingNullifier.toString(),
        existingSecret: existingSecret.toString(),
        withdrawnValue: withdrawnValue.toString(),
        newNullifier: newNullifier.toString(),
        newSecret: newSecret.toString(),
        pathElements: pathElements,
        pathIndices: pathIndices,
        recipient: _recipient,
    });

    // Check formats
    console.log("withdrawalTxData:", {
        amount: typeof withdrawalTxData.amount,
        nullifierHash: typeof withdrawalTxData.nullifierHash,
        newCommitment: typeof withdrawalTxData.newCommitment,
        proof: typeof withdrawalTxData.proof,
        proofValue: withdrawalTxData.proof
    });

    // Package zkData
    const zkData = {
        withdrawalTxData: withdrawalTxData,
        changeValue: changeValue,
        newDepositKey: `${_chainId}-${_token.symbol}-${withdrawalTxData.newCommitment.toString()}`,
        newDeposit: {
            secret: newSecret.toString(),
            nullifier: newNullifier.toString(),
            commitment: withdrawalTxData.newCommitment.toString(),
            amount: sdk.utils.formatUnits(changeValue, _token.decimals)
        },
        spentDepositKey: spentDepositKey,
        spentDeposit: storedDeposit
    }

    return zkData;
}

export function encodeProof(proofArray: string[]): `0x${string}` {
    // Convert each proof element to a 32-byte hex string and concatenate
    const encoded = proofArray.map(element => {
        const bn = BigInt(element);
        return bn.toString(16).padStart(64, '0');
    }).join('');

    return `0x${encoded}`;
}