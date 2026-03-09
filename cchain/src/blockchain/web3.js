/**
 * Web3 Provider Setup
 * 
 * This module handles the connection to the Ethereum blockchain
 * using MetaMask as the provider.
 */

import { ethers } from 'ethers';
import config from '../config/appConfig';

// Store the provider and signer globally
let provider = null;
let signer = null;

/**
 * Check if MetaMask is installed
 * @returns {boolean} True if MetaMask is available
 */
export const isMetaMaskInstalled = () => {
  return typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';
};

/**
 * Get the Web3 provider (read-only connection to blockchain)
 * @returns {ethers.BrowserProvider} The provider instance
 */
export const getProvider = () => {
  if (!provider) {
    if (isMetaMaskInstalled()) {
      provider = new ethers.BrowserProvider(window.ethereum);
    } else {
      // Fallback to JSON-RPC provider for read-only access
      provider = new ethers.JsonRpcProvider(config.rpcUrl);
    }
  }
  return provider;
};

/**
 * Get the signer (for sending transactions)
 * @returns {Promise<ethers.Signer>} The signer instance
 */
export const getSigner = async () => {
  if (!signer) {
    const provider = getProvider();
    signer = await provider.getSigner();
  }
  return signer;
};

/**
 * Connect to MetaMask wallet
 * @returns {Promise<string>} The connected wallet address
 */
export const connectWallet = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (accounts.length === 0) {
      throw new Error('No accounts found. Please connect your MetaMask wallet.');
    }

    // Reset provider and signer to get fresh instances
    provider = new ethers.BrowserProvider(window.ethereum);
    signer = await provider.getSigner();

    return accounts[0];
  } catch (error) {
    if (error.code === 4001) {
      throw new Error('Connection rejected. Please approve the connection in MetaMask.');
    }
    throw error;
  }
};

/**
 * Get the currently connected wallet address
 * @returns {Promise<string|null>} The wallet address or null if not connected
 */
export const getConnectedAddress = async () => {
  if (!isMetaMaskInstalled()) {
    return null;
  }

  try {
    const accounts = await window.ethereum.request({
      method: 'eth_accounts'
    });
    return accounts.length > 0 ? accounts[0] : null;
  } catch (error) {
    console.error('Error getting connected address:', error);
    return null;
  }
};

/**
 * Check if wallet is connected to the correct network
 * @returns {Promise<boolean>} True if connected to correct network
 */
export const isCorrectNetwork = async () => {
  if (!isMetaMaskInstalled()) {
    return false;
  }

  try {
    const chainId = await window.ethereum.request({
      method: 'eth_chainId'
    });
    // chainId is returned as hex, convert to number
    const currentChainId = parseInt(chainId, 16);
    return currentChainId === config.chainId;
  } catch (error) {
    console.error('Error checking network:', error);
    return false;
  }
};

/**
 * Switch to the correct network (Ganache)
 * @returns {Promise<void>}
 */
export const switchToCorrectNetwork = async () => {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed');
  }

  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: `0x${config.chainId.toString(16)}` }]
    });
  } catch (error) {
    // If the network doesn't exist, add it
    if (error.code === 4902) {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: `0x${config.chainId.toString(16)}`,
          chainName: 'Ganache Local',
          nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18
          },
          rpcUrls: [config.rpcUrl]
        }]
      });
    } else {
      throw error;
    }
  }
};

/**
 * Disconnect wallet (clears local state)
 */
export const disconnectWallet = () => {
  provider = null;
  signer = null;
};

/**
 * Listen for account changes
 * @param {Function} callback Function to call when account changes
 */
export const onAccountChange = (callback) => {
  if (isMetaMaskInstalled()) {
    window.ethereum.on('accountsChanged', callback);
  }
};

/**
 * Listen for network changes
 * @param {Function} callback Function to call when network changes
 */
export const onNetworkChange = (callback) => {
  if (isMetaMaskInstalled()) {
    window.ethereum.on('chainChanged', callback);
  }
};

/**
 * Remove event listeners
 */
export const removeListeners = () => {
  if (isMetaMaskInstalled()) {
    window.ethereum.removeAllListeners('accountsChanged');
    window.ethereum.removeAllListeners('chainChanged');
  }
};

export default {
  isMetaMaskInstalled,
  getProvider,
  getSigner,
  connectWallet,
  getConnectedAddress,
  isCorrectNetwork,
  switchToCorrectNetwork,
  disconnectWallet,
  onAccountChange,
  onNetworkChange,
  removeListeners
};
