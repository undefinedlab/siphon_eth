// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.8.28;


interface IMerkleTree {

    /*--------------------------------------------------------------------------------------------
                                                EVENTS
    --------------------------------------------------------------------------------------------*/

    /**
   * @notice Emitted when a new leaf (commitment) is added to the Merkle tree
   * @param _index The index of the leaf
   * @param _leaf The leaf value = hash(commitment, nonce)
   * @param _root The updated root value
   */
    event LeafInserted(uint256 _index, uint256 _leaf, uint256 _root);
    
    /**
     * @notice Thrown when the tree depth has reached its capacity.
     */
    error MaxDepthReached();

    /*--------------------------------------------------------------------------------------------
                                                VIEWS
    --------------------------------------------------------------------------------------------*/

    /**
     * @notice Returns the current root of the Merkle tree
     * @return _root The current root value
     */
    function getRoot() external view returns (uint256 _root);

    /**
     * @notice Returns the current depth of the Merkle tree
     * @return _depth The current depth value
     */
    function getDepth() external view returns (uint256 _depth);

    /**
     * @notice Returns the current size of the Merkle tree
     * @return _size The current size value
     */
    function getSize() external view returns (uint256 _size);

    /*--------------------------------------------------------------------------------------------
                                                METHODS
    --------------------------------------------------------------------------------------------*/

    /**
     * @notice Insert a leaf to the tree
     * @param _leaf The commitment being added to the tree
     * @return _newRoot New root after leaf has been addded to the tree
     */
    function insert(uint256 _leaf) external returns (uint256 _newRoot);

    /**
     * @notice Checks if the given leaf exists in the tree
     * @param _leaf The commitment to check its existance
     * @return True if leaf exists in the tree. False otherwise
     */
    function has(uint256 _leaf) external view returns (bool);

    /**
     * @notice Checks if the given root was recorded
     * @dev Tree only stores up to most recent ROOT_HISTORY_SIZE number of roots
     * @param _root The root to check
     * @return True if root exists in the root history. False otherwise
     */
    function rootExists(uint256 _root) external view returns (bool);

}