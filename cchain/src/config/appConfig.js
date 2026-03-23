/**
 * Application Configuration
 * 
 * This file contains all the configuration settings for Chain-Cred.
 * Update these values after deploying your smart contract.
 */

export const config = {
  // Smart Contract Configuration
  // -------------------------------------------------
  // The address where your FileRegistry contract is deployed
  // You'll get this after running: truffle migrate --network development
  // Example: "0x5FbDB2315678afecb367f032d93F642f64180aa3"
  contractAddress: "0x92E066357759a6970C8856F07148062731B7039C",

  // Blockchain Network Configuration
  // -------------------------------------------------
  // Ganache default RPC URL
  rpcUrl: "http://127.0.0.1:7545",
  
  // Chain ID for Ganache (usually 1337 or 5777)
  // Check your Ganache settings if transactions fail
  chainId: 1337,

  // IPFS Configuration
  // -------------------------------------------------
  // Public IPFS gateway for retrieving files
  ipfsGateway: "https://ipfs.io/ipfs/",
  
  // IPFS API endpoint for uploading files
  // If using local IPFS node: "http://localhost:5001"
  // If using Infura: "https://ipfs.infura.io:5001"
  ipfsApiUrl: "http://localhost:5001",

  // Demo Mode - Set to true if you don't have IPFS running locally
  // In demo mode, files get fake CIDs and aren't actually stored on IPFS
  // This is useful for testing the blockchain functionality without IPFS
  useDemoMode: false,

  // Application Settings
  // -------------------------------------------------
  // Maximum file size in bytes (default: 10MB)
  maxFileSize: 10 * 1024 * 1024,
  
  // Supported file types (empty array = all types allowed)
  allowedFileTypes: [],
};

export default config;
