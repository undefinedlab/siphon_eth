// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.28;
pragma abicoder v2;

import {Vault} from '../abstracts/Vault.sol';
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";

contract NativeVault is Vault {

    constructor(address _asset, address _verifier) Vault(_asset, _verifier) {}

    function _receive(address, uint256 _amount) internal override {
        if(msg.value != _amount) revert AmountMismatch();
    }

    function _send(address _to, uint256 _amount) internal override {
        (bool success, ) = _to.call{value: _amount}("");
        if(!success) revert NativeTransferFailed();
    }

    function _swap(address _router, SwapParam memory _param) internal override {
        // Load Uniswap V3 router
        ISwapRouter router = ISwapRouter(_router);

        // Build ExactInputSingleParams struct
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: _param.srcToken,
            tokenOut: _param.dstToken,
            fee: _param.fee,
            recipient: _param.recipient,
            deadline: block.timestamp + 60,
            amountIn: _param.amountIn,
            amountOutMinimum: _param.minAmountOut,
            sqrtPriceLimitX96: 0
        });

        // Execute a swap call to the router
        router.exactInputSingle{value: _param.amountIn}(params);
    }
}