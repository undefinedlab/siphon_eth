// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.28;

interface IVault {

    struct SwapParam {
        /// @notice The source token to send (ERC20 or native)
        address srcToken;
        /// @notice The destination token to receive after the swap (ERC20 or native)
        address dstToken;
        /// @notice The address that receives the swapped output
        address payable recipient;
        /// @notice The input amount to be withdrawn and swapped
        uint256 amountIn;
        /// @notice The minimum acceptable return amount to protect against slippage or MEV
        uint256 minAmountOut;
        /// @notice The pool's fee tier in hundredths of a bip (1e-6)
        uint24 fee;
    }

    /*--------------------------------------------------------------------------------------------
                                                EVENTS
    --------------------------------------------------------------------------------------------*/

    /**
     * @notice Emitted when processing a deposit
     * @param depositor The address of the depositor
     * @param amount The deposited amount
     * @param commitment The commitment hash
     * @param precommitment The deposit precommitment hash
     */
    event Deposited(address indexed depositor, uint256 amount, uint256 commitment, uint256 precommitment);

    /**
     * @notice Emitted when processing a withdrawal
     * @param recipient The address which processed the withdrawal
     * @param amount The withdrawn amount
     * @param nullifier The spent nullifier
     * @param newCommitment The new commitment hash
     */
    event Withdrawn(address indexed recipient, uint256 amount, uint256 nullifier, uint256 newCommitment);

    /**
     * @notice Emitted when vault approves a withdrawal for swap execution
     * @param recipient The address which will receive the swapped output
     * @param _param The swap parameters
     * @param _spentNullifier The spent nullifier
     * @param _newCommitment The new commitment hash
     */
    event Swapped(address indexed recipient, SwapParam _param, uint256 _spentNullifier, uint256 _newCommitment);

    /**
     * @notice Thrown when trying to deposit an invalid amount
     */
    error InvalidDepositAmount();

    /**
     * @notice Thrown when trying to withdraw an invalid amount
     */
    error InvalidWithdrawalAmount();

    /**
     * @notice Thrown when trying to nullifier is already spent
     */
    error NullifierAlreadySpent();

    /**
     * @notice Thrown when ZK Proof verification fails
     */
    error InvalidZKProof();

    /**
     * @notice Thrown when the amount received doesn't match msg.value
     */
    error AmountMismatch();

    /**
     * @notice Thrown when native asset transfer fails
     */
    error NativeTransferFailed();

    /**
     * @notice Thrown when vault receives native asset for alternative asset deposit
     */
    error NativeFundReceived();

    /*--------------------------------------------------------------------------------------------
                                                VIEWS
    --------------------------------------------------------------------------------------------*/

    /**
     * @notice Returns the asset being stored in this vault
     * @return _asset The asset address
     */
    function getAsset() external view returns (address _asset);

    /*--------------------------------------------------------------------------------------------
                                                METHODS
    --------------------------------------------------------------------------------------------*/

    /**
   * @notice Deposit funds into the Vault
   * @param _amount The amount being deposited
   * @param _precommitment The precommitment hash
   * @return _commitment The commitment hash
   */
   function deposit(uint256 _amount, uint256 _precommitment) external payable returns (uint256 _commitment);
    
    /**
     * @notice Withdraw funds from the Vault
     * @param _recipient The recipient address
     * @param _amount The amount being withdrawn
     * @param _nullifier The nullifier hash
     * @param _newCommitment The new commitment hash
     * @param _proof The Zero-Knowledge Proof of ownership
     */
     function withdraw(address _recipient, uint256 _amount, uint256 _nullifier, uint256 _newCommitment, bytes calldata _proof) external;    
    
    /**
     * @notice Approve and send funds from vault to swap executor
     * @param _param The swap parameters
     * @param _swapRouter The swap router address
     * @param _nullifier The nullifier hash
     * @param _newCommitment The new commitment hash
     * @param _proof The Zero-Knowledge Proof of ownership
     */
    function swap(SwapParam memory _param, address _swapRouter, uint256 _nullifier, uint256 _newCommitment, bytes calldata _proof) external;

    /**
     * @notice Verifies the given ZK proof
     * @param _amount The amount being withdrawn
     * @param _nullifier The nullifier hash
     * @param _newCommitment The new commitment hash
     * @param _proof The Zero-Knowledge Proof of ownership
     */
    function verify(uint256 _amount, uint256 _nullifier, uint256 _newCommitment, bytes calldata _proof) external view returns (bool);
}