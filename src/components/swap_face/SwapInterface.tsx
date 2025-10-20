"use client";

import { useState, useEffect } from "react";
import "./SwapInterface.css";
import UnifiedBalanceDisplay from "./elements/UnifiedBalanceDisplay";
import SimpleSwapMode from "./SimpleSwapMode";
import ProSwapMode from "./ProSwapMode";
import { isInitialized, initializeWithProvider, getUnifiedBalances } from "../../lib/nexus";
import { WalletInfo } from "../../lib/walletManager";

export default function SwapInterface() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProMode, setIsProMode] = useState(false);
  
  // Nexus SDK state
  const [nexusInitialized, setNexusInitialized] = useState(false);
  const [unifiedBalances, setUnifiedBalances] = useState<Array<{
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
  }> | null>(null);
  const [walletConnected, setWalletConnected] = useState(false);
  const [connectedWallet, setConnectedWallet] = useState<WalletInfo | null>(null);

  // Handler functions for child components
  const handleWalletConnected = (wallet: WalletInfo) => {
    setWalletConnected(true);
    setConnectedWallet(wallet);
  };

  const handleNexusInitialized = (initialized: boolean) => {
    setNexusInitialized(initialized);
  };

  const handleBalancesUpdated = (balances: any) => {
    setUnifiedBalances(balances);
  };


  useEffect(() => {
    // Delay to ensure styles are loaded
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    // Check if Nexus SDK is already initialized
    setNexusInitialized(isInitialized());

    return () => clearTimeout(timer);
  }, []);


  return (
    <div className="siphon-container">
      {/* Floating Mode Toggle */}
      <div className="floating-mode-toggle">
        <button 
          className={`toggle-button ${!isProMode ? 'active' : ''}`}
          onClick={() => setIsProMode(false)}
        >
          Swap
        </button>
        <button 
          className={`toggle-button ${isProMode ? 'active' : ''}`}
          onClick={() => setIsProMode(true)}
        >
          Pro
        </button>
      </div>

      {/* Left Sidebar for Unified Balances - Only show when wallet is connected and in simple mode */}
      {connectedWallet && !isProMode && (
        <div className="absolute-balance-sidebar">
          <UnifiedBalanceDisplay balances={unifiedBalances} />
        </div>
      )}

      <div className={`siphon-window ${isLoaded ? 'loaded' : ''} ${isProMode ? 'pro-mode' : 'simple-mode'}`}>
        {!isProMode ? (
          <SimpleSwapMode
            isLoaded={isLoaded}
            unifiedBalances={unifiedBalances}
            walletConnected={walletConnected}
            connectedWallet={connectedWallet}
            nexusInitialized={nexusInitialized}
            onWalletConnected={handleWalletConnected}
            onNexusInitialized={handleNexusInitialized}
            onBalancesUpdated={handleBalancesUpdated}
          />
        ) : (
          <ProSwapMode
            isLoaded={isLoaded}
            nexusInitialized={nexusInitialized}
          />
        )}
      </div>

    </div>
  );
}
