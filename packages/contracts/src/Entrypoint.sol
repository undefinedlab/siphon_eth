// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.28;

import {IVault} from "./interfaces/IVault.sol";
import {IEntrypoint} from "./interfaces/IEntrypoint.sol";
import {NativeVault} from "./states/NativeVault.sol";
import {AlternativeVault} from "./states/AlternativeVault.sol";
import {PlonkVerifier} from './verifiers/WithdrawalVerifier.sol';
import {IERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';

contract Entrypoint is IEntrypoint {
    /// @notice The address of the native asset (e.g., ETH)
    address public constant NATIVE_ASSET = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    address public constant WETH = 0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14;

    /// @notice The mapping of asset to its corresponding vault
    mapping(address asset => IVault vault) private vaults;

    /// @notice The contract owner
    address public owner;

    /// @notice The vault count nonce
    uint32 public nonce;

    /// @notice The ZK verifier
    PlonkVerifier internal immutable verifier;

    /// @notice The SwapRouter address
    address public immutable swapRouter;

    modifier vaultExists(address asset) {
        IVault vault = vaults[asset];
        if(address(vault) == address(0)) revert VaultNotFound();
        _;
    }

    constructor(address _owner, address _swapRouterAddress) {
        // Store owner address
        owner = (_owner == address(0)) ? msg.sender : _owner;

        // Initialize vault count nonce
        nonce = 0;

        // Initialize ZK verifier
        verifier = new PlonkVerifier();

        // Store the Uniswap V3 SwapRouter address
        swapRouter = _swapRouterAddress;
    }

    /// @inheritdoc IEntrypoint
    function initializeVaults(address[] memory assets) external {
        // Deploy vault for each asset then store to mapping
        for (uint256 i = 0; i < assets.length; i++) {
            address asset = address(assets[i]);
            if (vaults[asset] != IVault(address(0))) revert VaultAlreadyRegistered();

            // Create _salt to optimize gas-efficiency (CREATE2)
            bytes32 _salt = keccak256(abi.encodePacked(asset, nonce++));

            // Deploy vault and store to mapping
            vaults[asset] = (asset == NATIVE_ASSET)
                ? IVault(new NativeVault{salt: _salt}(asset, address(verifier)))
                : IVault(new AlternativeVault{salt: _salt}(asset, address(verifier)));
        }
    }

    /// @inheritdoc IEntrypoint
    function deposit(
        address _asset,
        uint256 _amount,
        uint256 _precommitment
    ) external payable vaultExists(_asset) returns (uint256 _commitment) {
        // Fetch the vault for the requested asset
        IVault vault = vaults[address(_asset)];

        // Validate token amount and process deposit
        if (address(_asset) == NATIVE_ASSET) {
            if(msg.value <= 0) revert InvalidDepositAmount();
            _commitment = vault.deposit{value: msg.value}(msg.value, _precommitment);
        } else {
            if(_amount <= 0 || msg.value > 0) revert InvalidDepositAmount();
            IERC20(_asset).transferFrom(msg.sender, address(this),_amount);       // First move the fund from Depositor to Entrypoint
            IERC20(_asset).approve(address(vault), _amount);                      // Then approve the vault to pull the fund
            _commitment = vault.deposit(_amount, _precommitment);
        }
    }

    /// @inheritdoc IEntrypoint
    function withdraw(
        address _asset,
        address _recipient,
        uint256 _amount,
        uint256 _nullifier,
        uint256 _newCommitment,
        bytes calldata _proof
    ) external {
        // Fetch the vault for the requested asset
        IVault vault = vaults[_asset];

        // Validate withdrawal amount
        if(_amount <= 0) revert InvalidWithdrawalAmount();

        // Validate recipient address
        if(_recipient == address(0)) revert ZeroAddress();

        // Transfer funds from the vault to the recipient
        vault.withdraw(_recipient, _amount, _nullifier, _newCommitment, _proof);
    }

    /// @inheritdoc IEntrypoint
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
    ) external vaultExists(_srcToken) {
        IVault srcVault = vaults[_srcToken];

        // Validate swap amount
        if(_amountIn <= 0) revert InvalidSwapAmount();

        // Validate the fee amount
        if(_fee <= 0) revert InvalidFeeAmount();

        // Validate recipient address
        if(_recipient == address(0)) revert ZeroAddress();

        // Convert ETH to WETH for swap
        if (_srcToken == NATIVE_ASSET) {
            _srcToken = WETH;
        }
        if (_dstToken == NATIVE_ASSET) {
            _dstToken = WETH;
        }

        // Generate swap parameter struct
        IVault.SwapParam memory param = IVault.SwapParam({
            srcToken: _srcToken,
            dstToken: _dstToken,
            recipient: _recipient,
            amountIn: _amountIn,
            minAmountOut: _minAmountOut,
            fee: _fee
        });

        // Execute swap via source vault
        srcVault.swap(param, swapRouter, _nullifier, _newCommitment, _proof);
    }

    /// @inheritdoc IEntrypoint
    function verify(
        address _asset,
        uint256 _amount,
        uint256 _nullifier,
        uint256 _newCommitment,
        bytes calldata _proof
    ) external view vaultExists(_asset) returns (bool) {
        IVault vault = vaults[_asset];
        return vault.verify(_amount, _nullifier, _newCommitment, _proof);
    }

    /// @inheritdoc IEntrypoint
    function getVault(address asset) external view returns (address) {
        return address(vaults[asset]);
    }
}
