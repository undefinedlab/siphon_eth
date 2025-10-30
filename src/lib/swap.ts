import { SUPPORTED_CHAINS_IDS } from '@avail-project/nexus-core';
import { getNexusSDK } from './nexus';
import { generateZKData, encodeProof } from './zkHandler';

export const sdk = getNexusSDK();

const VAULT_CHAIN_ID = 11155111  // Vault contract is located in ETH Sepolia
const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const ENTRYPOINT_ADDRESS = '0x6163B029aA6AdDd692C8d622f7504feafe35248a';
const FEE = 3000;
const MIN_AMOUNT_OUT = 0;

export async function instantSwap(_srcToken: string, _dstToken: string, _amount: string, _recipient: string) {
    // Get chain data
    const chain = sdk.utils.getSupportedChains(0).find(c => c.id === VAULT_CHAIN_ID);
    if (!chain) {
        return { success: false, error: "Chain not supported" };
    }
    
    // Get token data
    let srcToken, dstToken;
    if (_srcToken == 'ETH') {
        srcToken = sdk.chainList.getNativeToken(VAULT_CHAIN_ID);
    } else {
        srcToken = chain.tokens.find(t => t.symbol.toUpperCase() === _srcToken.toUpperCase());
    }
    if (_dstToken == 'ETH') {
        dstToken = sdk.chainList.getNativeToken(VAULT_CHAIN_ID);
    } else {
        dstToken = chain.tokens.find(t => t.symbol.toUpperCase() === _dstToken.toUpperCase());
    }
    if (!srcToken || !dstToken) {
        return { success: false, error: "Token not supported" };
    }

    // Process parameter data
    const srcTokenAddress = srcToken.symbol == 'ETH' ? NATIVE_TOKEN : srcToken.contractAddress;
    const dstTokenAddress = dstToken.symbol == 'ETH' ? NATIVE_TOKEN : dstToken.contractAddress;
    const srcAmount = sdk.utils.parseUnits(_amount, srcToken.decimals).toString();
    console.log(`Swap - Chain: ${chain.id}, From ${srcAmount} ${srcToken.symbol} to ${dstToken.symbol}`);

    try {
        // Process ZK Data
        const zkData = await generateZKData(VAULT_CHAIN_ID, srcToken, _amount, _recipient);

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

        const result = await sdk.execute({
            toChainId: chain.id as SUPPORTED_CHAINS_IDS,
            contractAddress: ENTRYPOINT_ADDRESS,
            contractAbi: [{
                "inputs": [
                    {
                        "internalType": "address",
                        "name": "_srcToken",
                        "type": "address"
                    },
                    {
                        "internalType": "address",
                        "name": "_dstToken",
                        "type": "address"
                    },
                    {
                        "internalType": "address payable",
                        "name": "_recipient",
                        "type": "address"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_amountIn",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint256",
                        "name": "_minAmountOut",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint24",
                        "name": "_fee",
                        "type": "uint24"
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
                "name": "swap",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            }],
            functionName: 'swap',
            buildFunctionParams: () => {
                return {
                    functionParams: [
                        srcTokenAddress,
                        dstTokenAddress,
                        _recipient,
                        srcAmount,
                        MIN_AMOUNT_OUT,
                        FEE,
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
            
            return { success: true, data: result.transactionHash };
        }
        return { success: false, data: undefined };
    } catch (error: unknown) {
        console.error("Error during swap:", error);
        return { success: false, data: undefined };
    }
}