import { SUPPORTED_TOKENS, SUPPORTED_CHAINS_IDS } from '@avail-project/nexus-core';
import { getNexusSDK } from './nexus';

export const sdk = getNexusSDK();

const SYPHON_ADDRESS = '0x6697452475A0C858218eb54247Ffdc9c8ca977cb';
const NATIVE_TOKEN = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";

export async function deposit(_chain: string, _token: string, _amount: string) {
    // Will need to replace this with actual precommitment hash
    const precommitment = 0;

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
            console.log(`Native Asset Bridging Not Executed: ${bridgeResult.error}`);
        }

        // Native Asset Deposit
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
        return {success: true, transactionHash: result.transactionHash, error: undefined};
    } else {
        // Alternative Asset Bridging & Deposit
        const assetAddress = token.contractAddress;
        const result = await sdk.bridgeAndExecute({
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
        return {success: result.success, transactionHash: result.executeTransactionHash, error: result.error};
    }
}

export async function withdraw(_chain: string, _token: string, _amount: string, _recipient: string) {
    return true;
}