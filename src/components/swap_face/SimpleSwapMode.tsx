"use client";

import { useState, useEffect } from "react";
import "./SimpleSwapMode.css";
import ConnectButton from "./elements/ConnectButton";
import TokenSelector from "./elements/TokenSelector";
import ToTokenSelector from "./elements/ToTokenSelector";
import { transferTokens, getUnifiedBalances, initializeWithProvider } from "../../lib/nexus";
import { WalletInfo } from "../../lib/walletManager";

interface SimpleSwapModeProps {
  isLoaded: boolean;
  unifiedBalances: Array<{
    symbol: string;
    balance: string;
    balanceInFiat?: number;
    breakdown?: Array<{
      balance: string;
      balanceInFiat?: number;
      chain: {
        id: number;
        logo: string;
        name: string;
      };
      contractAddress?: `0x${string}`;
      decimals?: number;
      isNative?: boolean;
    }>;
    decimals?: number;
    icon?: string;
  }> | null;
  walletConnected: boolean;
  connectedWallet: WalletInfo | null;
  nexusInitialized: boolean;
  onWalletConnected: (wallet: WalletInfo) => void;
  onNexusInitialized: (initialized: boolean) => void;
  onBalancesUpdated: (balances: Array<{
    symbol: string;
    balance: string;
    balanceInFiat?: number;
    breakdown?: Array<{
      balance: string;
      balanceInFiat?: number;
      chain: {
        id: number;
        logo: string;
        name: string;
      };
      contractAddress?: `0x${string}`;
      decimals?: number;
      isNative?: boolean;
    }>;
    decimals?: number;
    icon?: string;
  }>) => void;
}

export default function SimpleSwapMode({
  isLoaded,
  unifiedBalances,
  nexusInitialized,
  onWalletConnected,
  onNexusInitialized,
  onBalancesUpdated
}: SimpleSwapModeProps) {
  const [swapFromToken, setSwapFromToken] = useState("");
  const [swapToToken, setSwapToToken] = useState("USDC");
  const [swapAmount, setSwapAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [isTransferring, setIsTransferring] = useState(false);

  const handleSwap = async () => {
    console.log('handleSwap called');
    console.log('Current state:', { nexusInitialized, swapAmount, swapFromToken });
    
    if (!nexusInitialized) {
      alert('Please connect wallet first');
      return;
    }

    if (!swapAmount || parseFloat(swapAmount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    if (!swapFromToken) {
      alert('Please select a token');
      return;
    }

    if (!withdrawAddress) {
      alert('Please enter a withdrawal address');
      return;
    }

    setIsTransferring(true);

    try {
      // Parse the selected token-chain (format: "TOKEN-CHAIN")
      const [selectedToken, selectedChain] = swapFromToken.split('-');
      console.log(`Bridging ${swapAmount} ${selectedToken} from ${selectedChain} to Ethereum Sepolia`);
      
      // Bridge to Ethereum Sepolia testnet (chain ID: 11155111)
      const ethereumSepoliaChainId = 11155111; // Ethereum Sepolia testnet
      
      // Use the selected token from the dropdown
      const tokenSymbol = selectedToken || 'ETH'; // Fallback to ETH if no selection
      
      console.log('Calling transferTokens with:', {
        token: tokenSymbol,
        amount: swapAmount,
        chainId: ethereumSepoliaChainId,
        recipient: withdrawAddress
      });
      
      // Use transferTokens to send to the specified withdrawal address
      const result = await transferTokens(
        ethereumSepoliaChainId,
        tokenSymbol,
        swapAmount,
        withdrawAddress
      );
      
      console.log('Bridge transaction result:', result);
      
      if (result.success) {
        console.log(`Successfully transferred ${swapAmount} ${selectedToken} from ${selectedChain} to ${withdrawAddress} on Ethereum Sepolia`);
        
        // Wait a moment for the transaction to be processed
        console.log('Waiting for transaction confirmation...');
        await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds
        
        // Refresh balances after successful transaction
        try {
          console.log('Refreshing balances after successful transfer...');
          const refreshedBalances = await getUnifiedBalances();
          onBalancesUpdated(refreshedBalances);
          console.log('Balances refreshed successfully');
          
          // Clear the form after successful transfer
          setSwapAmount('');
          setSwapFromToken('');
          setWithdrawAddress('');
        } catch (refreshError: unknown) {
          console.error('Failed to refresh balances:', refreshError);
        }
      } else {
        alert(`Transfer failed: ${result.error}`);
      }
    } catch (error: unknown) {
      console.error('Transfer failed:', error);
      alert(`Transfer failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTransferring(false);
    }
  };

  // Auto-select token when balances are loaded
  useEffect(() => {
    if (unifiedBalances && !swapFromToken && Array.isArray(unifiedBalances)) {
      const firstTokenWithBalance = unifiedBalances.find(token => 
        token && token.symbol && parseFloat(token.balance) > 0
      );
      if (firstTokenWithBalance && firstTokenWithBalance.breakdown) {
        const firstChainWithBalance = firstTokenWithBalance.breakdown.find((chain: { balance: string; chain: { id: number; logo: string; name: string } }) => 
          parseFloat(chain.balance) > 0
        );
        if (firstChainWithBalance) {
          const chainName = firstChainWithBalance.chain.name || firstChainWithBalance.chain.id.toString() || 'Unknown';
          const tokenChainKey = `${firstTokenWithBalance.symbol}-${chainName}`;
          console.log('Auto-selecting token-chain from balances:', tokenChainKey);
          setSwapFromToken(tokenChainKey);
        }
      }
    }
  }, [unifiedBalances, swapFromToken]);

  return (
    <div className={`simple-swap ${isLoaded ? 'loaded' : ''}`}>
      <h3>Swap Tokens</h3>
      
      {/* Step 1: Connect Wallet */}
      <div className="swap-step">
        <div className="step-header">
          <span className="step-number">1</span>
          <span className="step-title">Connect Wallet</span>
        </div>
        <div className="step-content">
          <ConnectButton 
            className="step-connect-button" 
            onConnected={async (wallet) => {
              onWalletConnected(wallet);
              
              // Auto-initialize Nexus SDK for EVM wallets
              if (wallet.chain === 'EVM' && !nexusInitialized) {
                try {
                  const eth = (window as Window & { ethereum?: unknown })?.ethereum;
                  if (eth) {
                    await initializeWithProvider(eth);
                    onNexusInitialized(true);
                    console.log('Nexus SDK auto-initialized for EVM wallet');
                    
                // Auto-fetch balances after initialization
                try {
                  const balances = await getUnifiedBalances();
                  onBalancesUpdated(balances);
                  console.log('Balances auto-fetched after SDK initialization');
                  
                  // Set default token if none selected
                  if (!swapFromToken && Array.isArray(balances) && balances.length > 0) {
                    const firstTokenWithBalance = balances.find(token => 
                      token && token.symbol && parseFloat(token.balance) > 0
                    );
                    if (firstTokenWithBalance) {
                      console.log('Auto-selecting token:', firstTokenWithBalance.symbol);
                      setSwapFromToken(firstTokenWithBalance.symbol);
                    }
                  }
                } catch (balanceError: unknown) {
                  console.error('Auto-fetch balances failed:', balanceError);
                }
                  }
                } catch (error: unknown) {
                  console.error('Auto-initialization failed:', error);
                }
              }
            }}
          />
        </div>
      </div>

      <div className="swap-inputs">
        <div className="input-group">
          <input
            type="number"
            placeholder="0.0"
            value={swapAmount}
            onChange={(e) => setSwapAmount(e.target.value)}
          />
          <div className="token-selector">
            <TokenSelector
              balances={unifiedBalances}
              selectedToken={swapFromToken}
              onTokenSelect={setSwapFromToken}
              className="token-select"
            />
          </div>
        </div>

        <div className="swap-arrow">↓</div>

        <div className="input-group">
          <input
            type="number"
            placeholder="0.0"
            readOnly
          />
          <div className="token-selector">
            <ToTokenSelector
              selectedToken={swapToToken}
              onTokenSelect={setSwapToToken}
              className="token-select"
            />
          </div>
        </div>

        <br />

        <div className="wallet-input">
          <label>Withdraw to</label>
          <input
            type="text"
            placeholder="Enter wallet address"
            value={withdrawAddress}
            onChange={(e) => setWithdrawAddress(e.target.value)}
          />
        </div>
      </div>

      <div className="swap-info">
        <div className="info-row">
          <span>Rate</span>
          <span>1 SOL = 150 USDC</span>
        </div>
        <div className="info-row">
          <span>Slippage</span>
          <span>0.5%</span>
        </div>
        <div className="info-row">
          <span>Fee</span>
          <span>0.3%</span>
        </div>
      </div>

      <div className="privacy-info">
        <span className="privacy-text">
          🔒 Privacy: Standard swap with basic anonymity
        </span>
        <div className="privacy-tooltip">
          Standard swap uses public pools with basic privacy. For maximum anonymity, use Pro mode with Siphon Protocol&apos;s advanced privacy features.
        </div>
      </div>

      <button 
        className="action-button" 
        onClick={handleSwap}
        disabled={!nexusInitialized || isTransferring}
      >
        {isTransferring ? (
          <span className="loading-content">
            <span className="spinner"></span>
            Transferring...
          </span>
        ) : (
          nexusInitialized ? 'Transfer to Address' : 'Connect Wallet First'
        )}
      </button>
    </div>
  );
}
