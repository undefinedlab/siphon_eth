'use client';

import { useState } from 'react';

interface Balance {
  chain: string;
  token: string;
  balance: string;
  symbol: string;
}

interface TokenOption {
  value: string;
  label: string;
  balance: string;
  symbol?: string;
  key?: string;
  shortName?: string;
  displayName?: string;
}

interface TokenSelectorProps {
  balances: Array<{
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
          Select Token
        </button>
      </div>
    );
  }

  // Extract tokens with chain information from balances
  const getTokenChainOptions = () => {
    const tokenChains: TokenOption[] = [];
    
    try {
      if (Array.isArray(balances)) {
        // Handle the actual Nexus SDK balance structure
        balances.forEach((tokenBalance: {
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
        }) => {
          if (tokenBalance && tokenBalance.symbol && tokenBalance.balance && parseFloat(tokenBalance.balance) > 0) {
            // Process each chain in the breakdown
            if (tokenBalance.breakdown && Array.isArray(tokenBalance.breakdown)) {
              tokenBalance.breakdown.forEach((chainBalance: {
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
              }) => {
                if (chainBalance.balance && parseFloat(chainBalance.balance) > 0) {
                  const chainName = chainBalance.chain.name || chainBalance.chain.id.toString() || 'Unknown';
                  // Create short chain identifier with smaller text
                  const chainShort = chainName === 'Base' ? 'B' : 
                                   chainName === 'Sepolia' ? 'S' : 
                                   chainName === 'Polygon' ? 'P' : 
                                   chainName === 'Arbitrum' ? 'A' : 
                                   chainName.charAt(0).toUpperCase();
                  
                  tokenChains.push({
                    value: `${tokenBalance.symbol}-${chainName}`,
                    label: `${tokenBalance.symbol} on ${chainShort}`,
                    balance: chainBalance.balance,
                    symbol: tokenBalance.symbol,
                    key: `${tokenBalance.symbol}-${chainName}`,
                    shortName: chainShort,
                    displayName: `${tokenBalance.symbol} on ${chainShort}`
                  });
                }
              });
            }
          }
        });
      } else if (typeof balances === 'object') {
        Object.values(balances).forEach((chainBalances: unknown) => {
          if (Array.isArray(chainBalances)) {
            chainBalances.forEach((balance: Balance) => {
              if (balance && balance.symbol && parseFloat(balance.balance) > 0) {
                tokenChains.push({
                  value: `${balance.symbol}-${balance.chain}`,
                  label: `${balance.symbol} on ${balance.chain}`,
                  balance: balance.balance,
                  symbol: balance.symbol,
                  key: `${balance.symbol}-${balance.chain}`,
                  displayName: `${balance.symbol} on ${balance.chain}`
                });
              }
            });
          } else if (typeof chainBalances === 'object' && chainBalances !== null) {
            Object.values(chainBalances).forEach((nestedBalances: unknown) => {
              if (Array.isArray(nestedBalances)) {
                nestedBalances.forEach((balance: Balance) => {
                  if (balance && balance.symbol && parseFloat(balance.balance) > 0) {
                    tokenChains.push({
                      value: `${balance.symbol}-${balance.chain}`,
                      label: `${balance.symbol} on ${balance.chain}`,
                      balance: balance.balance,
                      symbol: balance.symbol,
                      key: `${balance.symbol}-${balance.chain}`,
                      displayName: `${balance.symbol} on ${balance.chain}`
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
        <option>Select Token</option>
      </select>
    );
  }

  // Find the selected option to show short name
  const selectedOption = tokenChainOptions.find(option => option.key === selectedToken);
  const displayText = selectedOption ? (
    <span>
      {selectedOption.symbol} <span className="chain-short">{selectedOption.shortName?.split(' ')[1] || ''}</span>
    </span>
  ) : 'Select Token';

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
                onTokenSelect(option.key || '');
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
