"use client";

import { useState, useEffect } from "react";
import "./SwapInterface.css";

export default function SwapInterface() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isProMode, setIsProMode] = useState(false);
  const [swapFromToken, setSwapFromToken] = useState("SOL");
  const [swapToToken, setSwapToToken] = useState("USDC");
  const [swapAmount, setSwapAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawToken, setWithdrawToken] = useState("USDC");
  const [swaps, setSwaps] = useState([{ 
    from: "ETH", 
    to: "USDC", 
    amount: "", 
    liquidity: "internal", 
    transactionMode: "single",
    liquidityChain: "ETH"
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
    console.log(`Swapping ${swapAmount} ${swapFromToken} for ${swapToToken}`);
  };

  const handleWithdraw = () => {
    console.log(`Withdrawing to ${withdrawAddress}`);
  };

  const addSwap = () => {
    setSwaps([...swaps, { 
      from: "ETH", 
      to: "USDC", 
      amount: "", 
      liquidity: "internal", 
      transactionMode: "single",
      liquidityChain: "ETH"
    }]);
  };

  const removeSwap = (index: number) => {
    if (swaps.length > 1) {
      setSwaps(swaps.filter((_, i) => i !== index));
    }
  };

  const updateSwap = (index: number, field: string, value: string) => {
    const updatedSwaps = swaps.map((swap, i) => 
      i === index ? { ...swap, [field]: value } : swap
    );
    setSwaps(updatedSwaps);
  };

  const addWithdrawInstruction = () => {
    setWithdrawInstructions([...withdrawInstructions, { chain: "SOL", token: "USDC", amount: "", address: "" }]);
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


  useEffect(() => {
    // Delay to ensure styles are loaded
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);


  return (
    <div className="siphon-container">
      <div className={`siphon-window ${isLoaded ? 'loaded' : ''} ${isProMode ? 'pro-mode' : 'simple-mode'}`}>
        <div className="mode-toggle">
          <button 
            className={`toggle-button ${!isProMode ? 'active' : ''}`}
            onClick={() => setIsProMode(false)}
          >
            Simple
          </button>
          <button 
            className={`toggle-button ${isProMode ? 'active' : ''}`}
            onClick={() => setIsProMode(true)}
          >
            Pro
          </button>
        </div>

        {!isProMode ? (
          <div className={`simple-swap ${isLoaded ? 'loaded' : ''}`}>
            <h3>Swap Tokens</h3>
            <div className="swap-inputs">
              <div className="input-group">
                <input
                  type="number"
                  placeholder="0.0"
                  value={swapAmount}
                  onChange={(e) => setSwapAmount(e.target.value)}
                />
                <div className="token-selector">
                  <select
                    value={swapFromToken}
                    onChange={(e) => setSwapFromToken(e.target.value)}
                  >
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                    <option value="ZCASH">ZCASH</option>
                    <option value="XMR">XMR</option>
                  </select>
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
                  <select
                    value={swapToToken}
                    onChange={(e) => setSwapToToken(e.target.value)}
                  >
                    <option value="SOL">SOL</option>
                    <option value="USDC">USDC</option>
                    <option value="ETH">ETH</option>
                    <option value="ZCASH">ZCASH</option>
                    <option value="XMR">XMR</option>
                  </select>
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
                Standard swap uses public pools with basic privacy. For maximum anonymity, use Pro mode with Siphon Protocol's advanced privacy features.
              </div>
            </div>

            <button className="action-button" onClick={handleSwap}>
              Swap Tokens
            </button>
          </div>
        ) : (
          <div className={`three-columns ${isLoaded ? 'loaded' : ''}`}>
          {/* Column 1: Deposit */}
        
        </div>
        )}
      </div>

    </div>
  );
}
