/**
 * Wallet Authentication
 * 
 * This module handles MetaMask wallet-based authentication for general users.
 */

import { 
  connectWallet, 
  getConnectedAddress, 
  isMetaMaskInstalled,
  isCorrectNetwork,
  switchToCorrectNetwork,
  disconnectWallet,
  onAccountChange,
  onNetworkChange
} from '../blockchain/web3';
import { getUserId, registerUser, isUserRegistered } from '../blockchain/contract';

/**
 * Authentication state
 */
let authState = {
  isAuthenticated: false,
  walletAddress: null,
  userId: null
};

/**
 * Get current authentication state
 * @returns {Object} The current auth state
 */
export const getAuthState = () => ({ ...authState });

/**
 * Login with MetaMask
 * @param {boolean} autoRegister - Whether to auto-register if user doesn't exist
 * @returns {Promise<Object>} The auth state after login
 */
export const loginWithWallet = async (autoRegister = false) => {
  // Check MetaMask installation
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask to continue.');
  }

  // Check network
  const correctNetwork = await isCorrectNetwork();
  if (!correctNetwork) {
    try {
      await switchToCorrectNetwork();
    } catch (error) {
      throw new Error('Please switch to the correct network (Ganache Local) in MetaMask.');
    }
  }

  // Clear logout flag since user is explicitly connecting
  clearLogoutFlag();

  // Connect wallet
  const address = await connectWallet();
  
  // Get user ID from blockchain
  let userId = await getUserId(address);
  
  // If not registered and autoRegister is true, register with wallet address as ID
  if (!userId && autoRegister) {
    // Generate a simple user ID from the wallet address
    const generatedId = `user_${address.slice(2, 10).toLowerCase()}`;
    await registerUser(generatedId);
    userId = generatedId;
  }

  // Update state
  authState = {
    isAuthenticated: true,
    walletAddress: address,
    userId: userId || null
  };

  return authState;
};

/**
 * Register a new user with a custom ID
 * @param {string} userId - The user ID to register
 * @returns {Promise<Object>} The auth state after registration
 */
export const registerNewUser = async (userId) => {
  if (!authState.walletAddress) {
    throw new Error('Please connect your wallet first.');
  }

  if (!userId || userId.trim().length === 0) {
    throw new Error('Please provide a valid user ID.');
  }

  // Check if already registered
  const isRegistered = await isUserRegistered(authState.walletAddress);
  if (isRegistered) {
    throw new Error('This wallet is already registered.');
  }

  // Register on blockchain
  await registerUser(userId.trim());

  // Update state
  authState.userId = userId.trim();

  return authState;
};

/**
 * Check if currently logged in
 * @returns {Promise<Object>} The auth state
 */
export const checkAuthStatus = async () => {
  const address = await getConnectedAddress();
  
  if (address) {
    const userId = await getUserId(address);
    authState = {
      isAuthenticated: true,
      walletAddress: address,
      userId: userId || null
    };
  } else {
    authState = {
      isAuthenticated: false,
      walletAddress: null,
      userId: null
    };
  }

  return authState;
};

/**
 * Logout - disconnect wallet
 */
export const logout = () => {
  disconnectWallet();
  authState = {
    isAuthenticated: false,
    walletAddress: null,
    userId: null
  };
  
  // Set a flag to prevent auto-reconnect
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('userLoggedOut', 'true');
    sessionStorage.removeItem('walletAuth');
  }
};

/**
 * Clear logout flag (called when user explicitly connects)
 */
export const clearLogoutFlag = () => {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('userLoggedOut');
  }
};

/**
 * Check if user explicitly logged out
 */
export const wasLoggedOut = () => {
  if (typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem('userLoggedOut') === 'true';
  }
  return false;
};

/**
 * Setup event listeners for account/network changes
 * @param {Function} onAuthChange - Callback when auth state changes
 */
export const setupAuthListeners = (onAuthChange) => {
  onAccountChange(async (accounts) => {
    if (accounts.length === 0) {
      // User disconnected
      logout();
      onAuthChange(authState);
    } else {
      // Account changed
      const userId = await getUserId(accounts[0]);
      authState = {
        isAuthenticated: true,
        walletAddress: accounts[0],
        userId: userId || null
      };
      onAuthChange(authState);
    }
  });

  onNetworkChange(() => {
    // Reload page on network change to ensure clean state
    window.location.reload();
  });
};

/**
 * Format wallet address for display
 * @param {string} address - The full wallet address
 * @returns {string} Formatted address (e.g., "0x1234...5678")
 */
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

export default {
  getAuthState,
  loginWithWallet,
  registerNewUser,
  checkAuthStatus,
  logout,
  setupAuthListeners,
  formatAddress
};
