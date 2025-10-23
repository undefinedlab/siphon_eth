import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "dotenv/config";

// Extract private_key from .env file
const PRIVATE_KEY = process.env.PRIVATE_KEY || "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      }
    }
  },
  
  paths: {
    sources: "./src"
  },

  networks: {
    // Local environment (Hardhat Network)
    hardhat: {},
    
    // ETH Sepolia testnet
    sepolia: {
      url: process.env.SEPOLIA_RPC_URL || "", 
      accounts: [PRIVATE_KEY],
    },
  }
};
export default config;
