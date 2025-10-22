"use client";

import { useState } from "react";
import "./ProSwapMode.css";
import { WalletInfo } from "../../lib/walletManager";

interface ProSwapModeProps {
  isLoaded: boolean;
  nexusInitialized: boolean;
}

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
    dex: "Uniswap"
  }]);
  const [withdrawInstructions, setWithdrawInstructions] = useState([
    { chain: "ETH", token: "USDC", amount: "", address: "" }
  ]);
  const [depositInputs, setDepositInputs] = useState([
    { chain: "ETH", token: "ETH", amount: "" }
  ]);

  const handleDeposit = () => {
    console.log(`Depositing to Siphon Vault`, depositInputs);
  };

  const handleSwap = () => {
    console.log('Executing Pro Strategy', swaps);
  };

  const handleWithdraw = () => {
    console.log(`Withdrawing to addresses`, withdrawInstructions);
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
      dex: "Uniswap"
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

  const addWithdrawInstruction = () => {
    setWithdrawInstructions([...withdrawInstructions, { chain: "ETH", token: "USDC", amount: "", address: "" }]);
  };

  const removeWithdrawInstruction = (index: number) => {
    if (withdrawInstructions.length > 1) {
      setWithdrawInstructions(withdrawInstructions.filter((_, i) => i !== index));
    }
  };

  const updateWithdrawInstruction = (index: number, field: string, value: string) => {
    const updatedInstructions = withdrawInstructions.map((instruction, i) => 
      i === index ? { ...instruction, [field]: value } : instruction
    );
    setWithdrawInstructions(updatedInstructions);
  };

  const addDepositInput = () => {
    setDepositInputs([...depositInputs, { chain: "SOL", token: "SOL", amount: "" }]);
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

  const getUSDEquivalent = (token: string, amount: number) => {
    // Mock prices - in real app these would come from price feeds
    const prices: { [key: string]: number } = {
      'ETH': 4024,
      'USDC': 1,
      'USDT': 1,
      'WBTC': 45000
    };
    
    return amount * (prices[token] || 0);
  };

  const calculateTotalWithdrawn = () => {
    const totals: { [key: string]: number } = {};
    
    withdrawInstructions.forEach(instruction => {
      const amount = parseFloat(instruction.amount) || 0;
      if (amount > 0) {
        totals[instruction.token] = (totals[instruction.token] || 0) + amount;
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
                      value={input.chain}
                      onChange={(e) => updateDepositInput(index, 'chain', e.target.value)}
                    >
                      <option value="ETH">Ethereum</option>
                      <option value="BTC" disabled>Bitcoin</option>
                      <option value="XMR" disabled>XMR</option>
                      <option value="ZCASH" disabled>ZCash</option>
                      <option value="LTC" disabled>Litecoin</option>
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
                 
                 const entries = Object.entries(totals).filter(([_, amount]) => amount > 0);
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
                          <option value="ETH">Ethereum</option>
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

              <div className="swap-preview">
                <div className="preview-row">
                  <span>Rate</span>
                  <span>1 {swap.from} = 150 {swap.to}</span>
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
                
                const entries = Object.entries(totals).filter(([_, amount]) => amount > 0);
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
          {withdrawInstructions.map((instruction, index) => (
            <div key={index} className="withdraw-item">
              <div className="withdraw-header">
                <span className="withdraw-label">Output {index + 1}</span>
                {withdrawInstructions.length > 1 && (
                  <button 
                    className="remove-withdraw"
                    onClick={() => removeWithdrawInstruction(index)}
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
                        value={instruction.chain}
                        onChange={(e) => updateWithdrawInstruction(index, 'chain', e.target.value)}
                      >
                        <option value="ETH">Ethereum</option>
                        <option value="OPTIMISM">Optimism</option>
                        <option value="BASE">Base</option>
                        <option value="ARBITRUM">Arbitrum</option>
                        <option value="XMR" disabled>XMR</option>
                        <option value="ZCASH" disabled>ZCash</option>
                      </select>
                    </div>
                  </div>

                  <div className="token-input">
                    <label>Token</label>
                    <div className="token-selector">
                      <select
                        value={instruction.token}
                        onChange={(e) => updateWithdrawInstruction(index, 'token', e.target.value)}
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
                      value={instruction.amount}
                      onChange={(e) => updateWithdrawInstruction(index, 'amount', e.target.value)}
                    />
                  </div>
                </div>
                
                <div className="wallet-input">
                  <label>Wallet Address</label>
                  <input
                    type="text"
                    placeholder="Enter wallet address"
                    value={instruction.address}
                    onChange={(e) => updateWithdrawInstruction(index, 'address', e.target.value)}
                  />
                </div>
              </div>
            </div>
          ))}
          
          <button className="add-withdraw-button" onClick={addWithdrawInstruction}>
            + Add Output
          </button>
          </div>
        </div>
        
        <div className="withdraw-stats">
          <div className="stat-row">
            <span>Total Outputs</span>
            <span>{withdrawInstructions.length} transaction{withdrawInstructions.length !== 1 ? 's' : ''}</span>
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
                
                const entries = Object.entries(totals).filter(([_, amount]) => amount > 0);
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
          onClick={handleWithdraw}
          disabled={!nexusInitialized}
        >
          {nexusInitialized ? 'Execute Withdrawals' : 'Initialize Nexus SDK First'}
        </button>
      </div>
    </div>
  );
}
