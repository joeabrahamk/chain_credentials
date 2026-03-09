/**
 * Smart Contract Interaction
 * 
 * This module provides functions to interact with the FileRegistry smart contract.
 * All blockchain read/write operations go through here.
 */

import { ethers } from 'ethers';
import { getProvider, getSigner } from './web3';
import config from '../config/appConfig';
import FileRegistryABI from '../abi/FileRegistry.json';

// Cache the contract instance
let contractInstance = null;
let contractWithSigner = null;

/**
 * Get the contract instance (read-only)
 * @returns {ethers.Contract} The contract instance
 */
export const getContract = () => {
  if (!contractInstance) {
    const provider = getProvider();
    contractInstance = new ethers.Contract(
      config.contractAddress,
      FileRegistryABI.abi,
      provider
    );
  }
  return contractInstance;
};

/**
 * Get the contract instance with signer (for write operations)
 * @returns {Promise<ethers.Contract>} The contract instance with signer
 */
export const getContractWithSigner = async () => {
  if (!contractWithSigner) {
    const signer = await getSigner();
    contractWithSigner = new ethers.Contract(
      config.contractAddress,
      FileRegistryABI.abi,
      signer
    );
  }
  return contractWithSigner;
};

/**
 * Register a new user with a unique ID
 * @param {string} userId - The unique user ID to register
 * @returns {Promise<ethers.TransactionReceipt>} The transaction receipt
 */
export const registerUser = async (userId) => {
  try {
    const contract = await getContractWithSigner();
    const tx = await contract.registerUser(userId);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error('Error registering user:', error);
    throw new Error(`Failed to register user: ${error.message}`);
  }
};

/**
 * Get the user ID for a wallet address
 * @param {string} walletAddress - The wallet address to look up
 * @returns {Promise<string>} The user ID or empty string if not registered
 */
export const getUserId = async (walletAddress) => {
  try {
    const contract = getContract();
    const userId = await contract.getUserId(walletAddress);
    return userId;
  } catch (error) {
    console.error('Error getting user ID:', error);
    throw new Error(`Failed to get user ID: ${error.message}`);
  }
};

/**
 * Upload file metadata to the blockchain
 * @param {string} userId - The user's ID
 * @param {string} cid - The IPFS Content Identifier
 * @param {string} fileName - The original file name
 * @returns {Promise<ethers.TransactionReceipt>} The transaction receipt
 */
export const uploadFileMetadata = async (userId, cid, fileName) => {
  try {
    const contract = await getContractWithSigner();
    const tx = await contract.uploadFile(userId, cid, fileName);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error('Error uploading file metadata:', error);
    throw new Error(`Failed to upload file metadata: ${error.message}`);
  }
};

/**
 * Get all files for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<Array>} Array of file objects {cid, name, timestamp}
 */
export const getFiles = async (userId) => {
  try {
    const contract = getContract();
    const files = await contract.getFiles(userId);
    
    // Transform the result into a more usable format
    return files.map((file, index) => ({
      index,
      cid: file.cid,
      name: file.name,
      timestamp: Number(file.timestamp),
      // Convert timestamp to readable date
      uploadDate: new Date(Number(file.timestamp) * 1000).toLocaleString()
    }));
  } catch (error) {
    console.error('Error getting files:', error);
    throw new Error(`Failed to get files: ${error.message}`);
  }
};

/**
 * Get the number of files for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<number>} The number of files
 */
export const getFileCount = async (userId) => {
  try {
    const contract = getContract();
    const count = await contract.getFileCount(userId);
    return Number(count);
  } catch (error) {
    console.error('Error getting file count:', error);
    throw new Error(`Failed to get file count: ${error.message}`);
  }
};

/**
 * Delete a file from the blockchain
 * @param {string} userId - The user's ID
 * @param {number} fileIndex - The index of the file to delete
 * @returns {Promise<ethers.TransactionReceipt>} The transaction receipt
 */
export const deleteFile = async (userId, fileIndex) => {
  try {
    const contract = await getContractWithSigner();
    const tx = await contract.deleteFile(userId, fileIndex);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Check if a user is registered
 * @param {string} walletAddress - The wallet address to check
 * @returns {Promise<boolean>} True if the user is registered
 */
export const isUserRegistered = async (walletAddress) => {
  try {
    const userId = await getUserId(walletAddress);
    return userId && userId.length > 0;
  } catch (error) {
    console.error('Error checking user registration:', error);
    return false;
  }
};

/**
 * Reset contract instances (useful when switching accounts)
 */
export const resetContractInstances = () => {
  contractInstance = null;
  contractWithSigner = null;
};

export default {
  getContract,
  getContractWithSigner,
  registerUser,
  getUserId,
  uploadFileMetadata,
  getFiles,
  getFileCount,
  deleteFile,
  isUserRegistered,
  resetContractInstances
};
