# Chain-Cred - Quick Start Guide

This is a quick reference for getting Chain-Cred up and running.

## Prerequisites

1. **Node.js** (v16+) - [Download](https://nodejs.org/)
2. **Ganache** - [Download](https://trufflesuite.com/ganache/)
3. **MetaMask** - [Install](https://metamask.io/)
4. **Truffle** (for contract deployment) - `npm install -g truffle`

## Setup Steps

### 1. Install Dependencies

```bash
cd Chain-Cred
npm install
```

### 2. Start Ganache

- Open Ganache
- Click "Quickstart (Ethereum)"
- Note the RPC Server URL (usually `HTTP://127.0.0.1:7545`)

### 3. Deploy Smart Contract

```bash
truffle migrate --network development
```

After deployment, copy the contract address from the output.

### 4. Configure the App

Edit `src/config/appConfig.js`:

```javascript
contractAddress: "YOUR_DEPLOYED_CONTRACT_ADDRESS",
```

### 5. Setup MetaMask

1. Add Ganache network:

   - Network Name: `Ganache Local`
   - RPC URL: `http://127.0.0.1:7545`
   - Chain ID: `1337`
   - Currency: `ETH`

2. Import a Ganache account:
   - Copy private key from Ganache
   - MetaMask → Import Account → Paste key

### 6. Start the App

```bash
npm start
```

Open http://localhost:3000

## Test Credentials

**Valuator Login:**

- Username: `valuator1`
- Password: `password123`

OR

- Username: `admin`
- Password: `admin123`

## Troubleshooting

| Issue                 | Solution                               |
| --------------------- | -------------------------------------- |
| MetaMask not detected | Install MetaMask extension             |
| Wrong network         | Switch to Ganache Local in MetaMask    |
| Transaction failed    | Check contract address in config       |
| IPFS upload failed    | Start local IPFS or use public gateway |

## File Structure

```
src/
├── abi/            # Contract ABI
├── auth/           # Authentication modules
├── blockchain/     # Web3 & contract utilities
├── components/     # React components
├── config/         # Configuration files
├── ipfs/           # IPFS client
└── pages/          # Page components

contracts/          # Solidity contracts
migrations/         # Truffle migrations
```

---

For detailed documentation, see [README.md](README.md).
