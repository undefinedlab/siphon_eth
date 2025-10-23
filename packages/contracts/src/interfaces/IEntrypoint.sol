// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.28;

import {IVault} from "./IVault.sol";

interface IEntrypoint {

    /**
     * @notice Thrown when trying to deposit an invalid amount
     */
    error InvalidDepositAmount();

    /**
     * @notice Thrown when trying to withdraw an invalid amount
     */
    error InvalidWithdrawalAmount();

    /**
     * @notice Thrown when trying to swap an invalid amount
     */
    error InvalidSwapAmount();

    /**
     * @notice Thrown when trying to swap with an invalid fee amount
     */
    error InvalidFeeAmount();

    /**
     * @notice Thrown when trying to access a non-existent vault
     */
    error VaultNotFound();

    /**
     * @notice Thrown when trying to register a pool for an asset that is already present in the registry
     */
    error VaultAlreadyRegistered();

    /**
     * @notice Thrown when an address parameter is zero
     */
    error ZeroAddress();


    /**
     * @notice Initialize the vaults and configuration
     * @param assets The list of assets to initialize vaults for
     */
    function initializeVaults(address[] memory assets) external;

    /**
     * @notice Deposit asset into the vault
     * @param _asset Type of asset to deposit (native or ERC20)
     * @param _amount The amount of asset to deposit
     * @param _precommitment The precommitment for the deposit
     * @return _commitment The commitment for the deposit
     */
    function deposit(
        address _asset,
        uint256 _amount,
        uint256 _precommitment
    ) external payable returns (uint256 _commitment);

    /**
     * @notice Withdraw asset from the vault
     * @param _asset The type of asset to withdraw (native or ERC20)
     * @param _recipient The recipient address
     * @param _amount The amount being withdrawn
     * @param _nullifier The nullifier hash
     * @param _newCommitment The new commitment hash
     * @param _proof The Zero-Knowledge Proof of ownership
     */
    function withdraw(
        address _asset,
        address _recipient,
        uint256 _amount,
        uint256 _nullifier,
        uint256 _newCommitment,
        bytes calldata _proof
    ) external;

    /**
     * @notice Swap asset via the swap router
     * @param _srcToken The source token to send (ERC20 or native).
     * @param _dstToken The output token of the swap (ERC20 or native).
     * @param _recipient The address that receives the swapped output
     * @param _amountIn The input amount to be withdrawn and swapped
     * @param _minAmountOut The minimum acceptable return amount to protect against slippage or MEV
     * @param _fee The pool's fee tier in hundredths of a bip (1e-6)
     * @param _nullifier The nullifier hash
     * @param _newCommitment The new commitment hash
     * @param _proof The Zero-Knowledge Proof of ownership
     */
    function swap(
        address _srcToken,
        address _dstToken,
        address payable _recipient,
        uint256 _amountIn,
        uint256 _minAmountOut,
        uint24 _fee,
        uint256 _nullifier,
        uint256 _newCommitment,
        bytes calldata _proof
    ) external;

    /**
     * @notice External function to verify ZK proof
     * @param _asset The type of asset to verify (native or ERC20)
     * @param _amount The amount being withdrawn
     * @param _nullifier The nullifier hash
     * @param _newCommitment The new commitment hash
     * @param _proof The Zero-Knowledge Proof of ownership
     */
    function verify(
        address _asset,
        uint256 _amount,
        uint256 _nullifier,
        uint256 _newCommitment,
        bytes calldata _proof
    ) external view returns (bool);

    /**
     * @notice Returns the address of vault linked to a specific asset.
     * @param asset The address of the asset to query.
     * @return The vault contract address
     */
    function getVault(address asset) external view returns (address);
}
