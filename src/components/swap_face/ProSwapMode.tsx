"use client";
import { useState, useEffect } from "react";
import "./ProSwapMode.css";
import { deposit, withdraw } from "../../lib/handler";
import { createStrategy } from "../../lib/strategy";
import { instantSwap } from "../../lib/swap";

interface ProSwapModeProps {
  isLoaded: boolean;
  nexusInitialized: boolean;
}

// UPDATED FOR PYTH: added pyth price feed IDs
const PYTH_PRICE_IDS: { [key: string]: string } = {
  'ETH': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace', 
  'USDC': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'USDT': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  'WBTC': '0xc9d8b075a5c69303365ae23633d4e085199bf5c520a3b90fed1322a0342ffc33',
};

export default function ProSwapMode({
  isLoaded,
  nexusInitialized
}: ProSwapModeProps) {
  const [swaps, setSwaps] = useState([{ 
    strategyType: "swap",
    from: "ETH", 
    to: "USDC", 
    amount: "", 
    liquidityEnabled: false,
    liquidity: "internal", 
    stopLossEnabled: false,
    stopLoss: "",
    stopGain: "",
    liquidityChain: "ETH",
    chain: "ETH",
    dex: "Uniswap",
    recipient_address: "",
    recipientEnabled: false,
  }]);
  const [withdrawals, setWithdrawals] = useState([
    { chain: "Ethereum Sepolia", token: "ETH", amount: "", recipient: "" }
  ]);
  const [depositInputs, setDepositInputs] = useState([
    { srcChain: "Ethereum Sepolia", token: "ETH", amount: "" }
  ]);
  // UPDATED FOR PYTH:realtime prices and loading status
  const [prices, setPrices] = useState<{ [key: string]: number }>({
    'ETH': 0,
    'USDC': 1,
    'USDT': 1,
    'WBTC': 0
  });
  const [pricesLoading, setPricesLoading] = useState(true);

  // UPDATED FOR PYTH: Function to fetch real time prices from Pyth
  const fetchPrices = async () => {
    try {
      const priceIds = Object.values(PYTH_PRICE_IDS);
      const idsParam = priceIds.map(id => `ids[]=${id}`).join('&');
      
      const response = await fetch(
        `https://hermes.pyth.network/v2/updates/price/latest?${idsParam}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch prices');
      }
      
      const data = await response.json();
      const newPrices: { [key: string]: number } = {};
      data.parsed?.forEach((priceData: any) => {
        const priceId = '0x' + priceData.id;
        const token = Object.keys(PYTH_PRICE_IDS).find(
          key => PYTH_PRICE_IDS[key] === priceId
        );
        
        if (token && priceData.price) {
          const price = Number(priceData.price.price) * Math.pow(10,priceData.price.expo);
          newPrices[token] = price;
        }
      });
      
      setPrices(prevPrices => ({ ...prevPrices, ...newPrices }));
      setPricesLoading(false);
    } catch (error) {
      console.error('Error fetching prices:', error);
      setPricesLoading(false);
    }
  };

  // UPDATED FOR PYTH:refresh prices every 10 seconds
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleDeposit = async () => {
    console.log('Depositing to Siphon Vault');

    // Confirm that wallet is connected
    if (!nexusInitialized) {
      alert('Please connect wallet first');
      return;
    }

    // Validate inputs
    for (let i = 0; i < depositInputs.length; i++) {
      const dep = depositInputs[i];
      if (!dep || parseFloat(dep.amount) <= 0) {
        alert(`Please enter a valid amount for Deposit #${i+1}`);
        return;
      }
      if (!dep.token) {
        alert(`Please select a token for Deposit #${i+1}`);
        return;
      }
    }
    
    // Execute each deposit
    for (let i = 0; i < depositInputs.length; i++) {
      try {
        const dep = depositInputs[i];

        // Bridge funds from the selected chain and deposit them into the vault
        const result = await deposit(dep.srcChain, dep.token, dep.amount);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

        if (result.success) {
          alert(`Successfully deposited ${dep.amount} ${dep.token} for Deposit #${i+1}`);
          setDepositInputs([{srcChain: "Ethereum Sepolia", token: "ETH", amount: ""}]);
        } else {
          alert(`Deposit failed: ${result.error}`);
        }
      } catch (error: unknown ) {
        console.error('Deposit failed:', error);
        alert(`Deposit failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const handleSwap = async () => {
    console.log('Executing Pro Strategy', swaps);

    if (!nexusInitialized) {
      alert('Please connect wallet first');
      return;
    }

    const swap = swaps[0];

    if (!swap.amount || parseFloat(swap.amount) <= 0) {
      alert('Please enter a valid amount');
      return;
    }

    try {
      const upperBound = parseFloat(swap.stopGain) || 0;
      const lowerBound = parseFloat(swap.stopLoss) || 0;

      let result;
      if (upperBound <= 0 && lowerBound <= 0) {
        console.log("Executing instant swap to vault contract");
        result = await instantSwap(swap.from, swap.to, swap.amount, swap.recipient_address);
      } else {
        const strategyPayload = {
          user_id: "user123", // Replace with actual wallet/JWT user ID
          strategy_type: "BRACKET_ORDER_LONG",
          asset_in: swap.from,
          asset_out: swap.to,
          amount: parseFloat(swap.amount),
          upper_bound: upperBound, // Raw numbers for Rust generator
          lower_bound: lowerBound,
          recipient_address: swap.recipient_address,
        };

        console.log("Sending strategy to Payload Generator:", strategyPayload);

        result = await createStrategy(strategyPayload);
      }

      if (result.success) {
        console.log("Payload generated:", result.data);
        alert("✅ Transaction successfully generated. Check console for details.");
      } else {
        alert(`❌ Transaction generation failed: ${result.error}`);
      }
    } catch (error: unknown) {
      console.error("Error generating payload:", error);
      alert(`Failed to generate payload: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleWithdraw = async () => {
    console.log('Withdrawing from Siphon Vault');

    // Confirm that wallet is connected
    if (!nexusInitialized) {
      alert('Please connect wallet first');
      return;
    }

    // Validate inputs
    for (let i = 0; i < withdrawals.length; i++) {
      const w = withdrawals[i];
      if (!w || parseFloat(w.amount) <= 0) {
        alert(`Please enter a valid amount for Withdrawal #${i+1}`);
        return;
      }
      if (!w.token) {
        alert(`Please select a token for Withdrawal #${i+1}`);
        return;
      }
    }
    
    // Execute each withdrawal
    for (let i = 0; i < withdrawals.length; i++) {
      try {
        const w = withdrawals[i];

        // Withdraw funds from the vault
        const result = await withdraw(w.chain, w.token, w.amount, w.recipient);
        console.log('Waiting for transaction confirmation...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 3 seconds

        if (result.success) {
          // Clear the form after successful transfer
          console.log(`Successfully withdrawn ${w.amount} ${w.token} for Withdrawal #${i+1}`);
          setWithdrawals([{chain: "Ethereum Sepolia", token: "ETH", amount: "", recipient: ""}]);
        } else {
          alert(`Withdraw failed: ${result.error}`);
          console.log(result.error);
        }
      } catch (error: unknown ) {
        console.error('Withdraw failed:', error);
        alert(`Withdraw failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
  };

  const addSwap = () => {
    setSwaps([...swaps, { 
      strategyType: "swap",
      from: "ETH", 
      to: "USDC", 
      amount: "", 
      liquidityEnabled: false,
      liquidity: "internal", 
      stopLossEnabled: false,
      stopLoss: "",
      stopGain: "",
      liquidityChain: "ETH",
      chain: "ETH",
      dex: "Uniswap",
      recipient_address: "",
      recipientEnabled: false,
    }]);
  };

  const removeSwap = (index: number) => {
    if (swaps.length > 1) {
      setSwaps(swaps.filter((_, i) => i !== index));
    }
  };

  const updateSwap = (index: number, field: string, value: string | boolean) => {
    const updatedSwaps = swaps.map((swap, i) => 
      i === index ? { ...swap, [field]: value } : swap
    );
    setSwaps(updatedSwaps);
  };

  const addWithdrawal = () => {
    setWithdrawals([...withdrawals, { chain: "Ethereum Sepolia", token: "ETH", amount: "", recipient: "" }]);
  };

  const removeWithdrawal = (index: number) => {
    if (withdrawals.length > 1) {
      setWithdrawals(withdrawals.filter((_, i) => i !== index));
    }
  };

  const updateWithdrawal = (index: number, field: string, value: string) => {
    const updatedWithdrawals = withdrawals.map((w, i) => 
      i === index ? { ...w, [field]: value } : w
    );
    setWithdrawals(updatedWithdrawals);
  };

  const addDepositInput = () => {
    setDepositInputs([...depositInputs, { srcChain: "Ethereum Sepolia", token: "ETH", amount: "" }]);
  };

  const removeDepositInput = (index: number) => {
    if (depositInputs.length > 1) {
      setDepositInputs(depositInputs.filter((_, i) => i !== index));
    }
  };

  const updateDepositInput = (index: number, field: string, value: string) => {
    const updatedInputs = depositInputs.map((input, i) => 
      i === index ? { ...input, [field]: value } : input
    );
    setDepositInputs(updatedInputs);
  };

  const calculateTotalDeposited = () => {
    const totals: { [key: string]: number } = {};
    
    depositInputs.forEach(input => {
      const amount = parseFloat(input.amount) || 0;
      if (amount > 0) {
        totals[input.token] = (totals[input.token] || 0) + amount;
      }
    });
    
    return totals;
  };

  // UPDATED FOR PYTH: integration part
  const getUSDEquivalent = (token: string, amount: number) => {
    return amount * (prices[token] || 0);
  };

  const calculateTotalWithdrawn = () => {
    const totals: { [key: string]: number } = {};
    
    withdrawals.forEach(w => {
      const amount = parseFloat(w.amount) || 0;
      if (amount > 0) {
        totals[w.token] = (totals[w.token] || 0) + amount;
      }
    });
    
    return totals;
  };

  const calculateSwapReceived = () => {
    const totals: { [key: string]: number } = {};
    
    swaps.forEach(swap => {
      const amount = parseFloat(swap.amount) || 0;
      if (amount > 0) {
        totals[swap.to] = (totals[swap.to] || 0) + amount;
      }
    });
    
    return totals;
  };

  return (
    <div className={`three-columns ${isLoaded ? 'loaded' : ''}`}>
      {/* Column 1: Deposit */}
      <div className="column">
        <div className="column-header">
          <div className="step-number">1</div>
          <h3 className="step-title" data-tooltip="Deposit your tokens to the Siphon Vault. Your funds are encrypted and anonymized using zero-knowledge proofs, making your transaction history completely private. Choose your blockchain network, select the token you want to deposit, enter the amount, and review the transaction details before proceeding.">Deposit</h3>
        </div>
        
        <div className="deposit-section">
          {depositInputs.map((input, index) => (
            <div key={index} className="deposit-item">
              <div className="deposit-header">
                <span className="deposit-label">Deposit {index + 1}</span>
                {depositInputs.length > 1 && (
                  <button 
                    className="remove-deposit"
                    onClick={() => removeDepositInput(index)}
                  >
                    ×
                  </button>
                )}
              </div>
              
              <div className="deposit-input-group">
                <div className="token-input">
                  <label>Chain</label>
                  <div className="token-selector">
                    <select
                      value={input.srcChain}
                      onChange={(e) => updateDepositInput(index, 'srcChain', e.target.value)}
                    >
                      <option value="Ethereum Sepolia">Ethereum</option>
                      <option value="Base Sepolia">Base</option>
                      <option value="Arbitrum Sepolia">Arbitrum</option>
                      <option value="Optimism Sepolia">Optimism</option>
                    </select>
                  </div>
                </div>

                <div className="token-input">
                  <label>Token</label>
                  <div className="token-selector">
                    <select
                      value={input.token}
                      onChange={(e) => updateDepositInput(index, 'token', e.target.value)}
                    >
                      <option value="ETH">ETH</option>
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                      <option value="WBTC">WBTC</option>
                    </select>
                  </div>
                </div>

                <div className="token-input">
                  <label>Amount</label>
                  <input
                    type="number"
                    placeholder="0.0"
                    value={input.amount}
                    onChange={(e) => updateDepositInput(index, 'amount', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          
           <button className="add-deposit-button" onClick={addDepositInput}>
             + Add Deposit
           </button>
         </div>
         
         <div className="deposit-stats">
           <div className="stat-row">
             <span>Total Deposits</span>
             <span>{depositInputs.length} transaction{depositInputs.length !== 1 ? 's' : ''}</span>
           </div>
           <div className="stat-row">
             <span>Deposit Fee</span>
             <span>0.01%</span>
           </div>
           <div className="stat-row">
             <span>Privacy Level</span>
             <span>Maximum</span>
           </div>
           <div className="stat-row">
             <span>Amount Deposited</span>
             <span>
               {(() => {
                 const totals = calculateTotalDeposited();
                 const totalUSD = Object.entries(totals).reduce((sum, [token, amount]) => 
                   sum + getUSDEquivalent(token, amount), 0
                 );
                 
                 if (totalUSD === 0) return 'No amount entered';
                 
                 const entries = Object.entries(totals).filter(([, amount]) => amount > 0);
                 if (entries.length === 1) {
                   const [token, amount] = entries[0];
                   return `${token} ${amount.toFixed(4)} ($${totalUSD.toFixed(2)})`;
                 } else {
                   return `$${totalUSD.toFixed(2)} total`;
                 }
               })()}
             </span>
           </div>
         </div>
         
         <button 
           className="action-button" 
           onClick={handleDeposit}
           disabled={!nexusInitialized}
         >
           {nexusInitialized ? 'Deposit to Vault' : 'Initialize Nexus SDK First'}
         </button>
      </div>

      {/* Column 2: Strategy */}
      <div className="column">
        <div className="column-header">
          <div className="step-number">2</div>
          <h3 className="step-title" data-tooltip="Create complex trading strategies with multiple swaps. Each swap is executed privately within the vault using homomorphic encryption, ensuring your trading patterns remain completely anonymous. Build sophisticated trading strategies by adding multiple swaps. Each swap can convert different amounts of tokens, allowing for complex multi-step trading operations.">Strategy</h3>
        </div>
        
        <div className="column-content">
          <div className="strategy-section">
          {swaps.map((swap, index) => (
            <div key={index} className="swap-item">
              <div className="swap-header">
                <span className="swap-label">Strategy {index + 1}</span>
                {swaps.length > 1 && (
                  <button 
                    className="remove-swap"
                    onClick={() => removeSwap(index)}
                  >
                    ×
                  </button>
                )}
              </div>
              
              <div className="strategy-type-selector">
                <div className="radio-group">
                  <label className="radio-option">
                    <input
                      type="radio"
                      name={`strategy-${index}`}
                      value="swap"
                      checked={swap.strategyType === "swap"}
                      onChange={(e) => updateSwap(index, 'strategyType', e.target.value)}
                    />
                    <span>Swap</span>
                  </label>
                  <label className="radio-option inactive">
                    <input
                      type="radio"
                      name={`strategy-${index}`}
                      value="long"
                      checked={swap.strategyType === "long"}
                      onChange={(e) => updateSwap(index, 'strategyType', e.target.value)}
                      disabled
                    />
                    <span>Long</span>
                  </label>
                  <label className="radio-option inactive">
                    <input
                      type="radio"
                      name={`strategy-${index}`}
                      value="short"
                      checked={swap.strategyType === "short"}
                      onChange={(e) => updateSwap(index, 'strategyType', e.target.value)}
                      disabled
                    />
                    <span>Short</span>
                  </label>
                </div>
              </div>
              
              <div className="swap-inputs">
                <div className="input-group">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={swap.amount}
                    onChange={(e) => updateSwap(index, 'amount', e.target.value)}
                  />
                  <div className="token-selector">
                    <select
                      value={swap.from}
                      onChange={(e) => updateSwap(index, 'from', e.target.value)}
                    >
                      <option value="ETH">ETH</option>
                      <option value="USDC">USDC</option>
                      <option value="USDT">USDT</option>
                      <option value="WBTC">WBTC</option>
                    </select>
                  </div>
                </div>
                

                <div className="swap-arrow">→</div>

                <div className="token-selector">
                  <select
                    value={swap.to}
                    onChange={(e) => updateSwap(index, 'to', e.target.value)}
                  >
                    <option value="ETH">ETH</option>
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDT</option>
                    <option value="WBTC">WBTC</option>
                  </select>
                </div>
              </div>

              <div className="swap-options">
                <div className="option-group">
                  <div className="toggle-group">
                    <label className="toggle-option">
                      <input
                        type="checkbox"
                        checked={swap.liquidityEnabled}
                        onChange={(e) => updateSwap(index, 'liquidityEnabled', e.target.checked)}
                      />
                      <span className="toggle-slider"></span>
                      <span className="toggle-label">Use External Liquidity</span>
                    </label>
                  </div>
                </div>

                {swap.liquidityEnabled && (
                  <div className="external-liquidity-selector">
                    <label className="sub-option-label">External Liquidity Details</label>
                    <div className="chain-dex-row">
                      <div className="token-selector">
                        <select
                          value={swap.liquidityChain}
                          onChange={(e) => updateSwap(index, 'liquidityChain', e.target.value)}
                        >
                          <option value="ETHEREUM">Ethereum</option>
                          <option value="POLYGON">Polygon</option>
                          <option value="ARBITRUM">Arbitrum</option>
                          <option value="BASE">Base</option>
                          <option value="OPTIMISM">Optimism</option>
                        </select>
                      </div>
                      <div className="token-selector">
                        <select
                          value={swap.dex}
                          onChange={(e) => updateSwap(index, 'dex', e.target.value)}
                        >
                          <option value="Uniswap">Uniswap</option>
                          <option value="SushiSwap">SushiSwap</option>
                          <option value="PancakeSwap">PancakeSwap</option>
                          <option value="Curve">Curve</option>
                          <option value="Balancer">Balancer</option>
                          <option value="1inch">1inch</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {swap.strategyType === "swap" && (
                  <div className="option-group">
                    <div className="toggle-group">
                      <label className="toggle-option">
                        <input
                          type="checkbox"
                          checked={swap.stopLossEnabled}
                          onChange={(e) => updateSwap(index, 'stopLossEnabled', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">Enable Stop Loss & Take Profit</span>
                      </label>
                    </div>
                    
                    {swap.stopLossEnabled && (
                      <div className="stop-settings">
                        <div className="stop-input">
                          <label>Stop Loss Price</label>
                          <input
                            type="number"
                            placeholder="0.0"
                            value={swap.stopLoss}
                            onChange={(e) => updateSwap(index, 'stopLoss', e.target.value)}
                          />
                        </div>
                        <div className="stop-input">
                          <label>Take Profit Price</label>
                          <input
                            type="number"
                            placeholder="0.0"
                            value={swap.stopGain}
                            onChange={(e) => updateSwap(index, 'stopGain', e.target.value)}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="option-group">
                    <div className="toggle-group">
                      <label className="toggle-option">
                        <input
                          type="checkbox"
                          checked={!!swap.recipientEnabled}
                          onChange={(e) => updateSwap(index, 'recipientEnabled', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-label">Enter Recipient Address</span>
                      </label>
                    </div>
                    
                    {swap.recipientEnabled && (
                      <div className="address-input">
                        <label>Recipient Address</label>
                        <input
                          type="text"
                          placeholder="Enter address (e.g., 0x...)"
                          value={swap.recipient_address}
                          onChange={(e) => updateSwap(index, 'recipient_address', e.target.value)}
                        />
                      </div>
                    )}
                  </div>

              <div className="swap-preview">
                <div className="preview-row">
                  <span>Rate</span>
                  {/* UPDATED FOR PYTH */}
                  <span>
                    {pricesLoading ? (
                      'Loading...'
                    ) : prices[swap.from] > 0 && prices[swap.to] > 0 ? (
                      `1 ${swap.from} = ${(prices[swap.from] / prices[swap.to]).toFixed(4)} ${swap.to}`
                    ) : (
                      'Price unavailable'
                    )}
                  </span>
                </div>
                <div className="preview-row">
                  <span>Slippage</span>
                  <span>{swap.liquidity === "internal" ? "0.1%" : "0.5%"}</span>
                </div>
                <div className="preview-row">
                  <span>Fee</span>
                  <span>{swap.liquidity === "internal" ? "0.05%" : "0.3%"}</span>
                </div>
              </div>
            </div>
          ))}
          
          <button className="add-swap-button" onClick={addSwap}>
            + Add Swap
          </button>
          </div>
        </div>
        
        <div className="strategy-stats">
          <div className="stat-row">
            <span>Total Swaps</span>
            <span>{swaps.length} transaction{swaps.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="stat-row">
            <span>Execution Fee</span>
            <span>0.1%</span>
          </div>
          <div className="stat-row">
            <span>Privacy Level</span>
            <span>Maximum</span>
          </div>

          <div className="stat-row">
            <span>Amount Received</span>
            <span>
              {(() => {
                const totals = calculateSwapReceived();
                const totalUSD = Object.entries(totals).reduce((sum, [token, amount]) => 
                  sum + getUSDEquivalent(token, amount), 0
                );
                
                if (totalUSD === 0) return 'No amount entered';
                
                const entries = Object.entries(totals).filter(([, amount]) => amount > 0);
                if (entries.length === 1) {
                  const [token, amount] = entries[0];
                  return `${token} ${amount.toFixed(4)} ($${totalUSD.toFixed(2)})`;
                } else {
                  return `$${totalUSD.toFixed(2)} total`;
                }
              })()}
            </span>
          </div>
        </div>
        
        <button 
          className="action-button" 
          onClick={handleSwap}
          disabled={!nexusInitialized}
        >
          {nexusInitialized ? 'Execute Strategy' : 'Initialize Nexus SDK First'}
        </button>
      </div>

      {/* Column 3: Withdraw */}
      <div className="column">
        <div className="column-header">
          <div className="step-number">3</div>
          <h3 className="step-title" data-tooltip="Withdraw your tokens to any wallet address. The withdrawal process uses advanced privacy techniques to break the transaction trail, ensuring your funds cannot be traced back to their original source. Configure multiple withdrawal outputs to different wallet addresses. Specify the exact amount and token for each output, enabling complex distribution strategies.">Withdraw</h3>
        </div>
        
        <div className="column-content">
          <div className="withdraw-section">
          {withdrawals.map((w, index) => (
            <div key={index} className="withdraw-item">
              <div className="withdraw-header">
                <span className="withdraw-label">Output {index + 1}</span>
                {withdrawals.length > 1 && (
                  <button 
                    className="remove-withdraw"
                    onClick={() => removeWithdrawal(index)}
                  >
                    ×
                  </button>
                )}
              </div>
              
              <div className="withdraw-inputs">
                <div className="deposit-input-group">
                  <div className="token-input">
                    <label>Chain</label>
                    <div className="token-selector">
                      <select
                        value={w.chain}
                        onChange={(e) => updateWithdrawal(index, 'chain', e.target.value)}
                      >
                      <option value="Ethereum Sepolia">Ethereum</option>
                      <option value="Base Sepolia" disabled>Base</option>
                      <option value="Arbitrum Sepolia" disabled>Arbitrum</option>
                      <option value="Optimism Sepolia" disabled>Optimism</option>
                      </select>
                    </div>
                  </div>

                  <div className="token-input">
                    <label>Token</label>
                    <div className="token-selector">
                      <select
                        value={w.token}
                        onChange={(e) => updateWithdrawal(index, 'token', e.target.value)}
                      >
                        <option value="ETH">ETH</option>
                        <option value="USDC">USDC</option>
                        <option value="USDT">USDT</option>
                      </select>
                    </div>
                  </div>

                  <div className="token-input">
                    <label>Amount</label>
                    <input
                      type="number"
                      placeholder="0.0"
                      value={w.amount}
                      onChange={(e) => updateWithdrawal(index, 'amount', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="wallet-input">
                  <label>Wallet Address</label>
                  <input
                    type="text"
                    placeholder="Enter wallet address"
                    value={w.recipient}
                    onChange={(e) => updateWithdrawal(index, 'recipient', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button className="add-withdraw-button" onClick={addWithdrawal}>
            + Add Output
          </button>
          </div>
        </div>
        
        <div className="withdraw-stats">
          <div className="stat-row">
            <span>Total Outputs</span>
            <span>{withdrawals.length} transaction{withdrawals.length !== 1 ? 's' : ''}</span>
          </div>
          <div className="stat-row">
            <span>Withdrawal Fee</span>
            <span>0.03%</span>
          </div>
          <div className="stat-row">
            <span>Privacy Level</span>
            <span>Maximum</span>
          </div>
          <div className="stat-row">
            <span>Amount Withdrawn</span>
            <span>
              {(() => {
                const totals = calculateTotalWithdrawn();
                const totalUSD = Object.entries(totals).reduce((sum, [token, amount]) => 
                  sum + getUSDEquivalent(token, amount), 0
                );
                
                if (totalUSD === 0) return 'No amount entered';
                
                const entries = Object.entries(totals).filter(([, amount]) => amount > 0);
                if (entries.length === 1) {
                  const [token, amount] = entries[0];
                  return `${token} ${amount.toFixed(4)} (${totalUSD.toFixed(2)})`;
                } else {
                  return `${totalUSD.toFixed(2)} total`;
                }
              })()}
            </span>
          </div>
        </div>
        
        <button 
          className="action-button" 
          onClick={handleWithdraw}
          disabled={!nexusInitialized}
        >
          {nexusInitialized ? 'Execute Withdrawals' : 'Initialize Nexus SDK First'}
        </button>
      </div>
    </div>
  );
}
