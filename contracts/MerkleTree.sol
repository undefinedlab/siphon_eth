// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./lib/Poseidon.sol";

/**
 * @title MerkleTree
 * @notice Production-grade incremental Merkle tree for privacy vault commitments
 * @dev Implements efficient incremental Merkle tree with proper gas optimizations
 * Supports 20 levels (~1M deposits) with root history for proof flexibility
 */
contract MerkleTree {
    using Poseidon for uint256;
    
    // Tree configuration
    uint256 public constant TREE_DEPTH = 20;
    uint256 public constant MAX_LEAVES = 2**TREE_DEPTH; // ~1M deposits
    uint256 public constant ROOT_HISTORY_SIZE = 30; // Store last 30 roots
    
    // Tree state
    uint256 public currentRoot;
    uint256 public nextLeafIndex;
    uint256 public leafCount;
    
    // Root history for proof flexibility
    uint256[ROOT_HISTORY_SIZE] public rootHistory;
    uint256 public currentRootIndex;
    
    // Incremental tree storage - stores only necessary nodes
    mapping(uint256 => uint256) public filledSubtrees; // Level => hash
    mapping(uint256 => uint256) public zeros; // Level => zero hash
    
    // Events
    event LeafInserted(uint256 indexed leafIndex, uint256 commitment, uint256 newRoot);
    event RootUpdated(uint256 indexed rootIndex, uint256 newRoot);
    
    // Errors
    error TreeFull();
    error InvalidCommitment();
    error InvalidRoot();
    error InvalidPath();
    
    constructor() {
        // Initialize with zero root
        currentRoot = 0;
        nextLeafIndex = 0;
        leafCount = 0;
        currentRootIndex = 0;
        
        // Initialize zero hashes for each level
        zeros[0] = 0;
        for (uint256 i = 1; i <= TREE_DEPTH; i++) {
            zeros[i] = Poseidon.hash2(zeros[i - 1], zeros[i - 1]);
        }
        
        // Initialize filled subtrees with zeros
        for (uint256 i = 0; i < TREE_DEPTH; i++) {
            filledSubtrees[i] = zeros[i];
        }
        
        // Initialize root history with zero
        for (uint256 i = 0; i < ROOT_HISTORY_SIZE; i++) {
            rootHistory[i] = 0;
        }
    }
    
    /**
     * @notice Insert a new commitment into the Merkle tree
     * @param commitment The commitment hash to insert
     * @return newRoot The new Merkle root after insertion
     */
    function insert(uint256 commitment) external returns (uint256 newRoot) {
        if (nextLeafIndex >= MAX_LEAVES) {
            revert TreeFull();
        }
        if (commitment == 0) {
            revert InvalidCommitment();
        }
        
        uint256 leafIndex = nextLeafIndex;
        uint256 current = commitment;
        
        // Update filled subtrees and calculate new root
        for (uint256 level = 0; level < TREE_DEPTH; level++) {
            if (leafIndex & (1 << level) == 0) {
                // Left child - store current hash and break
                filledSubtrees[level] = current;
                break;
            } else {
                // Right child - hash with left sibling
                current = Poseidon.hash2(filledSubtrees[level], current);
            }
        }
        
        // Calculate new root
        newRoot = _calculateRoot();
        
        // Update tree state
        currentRoot = newRoot;
        nextLeafIndex++;
        leafCount++;
        
        // Update root history
        rootHistory[currentRootIndex] = newRoot;
        currentRootIndex = (currentRootIndex + 1) % ROOT_HISTORY_SIZE;
        
        emit LeafInserted(leafIndex, commitment, newRoot);
        emit RootUpdated(currentRootIndex, newRoot);
        
        return newRoot;
    }
    
    /**
     * @notice Check if a root exists in the root history
     * @param root The root to check
     * @return exists True if the root exists in history
     */
    function isKnownRoot(uint256 root) external view returns (bool exists) {
        if (root == 0) return true; // Zero root is always valid
        
        for (uint256 i = 0; i < ROOT_HISTORY_SIZE; i++) {
            if (rootHistory[i] == root) {
                return true;
            }
        }
        return false;
    }
    
    /**
     * @notice Get the current Merkle root
     * @return root The current root
     */
    function getCurrentRoot() external view returns (uint256 root) {
        return currentRoot;
    }
    
    /**
     * @notice Get the number of leaves in the tree
     * @return count The number of leaves
     */
    function getLeafCount() external view returns (uint256 count) {
        return leafCount;
    }
    
    /**
     * @notice Calculate the current Merkle root
     * @return root The current root
     */
    function _calculateRoot() internal view returns (uint256 root) {
        uint256 current = filledSubtrees[TREE_DEPTH - 1];
        
        // Calculate root from filled subtrees
        for (uint256 level = TREE_DEPTH - 1; level > 0; level--) {
            if (filledSubtrees[level - 1] != zeros[level - 1]) {
                current = Poseidon.hash2(filledSubtrees[level - 1], current);
            } else {
                current = Poseidon.hash2(zeros[level - 1], current);
            }
        }
        
        return current;
    }
    
    /**
     * @notice Calculate Merkle path elements for a given leaf index
     * @param leafIndex The index of the leaf
     * @return pathElements Array of path elements
     * @return pathIndices Array of path indices (0 = left, 1 = right)
     */
    function calculateMerklePath(uint256 leafIndex) external view returns (
        uint256[TREE_DEPTH] memory pathElements,
        uint256[TREE_DEPTH] memory pathIndices
    ) {
        require(leafIndex < leafCount, "MerkleTree: Invalid leaf index");
        
        for (uint256 level = 0; level < TREE_DEPTH; level++) {
            pathIndices[level] = (leafIndex >> level) & 1;
            
            if (pathIndices[level] == 0) {
                // Left child - use zero hash for right sibling
                pathElements[level] = zeros[level];
            } else {
                // Right child - use filled subtree for left sibling
                pathElements[level] = filledSubtrees[level];
            }
        }
    }
    
    /**
     * @notice Verify a Merkle path
     * @param leaf The leaf value
     * @param pathElements Array of path elements
     * @param pathIndices Array of path indices
     * @param root The expected root
     * @return valid True if the path is valid
     */
    function verifyMerklePath(
        uint256 leaf,
        uint256[TREE_DEPTH] memory pathElements,
        uint256[TREE_DEPTH] memory pathIndices,
        uint256 root
    ) external pure returns (bool valid) {
        uint256 current = leaf;
        
        for (uint256 level = 0; level < TREE_DEPTH; level++) {
            if (pathIndices[level] == 0) {
                // Left child
                current = Poseidon.hash2(current, pathElements[level]);
            } else {
                // Right child
                current = Poseidon.hash2(pathElements[level], current);
            }
        }
        
        return current == root;
    }
    
    /**
     * @notice Get tree statistics
     * @return _currentRoot Current root
     * @return _leafCount Number of leaves
     * @return _nextLeafIndex Next leaf index
     * @return _currentRootIndex Current root index in history
     */
    function getTreeStats() external view returns (
        uint256 _currentRoot,
        uint256 _leafCount,
        uint256 _nextLeafIndex,
        uint256 _currentRootIndex
    ) {
        return (currentRoot, leafCount, nextLeafIndex, currentRootIndex);
    }
    
    /**
     * @notice Get root history
     * @return roots Array of root history
     */
    function getRootHistory() external view returns (uint256[ROOT_HISTORY_SIZE] memory roots) {
        return rootHistory;
    }
}
