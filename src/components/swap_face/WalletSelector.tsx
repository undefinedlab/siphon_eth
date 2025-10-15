'use client';

import { useState } from 'react';

interface WalletOption {
  id: string;
  name: string;
  icon: string;
  chain: string;
  description: string;
}

const walletOptions: WalletOption[] = [
  {
    id: 'metamask',
    name: 'MetaMask',
    icon: 'MM',
    chain: 'EVM',
    description: 'Connect to Ethereum, Polygon, Arbitrum, and other EVM chains'
  },
  {
    id: 'solana',
    name: 'Solflare',
    icon: 'SOL',
    chain: 'Solana',
    description: 'Connect to Solana blockchain'
  },
  {
    id: 'bitcoin',
    name: 'Xverse',
    icon: 'BTC',
    chain: 'Bitcoin',
    description: 'Connect to Bitcoin network'
  },
  {
    id: 'xmr',
    name: 'Monero',
    icon: 'XMR',
    chain: 'Monero',
    description: 'Connect to Monero network'
  }
];

interface WalletSelectorProps {
  onWalletSelect: (walletId: string) => void;
  className?: string;
}

export default function WalletSelector({ onWalletSelect, className }: WalletSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleWalletClick = async (walletId: string) => {
    setIsOpen(false);
    onWalletSelect(walletId);
  };

  return (
    <div className={`wallet-selector ${className}`}>
      <button 
        className="wallet-selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="wallet-icon">🔗</span>
        <span className="wallet-text">Connect Wallet</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="wallet-dropdown">
          <div className="wallet-dropdown-header">
            <h4>Select Wallet</h4>
            <p>Choose your preferred wallet to connect</p>
          </div>
          
          <div className="wallet-options">
            {walletOptions.map((wallet) => (
              <button
                key={wallet.id}
                className="wallet-option"
                onClick={() => handleWalletClick(wallet.id)}
              >
                <div className="wallet-option-content">
                  <div className="wallet-option-header">
                    <span className="wallet-option-icon">{wallet.icon}</span>
                    <div className="wallet-option-info">
                      <span className="wallet-option-name">{wallet.name}</span>
                      <span className="wallet-option-chain">{wallet.chain}</span>
                    </div>
                  </div>
                  <p className="wallet-option-description">{wallet.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
