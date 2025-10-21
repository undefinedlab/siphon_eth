"use client";

import { useState, useEffect } from "react";
import "./SwapInterface.css";
import ConnectButton from "./ConnectButton";
import UnifiedBalanceDisplay from "./UnifiedBalanceDisplay";
import TokenSelector from "./TokenSelector";
import { isInitialized, transferTokens, bridgeTokens, initializeWithProvider, getUnifiedBalances } from "../../lib/nexus";
import { WalletInfo } from "../../lib/walletManager";

export default function SwapInterface() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [uiMode, setUiMode] = useState(1);
  const [swapFromToken, setSwapFromToken] = useState("");
  const [swapToToken, setSwapToToken] = useState("USDC");
  const [swapAmount, setSwapAmount] = useState("");
  const [withdrawAddress, setWithdrawAddress] = useState("");
  const [withdrawToken, setWithdrawToken] = useState("USDC");
  
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
  const [isTransferring, setIsTransferring] = useState(false);
  const [swaps, setSwaps] = useState([{ 
    fromChain: "Ethereum",
    from: "ETH",
    amount: "",
    toChain: "Ethereum",
    to: "USDC", 
    amountOut: "",
    recipient: "",
    liquidity: "internal", 
    liquidityChain: "ETH"
  }]);
  const [withdrawInstructions, setWithdrawInstructions] = useState([
    { chain: "Ethereum", token: "ETH", amount: "", address: "" }
  ]);
  const [depositInputs, setDepositInputs] = useState([
    { chain: "Ethereum", token: "ETH", amount: "" }
  ]);

  const handleDeposit = () => {
    console.log(`Depositing to Siphon Vault`, depositInputs);
  };

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
          setUnifiedBalances(refreshedBalances);
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

  const handleWithdraw = () => {
    console.log(`Withdrawing to ${withdrawAddress}`);
  };

  const addSwap = () => {
    setSwaps([...swaps, { 
      from: "SOL", 
      to: "USDC", 
      amount: "", 
      liquidity: "internal", 
      transactionMode: "single",
      liquidityChain: "SOL"
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
    setDepositInputs([...depositInputs, { chain: "ETH", token: "ETH", amount: "" }]);
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

    // Check if Nexus SDK is already initialized
    setNexusInitialized(isInitialized());

    return () => clearTimeout(timer);
  }, []);

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
    <div className="siphon-container">
      {/* Left Sidebar for Unified Balances - Only show when wallet is connected */}
      {connectedWallet && (
        <div className="sidebar-left">
          <UnifiedBalanceDisplay balances={unifiedBalances} />
        </div>
      )}

      <div className={`siphon-window ${isLoaded ? 'loaded' : ''} ${uiMode == 1 ? 'dashboard-mode' : uiMode == 2 ? 'simple-mode' : 'pro-mode'}`}>
        <div className="mode-toggle">
          <button 
            className={`toggle-button ${uiMode == 1 ? 'active' : ''}`}
            onClick={() => setUiMode(1)}
          >
            Dashboard
          </button>
          <button 
            className={`toggle-button ${uiMode == 2 ? 'active' : ''}`}
            onClick={() => setUiMode(2)}
          >
            Simple
          </button>
          <button 
            className={`toggle-button ${uiMode == 3 ? 'active' : ''}`}
            onClick={() => setUiMode(3)}
          >
            Pro
          </button>
        </div>

        {uiMode == 1 ? (
          <div className={`dashboard ${isLoaded ? 'loaded' : ''}`}>
            {/* Step 1: Connect Wallet */}
            <div className="connect-wallet">
              <div className="step-header">
                <span className="step-number">1</span>
                <span className="step-title">Connect Wallet</span>
              </div>
              <div className="step-content">
                <ConnectButton 
                  className="step-connect-button" 
                  onConnected={async (wallet) => {
                    setWalletConnected(true);
                    setConnectedWallet(wallet);
                    
                    // Auto-initialize Nexus SDK for EVM wallets
                    if (wallet.chain === 'EVM' && !nexusInitialized) {
                      try {
                        const eth = (window as Window & { ethereum?: unknown })?.ethereum;
                        if (eth) {
                          await initializeWithProvider(eth);
                          setNexusInitialized(true);
                          console.log('Nexus SDK auto-initialized for EVM wallet');
                          
                      // Auto-fetch balances after initialization
                      try {
                        const balances = await getUnifiedBalances();
                        setUnifiedBalances(balances);
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
          </div>
        ) : uiMode == 2 ? (
          <div className={`three-columns ${isLoaded ? 'loaded' : ''}`}>
            {/* Column 1: Deposit */}
            <div className="column">
              <div className="column-header">
                <div className="step-number">1</div>
                <h3 className="step-title" data-tooltip="Deposit your tokens to the Siphon Vault. Your funds are anonymized using zero-knowledge proofs, making your transaction history completely private. Choose your blockchain network, select the token you want to deposit, enter the amount, and review the transaction details before proceeding.">Deposit</h3>
              </div>
              
              <div className="deposit-section">
                {depositInputs.map((input, index) => (
                  <div key={index} className="deposit-item">
                    <div className="deposit-header">
                      <span className="deposit-label">Deposit {index + 1}</span>
                      {depositInputs.length > 1 && (
                        <button 
                          className="remove"
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
                            <option value="Ethereum">Ethereum</option>
                            <option value="Optimism">Optimism</option>
                            <option value="Arbitrum">Arbitrum</option>
                            <option value="Base">Base</option>
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
                            <option value="POL">POL</option>
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

                <div className="deposit-stats">
                  <div className="stat-row">
                    <span>Total Deposits</span>
                    <span>{depositInputs.length} transaction{depositInputs.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="stat-row">
                    <span>Deposit Fee</span>
                    <span>0.1%</span>
                  </div>
                  <div className="stat-row">
                    <span>Privacy Level</span>
                    <span>Maximum</span>
                  </div>
                </div>
              </div>
              
              <button 
                className="action-button" 
                onClick={handleDeposit}
                disabled={!nexusInitialized}
              >
                {nexusInitialized ? 'Deposit to Vault' : 'Initialize Wallet Connection First'}
              </button>
            </div>

            {/* Column 2: Swap */}
            <div className="column">
              <div className="column-header">
                <div className="step-number">2</div>
                <h3 className="step-title" data-tooltip="Create anonymized cross-chain swaps by transferring funds through Siphon vault. Funds stored in your vault will be swapped with specied token and sent to recipient wallets.">Swap</h3>
              </div>
              
              <div className="swap-section">
                {swaps.map((swap, index) => (
                  <div key={index} className="swap-item">
                    <div className="swap-header">
                      <span className="swap-label">Swap {index + 1}</span>
                      {swaps.length > 1 && (
                        <button 
                          className="remove"
                          onClick={() => removeSwap(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    <div className="swap-inputs">
                      <div id="from_group" className="input-group">
                        <div className="token-input">
                          <label>Amount In</label>
                          <input
                            type="number"
                            placeholder="0.0"
                            value={swap.amount}
                            onChange={(e) => updateSwap(index, 'amount', e.target.value)}
                          />
                        </div>
                        <div className="token-input">
                          <div className="token-selector">
                            <label>Source Chain</label>
                            <select
                              value={swap.fromChain}
                              onChange={(e) => updateSwap(index, 'fromChain', e.target.value)}
                            >
                              <option value="Ethereum">Ethereum</option>
                              <option value="Optimism">Optimism</option>
                              <option value="Arbitrum">Arbitrum</option>
                              <option value="Base">Base</option>
                            </select>
                          </div>
                        </div>
                        <div className="token-input">
                          <div className="token-selector">
                            <label>Token</label>
                            <select
                              value={swap.from}
                              onChange={(e) => updateSwap(index, 'from', e.target.value)}
                            >
                              <option value="ETH">ETH</option>
                              <option value="USDC">USDC</option>
                              <option value="USDT">USDT</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      {/* <div className="swap-arrow">↓</div> */}
                      <div id="to_group" className="input-group">
                        <div className="token-input">
                          <label>Amount Out</label>
                          <input
                            type="number"
                            placeholder="0.0"
                            readOnly
                            value={swap.amountOut}
                            onChange={(e) => updateSwap(index, 'amountOut', e.target.value)}
                          />
                        </div>
                        <div className="token-input">
                          <div className="token-selector">
                            <label>Target Chain</label>
                            <select
                              value={swap.toChain}
                              onChange={(e) => updateSwap(index, 'toChain', e.target.value)}
                            >
                              <option value="Ethereum">Ethereum</option>
                              <option value="Optimism">Optimism</option>
                              <option value="Arbitrum">Arbitrum</option>
                              <option value="Base">Base</option>
                            </select>
                          </div>
                        </div>
                        <div className="token-input">
                          <div className="token-selector">
                            <label>Token</label>
                            <select
                              value={swap.to}
                              onChange={(e) => updateSwap(index, 'to', e.target.value)}
                            >
                              <option value="ETH">ETH</option>
                              <option value="USDC">USDC</option>
                              <option value="USDT">USDT</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* <div className="swap-options">
                      <div className="option-group">
                        <label className="option-label">
                          Liquidity Source
                          <span className="option-tooltip" data-tooltip="Internal: Uses Siphon's internal orderbook for fast, cheap execution. External: Takes liquidity from external pools for better rates.">?</span>
                        </label>
                        <div className="radio-group">
                          <label className="radio-option">
                            <input
                              type="radio"
                              name={`liquidity-${index}`}
                              value="internal"
                              checked={swap.liquidity === "internal"}
                              onChange={(e) => updateSwap(index, 'liquidity', e.target.value)}
                            />
                            <span>Internal</span>
                          </label>
                          <label className="radio-option">
                            <input
                              type="radio"
                              name={`liquidity-${index}`}
                              value="external"
                              checked={swap.liquidity === "external"}
                              onChange={(e) => updateSwap(index, 'liquidity', e.target.value)}
                            />
                            <span>External</span>
                          </label>
                        </div>
                      </div>

                      <div className="option-group">
                        <label className="option-label">
                          Transaction Mode
                          <span className="option-tooltip" data-tooltip="Single: Execute this swap independently. Group: Combine with other swaps for atomic execution.">?</span>
                        </label>
                        <div className="radio-group">
                          <label className="radio-option">
                            <input
                              type="radio"
                              name={`transaction-${index}`}
                              value="single"
                              checked={swap.transactionMode === "single"}
                              onChange={(e) => updateSwap(index, 'transactionMode', e.target.value)}
                            />
                            <span>Single</span>
                          </label>
                          <label className="radio-option">
                            <input
                              type="radio"
                              name={`transaction-${index}`}
                              value="group"
                              checked={swap.transactionMode === "group"}
                              onChange={(e) => updateSwap(index, 'transactionMode', e.target.value)}
                            />
                            <span>Group</span>
                          </label>
                        </div>
                      </div>

                      {swap.liquidity === "external" && (
                        <div className="option-group">
                          <label className="option-label">
                            Liquidity Chain
                            <span className="option-tooltip" data-tooltip="Select which blockchain network to source external liquidity from.">?</span>
                          </label>
                          <div className="token-selector">
                            <select
                              value={swap.liquidityChain}
                              onChange={(e) => updateSwap(index, 'liquidityChain', e.target.value)}
                            >
                              <option value="SOL">Solana</option>
                              <option value="ETH">Ethereum</option>
                              <option value="BTC">Bitcoin</option>
                              <option value="POLYGON">Polygon</option>
                              <option value="ARBITRUM">Arbitrum</option>
                            </select>
                          </div>
                        </div>
                      )}
                    </div> */}

                    <div className="wallet-input">
                        <label>Wallet Address</label>
                        <input
                          type="text"
                          placeholder="Enter wallet address"
                          value={swap.recipient}
                          onChange={(e) => updateSwap(index, 'recipient', e.target.value)}
                        />
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
              
              <button 
                className="action-button" 
                onClick={handleSwap}
                disabled={!nexusInitialized}
              >
                {nexusInitialized ? 'Execute Swap' : 'Initialize Wallet Connection First'}
              </button>
            </div>

            {/* Column 3: Withdraw */}
            <div className="column">
              <div className="column-header">
                <div className="step-number">3</div>
                <h3 className="step-title" data-tooltip="Withdraw your tokens to any wallet address. The withdrawal process uses advanced privacy techniques to break the transaction trail, ensuring your funds cannot be traced back to their original source. Configure multiple withdrawal outputs to different wallet addresses. Specify the exact amount and token for each output, enabling complex distribution strategies.">Withdraw</h3>
              </div>
              
              <div className="withdraw-section">
                {withdrawInstructions.map((instruction, index) => (
                  <div key={index} className="withdraw-item">
                    <div className="withdraw-header">
                      <span className="withdraw-label">Withdrawal {index + 1}</span>
                      {withdrawInstructions.length > 1 && (
                        <button 
                          className="remove"
                          onClick={() => removeWithdrawInstruction(index)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                    
                    <div className="withdraw-inputs">
                      <div className="withdraw-input-group">
                        <div className="token-input">
                          <label>Chain</label>
                          <div className="token-selector">
                            <select
                              value={instruction.chain}
                              onChange={(e) => updateWithdrawInstruction(index, 'chain', e.target.value)}
                            >
                              <option value="Ethereum">Ethereum</option>
                              <option value="Optimism">Optimism</option>
                              <option value="Arbitrum">Arbitrum</option>
                              <option value="Base">Base</option>
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
                  + Add Withdraw
                </button>
              </div>
              
              <button 
                className="action-button" 
                onClick={handleWithdraw}
                disabled={!nexusInitialized}
              >
                {nexusInitialized ? 'Execute Withdrawals' : 'Initialize Wallet Connection First'}
              </button>
            </div>
          </div>
        ) : (
          <div className={`strategy-swap ${isLoaded ? 'loaded' : ''}`}>
            <h3 data-tooltip="The trading data is encrypted by FHE mechanism and anonymity is kept by Zero-Knowledge proof mechanism to provide a fully encrypted & secure trading strategy.">
              Create a Swap Strategy
            </h3>
            <div className="strategy-inputs">
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
                  <select
                    value={swapToToken}
                    onChange={(e) => setSwapToToken(e.target.value)}
                  >
                    <option value="ETH">ETH</option>
                    <option value="USDC">USDC</option>
                    <option value="USDT">USDC</option>
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
                Standard swap uses public pools with basic privacy. For maximum anonymity, use Pro mode with Siphon Protocol&apos;s advanced privacy features.
              </div>
            </div>

            <button 
              className="action-button" 
              onClick={handleStrategy}
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
        )}
      </div>

    </div>
  );
}
