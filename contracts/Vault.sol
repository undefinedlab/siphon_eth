// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "./MerkleTree.sol";
import "./Verifier.sol";
import "./lib/Poseidon.sol";

/**
 * @title Vault
 * @notice Production-grade privacy vault for anonymous ETH deposits and withdrawals
 * @dev Implements Tornado Cash-inspired privacy mechanism with proper security measures
 * Features: ZK proof verification, nullifier tracking, fee management, emergency controls
 */
contract Vault {
    using Poseidon for uint256;
    
    // Contract dependencies
    MerkleTree public immutable merkleTree;
    Verifier public immutable verifier;
    
    // Vault configuration
    uint256 public constant DENOMINATION = 0.1 ether; // Fixed deposit amount
    uint256 public constant MAX_FEE_PERCENTAGE = 5; // Maximum 5% fee
    uint256 public constant MIN_FEE = 0.001 ether; // Minimum fee in wei
    
    // Access control
    address public immutable owner;
    bool public emergencyStop;
    
    // State tracking
    mapping(uint256 => bool) public nullifiers; // Prevent double-spending
    uint256 public totalDeposits;
    uint256 public totalWithdrawals;
    uint256 public totalFees;
    
    // Fee management
    uint256 public feePercentage = 1; // 1% default fee
    address public feeRecipient;
    
    // Events
    event Deposit(
        uint256 indexed commitment,
        uint256 indexed leafIndex,
        uint256 amount,
        address indexed depositor
    );
    event Withdrawal(
        address indexed recipient,
        uint256 nullifierHash,
        uint256 amount,
        uint256 fee,
        address indexed feeRecipient
    );
    event EmergencyStopToggled(bool stopped);
    event FeeUpdated(uint256 newFeePercentage);
    event FeeRecipientUpdated(address newFeeRecipient);
    event FundsRecovered(address indexed recipient, uint256 amount);
    
    // Errors
    error InvalidAmount();
    error InvalidProof();
    error NullifierAlreadyUsed();
    error InvalidRoot();
    error InsufficientBalance();
    error TransferFailed();
    error EmergencyStopActive();
    error Unauthorized();
    error InvalidFeePercentage();
    error InvalidFeeRecipient();
    error InvalidCommitment();
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }
    
    modifier whenNotStopped() {
        if (emergencyStop) revert EmergencyStopActive();
        _;
    }
    
    constructor(address _merkleTree, address _verifier) {
        merkleTree = MerkleTree(_merkleTree);
        verifier = Verifier(_verifier);
        owner = msg.sender;
        feeRecipient = msg.sender;
    }
    
    /**
     * @notice Deposit ETH into the privacy vault
     * @dev Generates a commitment and adds it to the Merkle tree
     * @param commitment The commitment hash (Poseidon(nullifier, secret))
     */
    function deposit(uint256 commitment) external payable whenNotStopped {
        // Validate deposit amount
        if (msg.value != DENOMINATION) {
            revert InvalidAmount();
        }
        
        // Validate commitment
        if (commitment == 0) {
            revert InvalidCommitment();
        }
        
        // Insert commitment into Merkle tree
        uint256 leafIndex = merkleTree.insert(commitment);
        
        // Update state
        totalDeposits += msg.value;
        
        emit Deposit(commitment, leafIndex, msg.value, msg.sender);
    }
    
    /**
     * @notice Withdraw ETH from the privacy vault using ZK proof
     * @param proof The Groth16 proof components
     * @param nullifierHash The hash of the nullifier
     * @param recipient The address to receive the withdrawal
     * @param fee The fee amount (in wei)
     */
    function withdraw(
        uint256[2] memory a,
        uint256[2][2] memory b,
        uint256[2] memory c,
        uint256 nullifierHash,
        address recipient,
        uint256 fee
    ) external whenNotStopped {
        // Validate inputs
        if (recipient == address(0)) revert InvalidFeeRecipient();
        if (fee > DENOMINATION) revert InvalidAmount();
        if (fee < MIN_FEE && fee > 0) revert InvalidAmount();
        
        // Check if nullifier has been used
        if (nullifiers[nullifierHash]) {
            revert NullifierAlreadyUsed();
        }
        
        // Prepare public inputs for proof verification
        uint256[4] memory publicInputs = [
            merkleTree.getCurrentRoot(), // root
            nullifierHash,               // nullifierHash
            uint256(uint160(recipient)), // recipient (as uint256)
            fee                          // fee
        ];
        
        // Verify the ZK proof
        if (!verifier.verifyProof(a, b, c, publicInputs)) {
            revert InvalidProof();
        }
        
        // Mark nullifier as used
        nullifiers[nullifierHash] = true;
        
        // Calculate withdrawal amount
        uint256 withdrawalAmount = DENOMINATION - fee;
        
        // Check contract balance
        if (address(this).balance < withdrawalAmount) {
            revert InsufficientBalance();
        }
        
        // Update state
        totalWithdrawals += withdrawalAmount;
        if (fee > 0) {
            totalFees += fee;
        }
        
        // Transfer funds to recipient
        (bool success, ) = recipient.call{value: withdrawalAmount}("");
        if (!success) {
            revert TransferFailed();
        }
        
        // Transfer fee to fee recipient if specified
        if (fee > 0 && feeRecipient != address(0)) {
            (bool feeSuccess, ) = feeRecipient.call{value: fee}("");
            if (!feeSuccess) {
                // If fee transfer fails, send it to recipient instead
                (bool fallbackSuccess, ) = recipient.call{value: fee}("");
                if (!fallbackSuccess) {
                    revert TransferFailed();
                }
            }
        }
        
        emit Withdrawal(recipient, nullifierHash, withdrawalAmount, fee, feeRecipient);
    }
    
    /**
     * @notice Emergency stop function to halt deposits and withdrawals
     * @dev Only owner can call this function
     */
    function toggleEmergencyStop() external onlyOwner {
        emergencyStop = !emergencyStop;
        emit EmergencyStopToggled(emergencyStop);
    }
    
    /**
     * @notice Update the fee percentage
     * @param newFeePercentage New fee percentage (0-5%)
     */
    function updateFeePercentage(uint256 newFeePercentage) external onlyOwner {
        if (newFeePercentage > MAX_FEE_PERCENTAGE) {
            revert InvalidFeePercentage();
        }
        feePercentage = newFeePercentage;
        emit FeeUpdated(newFeePercentage);
    }
    
    /**
     * @notice Update the fee recipient address
     * @param newFeeRecipient New fee recipient address
     */
    function updateFeeRecipient(address newFeeRecipient) external onlyOwner {
        if (newFeeRecipient == address(0)) {
            revert InvalidFeeRecipient();
        }
        feeRecipient = newFeeRecipient;
        emit FeeRecipientUpdated(newFeeRecipient);
    }
    
    /**
     * @notice Recover funds in emergency situations
     * @dev Only owner can call this function
     * @param recipient Address to receive the funds
     * @param amount Amount to recover
     */
    function recoverFunds(address recipient, uint256 amount) external onlyOwner {
        if (recipient == address(0)) revert InvalidFeeRecipient();
        if (amount > address(this).balance) revert InsufficientBalance();
        
        (bool success, ) = recipient.call{value: amount}("");
        if (!success) revert TransferFailed();
        
        emit FundsRecovered(recipient, amount);
    }
    
    /**
     * @notice Get the current Merkle root
     * @return root The current root
     */
    function getCurrentRoot() external view returns (uint256 root) {
        return merkleTree.getCurrentRoot();
    }
    
    /**
     * @notice Check if a nullifier has been used
     * @param nullifierHash The nullifier hash to check
     * @return used True if the nullifier has been used
     */
    function isNullifierUsed(uint256 nullifierHash) external view returns (bool used) {
        return nullifiers[nullifierHash];
    }
    
    /**
     * @notice Get vault statistics
     * @return deposits Total deposits
     * @return withdrawals Total withdrawals
     * @return fees Total fees collected
     * @return balance Current vault balance
     * @return leafCount Number of commitments in tree
     */
    function getVaultStats() external view returns (
        uint256 deposits,
        uint256 withdrawals,
        uint256 fees,
        uint256 balance,
        uint256 leafCount
    ) {
        deposits = totalDeposits;
        withdrawals = totalWithdrawals;
        fees = totalFees;
        balance = address(this).balance;
        leafCount = merkleTree.getLeafCount();
    }
    
    /**
     * @notice Check if a root is known (for proof verification)
     * @param root The root to check
     * @return known True if the root is known
     */
    function isKnownRoot(uint256 root) external view returns (bool known) {
        return merkleTree.isKnownRoot(root);
    }
    
    /**
     * @notice Get vault configuration
     * @return denomination Fixed deposit amount
     * @return feePercentage Current fee percentage
     * @return feeRecipient Current fee recipient
     * @return emergencyStop Current emergency stop status
     */
    function getVaultConfig() external view returns (
        uint256 denomination,
        uint256 _feePercentage,
        address _feeRecipient,
        bool _emergencyStop
    ) {
        denomination = DENOMINATION;
        _feePercentage = feePercentage;
        _feeRecipient = feeRecipient;
        _emergencyStop = emergencyStop;
    }
    
    /**
     * @notice Receive ETH (for direct transfers)
     */
    receive() external payable {
        // Allow direct ETH transfers to the contract
    }
    
    /**
     * @notice Fallback function
     */
    fallback() external payable {
        revert("Vault: Function not found");
    }
}
