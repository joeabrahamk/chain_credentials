/**
 * Truffle Configuration
 * 
 * This file configures Truffle for deploying the smart contract.
 */

module.exports = {
  // Configure networks
  networks: {
    // Ganache local development network
    development: {
      host: "127.0.0.1",
      port: 7545,           // Ganache default port
      network_id: "*",      // Match any network id
    },
    
    // Alternative Ganache CLI configuration
    ganache_cli: {
      host: "127.0.0.1",
      port: 8545,           // Ganache CLI default port
      network_id: "*",
    },
  },

  // Configure compilers
  compilers: {
    solc: {
      version: "0.8.19",    // Solidity version
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  },

  // Truffle DB is currently disabled by default
  db: {
    enabled: false
  }
};
