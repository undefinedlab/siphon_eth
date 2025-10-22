'use client';

import { useState } from 'react';

interface ToTokenOption {
  value: string;
  label: string;
  active: boolean;
}

const toTokenOptions: ToTokenOption[] = [
  { value: 'ETH', label: 'ETH', active: true },
  { value: 'USDC', label: 'USDC', active: true },
  { value: 'PYTH', label: 'PYTH', active: false },
  { value: 'XMR', label: 'XMR', active: false },
  { value: 'ZCASH', label: 'ZCASH', active: false },
  { value: 'BTC', label: 'BTC', active: false },
  { value: 'LTC', label: 'LTC', active: false },
];

interface ToTokenSelectorProps {
  selectedToken: string;
  onTokenSelect: (token: string) => void;
  className?: string;
}

export default function ToTokenSelector({ selectedToken, onTokenSelect, className }: ToTokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedOption = toTokenOptions.find(option => option.value === selectedToken);
  const displayText = selectedOption ? selectedOption.label : 'Select Token';

  return (
    <div className="token-selector-custom">
      <button 
        className={`token-selector-button ${className} ${!selectedOption?.active ? 'inactive' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        disabled={!selectedOption?.active}
      >
        <span className="token-text">{displayText}</span>
        <span className="dropdown-arrow">{isOpen ? '▲' : '▼'}</span>
      </button>

      {isOpen && (
        <div className="token-dropdown">
          {toTokenOptions.map((option) => (
            <button
              key={option.value}
              className={`token-option ${!option.active ? 'inactive' : ''}`}
              onClick={() => {
                if (option.active) {
                  onTokenSelect(option.value);
                  setIsOpen(false);
                }
              }}
              disabled={!option.active}
            >
              <span className="token-name">{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
