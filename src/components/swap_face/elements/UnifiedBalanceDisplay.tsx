'use client';

interface UnifiedBalance {
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
}

export default function UnifiedBalanceDisplay({ balances }: { balances: UnifiedBalance[] | null }) {
  if (!balances) {
    return (
      <div className="balance-display">
        <h4>Unified Balances</h4>
        <p>No balances loaded. Connect wallet and fetch balances to see your tokens across all chains.</p>
      </div>
    );
  }

  // Handle the actual Nexus SDK balance structure
  let tokenBalances: UnifiedBalance[] = [];
  
  try {
    if (Array.isArray(balances)) {
      // Handle the actual Nexus SDK balance structure
      tokenBalances = balances.filter(token => 
        token && token.symbol && parseFloat(token.balance) > 0
      );
    } else if (typeof balances === 'object') {
      // If balances is an object, try to extract arrays from its values
      Object.values(balances).forEach(chainBalances => {
        if (Array.isArray(chainBalances)) {
          tokenBalances.push(...chainBalances.filter(token => 
            token && token.symbol && parseFloat(token.balance) > 0
          ));
        } else if (typeof chainBalances === 'object' && chainBalances !== null) {
          // Handle nested objects
          Object.values(chainBalances).forEach(nestedBalances => {
            if (Array.isArray(nestedBalances)) {
              tokenBalances.push(...nestedBalances.filter(token => 
                token && token.symbol && parseFloat(token.balance) > 0
              ));
            }
          });
        }
      });
    }
  } catch (error) {
    console.error('Error processing balances:', error);
    return (
      <div className="balance-display">
        <h4>Unified Balances</h4>
        <p>Error processing balance data. Check console for details.</p>
        <pre style={{ fontSize: '10px', opacity: 0.7 }}>
          {JSON.stringify(balances, null, 2)}
        </pre>
      </div>
    );
  }

  // Group balances by token symbol
  const groupedBalances: { [token: string]: UnifiedBalance[] } = {};
  tokenBalances.forEach(token => {
    if (token && token.symbol) {
      if (!groupedBalances[token.symbol]) {
        groupedBalances[token.symbol] = [];
      }
      groupedBalances[token.symbol].push(token);
    }
  });

  // If no balances found, show debug info
  if (Object.keys(groupedBalances).length === 0) {
    return (
      <div className="balance-display">
        <h4>Unified Balances</h4>
        <p>No balances found. This might be because:</p>
        <ul style={{ fontSize: '12px', opacity: 0.7, margin: '1rem 0' }}>
          <li>Wallet has no tokens on supported chains</li>
          <li>Nexus SDK is still loading balances</li>
          <li>Network connection issues</li>
        </ul>
        <details style={{ fontSize: '10px', opacity: 0.6 }}>
          <summary>Debug Info (Click to expand)</summary>
          <pre style={{ marginTop: '0.5rem', padding: '0.5rem', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
            {JSON.stringify(balances, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  return (
    <div className="balance-display">
      <h4>Unified Balances</h4>
      <div className="balance-grid">
        {Object.entries(groupedBalances).map(([token, tokenBalances]) => {
          const totalBalance = tokenBalances.reduce((sum, tokenBalance) => {
            return sum + parseFloat(tokenBalance.balance || '0');
          }, 0);

          const totalFiat = tokenBalances.reduce((sum, tokenBalance) => {
            return sum + (tokenBalance.balanceInFiat || 0);
          }, 0);

          return (
            <div key={token} className="token-balance-card">
              <div className="token-header">
                <span className="token-symbol">{token}</span>
                <div className="balance-info">
                  <span className="total-balance">{totalBalance.toFixed(6)}</span>
                  {totalFiat > 0 && (
                    <span className="fiat-balance"> ${totalFiat.toFixed(2)}</span>
                  )}
                </div>
              </div>
              <div className="chain-breakdown">
                {tokenBalances[0]?.breakdown?.map((chainBalance: {
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
                }, index: number) => {                  
                  // Extract chain name from nested chain object
                  const chainName = chainBalance.chain.name || chainBalance.chain.id.toString() || 'Unknown';
                  const chainAmount = parseFloat(chainBalance?.balance || '0');
                  
                  // Only show chains with positive balance
                  if (chainAmount <= 0) return null;
                  
                  return (
                    <div key={index} className="chain-balance">
                      <span className="chain-name">{String(chainName)}</span>
                      <span className="chain-balance-amount">{chainAmount.toFixed(6)}</span>
                    </div>
                  );
                }).filter(Boolean) || (
                  <div className="chain-balance">
                    <span className="chain-name">Total</span>
                    <span className="chain-balance-amount">{totalBalance.toFixed(6)}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
