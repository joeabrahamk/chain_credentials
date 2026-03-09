// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title FileRegistry
 * @dev A simple smart contract for storing file metadata on the blockchain.
 *
 * This contract allows users to:
 * - Register with a unique user ID
 * - Upload file metadata (CID, name, timestamp)
 * - Retrieve their files
 * - Delete their files
 *
 * Note: This contract does NOT store actual files, only metadata.
 * The actual files are stored on IPFS.
 */
contract FileRegistry {
    // ============ Structs ============

    /**
     * @dev Represents a file's metadata
     * @param cid The IPFS Content Identifier
     * @param name The original filename
     * @param timestamp When the file was uploaded (block timestamp)
     */
    struct File {
        string cid;
        string name;
        uint256 timestamp;
    }

    // ============ State Variables ============

    // Maps wallet address to user ID
    mapping(address => string) public userIds;

    // Maps user ID to array of files
    mapping(string => File[]) private userFiles;

    // Maps user ID to wallet address (reverse lookup)
    mapping(string => address) private userIdToWallet;

    // ============ Events ============

    /**
     * @dev Emitted when a new user registers
     */
    event UserRegistered(address indexed wallet, string userId);

    /**
     * @dev Emitted when a file is uploaded
     */
    event FileUploaded(
        address indexed owner,
        string userId,
        string cid,
        string name
    );

    /**
     * @dev Emitted when a file is deleted
     */
    event FileDeleted(address indexed owner, string userId, uint256 index);

    // ============ Modifiers ============

    /**
     * @dev Ensures the caller owns the user ID
     */
    modifier onlyOwner(string memory userId) {
        require(
            keccak256(bytes(userIds[msg.sender])) == keccak256(bytes(userId)),
            "Not authorized: You don't own this user ID"
        );
        _;
    }

    /**
     * @dev Ensures the user ID is not empty
     */
    modifier validUserId(string memory userId) {
        require(bytes(userId).length > 0, "User ID cannot be empty");
        require(bytes(userId).length <= 50, "User ID too long (max 50 chars)");
        _;
    }

    // ============ Functions ============

    /**
     * @dev Register a new user with a unique ID
     * @param userId The unique identifier for the user
     *
     * Requirements:
     * - Caller must not already be registered
     * - User ID must not be taken
     * - User ID must be between 1 and 50 characters
     */
    function registerUser(string memory userId) public validUserId(userId) {
        // Check if caller is already registered
        require(
            bytes(userIds[msg.sender]).length == 0,
            "Already registered: This wallet already has a user ID"
        );

        // Check if user ID is already taken
        require(
            userIdToWallet[userId] == address(0),
            "User ID taken: This ID is already registered"
        );

        // Register the user
        userIds[msg.sender] = userId;
        userIdToWallet[userId] = msg.sender;

        emit UserRegistered(msg.sender, userId);
    }

    /**
     * @dev Upload file metadata
     * @param userId The user's ID
     * @param cid The IPFS Content Identifier
     * @param name The original filename
     *
     * Requirements:
     * - Caller must own the user ID
     * - CID cannot be empty
     * - Name cannot be empty
     */
    function uploadFile(
        string memory userId,
        string memory cid,
        string memory name
    ) public onlyOwner(userId) {
        require(bytes(cid).length > 0, "CID cannot be empty");
        require(bytes(name).length > 0, "File name cannot be empty");

        // Add file to user's file list
        userFiles[userId].push(
            File({cid: cid, name: name, timestamp: block.timestamp})
        );

        emit FileUploaded(msg.sender, userId, cid, name);
    }

    /**
     * @dev Get all files for a user
     * @param userId The user's ID
     * @return Array of File structs
     *
     * Note: This is a view function, no gas cost when called directly
     * Anyone can read file metadata (for valuators)
     */
    function getFiles(
        string memory userId
    ) public view returns (File[] memory) {
        return userFiles[userId];
    }

    /**
     * @dev Get the number of files for a user
     * @param userId The user's ID
     * @return The number of files
     */
    function getFileCount(string memory userId) public view returns (uint256) {
        return userFiles[userId].length;
    }

    /**
     * @dev Delete a file by index
     * @param userId The user's ID
     * @param index The index of the file to delete
     *
     * Requirements:
     * - Caller must own the user ID
     * - Index must be valid
     *
     * Note: This uses swap-and-pop for efficiency, which changes array order
     */
    function deleteFile(
        string memory userId,
        uint256 index
    ) public onlyOwner(userId) {
        File[] storage files = userFiles[userId];

        require(index < files.length, "Invalid index: File does not exist");

        // Swap with last element and pop (gas efficient)
        files[index] = files[files.length - 1];
        files.pop();

        emit FileDeleted(msg.sender, userId, index);
    }

    /**
     * @dev Get user ID for a wallet address
     * @param wallet The wallet address to look up
     * @return The user ID or empty string if not registered
     */
    function getUserId(address wallet) public view returns (string memory) {
        return userIds[wallet];
    }

    /**
     * @dev Get wallet address for a user ID
     * @param userId The user ID to look up
     * @return The wallet address or zero address if not found
     */
    function getWalletByUserId(
        string memory userId
    ) public view returns (address) {
        return userIdToWallet[userId];
    }

    /**
     * @dev Check if a user ID is available
     * @param userId The user ID to check
     * @return True if available, false if taken
     */
    function isUserIdAvailable(
        string memory userId
    ) public view returns (bool) {
        return userIdToWallet[userId] == address(0);
    }

    /**
     * @dev Check if a wallet is registered
     * @param wallet The wallet address to check
     * @return True if registered, false otherwise
     */
    function isWalletRegistered(address wallet) public view returns (bool) {
        return bytes(userIds[wallet]).length > 0;
    }
}
