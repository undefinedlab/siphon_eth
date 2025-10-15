'use client';

import { useState } from 'react';

interface Balance {
  chain: string;
  token: string;
  balance: string;
  symbol: string;
}

interface TokenSelectorProps {
  balances: any;
  selectedToken: string;
  onTokenSelect: (token: string) => void;
  className?: string;
}

export default function TokenSelector({ balances, selectedToken, onTokenSelect, className }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!balances) {
    return (
      <div className="token-selector-custom">
        <button className={`token-selector-button ${className}`} disabled>
          Select Token & Chain
        </button>
      </div>
    );
  }

  // Extract tokens with chain information from balances
  const getTokenChainOptions = () => {
    const tokenChains: any[] = [];
    
    try {
      if (Array.isArray(balances)) {
        // Handle the actual Nexus SDK balance structure
        balances.forEach((tokenBalance: any) => {
          if (tokenBalance && tokenBalance.symbol && parseFloat(tokenBalance.balance) > 0) {
            // Process each chain in the breakdown
            if (tokenBalance.breakdown && Array.isArray(tokenBalance.breakdown)) {
              tokenBalance.breakdown.forEach((chainBalance: any) => {
                if (parseFloat(chainBalance.balance) > 0) {
                  const chainName = chainBalance.chain?.name || chainBalance.chain?.id || 'Unknown';
                  // Create short chain identifier with smaller text
                  const chainShort = chainName === 'Base' ? 'B' : 
                                   chainName === 'Sepolia' ? 'S' : 
                                   chainName === 'Polygon' ? 'P' : 
                                   chainName === 'Arbitrum' ? 'A' : 
                                   chainName.charAt(0).toUpperCase();
                  
                  tokenChains.push({
                    symbol: tokenBalance.symbol,
                    chain: chainName,
                    balance: chainBalance.balance,
                    balanceInFiat: chainBalance.balanceInFiat || 0,
                    decimals: tokenBalance.decimals || 18,
                    displayName: `${tokenBalance.symbol} (${chainName})`,
                    shortName: `${tokenBalance.symbol} ${chainShort}`,
                    key: `${tokenBalance.symbol}-${chainName}`
                  });
                }
              });
            }
          }
        });
      } else if (typeof balances === 'object') {
        Object.values(balances).forEach((chainBalances: any) => {
          if (Array.isArray(chainBalances)) {
            chainBalances.forEach((balance: Balance) => {
              if (balance && balance.symbol && parseFloat(balance.balance) > 0) {
                tokenChains.push({
                  symbol: balance.symbol,
                  chain: balance.chain,
                  balance: balance.balance,
                  displayName: `${balance.symbol} (${balance.chain})`,
                  key: `${balance.symbol}-${balance.chain}`
                });
              }
            });
          } else if (typeof chainBalances === 'object' && chainBalances !== null) {
            Object.values(chainBalances).forEach((nestedBalances: any) => {
              if (Array.isArray(nestedBalances)) {
                nestedBalances.forEach((balance: Balance) => {
                  if (balance && balance.symbol && parseFloat(balance.balance) > 0) {
                    tokenChains.push({
                      symbol: balance.symbol,
                      chain: balance.chain,
                      balance: balance.balance,
                      displayName: `${balance.symbol} (${balance.chain})`,
                      key: `${balance.symbol}-${balance.chain}`
                    });
                  }
                });
              }
            });
          }
        });
      }
    } catch (error) {
      console.error('Error processing balances for token selector:', error);
    }

    return tokenChains;
  };

  const tokenChainOptions = getTokenChainOptions();

  if (tokenChainOptions.length === 0) {
    return (
      <select className={className} disabled>
        <option>Select Token & Chain</option>
      </select>
    );
  }

  // Find the selected option to show short name
  const selectedOption = tokenChainOptions.find(option => option.key === selectedToken);
  const displayText = selectedOption ? (
    <span>
      {selectedOption.symbol} <span className="chain-short">{selectedOption.shortName.split(' ')[1]}</span>
    </span>
  ) : 'Select Token & Chain';

  return (
    <div className="token-selector-custom">
      <button 
        className={`token-selector-button ${className}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        {displayText}
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="token-dropdown">
          {tokenChainOptions.map((option) => (
            <button
              key={option.key}
              className="token-option"
              onClick={() => {
                onTokenSelect(option.key);
                setIsOpen(false);
              }}
            >
              {option.displayName}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
