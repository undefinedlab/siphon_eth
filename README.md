<div align="left">

# 🔒 Siphon Protocol

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Three.js](https://img.shields.io/badge/Three.js-0.180-green?style=for-the-badge&logo=three.js)](https://threejs.org/)
[![Rust](https://img.shields.io/badge/Rust-1.70-orange?style=for-the-badge&logo=rust)](https://www.rust-lang.org/)
[![Solidity](https://img.shields.io/badge/Solidity-0.8.20-black?style=for-the-badge&logo=solidity)](https://soliditylang.org/)
[![Citcom](https://img.shields.io/badge/Citcom-latest-blue?style=for-the-badge)](https://github.com/citcomsuite/citcoms)
[![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)](https://www.python.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow?style=for-the-badge)](LICENSE)

**Enabling untraceable, hyperliquid and institutional-grade DeFi privacy with Fully Homomorphic Encryption and Zero-Knowledge proofs.**


[🚀 Live Demo](https://siphon-eth.vercel.app) 

---

</div>

## 🎯 The Problem We Solve

### ⚠️ Three Critical Privacy Crises in DeFi:

<table>
<tr>
<td width="33%">


#### 🔍 **Wallets Are Tracked**
- **Chain analytics links addresses** timing, and flows into identities.
- **Your PNL**, history and every move are visible.

</td>
<td width="33%">

#### 🤖 **Value is Extracted**
- **Visible flow**  widens quotes and worsens fills.
- **Sniping and MEV**  extraction destroys profitability.

</td>
<td width="33%">

#### 💰 **The Privacy-Liquidity Dilemma**
- **Privacy coins** (ZEC, XMR) lack DeFi integration
- **Users forced** to choose: privacy OR best execution

</td>
</tr>
</table>

### 📊 Market Reality
- **$280M** lost monthly to front-running attacks on DEXs 
- **$12B** in privacy coin market cap lacks DeFi integration
- **Zero** truly private DEXs with easy access to global liquidity


---

## 🚀 The Siphon Solution

<div align="left">

**Siphon serves as the seamless privacy-preserving gateway between public and private capital, facilitating secure, private and verifiable movement of assets across multiple blockchains. By enabling frictionless access to the deepest, most liquid DeFi opportunities in a true omnichain environment, Siphon empowers institutions and individuals alike to transact and deploy strategies at scale—without sacrificing confidentiality, competitive edge, or market efficiency.**
</div>

### ✨ Key Features:

<table>
<tr>
<td width="50%">

#### 🔒 **Complete Privacy**
- Portfolio, PnL, and strategies are no longer visible on-chain
- Encrypted state management

#### ⚡ **No Front-running**
- Eliminates order sniffing and MEV extraction
- Private transaction routing

</td>
<td width="50%">

#### 💰 **Better Pricing**
- Cheaper transaction prices through optimized execution
- Reduced slippage through privacy-preserving routing

#### 🌐 **Omnichain**
- Hyperliquid execution across multiple chains
- Privacy preserved end-to-end

</td>
</tr>
</table>

<img src="https://github.com/undefinedlab/siphon_eth/blob/master/docs/4.png" alt="Siphon Architecture Diagram" width="100%" />


---

## 🛠️ Technical Architecture

### 🔧 Core Technologies

<table>
  <tr>
    <td width="33%" align="center">

#### 🔐 **FHE**
**Fully Homomorphic Encryption**  
Enables computation on encrypted data

  </td>
    <td width="33%" align="center">

#### 🎭 **ZK Proofs**
**Zero-Knowledge Proofs**  
Proves correctness—no data revealed

  </td>
    <td width="33%" align="center">

#### 🌉 **Avail Nexus SDK**
**Cross-Chain Operations**  
Seamless multi-chain execution

  </td>
  </tr>
  <tr>
    <td width="33%" align="center">

#### 📈 **Pyth Network**
**Price Feeds & Randomness**  
Reliable oracles and entropy

  </td>
    <td width="33%" align="center">

#### 🛠️ **Hardhat**
**Deployment Tool**  
Flexible, developer-friendly smart contract deployment

  </td>
    <td width="33%" align="center">
    </td>
  </tr>
</table>


### The Five-Layer Architecture:

```
┌─────────────────────────────────────────────────────────────┐
│ Layer 5: Liquidity Interface                                │
│ - Public DEX aggregators                                     │
│ - Cross-chain bridges                                        │
│ - Modular design for privacy-native assets                   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Layer 4: Verification & Settlement                          │
│ - ZK proof of correct execution                             │
│ - On-chain verification                                      │
│ - Cryptographic guarantees                                    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Layer 3: Confidential Execution Environment (FHE Engine)    │
│ - Encrypted mempool                                          │
│ - Computation on encrypted data                              │
│ - Order matching & slippage calculation                      │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Layer 2: Shielded Pool                                       │
│ - Incremental Merkle trees                                   │
│ - Zero-knowledge membership proofs                           │
│ - Nullifier system for double-spend prevention               │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│ Layer 1: Vault Contract                                      │
│ - Trustless escrow for public assets                         │
│ - ETH, USDC, WBTC and more                                   │
│ - Release on valid ZK proof verification                     │
└─────────────────────────────────────────────────────────────┘
```


## ⚖️ Compliance & Regulatory Considerations

Siphon Protocol should integrate multiple compliance mechanisms to address regulatory requirements while maintaining core privacy principles:

### 🛡️ Risk Screening Gate
- **On-Chain Risk Oracle Integration**: Funds entering the Siphon Vault must pass validation through established risk oracles (e.g., Chainalysis, TRM, or in-protocol scoring systems)
- **Source Verification**: Addresses are screened against known restricted or sanctioned lists before admission

### 🔐 Zero-Knowledge Proof of Compliance
- **Privacy-Preserving Verification**: Users can prove they meet KYC/AML requirements without revealing identity
- **Compliant Service Provider Integration**: Works with compliance providers to generate non-revealing proofs
- **Address Sanctioning**: Demonstrates funds are not from restricted address lists, cryptographically

### 📊 Verifiable Transparency Layer
- **Per-Batch Proofs**: Each execution batch emits a zero-knowledge event proving:
  - Encrypted trades were executed correctly
  - State updates followed protocol rules
  - Fees were computed and distributed correctly
  - All without revealing underlying sensitive data
- **Cryptographic Guarantees**: Mathematical proofs ensure system integrity
- **Audit Trail**: Maintains verifiable record of protocol correctness while preserving user privacy

> **Note**: These compliance mechanisms are part of the architectural design and serve to demonstrate how privacy and regulatory compliance can coexist. Real-world implementation would require integration with licensed compliance service providers and legal frameworks.



## 📁 Project Structure
```
siphon/
├── 📂 circuits/              # ZK-SNARK circuits for private proofs
│
├── 📂 contracts/             # Solidity smart contracts for on-chain logic

├── 📂 docs/                  # Documentation

├── 📂 packages/              # Reusable cryptographic and utility packages
│   ├── fhe-lib/
│   ├── zk-proofs/
│   └── crypto-utils/
│
├── 📂 public/                # Static assets

├── 📂 src/                   # Application source code
│   ├── 📂 app/              # Next.js 14 App Router pages and API routes
│   ├── 📂 components/       # Reusable React components
│   │   ├── ui/
│   │   ├── trading/
│   │   └── wallet/
│   │
│   ├── 📂 lib/              # Core FHE and ZK proof implementations
│   │   ├── fhe/
│   │   ├── zk/
│   │   └── blockchain/
│   │
│   ├── 📂 hooks/            # React hooks
│   ├── 📂 utils/            # Utility functions
│   └── 📂 types/            # TypeScript types
│
├── 📄 README.md


```




## 🚀 Quick Start

### 📋 Prerequisites

- **Node.js** 18+ 
- **npm** or **yarn**
- **Git**

### ⚡ Installation

```bash
# Clone the repository
git clone https://github.com/undefinedlab/siphon_eth.git
cd siphon_eth/siphon

# Install dependencies
npm install

# Run development server
npm run dev
```

🌐 Open [http://localhost:3000](http://localhost:3000) to see the application.

### 📜 Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | 🚀 Start development server |
| `npm run build` | 🏗️ Build for production |
| `npm run start` | ▶️ Start production server |
| `npm run lint` | 🔍 Run ESLint |
| `npm run test` | 🧪 Run tests |


---

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### 🚀 Getting Started

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** your changes (`git commit -m 'Add amazing feature'`)
4. **Push** to the branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### 📋 Development Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---


## ⚠️ Critical Disclaimer

### Proof of Concept & Academic Exploration
> **This project is a proof of concept and represents an exploration of potential directions for privacy-preserving DeFi protocols. It is NOT intended for production use, real-world financial transactions, or any non-academic purposes.**

### No Warranty or Responsibility
> **THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY.**

### Usage Restrictions
- **Academic & Research Only**: This code is intended solely for academic study, research, and educational purposes
- **NOT FOR PRODUCTION**: Do not deploy this code in any production environment
- **NOT FOR FINANCIAL USE**: Do not use for any actual financial transactions or trading
- **EXPERIMENTAL**: This is experimental software with no security guarantees
- **Zero Responsibility**: Authors accept zero responsibility for any use, misuse, or consequences

---

<div align="center">

### 🌟 **Siphon Protocol**


**Made with ❤️ for Eth Global **

</div>
