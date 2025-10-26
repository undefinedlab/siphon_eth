import { expect } from "chai";
import hre, { ethers } from "hardhat";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import DeploymentModule from "../ignition/modules/Deploy";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const UNISWAP_V3_ROUTER = "0x65669fE35312947050C450Bd5d36e6361F85eC12";
const NATIVE_ASSET = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
const USDC = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";
const TOKEN_ADDRESSES = [NATIVE_ASSET, USDC];
const PRECOMMITMENT = 1234567890n;
const DEPOSIT_AMOUNT_ETH = ethers.parseEther("1");

describe("DeploymentModule", function () {
    async function deployFixture() {
        const [owner, depositor] = await ethers.getSigners();

        const { entrypoint } = await hre.ignition.deploy(DeploymentModule, {});

        const entrypointAddress = entrypoint.target;

        return { entrypoint, entrypointAddress, owner, depositor };
    }

    describe("Entrypoint Deployment", function () {
        it("Should deploy the Entrypoint contract and set the owner correctly", async function () {
            const { entrypoint, owner } = await loadFixture(deployFixture);

            // Verify the contract is deployed (has an address)
            expect(entrypoint.address).to.not.equal(ZERO_ADDRESS, "Entrypoint contract was not deployed");

            // Verify the owner is set to the deployer
            const deployedOwner = await entrypoint.owner();
            expect(deployedOwner).to.equal(owner.address, "Contract owner is not the deployment sender");
        });

        it("Should set the Uniswap V3 Router address correctly", async function () {
            const { entrypoint } = await loadFixture(deployFixture);

            // Verify the Uniswap V3 Router is set in the constructor
            const routerAddress = await entrypoint.swapRouter();
            expect(routerAddress).to.equal(UNISWAP_V3_ROUTER, "Uniswap V3 Router address is incorrect");
        });

        it("Should successfully initialize vaults for all specified assets", async function () {
            const { entrypoint } = await loadFixture(deployFixture);

            // Check if a vault was created for the ETH
            const ethVaultAddress = await entrypoint.getVault(NATIVE_ASSET);
            expect(ethVaultAddress).to.not.equal(ZERO_ADDRESS, "ETH Vault was not initialized");

            // Check if a vault was created for USDC
            const usdcVaultAddress = await entrypoint.getVault(USDC);
            expect(usdcVaultAddress).to.not.equal(ZERO_ADDRESS, "USDC Vault was not initialized");
        });
    });

    describe("Deposit Functionality", function () {
        it("Should successfully deposit ETH", async function () {
            const { entrypoint, depositor } = await loadFixture(deployFixture);

            // Get initial balance of the Entrypoint contract
            const initialBalance = await ethers.provider.getBalance(entrypoint.target);

            // Call deposit for ETH
            const depositTx = await entrypoint.connect(depositor).deposit(
                NATIVE_ASSET,
                0,
                PRECOMMITMENT,
                { value: DEPOSIT_AMOUNT_ETH }
            );

            // Confirm that transaction completed successfully
            const receipt = await depositTx.wait();
            expect(receipt.status).to.equal(1, "Native deposit transaction failed");

            // Check balance of ETH Vault
            const ethVaultAddress = await entrypoint.getVault(NATIVE_ASSET);
            const finalBalance = await ethers.provider.getBalance(ethVaultAddress);
            expect(finalBalance).to.be.gt(initialBalance, "ETH balance of Entrypoint did not increase");
        });

        it("Should revert if Native Asset deposit has zero value", async function () {
            const { entrypoint, depositor } = await loadFixture(deployFixture);

            // Attempt to deposit 0 ETH for the native asset
            await expect(
                entrypoint.connect(depositor).deposit(
                    NATIVE_ASSET,
                    0,
                    PRECOMMITMENT,
                    { value: 0 }
                )
            ).to.be.reverted;
        });
    });
});
