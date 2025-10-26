import { SUPPORTED_TOKENS, SUPPORTED_CHAINS_IDS } from '@avail-project/nexus-core';
import { getNexusSDK } from './nexus';
import { generateCommitmentData, generateZKData, encodeProof } from "./zkHandler";

export const sdk = getNexusSDK();

const VAULT_CHAIN_ID = 11155111  // Vault contract is located in ETH Sepolia
const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ENTRYPOINT_ADDRESS = '0x9A1909525Fb2810b87Fa370015d1cd6b2F5F8fcc';

export async function deposit(_srcChainName: string, _token: string, _amount: string) {
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

        // Generate commitment data
        const commitmentData = await generateCommitmentData(VAULT_CHAIN_ID, token, _amount);

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
                    buildFunctionParams: () => {
                        return { functionParams: [NATIVE_TOKEN, decAmount, commitmentData.precommitment] };
                    },
                    value: `0x${hexAmount}`
                });
            } else {
                // Set token allowance for Nexus router & entrypoint contracts
                await sdk.setAllowance(VAULT_CHAIN_ID, [token.symbol], BigInt(decAmount));
                await sdk.execute({
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
                    buildFunctionParams: () => {
                        return { functionParams: [ENTRYPOINT_ADDRESS, decAmount] };
                    }
                });

                // Wait for approve transaction to finish
                await new Promise(resolve => setTimeout(resolve, 10000));

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
                    buildFunctionParams: () => {
                        return { functionParams: [assetAddress, decAmount, commitmentData.precommitment] };
                    },
                    waitForReceipt: true
                });
            }

            // Store commitment data
            const id = `${VAULT_CHAIN_ID}-${token.symbol}-${commitmentData.commitment}`;
            localStorage.setItem(id, JSON.stringify(commitmentData));

            return {
                success: true,
                bridgeTransaction: bridge.transactionHash,
                executeTransaction: result.transactionHash,
            };
        }
        return { success: false, error: bridge.error };
    } catch (error: unknown) {
        console.error("Error during deposit:", error);
        return { success: false, error: error };
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

    // Process parameter data
    const decAmount = sdk.utils.parseUnits(_amount, token.decimals).toString();
    const tokenAddress = (token.symbol == 'ETH') ? NATIVE_TOKEN : token.contractAddress;

    const zkData = await generateZKData(VAULT_CHAIN_ID, token, _amount, _recipient);

    if ('error' in zkData) {
        return { success: false, error: zkData.error };
    }

    const withdrawalTxData = zkData.withdrawalTxData as {
        recipient: string;
        amount: string;
        nullifierHash: string;
        newCommitment: string;
        proof: string[];
        publicSignals: string[];
    };

    if ('error' in zkData) {
        return { success: false, error: zkData.error };
    }
    
    console.log("Token Address: ", tokenAddress);
    console.log("Amount: ", decAmount);
    console.log("Nullifier: ", withdrawalTxData.nullifierHash.toString());
    console.log("newCommitment: ", withdrawalTxData.newCommitment.toString());
    console.log("Proof: ", encodeProof(withdrawalTxData.proof));

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
        buildFunctionParams: () => {
            return {
                functionParams: [
                    tokenAddress,
                    _recipient,
                    decAmount,
                    withdrawalTxData.nullifierHash.toString(),
                    withdrawalTxData.newCommitment.toString(),
                    encodeProof(withdrawalTxData.proof)
                ]
            };
        }
    });

    if (result) {
        // Store new commitment if remaining_balance > 0
        if (zkData.changeValue > 0n) {
            localStorage.setItem(zkData.newDepositKey, JSON.stringify(zkData.newDeposit));
        }

        // Mark spent deposit
        if (zkData.spentDepositKey) {
            localStorage.setItem(zkData.spentDepositKey, JSON.stringify({...zkData.spentDeposit, spent: true}));
        }
        return { success: true, transactionHash: result.transactionHash };
    } else 
        return { success: false, transactionHash: undefined };
}
