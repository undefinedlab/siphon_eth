// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.28;

import {IVault} from '../interfaces/IVault.sol';
import {MerkleTree} from '../states/MerkleTree.sol';
import {PoseidonT3} from "poseidon-solidity/PoseidonT3.sol";
import {PlonkVerifier} from '../verifiers/WithdrawalVerifier.sol';

abstract contract Vault is IVault {

    /*--------------------------------------------------------------------------------------------
                                        VARIABLES & CONSTANTS
    --------------------------------------------------------------------------------------------*/

    /// @notice The address of asset
    address public immutable asset;
    
    /// @notice The merkle tree containing all commitments
    MerkleTree public merkleTree;

    /// @notice Record of nullifiers' spent history
    mapping(uint256 _nullifier => bool _spent) public nullifiers;

    /// @notice The deposit nonce
    uint256 public nonce;

    /// @notice The ZK verifier
    PlonkVerifier internal immutable verifier;

    /*--------------------------------------------------------------------------------------------
                                            CONSTRUCTOR
    --------------------------------------------------------------------------------------------*/

    /**
     * @notice Initialize the vault with the given asset
     * @param _asset The address of asset being stored in this vault
     */
    constructor(address _asset) {
        asset = _asset;
        merkleTree = new MerkleTree();
        verifier = new PlonkVerifier();
    }

    /*--------------------------------------------------------------------------------------------
                                                VIEWS
    --------------------------------------------------------------------------------------------*/

    /**
     * @notice Returns the asset being stored in this vault
     * @return _asset The asset address
     */
    function getAsset() external view returns (address _asset) {
        _asset = asset;
    }

    /**
     * @notice Verifies the ZK proof
     * @return true if the proof is valid, false otherwise
     */
    function verify(
        uint256 _amount,
        uint256 _nullifier,
        uint256 _newCommitment,
        bytes calldata _proof
    ) external view returns (bool) {
        // Get current merkle root
        uint256 root = merkleTree.getRoot();
        
        // Prepare public inputs for verification
        uint256[4] memory publicInputs = [
            _amount,           // withdrawnValue
            root,              // stateRoot
            _newCommitment,    // newCommitment
            _nullifier         // nullifierHash
        ];
        return verifier.verifyProof(_proof, publicInputs);
    }

    /*--------------------------------------------------------------------------------------------
                                                METHODS
    --------------------------------------------------------------------------------------------*/

    /// @inheritdoc IVault
    function deposit(
        uint256 _amount,
        uint256 _precommitment
    ) external payable returns (uint256 _commitment) {
        if(_amount <= 0) revert InvalidDepositAmount();

        // Generate commitment and insert into the merkle tree
        _commitment = PoseidonT3.hash([_amount, _precommitment]);
        merkleTree.insert(_commitment);

        // Receive fund from the depositor
        _receive(msg.sender, _amount);

        emit Deposited(msg.sender, _amount, _commitment, _precommitment);
    }

    /// @inheritdoc IVault
    function withdraw(
        address _recipient,
        uint256 _amount,
        uint256 _nullifier,
        uint256 _newCommitment,
        bytes calldata _proof  // Changed from uint256 to bytes
    ) external {
        // Get current merkle root
        uint256 root = merkleTree.getRoot();
        
        // Prepare public inputs for verification
        uint256[4] memory publicInputs = [
            _amount,           // withdrawnValue
            root,              // stateRoot
            _newCommitment,    // newCommitment
            _nullifier         // nullifierHash
        ];

        // Verify the ZK proof
        if(!verifier.verifyProof(_proof, publicInputs)) revert InvalidZKProof();

        // Validate nullifier and mark it as spent
        if(nullifiers[_nullifier]) revert NullifierAlreadySpent();
        nullifiers[_nullifier] = true;

        // Insert the new commitment into the merkle tree
        merkleTree.insert(_newCommitment);

        // Send fund to the recipient
        _send(_recipient, _amount);

        emit Withdrawn(_recipient, _amount, _nullifier, _newCommitment);
    }
    
    function swap(
        SwapParam memory _param,
        address _swapRouter,
        uint256 _nullifier,
        uint256 _newCommitment,
        bytes calldata _proof
    ) external {
        // Get current merkle root
        uint256 root = merkleTree.getRoot();
        
        // Prepare public inputs for verification
        uint256[4] memory publicInputs = [
            _param.amountIn,   // withdrawnValue
            root,              // stateRoot
            _newCommitment,    // newCommitment
            _nullifier         // nullifierHash
        ];

        // Verify the ZK proof
        if(!verifier.verifyProof(_proof, publicInputs)) revert InvalidZKProof();

        // Validate nullifier and mark it as spent
        if(nullifiers[_nullifier]) revert NullifierAlreadySpent();
        nullifiers[_nullifier] = true;

        // Insert the new commitment into the merkle tree
        merkleTree.insert(_newCommitment);

        // Execute swap
        _swap(_swapRouter, _param);

        emit Swapped(_param.recipient, _param, _nullifier, _newCommitment);
    }

    /*--------------------------------------------------------------------------------------------
                                            OVERRIDES
    --------------------------------------------------------------------------------------------*/

    /**
     * @notice Internal function to handle the asset transfer on deposit
     * @param _from The address from which the asset is transferred
     * @param _amount The amount being transferred
     */
    function _receive(address _from, uint256 _amount) internal virtual;


    /**
     * @notice Internal function to handle the asset transfer on withdrawal
     * @param _to The address to which the asset is transferred
     * @param _amount The amount being transferred
     */
    function _send(address _to, uint256 _amount) internal virtual;

    /**
     * @notice Swap current asset to another asset via external DEX
     * @param _router The DEX swap router address
     * @param _param The swap parameters
     */
    function _swap(address _router, SwapParam memory _param) internal virtual;
}