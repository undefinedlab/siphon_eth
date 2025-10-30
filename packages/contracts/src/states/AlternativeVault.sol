// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.28;
pragma abicoder v2;

import {Vault} from '../abstracts/Vault.sol';
import {IERC20, SafeERC20} from '@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol';
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

contract AlternativeVault is Vault {
    using SafeERC20 for IERC20;

    constructor(address _asset, address _verifier) Vault(_asset, _verifier) {}

    function _receive(address _from, uint256 _amount) internal override {
        if(msg.value > 0) revert NativeFundReceived();

        IERC20(asset).safeTransferFrom(_from, address(this), _amount);
    }

    function _send(address _to, uint256 _amount) internal override {
        IERC20(asset).safeTransfer(_to, _amount);
    }

    function _swap(address _router, SwapParam memory _param) internal override {
        // Load Uniswap V3 router
        ISwapRouter router = ISwapRouter(_router);

        // Approve the router to spend the ERC20 asset
        IERC20(asset).approve(address(router), _param.amountIn);

        // Build ExactInputSingleParams struct
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: asset,
            tokenOut: _param.dstToken,
            fee: _param.fee,
            recipient: _param.recipient,
            deadline: block.timestamp + 60,
            amountIn: _param.amountIn,
            amountOutMinimum: _param.minAmountOut,
            sqrtPriceLimitX96: 0
        });

        // Execute a swap call to the router
        router.exactInputSingle(params);
    }
}