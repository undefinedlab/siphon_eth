import { SUPPORTED_TOKENS, SUPPORTED_CHAINS_IDS } from '@avail-project/nexus-core';
import { getNexusSDK } from './nexus';
import { buildPoseidon } from "circomlibjs";
import crypto from 'crypto';
import { prepareWithdrawalTransaction } from "./generateProof";
import { LeanIMT } from "@zk-kit/lean-imt";

// Helper function to encode proof array to bytes
function encodeProof(proofArray: string[]): `0x${string}` {
    // Convert each proof element to a 32-byte hex string and concatenate
    const encoded = proofArray.map(element => {
        const bn = BigInt(element);
        return bn.toString(16).padStart(64, '0');
    }).join('');
    
    return `0x${encoded}`;
}

export const sdk = getNexusSDK();

const SYPHON_ADDRESS = '0xE54918FF91D62566c291a05A04De6c9F297cFD0F';
const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export async function deposit(_chain: string, _token: string, _amount: string) {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // Generate secret and nullifier
    const secret = BigInt('0x' + crypto.randomBytes(32).toString('hex'));
    const nullifier = BigInt('0x' + crypto.randomBytes(32).toString('hex'));

    // Calculate precommitment
    const precommitment = F.toString(poseidon([nullifier, secret]));

    // Store secret, nullifier, precommitment, and amount in local storage
    const depositId = `${_chain}-${_token}-${precommitment}`;
    localStorage.setItem(depositId, JSON.stringify({ secret: secret.toString(), nullifier: nullifier.toString(), precommitment: precommitment, amount: _amount }));

    // Retrieve chain & token data
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

    // Process parameter data
    const hexAmount = sdk.utils.parseUnits(_amount, token.decimals).toString(16);
    const decAmount = sdk.utils.parseUnits(_amount, token.decimals).toString();
    console.log(`Deposit - Chain: ${chain.id}, Token: ${token.symbol}, TokenAddress: ${token.contractAddress}, Amount: ${decAmount}`);

    // Get source chains for the given token
    const userAsset = await sdk.getUnifiedBalance(token.symbol);
    if (!userAsset || !userAsset.breakdown) {
        return { success: false, error: `No balances found for ${token.symbol}` };
    }
    let sourceChains = userAsset.breakdown.filter(d => parseFloat(d.balance) > 0).map(b => b.chain.id);

    console.log(`Pulling funds from the following chains: ${sourceChains}`);

    // Execute bridging and deposit to vault
    if (token.symbol == 'ETH') {
        // Native Asset Bridging
        const bridgeResult = await sdk.bridge({
            token: token.symbol as SUPPORTED_TOKENS,
            amount: _amount,
            chainId: chain.id as SUPPORTED_CHAINS_IDS,
            sourceChains: sourceChains
        });

        if(bridgeResult.success) {
            console.log(`Native Asset Bridging Executed: ${bridgeResult.transactionHash}`);
        } else {
            //CHANGE: Improved logging for expected 'Insufficient balance' error during bridging
            if (bridgeResult.error && bridgeResult.error.includes("Insufficient balance")) {
                console.log("No funds available on other chains for bridging, proceeding with direct deposit");
            } else {
                console.error("Native Asset Bridging Not Executed:", bridgeResult.error);
            }
        }

        // Native Asset Deposit
        try {
            const result = await sdk.execute({
                toChainId: chain.id as SUPPORTED_CHAINS_IDS,
                contractAddress: SYPHON_ADDRESS,
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
                value: `0x${hexAmount}`,
                tokenApproval: undefined
            });
            //CHANGE: Added console.log to inspect the result object
            console.log("SDK Execute Result (Native Asset Deposit):", result);

            // Check what's actually in the result
            if (!result || !result.transactionHash || result.success === false) {
                console.error("Invalid or failed result from SDK:", result);
                return { success: false, error: result.error || "Invalid transaction result" };
            }

            // The commitment might be in result.receipt.logs or result.logs
            // For now, store the precommitment we calculated earlier
            const storedData = JSON.parse(localStorage.getItem(depositId) || '{}');
            localStorage.setItem(depositId, JSON.stringify({
                ...storedData,
                commitment: precommitment.toString() // Use precommitment instead of result.returnValue
            }));

            return {
                success: true,
                transactionHash: result.transactionHash?.toString() || result.transactionHash,
                error: undefined
            };
        } catch (e: any) {
            console.error("Error during native asset deposit:", e);
            return { success: false, error: `Deposit failed: ${e.message}` };
        }
    } else {
        // Alternative Asset Bridging & Deposit
        const bridgeResult = await sdk.bridgeAndExecute({
            token: token.symbol as SUPPORTED_TOKENS,
            amount: _amount,
            toChainId: chain.id as SUPPORTED_CHAINS_IDS,
            sourceChains: sourceChains,
            execute: {
                contractAddress: SYPHON_ADDRESS,
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
                tokenApproval: {
                    token: token.symbol as SUPPORTED_TOKENS,
                    amount: _amount
                }
            }
        });

        if(bridgeResult.success) {
            console.log(`Alternative Asset Bridging Executed: ${bridgeResult.executeTransactionHash}`);
        } else {
            //CHANGE: Improved logging for expected 'Insufficient balance' error during bridging
            if (bridgeResult.error && bridgeResult.error.includes("Insufficient balance")) {
                console.log("No funds available on other chains for bridging, proceeding with direct deposit");
            } else {
                console.error("Alternative Asset Bridging Not Executed:", bridgeResult.error);
            }
        }
    }

        // Now, proceed with the deposit to the vault (this part was already correct)
        try {
            // The result object from bridgeAndExecute already contains the transaction hash and success status
            // We need to extract the commitment from the logs if bridgeResult.success is true
            // For now, we'll continue to use precommitment as a placeholder
            const storedData = JSON.parse(localStorage.getItem(depositId) || '{}');
            localStorage.setItem(depositId, JSON.stringify({
                ...storedData,
                commitment: precommitment.toString() // Use precommitment as a placeholder
            }));

            return {
                success: bridgeResult.success,
                transactionHash: bridgeResult.executeTransactionHash?.toString() || bridgeResult.executeTransactionHash,
                error: bridgeResult.error
            };
        } catch (e: any) {
            console.error("Error during alternative asset deposit:", e);
            return { success: false, error: `Deposit failed: ${e.message}` };
        }
    }
export async function withdraw(_chain: string, _token: string, _amount: string, _recipient: string) {
    const poseidon = await buildPoseidon();
    const F = poseidon.F;

    // Retrieve stored deposit information
    // This is a simplified lookup. In a real app, you'd have a more robust way to manage deposits.
    let storedDeposit = null;
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(`${_chain}-${_token}-`)) {
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
    
    const chains = sdk.chainList.chains;
    const chain = chains.find(c => 
        c.id.toString() === _chain || 
        c.name.toUpperCase() === _chain.toUpperCase()
    );

    if (!chain) {
        return { success: false, error: `Chain not supported: ${_chain}` };
    }

    let token = sdk.chainList.getNativeToken(chain.id);
    if (_token.toUpperCase() !== token.symbol.toUpperCase()) {
        const erc20 = chain.tokens.find(t => t.symbol.toUpperCase() === _token.toUpperCase());
        if (!erc20) {
            return { success: false, error: `Token not supported: ${_token}` };
        }
        token = erc20;
    }
    
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
        if (key && key.startsWith(`${_chain}-${_token}-`)) { // Assuming a naming convention for commitment keys
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
        contractAddress: SYPHON_ADDRESS,
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
            return { functionParams: [
            tokenAddress, 
            _recipient, 
            withdrawalTxData.amount.toString(), 
            withdrawalTxData.nullifierHash.toString(), 
            withdrawalTxData.newCommitment.toString(), 
            encodeProof(withdrawalTxData.proof)  // Encode the proof array
        ] };
        }
    });

    if (result){
        return {success: true, transactionHash: result.transactionHash};
    } else 
        return {success: false, transactionHash: undefined};
}
