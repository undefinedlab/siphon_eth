import { SUPPORTED_TOKENS, SUPPORTED_CHAINS_IDS } from '@avail-project/nexus-core';
import { getNexusSDK } from './nexus';
import { buildPoseidon } from "circomlibjs";
import crypto from 'crypto';
import { prepareWithdrawalTransaction } from "./generateProof";
import { LeanIMT } from "@zk-kit/lean-imt";

export const sdk = getNexusSDK();

const VAULT_CHAIN_ID = 11155111  // Vault contract is located in ETH Sepolia
const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ENTRYPOINT_ADDRESS = '0x43440e22471EcF16aB981ea7A4682FD8D1f4F017';

// Helper function to encode proof array to bytes
function encodeProof(proofArray: string[]): `0x${string}` {
    // Convert each proof element to a 32-byte hex string and concatenate
    const encoded = proofArray.map(element => {
        const bn = BigInt(element);
        return bn.toString(16).padStart(64, '0');
    }).join('');

    return `0x${encoded}`;
}

export async function deposit(_srcChainName: string, _token: string, _amount: string) {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // Generate secret and nullifier
    const secret = BigInt('0x' + crypto.randomBytes(32).toString('hex'));
    const nullifier = BigInt('0x' + crypto.randomBytes(32).toString('hex'));

    // Calculate precommitment
    const precommitment = F.toString(poseidon([nullifier, secret]));

    // Store secret, nullifier, precommitment, and amount in local storage
    const depositId = `${VAULT_CHAIN_ID}-${_token}-${precommitment}`;
    localStorage.setItem(depositId, JSON.stringify({ secret: secret.toString(), nullifier: nullifier.toString(), precommitment: precommitment, amount: _amount }));

    // Retrieve source chain & token data
    const srcChain = sdk.utils.getSupportedChains(0).find(c => c.name.toUpperCase() === _srcChainName.toUpperCase());
    if (srcChain == undefined) {
        return { success: false, error: `Chain not supported: ${_srcChainName.toUpperCase()}` };
    }
    let token = sdk.chainList.getNativeToken(srcChain.id);
    if (_token.toUpperCase() != token.symbol.toUpperCase()) {
        const erc20 = srcChain.tokens.find(t => t.symbol.toUpperCase() === _token.toUpperCase());
        if (!erc20) return { success: false, error: `Token not supported: ${_token.toUpperCase()}` };
        token = erc20;
    };

    // Parse token
    const hexAmount = sdk.utils.parseUnits(_amount, token.decimals).toString(16);
    const decAmount = sdk.utils.parseUnits(_amount, token.decimals).toString();

    try {
        console.log(`Pulling funds from '${srcChain.name}' - ${srcChain.id} chain`);
        
        // Execute bridging only if srcChain is not ETH Sepolia
        let bridge;
        if (srcChain.id != VAULT_CHAIN_ID){
            bridge = await sdk.bridge({
                token: token.symbol as SUPPORTED_TOKENS,
                amount: Number(_amount),
                chainId: VAULT_CHAIN_ID,
                sourceChains: [srcChain.id]
            });
        } else bridge = {success: true, transactionHash: undefined};

        // Execute deposit only if bridging is successful
        if (bridge.success) {
            let result;
            if (token.symbol == 'ETH') {
                result = await sdk.execute({
                    toChainId: VAULT_CHAIN_ID,
                    contractAddress: ENTRYPOINT_ADDRESS,
                    contractAbi: [{
                        "inputs": [
                            {
                                "internalType": "contract IERC20",
                                "name": "_asset",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "_amount",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "_precommitment",
                                "type": "uint256"
                            }
                        ],
                        "name": "deposit",
                        "outputs": [
                            {
                                "internalType": "uint256",
                                "name": "_commitment",
                                "type": "uint256"
                            }
                        ],
                        "stateMutability": "payable",
                        "type": "function"
                    }],
                    functionName: 'deposit',
                    buildFunctionParams: (
                        token: SUPPORTED_TOKENS,
                        amount: string,
                        chainId: SUPPORTED_CHAINS_IDS,
                        userAddress: `0x${string}`
                    ) => {
                        return { functionParams: [NATIVE_TOKEN, decAmount, precommitment] };
                    },
                    value: `0x${hexAmount}`
                });
            } else {
                // Set token allowance for Nexus router & entrypoint contracts
                await sdk.setAllowance(VAULT_CHAIN_ID, [token.symbol], BigInt(decAmount));
                const allowance = await sdk.execute({
                    toChainId: VAULT_CHAIN_ID,
                    contractAddress: token.contractAddress,
                    contractAbi: [{
                        "inputs": [
                            { "internalType": 'address', "name": 'spender', "type": 'address' },
                            { "internalType": 'uint256', "name": 'amount', "type": 'uint256' },
                        ],
                        "name": 'approve',
                        "outputs": [{ "internalType": 'bool', "name": '', "type": 'bool' }],
                        "stateMutability": 'nonpayable',
                        "type": 'function',
                    }],
                    functionName: 'approve',
                    buildFunctionParams: (
                        token: SUPPORTED_TOKENS,
                        amount: string,
                        chainId: SUPPORTED_CHAINS_IDS,
                        userAddress: `0x${string}`
                    ) => {
                        return { functionParams: [ENTRYPOINT_ADDRESS, decAmount] };
                    }
                });

                // Wait for approve transaction to finish
                for (let i = 0; i < 15; i++) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                    if (allowance.transactionHash) break;
                }

                // Alternative Asset Bridging & Deposit
                const assetAddress = token.contractAddress;
                result = await sdk.execute({
                    toChainId: VAULT_CHAIN_ID,
                    contractAddress: ENTRYPOINT_ADDRESS,
                    contractAbi: [{
                        "inputs": [
                            {
                                "internalType": "contract IERC20",
                                "name": "_asset",
                                "type": "address"
                            },
                            {
                                "internalType": "uint256",
                                "name": "_amount",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint256",
                                "name": "_precommitment",
                                "type": "uint256"
                            }
                        ],
                        "name": "deposit",
                        "outputs": [
                            {
                                "internalType": "uint256",
                                "name": "_commitment",
                                "type": "uint256"
                            }
                        ],
                        "stateMutability": "payable",
                        "type": "function"
                    }],
                    functionName: 'deposit',
                    buildFunctionParams: (
                        token: SUPPORTED_TOKENS,
                        amount: string,
                        chainId: SUPPORTED_CHAINS_IDS,
                        userAddress: `0x${string}`
                    ) => {
                        return { functionParams: [assetAddress, decAmount, precommitment] };
                    },
                    waitForReceipt: true
                });
            }

            // The result object from bridgeAndExecute already contains the transaction hash and success status
            // We need to extract the commitment from the logs if bridgeResult.success is true
            // For now, we'll continue to use precommitment as a placeholder
            const storedData = JSON.parse(localStorage.getItem(depositId) || '{}');
            localStorage.setItem(depositId, JSON.stringify({
                ...storedData,
                commitment: precommitment.toString() // Use precommitment as a placeholder
            }));

            return {
                success: true,
                bridgeTransaction: bridge.transactionHash,
                executeTransaction: result.transactionHash,
            };
        }
        return { success: false, error: bridge.error };
    } catch (e: any) {
        console.error("Error during deposit:", e);
        return { success: false, error: e.message };
    }
}

export async function withdraw(_chain: string, _token: string, _amount: string, _recipient: string) {
    
    // Get chain & token
    const chain = sdk.utils.getSupportedChains(0).find(c => c.name.toUpperCase() === _chain.toUpperCase());
    if (chain == undefined) {
        return { success: false, error: `Chain not supported: ${_chain.toUpperCase()}` };
    }
    let token = sdk.chainList.getNativeToken(chain.id);
    if (_token.toUpperCase() != token.symbol.toUpperCase()) {
        const erc20 = chain.tokens.find(t => t.symbol.toUpperCase() === _token.toUpperCase());
        if (!erc20) return { success: false, error: `Token not supported: ${_token.toUpperCase()}` };
        token = erc20;
    };
    
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // Retrieve stored deposit information
    // This is a simplified lookup. In a real app, you'd have a more robust way to manage deposits.
    let storedDeposit = null;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${chain.id}-${token.symbol}-`)) {
            const depositData = JSON.parse(localStorage.getItem(key) || '{}');
            if (depositData.commitment) {
                storedDeposit = depositData;
                break;
            }
        }
    }

    if (!storedDeposit || !storedDeposit.secret || !storedDeposit.nullifier || !storedDeposit.commitment || !storedDeposit.amount) {
        return { success: false, error: "No matching deposit found in local storage or missing data." };
    }

    const existingSecret = BigInt(storedDeposit.secret);
    const existingNullifier = BigInt(storedDeposit.nullifier);
    const existingCommitment = BigInt(storedDeposit.commitment);

    const existingValue = BigInt(sdk.utils.parseUnits(storedDeposit.amount, token.decimals).toString());
    const withdrawnValue = BigInt(sdk.utils.parseUnits(_amount, token.decimals).toString());

    // Generate new nullifier and secret for the change output (if any)
    const newSecret = poseidon.F.toObject(poseidon([existingSecret, 1n]));
    const newNullifier = poseidon.F.toObject(poseidon([existingNullifier, 1n]));
    const changeValue = existingValue - withdrawnValue;
    const newCommitment = changeValue > 0n
        ? poseidon.F.toObject(poseidon([newSecret, newNullifier, changeValue]))
        : 0n;

    // Get all commitments from local storage to build a local Merkle tree
    const commitments: bigint[] = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${chain.id}-${token.symbol}-`)) { // Assuming a naming convention for commitment keys
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
    let pathElements = proof.siblings;

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

    console.log("pathElements:", pathElements.map(p => p.toString()));
    console.log("pathIndices:", pathIndices);
    console.log("leafIndex:", leafIndex);

    // Process parameter data
    const tokenAddress = token.symbol == 'ETH' ? NATIVE_TOKEN : token.contractAddress;
    const parsedAmount = sdk.utils.parseUnits(_amount, token.decimals).toString();
    console.log(`Withdraw - Chain: ${chain.id}, Token: ${token.symbol}, TokenAddress: ${tokenAddress}, Amount: ${parsedAmount}`);

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
        recipient: _recipient
    });

    //check formats
    console.log("withdrawalTxData:", {
        amount: typeof withdrawalTxData.amount,
        nullifierHash: typeof withdrawalTxData.nullifierHash,
        newCommitment: typeof withdrawalTxData.newCommitment,
        proof: typeof withdrawalTxData.proof,
        proofValue: withdrawalTxData.proof
    });

    const localRoot = leanIMT.root;
    console.log("Local Merkle root:", localRoot.toString());
    console.log("Public signals stateRoot:", withdrawalTxData.publicSignals?.[3] || "Not found");
    console.log("StateRoot from circuit inputs:", withdrawalTxData.stateRoot);
    console.log("Do they match?", localRoot.toString() === (withdrawalTxData.publicSignals?.[3] || withdrawalTxData.stateRoot));

    // Log all commitments in our local tree
    console.log("Commitments in local tree:", commitments.map(c => c.toString()));
    console.log("Number of commitments:", commitments.length);
    console.log("Existing commitment we're withdrawing:", existingCommitment.toString());

    // Execute withdraw
    const result = await sdk.execute({
        toChainId: chain.id as SUPPORTED_CHAINS_IDS,
        contractAddress: ENTRYPOINT_ADDRESS,
        contractAbi: [{
            "inputs": [
                {
                    "internalType": "address",
                    "name": "_asset",
                    "type": "address"
                },
                {
                    "internalType": "address",
                    "name": "_recipient",
                    "type": "address"
                },
                {
                    "internalType": "uint256",
                    "name": "_amount",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "_nullifier",
                    "type": "uint256"
                },
                {
                    "internalType": "uint256",
                    "name": "_newCommitment",
                    "type": "uint256"
                },
                {
                    "internalType": "bytes",
                    "name": "_proof",
                    "type": "bytes"
                }
            ],
            "name": "withdraw",
            "outputs": [],
            "stateMutability": "nonpayable",
            "type": "function"
        }],
        functionName: 'withdraw',
        buildFunctionParams: (
            token: SUPPORTED_TOKENS,
            amount: string,
            chainId: SUPPORTED_CHAINS_IDS,
            userAddress: `0x${string}`
        ) => {
            return {
                functionParams: [
                    tokenAddress,
                    _recipient,
                    withdrawalTxData.amount.toString(),
                    withdrawalTxData.nullifierHash.toString(),
                    withdrawalTxData.newCommitment.toString(),
                    encodeProof(withdrawalTxData.proof)  // Encode the proof array
                ]
            };
        }
    });

    if (result) {
        return { success: true, transactionHash: result.transactionHash };
    } else
        return { success: false, transactionHash: undefined };
}
