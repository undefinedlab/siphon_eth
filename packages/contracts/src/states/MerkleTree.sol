// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.28;

import {IMerkleTree} from '../interfaces/IMerkleTree.sol';
import {LeanIMTData} from "@zk-kit/lean-imt.sol/InternalLeanIMT.sol";
import {LeanIMT} from "@zk-kit/lean-imt.sol/LeanIMT.sol";

contract MerkleTree is IMerkleTree{
    using LeanIMT for LeanIMTData;
    
    /*--------------------------------------------------------------------------------------------
                                        VARIABLES & CONSTANTS
    --------------------------------------------------------------------------------------------*/

    /**
     * @notice The maximum depth of the Merkle tree
     */
    uint32 public constant MAX_DEPTH = 32;

    /**
     * @notice The maximum number of roots to be stored in history
     */
    uint32 public constant ROOT_HISTORY_SIZE = 100;

    /// @notice The Merkle Tree data
    LeanIMTData internal _tree;

    /// @notice Mapping of root history, used to verify a given root 
    mapping(uint32 _index => uint256 _root) public roots;
    
    /// @notice The current root index
    uint32 public currentRootIndex;

    /*--------------------------------------------------------------------------------------------
                                                VIEWS
    --------------------------------------------------------------------------------------------*/

    /// @inheritdoc IMerkleTree
    function getRoot() external view returns (uint256) {
        return _tree.root();
    }

    /// @inheritdoc IMerkleTree
    function getDepth() external view returns (uint256) {
        return _tree.depth;
    }

    /// @inheritdoc IMerkleTree
    function getSize() external view returns (uint256) {
        return _tree.size;
    }

    /*--------------------------------------------------------------------------------------------
                                                METHODS
    --------------------------------------------------------------------------------------------*/

    ///@inheritdoc IMerkleTree
    function insert(uint256 _leaf) external returns (uint256 _newRoot) {
        if(_tree.depth >= MAX_DEPTH) revert MaxDepthReached();

        // Insert leaf to the Merkle tree
        _newRoot = _tree.insert(_leaf);

        // Update the root history
        currentRootIndex++;
        roots[currentRootIndex % ROOT_HISTORY_SIZE] = _newRoot;

        emit LeafInserted(_tree.size, _leaf, _newRoot);
    }

    ///@inheritdoc IMerkleTree
    function has(uint256 _leaf) external view returns (bool) {
        return _tree.has(_leaf);
    }

    ///@inheritdoc IMerkleTree
    function rootExists(uint256 _root) external view returns (bool) {
        if (_root == 0) return false;

        // Search root from latest to oldest order
        uint32 index = currentRootIndex;
        for(uint32 i = 1; i <= ROOT_HISTORY_SIZE; i++) {
            if (_root == roots[index]) return true;
            index = (--index + ROOT_HISTORY_SIZE) % ROOT_HISTORY_SIZE;
        }
        return false;
    }

}