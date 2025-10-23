import { buildModule } from "@nomicfoundation/hardhat-ignition/modules";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-ignition-ethers";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const UNISWAP_V3_ROUTER = "0x65669fE35312947050C450Bd5d36e6361F85eC12"; // Uniswap V3 Router on Sepolia

// Addresses for assets
const NATIVE_ASSET = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";   // Native Asset = ETH
const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";   // USDC in Sepolia
const USDT = "0xaA8E23Fb1079EA71e0a56F48a2aA51851D8433D0";   // USDT in Sepolia
const TOKEN_ADDRESSES = [NATIVE_ASSET, USDC, USDT];

const DeploymentModule = buildModule("DeploymentModule", (m) => {

    const poseidonT3 = m.library("poseidon-solidity/PoseidonT3.sol:PoseidonT3");
    const poseidonT4 = m.library("poseidon-solidity/PoseidonT4.sol:PoseidonT4");
    const leanImt = m.library("@zk-kit/lean-imt.sol/LeanIMT.sol:LeanIMT", {
        libraries: {
            PoseidonT3: poseidonT3, 
        }
    });

    // Initialzing with zero address defaults the owner to msg.sender
    const entrypoint = m.contract("Entrypoint", [ZERO_ADDRESS, UNISWAP_V3_ROUTER], {
        // Deploy libraries before contract
        libraries: {
            LeanIMT: leanImt,
            PoseidonT4: poseidonT4,
        }
    });

    // Initialize each vault with corresponding asset
    const assets = m.getParameter<string[]>("assets", TOKEN_ADDRESSES);
    m.call(entrypoint, "initializeVaults", [assets], {
        id: "InitializeVaults"
    });

    return { entrypoint };
});

export default DeploymentModule;