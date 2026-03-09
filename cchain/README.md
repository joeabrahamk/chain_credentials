# CChain - Decentralized File Storage & Skill Audit DApp

> Part of the **[Chain Credentials](https://github.com/joeabrahamk/chain_credentials)** platform — combining decentralized storage with evidence-based skill verification.

A blockchain-based file storage application built with React, Ethereum (Ganache), and IPFS — extended with a **Skill Audit** feature that analyses resume files directly from IPFS storage.

---

## 📖 Table of Contents

1. [What is CChain?](#what-is-cchain)
2. [How It Works](#how-it-works)
3. [Architecture Overview](#architecture-overview)
4. [Skill Audit Feature](#skill-audit-feature)
5. [Prerequisites](#prerequisites)
6. [Installation Guide](#installation-guide)
7. [Project Structure](#project-structure)
8. [Smart Contract](#smart-contract)
9. [Configuration](#configuration)
10. [User Guide](#user-guide)
11. [Troubleshooting](#troubleshooting)
12. [FAQ](#faq)

---

## 🎯 What is CChain?

CChain is a **decentralized file storage system** that allows users to:

- **Upload files** to IPFS (InterPlanetary File System)
- **Store file metadata** on a local Ethereum blockchain
- **Manage their files** (list, download, delete) through a simple web interface

### Why is it special?

- **No traditional backend server** - The React app talks directly to the blockchain and IPFS
- **Your files, your control** - Only you can manage your files (authenticated via your wallet)
- **Transparent and traceable** - All file metadata is stored on the blockchain

### Who can use it?

| User Type        | Authentication    | Can Do                                                            |
| ---------------- | ----------------- | ----------------------------------------------------------------- |
| **General User** | MetaMask Wallet   | Upload, list, download, delete their own files + **Audit Skills** |
| **Valuator**     | Username/Password | View any user's files (read-only)                                 |

---

## 🔄 How It Works

### The Three-Layer Architecture

Think of CChain as three simple layers that work together:

```
┌─────────────────────────────────────────────────────────────┐
│                      FRONTEND (React)                        │
│         What you see and interact with in your browser       │
└─────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────┐
│   BLOCKCHAIN (Ganache)  │     │      STORAGE (IPFS)         │
│   Stores WHO owns WHAT  │     │   Stores ACTUAL FILES       │
│   (metadata only)       │     │   (raw file bytes)          │
└─────────────────────────┘     └─────────────────────────────┘
```

### What Goes Where?

| Storage Location | What's Stored                               | Why?                                     |
| ---------------- | ------------------------------------------- | ---------------------------------------- |
| **IPFS**         | Actual file content (bytes)                 | Decentralized, content-addressed storage |
| **Blockchain**   | File metadata (CID, name, timestamp, owner) | Immutable record of ownership            |

### The Upload Flow (Step by Step)

```
1. User selects a file in the React app
                    │
                    ▼
2. File is uploaded to IPFS
   └── IPFS returns a CID (Content Identifier)
       Example: "QmXgZAUWd3S6ZsMqY5zGw9WJ5Dt7qbMV..."
                    │
                    ▼
3. Metadata is stored on blockchain via Smart Contract
   └── Stores: CID, filename, timestamp, owner wallet
                    │
                    ▼
4. Done! File is now decentralized and tracked
```

### The Download Flow

```
1. User clicks "Download" on a file
                    │
                    ▼
2. React reads file metadata from blockchain
   └── Gets the CID for that file
                    │
                    ▼
3. React fetches actual file from IPFS using CID
                    │
                    ▼
4. File downloads to user's computer
```

---

## � Skill Audit Feature

> **Requires the `res_main` analysis backend running on port 8000.**  
> See the [Chain Credentials root README](../README.md) for setup instructions.

### What It Does

Each file in your **My Files** list has an **Audit** button alongside Download and Delete. Clicking it:

1. Fetches the file directly from IPFS by its CID
2. Sends it to the `res_main` FastAPI backend (`POST /evaluate`)
3. The backend parses the resume, finds GitHub URLs in it, clones those repos, and scores each listed technology
4. Redirects you to the **Skills Dashboard** with live per-stack results

```
My Files table
┌───┬──────────────────┬─────────────┬─────────────────────────────────┐
│ # │ File Name        │ Upload Date │ Actions                         │
├───┼──────────────────┼─────────────┼─────────────────────────────────┤
│ 1 │ resume.pdf       │ 2026-03-08  │ [Download]  [Audit]  [Delete]   │
│ 2 │ portfolio.pdf    │ 2026-03-07  │ [Download]  [Audit]  [Delete]   │
└───┴──────────────────┴─────────────┴─────────────────────────────────┘
```

### Skills Dashboard

After an audit, the Skills Dashboard shows:

- **Overall Score** and **Confidence** rating
- Per-technology proficiency (score 0–100, level label)
- **Gaps** flagged per stack (e.g. "No test files found")
- **Recommendations** for improvement
- AI Audit summary (if Ollama is running)

### Resume Format for Best Results

The resume parser looks for:

- **Tech keywords**: `React`, `Python`, `Node.js`, `PostgreSQL`, `Docker`, etc.
- **GitHub URLs**: full `https://github.com/username/repo` links in the document

A plain `.txt` or single-column `.pdf` works best. See [Chain Credentials README](../README.md#how-the-two-systems-connect) for the full keyword list.

### Relevant Files

| File                            | Purpose                                                                |
| ------------------------------- | ---------------------------------------------------------------------- |
| `src/components/AuditFile.jsx`  | Fetches file from IPFS → POSTs to `/evaluate` → navigates to Skills    |
| `src/components/FileList.jsx`   | Renders the file table with Audit button per row                       |
| `src/pages/SkillsDashboard.jsx` | Visualizes live scores from router state or localStorage               |
| `src/pages/Login.jsx`           | Captures GitHub username (required, stored in localStorage per wallet) |

---

## �🏗️ Architecture Overview

### System Diagram

```
┌──────────────┐         ┌──────────────┐
│ General User │         │   Valuator   │
└──────┬───────┘         └──────┬───────┘
       │                        │
       │ Connect Wallet         │ Username/Password
       ▼                        ▼
┌──────────────┐         ┌──────────────┐
│   MetaMask   │         │  Local Auth  │
└──────┬───────┘         └──────┬───────┘
       │                        │
       └────────────┬───────────┘
                    ▼
           ┌────────────────┐
           │   React App    │
           │  (Frontend)    │
           └───────┬────────┘
                   │
       ┌───────────┼───────────┐
       ▼           ▼           ▼
┌──────────┐ ┌──────────┐ ┌──────────┐
│   IPFS   │ │  Smart   │ │  Ganache │
│ Gateway  │ │ Contract │ │  (Local  │
│          │ │          │ │  Chain)  │
└──────────┘ └──────────┘ └──────────┘
```

### Technology Stack

| Layer          | Technology | Purpose                                   |
| -------------- | ---------- | ----------------------------------------- |
| Frontend       | React.js   | User interface                            |
| Wallet         | MetaMask   | User authentication & transaction signing |
| Blockchain     | Ganache    | Local Ethereum blockchain for development |
| Smart Contract | Solidity   | File registry logic                       |
| File Storage   | IPFS       | Decentralized file storage                |

---

## 📋 Prerequisites

Before you begin, make sure you have these installed:

### 1. Node.js (v16 or higher)

**What is it?** JavaScript runtime that lets you run JavaScript outside the browser.

**How to install:**

- Download from [nodejs.org](https://nodejs.org/)
- Choose the LTS (Long Term Support) version
- Run the installer

**Verify installation:**

```bash
node --version
# Should show v16.x.x or higher

npm --version
# Should show 8.x.x or higher
```

### 2. Ganache

**What is it?** A personal Ethereum blockchain for development. Think of it as your own private blockchain running on your computer.

**How to install:**

- Download from [trufflesuite.com/ganache](https://trufflesuite.com/ganache/)
- Run the installer
- Launch Ganache

**What you'll see:**

- A list of 10 pre-funded accounts (each with 100 ETH)
- Each account has an address (starts with `0x`) and a private key

### 3. MetaMask Browser Extension

**What is it?** A crypto wallet that lives in your browser. It lets you interact with blockchain applications.

**How to install:**

1. Go to [metamask.io](https://metamask.io/)
2. Click "Download"
3. Add the extension to your browser (Chrome, Firefox, etc.)
4. Create a new wallet OR import an existing one
5. **Important:** Save your recovery phrase somewhere safe!

### 4. IPFS (Choose one option)

**Option A: Use a Public Gateway (Easiest)**

- No installation needed
- Use `https://ipfs.io` as your gateway

**Option B: Install IPFS Desktop**

- Download from [docs.ipfs.tech/install/ipfs-desktop](https://docs.ipfs.tech/install/ipfs-desktop/)
- More control, works offline

---

## 🚀 Installation Guide

### Step 1: Clone the Repository

```bash
git clone https://github.com/yourusername/cchain.git
cd cchain
```

### Step 2: Install Dependencies

```bash
npm install
```

This installs all the packages listed in `package.json`.

### Step 3: Start Ganache

1. Open Ganache application
2. Click "Quickstart" (Ethereum)
3. You'll see a screen with:
   - RPC Server: `HTTP://127.0.0.1:7545`
   - Network ID: Usually `5777`
   - 10 accounts with 100 ETH each

**Keep Ganache running!** The blockchain only exists while Ganache is open.

### Step 4: Deploy the Smart Contract

```bash
# If using Truffle
truffle migrate --network development

# If using Hardhat
npx hardhat run scripts/deploy.js --network localhost
```

**After deployment, note down the contract address!** You'll need it for configuration.

### Step 5: Configure MetaMask

#### Add Ganache Network to MetaMask:

1. Open MetaMask
2. Click the network dropdown (usually says "Ethereum Mainnet")
3. Click "Add Network" → "Add a network manually"
4. Enter these details:

| Field           | Value                         |
| --------------- | ----------------------------- |
| Network Name    | Ganache Local                 |
| New RPC URL     | http://127.0.0.1:7545         |
| Chain ID        | 1337 (or 5777, check Ganache) |
| Currency Symbol | ETH                           |

5. Click "Save"

#### Import a Ganache Account:

1. In Ganache, click the key icon 🔑 next to any account
2. Copy the private key
3. In MetaMask, click your account icon → "Import Account"
4. Paste the private key
5. Click "Import"

Now you have a test account with 100 ETH! 🎉

### Step 6: Update Configuration

Edit `src/config/appConfig.js`:

```javascript
export const config = {
  // Paste your deployed contract address here
  contractAddress: "0x...",

  // IPFS gateway URL
  ipfsGateway: "https://ipfs.io/ipfs/",

  // Must match your Ganache network
  chainId: 1337,

  // Ganache RPC URL
  rpcUrl: "http://127.0.0.1:7545",
};
```

### Step 7: Start the Application

```bash
npm start
```

The app will open at `http://localhost:3000` 🚀

---

## 📁 Project Structure

```
src/
├── abi/
│   └── FileRegistry.json      # Smart contract ABI (interface)
│
├── blockchain/
│   ├── contract.js            # Smart contract interaction functions
│   └── web3.js                # Web3 provider setup
│
├── ipfs/
│   └── ipfsClient.js          # IPFS upload/download/fetch functions
│
├── auth/
│   ├── walletAuth.js          # MetaMask connection logic
│   └── valuatorAuth.js        # Valuator login logic
│
├── components/
│   ├── UploadFile.jsx         # File upload component
│   ├── FileList.jsx           # File table with Download/Audit/Delete per row
│   ├── AuditFile.jsx          # ← NEW: Fetches from IPFS → skill audit API
│   ├── DownloadFile.jsx       # File download component
│   └── DeleteFile.jsx         # File deletion component
│
├── pages/
│   ├── Login.jsx              # Wallet login + GitHub username (required)
│   ├── UserDashboard.jsx      # Main page for general users
│   ├── SkillsDashboard.jsx    # ← NEW: Live skill score visualization
│   └── ValuatorDashboard.jsx  # Read-only view for valuators
│
├── config/
│   ├── valuators.json         # Valuator credentials
│   └── appConfig.js           # App configuration
│
└── App.jsx                    # Main app component with routing
```

### What Each Folder Does

| Folder        | Purpose                                                                                      |
| ------------- | -------------------------------------------------------------------------------------------- |
| `abi/`        | Contains the smart contract ABI - a JSON file that tells the app how to talk to the contract |
| `blockchain/` | All blockchain-related code (connecting, reading, writing)                                   |
| `ipfs/`       | IPFS upload and download functions                                                           |
| `auth/`       | Authentication logic for both user types                                                     |
| `components/` | Reusable UI components                                                                       |
| `pages/`      | Full pages that combine multiple components                                                  |
| `config/`     | Configuration files (easy to edit without touching code)                                     |

---

## 📜 Smart Contract

### Overview

The smart contract is the "brain" that lives on the blockchain. It:

- Keeps track of which user owns which files
- Stores file metadata (not the actual files!)
- Enforces rules (only owners can delete their files)

### Contract Structure

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract FileRegistry {

    // A file's metadata
    struct File {
        string cid;           // IPFS Content Identifier
        string name;          // Original filename
        uint256 timestamp;    // When it was uploaded
    }

    // Maps wallet address to user ID
    mapping(address => string) public userIds;

    // Maps user ID to their files
    mapping(string => File[]) private userFiles;

    // Register a new user
    function registerUser(string memory userId) public {
        userIds[msg.sender] = userId;
    }

    // Upload file metadata
    function uploadFile(
        string memory userId,
        string memory cid,
        string memory name
    ) public {
        // Only the owner can upload
        require(
            keccak256(bytes(userIds[msg.sender])) == keccak256(bytes(userId)),
            "Not authorized"
        );

        userFiles[userId].push(File(cid, name, block.timestamp));
    }

    // Get all files for a user (anyone can read)
    function getFiles(string memory userId)
        public
        view
        returns (File[] memory)
    {
        return userFiles[userId];
    }

    // Delete a file
    function deleteFile(string memory userId, uint256 index) public {
        // Only the owner can delete
        require(
            keccak256(bytes(userIds[msg.sender])) == keccak256(bytes(userId)),
            "Not authorized"
        );

        // Remove file from array
        File[] storage files = userFiles[userId];
        require(index < files.length, "Invalid index");

        files[index] = files[files.length - 1];
        files.pop();
    }
}
```

### Key Concepts Explained

**`mapping`**: Think of it as a dictionary/hash table. Given a key, it returns a value.

```
mapping(address => string) means: wallet address → user ID
```

**`msg.sender`**: The wallet address that called this function. This is how we know WHO is calling.

**`require`**: A security check. If the condition is false, the transaction fails.

**`view`**: This function only reads data, doesn't modify anything. No gas cost when called directly.

---

## ⚙️ Configuration

### Application Config (`src/config/appConfig.js`)

```javascript
export const config = {
  // The address where your smart contract is deployed
  // You get this after running 'truffle migrate' or 'hardhat deploy'
  contractAddress: "0x1234567890123456789012345678901234567890",

  // IPFS gateway for fetching files
  // Public gateway (no setup needed):
  ipfsGateway: "https://ipfs.io/ipfs/",
  // OR local IPFS node:
  // ipfsGateway: "http://localhost:8080/ipfs/",

  // Ganache chain ID (check your Ganache settings)
  chainId: 1337,

  // Ganache RPC URL
  rpcUrl: "http://127.0.0.1:7545",
};
```

### Valuator Credentials (`src/config/valuators.json`)

```json
{
  "valuators": [
    {
      "username": "valuator1",
      "password": "password123"
    },
    {
      "username": "auditor",
      "password": "securepass456"
    }
  ]
}
```

> ⚠️ **Note:** This is intentionally simple for a prototype. In production, never store passwords in plain text!

---

## 👤 User Guide

### For General Users

#### Connecting Your Wallet

1. Click "Connect Wallet" on the login page
2. MetaMask will pop up asking for permission
3. Click "Connect" in MetaMask
4. You're now logged in! Your wallet address is your identity.

#### Uploading a File

1. Click "Upload File" button
2. Select a file from your computer
3. Click "Upload"
4. Wait for two things to happen:
   - File uploads to IPFS (you'll see "Uploading...")
   - Metadata saves to blockchain (MetaMask will ask you to confirm)
5. Done! Your file appears in the list.

#### Downloading a File

1. Find the file in your list
2. Click the "Download" button
3. File downloads to your computer

#### Deleting a File

1. Find the file in your list
2. Click "Delete"
3. Confirm in MetaMask
4. File metadata is removed from blockchain

> **Note:** Deleting removes the blockchain record, but the file may still exist on IPFS (that's how IPFS works - it's content-addressed).

### For Valuators

#### Logging In

1. Go to the Valuator login page
2. Enter your username and password
3. Click "Login"

#### Viewing User Files

1. Enter a User ID in the search box
2. Click "Search"
3. All files for that user are displayed
4. You can view/download but NOT upload or delete

---

## 🔧 Troubleshooting

### Common Issues and Solutions

#### "MetaMask is not installed"

**Problem:** The app can't detect MetaMask.

**Solution:**

1. Make sure MetaMask extension is installed
2. Refresh the page
3. Make sure MetaMask is not disabled in your browser

#### "Wrong network" Error

**Problem:** MetaMask is connected to the wrong blockchain.

**Solution:**

1. Open MetaMask
2. Click the network dropdown
3. Select "Ganache Local" (or whatever you named it)
4. Refresh the app

#### "Transaction failed" / "Gas estimation failed"

**Problem:** The smart contract rejected the transaction.

**Possible causes:**

- You're not the owner of that file
- The contract address is wrong
- Ganache was restarted (contract no longer exists)

**Solution:**

1. Check `appConfig.js` has correct contract address
2. Redeploy contract if Ganache was restarted
3. Update contract address in config

#### "IPFS upload failed"

**Problem:** Can't connect to IPFS.

**Solution:**

1. Check your internet connection
2. Try a different IPFS gateway in config
3. If using local IPFS, make sure it's running

#### "Account has 0 ETH"

**Problem:** Can't send transactions because no gas.

**Solution:**

1. Open Ganache
2. Copy a private key from an account with ETH
3. Import it into MetaMask
4. Switch to that account

### Ganache Was Restarted - Now What?

When you restart Ganache:

- All blockchain data is **erased**
- Your contract **no longer exists**
- You need to **redeploy**

**Steps to recover:**

1. Redeploy your contract: `truffle migrate --reset`
2. Copy the new contract address
3. Update `src/config/appConfig.js`
4. Re-import a Ganache account to MetaMask (if needed)

---

## ❓ FAQ

### General Questions

**Q: Is this production-ready?**

A: No! This is a learning/prototype project. For production, you'd need proper security, a real blockchain network, and enterprise-grade authentication.

**Q: Why Ganache instead of a real blockchain?**

A: Ganache is free, fast, and perfect for learning. No real money, no waiting for transactions, easy to reset.

**Q: Where are my files actually stored?**

A: The actual file bytes are on IPFS. Only the metadata (filename, CID, timestamp, owner) is on the blockchain.

**Q: Why not encrypt the files?**

A: To keep things simple! This is a learning project. Encryption would add complexity that distracts from the core concepts.

### Technical Questions

**Q: What is a CID?**

A: Content Identifier. It's like a fingerprint for your file. The same file always produces the same CID. IPFS uses this to find and retrieve files.

**Q: Why do I need MetaMask?**

A: MetaMask holds your private key and signs transactions. This proves you own your wallet without revealing your private key.

**Q: What is gas?**

A: Gas is the fee you pay to execute operations on the blockchain. In Ganache, it's fake ETH, so don't worry about it!

**Q: Can I use this with a real blockchain?**

A: Yes! You'd need to:

1. Deploy to a testnet (Sepolia) or mainnet
2. Update the RPC URL and chain ID in config
3. Get real/test ETH for gas fees

---

## 🚀 Future Improvements

- [ ] Add file encryption before IPFS upload
- [ ] Deploy to Ethereum testnet (Sepolia)
- [ ] Add file sharing between users
- [ ] Implement proper authentication for valuators
- [ ] Add file versioning
- [ ] Create mobile-friendly UI
- [ ] Display skill audit history per file
- [ ] Allow valuators to view skill scores alongside files

---

## 📚 Learning Resources

### Blockchain & Ethereum

- [Ethereum.org Developers](https://ethereum.org/developers/)
- [CryptoZombies](https://cryptozombies.io/) - Learn Solidity by making a game

### IPFS

- [IPFS Docs](https://docs.ipfs.tech/)
- [ProtoSchool](https://proto.school/) - Interactive IPFS tutorials

### React

- [React Official Tutorial](https://react.dev/learn)
- [React with Web3](https://web3js.readthedocs.io/)

### Tools

- [Truffle Suite Docs](https://trufflesuite.com/docs/)
- [Hardhat Docs](https://hardhat.org/docs)
- [MetaMask Docs](https://docs.metamask.io/)

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

## 🤝 Contributing

Contributions are welcome! Feel free to:

- Report bugs
- Suggest features
- Submit pull requests

---

**Happy Building! 🎉**

_Remember: Everyone starts as a beginner. Don't be afraid to experiment and break things - that's how you learn!_
#   c h a i n _ c r e d - D a p p 
 
 
