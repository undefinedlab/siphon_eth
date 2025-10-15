import { NexusSDK } from '@avail-project/nexus-core';

export const sdk = new NexusSDK({ network: 'testnet' });

// Thin wrapper that calls sdk.isInitialized() from the SDK
export function isInitialized() {
  return sdk.isInitialized();
}

export async function initializeWithProvider(provider: any) {
  if (!provider) throw new Error('No EIP-1193 provider (e.g., MetaMask) found');
  
  //If the SDK is already initialized, return
  if (sdk.isInitialized()) return;

  //If the SDK is not initialized, initialize it with the provider passed as a parameter
  await sdk.initialize(provider);
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
export async function bridgeTokens(token: string, amount: string, chainId: number, sourceChains?: number[]) {
  console.log('bridgeTokens called with:', { token, amount, chainId, sourceChains });
  
  if (!sdk.isInitialized()) {
    console.error('SDK not initialized');
    throw new Error('SDK not initialized');
  }
  
  try {
    console.log('Calling sdk.bridge with:', {
      token: token.toUpperCase(),
      amount: parseFloat(amount),
      chainId: chainId,
      sourceChains: sourceChains
    });
    
    // Use the  Nexus SDK bridge method
    const result = await sdk.bridge({
      token: token.toUpperCase() as any, // Convert to supported token format
      amount: parseFloat(amount),
      chainId: chainId as any, // Convert to supported chain ID format
      sourceChains: sourceChains
    });
    
    console.log('SDK bridge result:', result);
    return result;
  } catch (error: any) {
    console.error('Bridge failed:', error);
    return { 
      success: false, 
      error: error.message || 'Bridge transaction failed' 
    };
  }
}

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
      chainId: chainId as any,
      token: token.toUpperCase() as any,
      amount: parseFloat(amount),
      recipient: recipient as `0x${string}` // Type assertion for address format
    });
    
    console.log('SDK transfer result:', result);
    return result;
  } catch (error: any) {
    console.error('Transfer failed:', error);
    return { 
      success: false, 
      error: error.message || 'Transfer transaction failed' 
    };
  }
}
