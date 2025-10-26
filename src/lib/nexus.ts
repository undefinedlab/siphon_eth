import { NexusSDK, SUPPORTED_TOKENS, SUPPORTED_CHAINS_IDS, EthereumProvider, NexusNetwork } from '@avail-project/nexus-core';

// Declare SDK singleton variable
const sdk = new NexusSDK({ 
  network: 'testnet' as NexusNetwork
});

export function getNexusSDK(): NexusSDK {
  return sdk;
}

// Thin wrapper that calls sdk.isInitialized() from the SDK
export function isInitialized() {
  return sdk.isInitialized();
}

export async function initializeWithProvider(provider: unknown) {
  if (!provider) throw new Error('No EIP-1193 provider (e.g., MetaMask) found');

  //If the SDK is already initialized, return
  if (sdk.isInitialized()) return;

  //If the SDK is not initialized, initialize it with the provider passed as a parameter
  await sdk.initialize(provider as unknown as EthereumProvider);
}

export async function deinit() {

  //If the SDK is not initialized, return
  if (!sdk.isInitialized()) return;

  //If the SDK is initialized, de-initialize it
  await sdk.deinit();
}

export async function getUnifiedBalances() {

  //Get the unified balances from the SDK
  return await sdk.getUnifiedBalances();
}

// Bridge tokens using the actual Nexus SDK
// Transfer tokens using the actual Nexus SDK
export async function transferTokens(chainId: number, token: string, amount: string, recipient: string) {
  console.log('transferTokens called with:', { chainId, token, amount, recipient });

  if (!sdk.isInitialized()) {
    console.error('SDK not initialized');
    throw new Error('SDK not initialized');
  }

  try {
    console.log('Calling sdk.transfer with:', {
      chainId: chainId,
      token: token.toUpperCase(),
      amount: parseFloat(amount),
      recipient: recipient
    });

    // Use the actual Nexus SDK transfer method
    const result = await sdk.transfer({
      chainId: chainId as SUPPORTED_CHAINS_IDS,
      token: token.toUpperCase() as SUPPORTED_TOKENS,
      amount: parseFloat(amount),
      recipient: recipient as `0x${string}` // Type assertion for address format
    });

    console.log('SDK transfer result:', result);
    return result;
  } catch (error: unknown) {
    console.error('Transfer failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Transfer transaction failed'
    };
  }
}
