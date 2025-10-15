'use client';

import { useState, useEffect } from 'react';
import WalletSelector from './WalletSelector';
import { walletManager, WalletInfo } from '../../lib/walletManager';

export default function ConnectButton({ className, onConnected }: { className?: string; onConnected?: (wallet: WalletInfo) => void }) {
  const [connectedWallet, setConnectedWallet] = useState<WalletInfo | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    // Check for existing connections on mount
    const wallets = walletManager.getConnectedWallets();
    if (wallets.length > 0) {
      setConnectedWallet(wallets[0]);
    }
  }, []);

  const handleWalletSelect = async (walletId: string) => {
    setIsConnecting(true);
    try {
      const result = await walletManager.connectWallet(walletId);
      if (result.success && result.wallet) {
        setConnectedWallet(result.wallet);
        onConnected?.(result.wallet);
      } else {
        alert(`Failed to connect wallet: ${result.error}`);
      }
    } catch (error: unknown) {
      alert(`Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    if (connectedWallet) {
      walletManager.disconnectWallet(connectedWallet.id);
      setConnectedWallet(null);
      alert(`${connectedWallet.name} disconnected`);
    }
  };

  const formatAddress = (address: string) => {
    if (address.length <= 10) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (connectedWallet) {
    return (
      <div className={`connected-wallet ${className}`}>
        <div className="wallet-info">
          <span className="wallet-icon">
            {connectedWallet.id === 'metamask' ? 'MM' : 
             connectedWallet.id === 'solana' ? 'SOL' :
             connectedWallet.id === 'bitcoin' ? 'BTC' : 'XMR'}
          </span>
          <div className="wallet-details">
            <span className="wallet-name">{connectedWallet.name}</span>
            <span className="wallet-address">{formatAddress(connectedWallet.address)}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <WalletSelector 
      className={className}
      onWalletSelect={handleWalletSelect}
    />
  );
}
