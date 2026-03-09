# Chain-Cred Visual Architecture Summary

## 1) System Context

```
┌──────────────────┐                         ┌──────────────────┐
│   General User   │                         │    Valuator      │
└────────┬─────────┘                         └─────────┬────────┘
         │  upload & manage files                      │  view-only access
         └─────────────────────┬───────────────────────┘
                               │
                               ▼
              ┌──────────────────────────────────────┐
              │          React Web App               │
              │           (Frontend)                 │
              └────┬──────────┬──────────┬───────────┘
                   │          │          │          │
         sign txns │   RPC    │  upload  │  auth &  │
                   │  calls   │  /fetch  │  profile │
                   ▼          ▼          ▼          ▼
            ┌──────────┐ ┌─────────┐ ┌────────┐ ┌───────────────┐
            │ MetaMask │ │ Ganache │ │ IPFS   │ │   Firebase    │
            │  Wallet  │ │  :7545  │ │  API   │ │ Auth+Firestore│
            └──────────┘ └────┬────┘ │  /     │ └───────────────┘
                              │      │Gateways│
                              │      └────────┘
                              ▼
                     ┌─────────────────┐
                     │  FileRegistry   │
                     │    Contract     │
                     │   (Solidity)    │
                     └─────────────────┘
```

classDef user fill:#dbeafe,stroke:#2563eb,color:#1e3a8a,font-weight:bold
classDef app fill:#ede9fe,stroke:#7c3aed,color:#3b0764,font-weight:bold
classDef wallet fill:#fef3c7,stroke:#d97706,color:#78350f,font-weight:bold
classDef blockchain fill:#fed7aa,stroke:#ea580c,color:#7c2d12,font-weight:bold
classDef ipfs fill:#d1fae5,stroke:#059669,color:#064e3b,font-weight:bold
classDef firebase fill:#fce7f3,stroke:#db2777,color:#831843,font-weight:bold

User(["👤 General User"]):::user
Valuator(["🔍 Valuator"]):::user
Browser(["⚛️ React Web App"]):::app
MM(["🦊 MetaMask"]):::wallet
Ganache(["⛓️ Ganache\nEthereum Node"]):::blockchain
Contract(["📜 FileRegistry\nSmart Contract"]):::blockchain
IPFS(["📦 IPFS\nAPI / Gateway"]):::ipfs
FirebaseAuth(["🔐 Firebase Auth"]):::firebase
Firestore(["🗄️ Firestore\nvaluators collection"]):::firebase

User -->|upload & manage files| Browser
Valuator -->|view-only access| Browser
Browser <-->|sign transactions| MM
Browser -->|upload & fetch files| IPFS
Browser -->|read & write metadata| Ganache
Ganache -->|executes| Contract
Browser -->|authenticate| FirebaseAuth
Browser -->|store & fetch profile| Firestore
Browser -->|read metadata| Contract

````

## 2) Container Architecture

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#f8fafc', 'lineColor': '#94a3b8'}}}%%
flowchart TB
  classDef page fill:#ede9fe,stroke:#7c3aed,color:#3b0764,font-weight:600
  classDef component fill:#dbeafe,stroke:#2563eb,color:#1e3a8a,font-weight:600
  classDef service fill:#d1fae5,stroke:#059669,color:#064e3b,font-weight:600
  classDef config fill:#f1f5f9,stroke:#64748b,color:#1e293b
  classDef chain fill:#fed7aa,stroke:#ea580c,color:#7c2d12,font-weight:600
  classDef firebase fill:#fce7f3,stroke:#db2777,color:#831843,font-weight:600
  classDef storage fill:#ecfdf5,stroke:#16a34a,color:#14532d,font-weight:600

  subgraph Client["🌐 Client – Browser"]
    App["🧭 App Router"]:::page
    Login["🔑 Login Page"]:::page
    UserDash["📋 User Dashboard"]:::page
    ValDash["🔍 Valuator Dashboard"]:::page
    Skills["📊 Skills Dashboard"]:::page
    Upload["📤 UploadFile"]:::component
    Files["📁 FileList"]:::component
    Download["⬇️ DownloadFile"]:::component
    Delete["🗑️ DeleteFile"]:::component
  end

  subgraph FrontendServices["⚙️ Frontend Services"]
    WalletAuth["🔐 walletAuth.js"]:::service
    ValAuth["🔐 valuatorAuth.js"]:::service
    Web3["🌐 web3.js"]:::service
    ContractSvc["📜 contract.js"]:::service
    IpfsClient["📦 ipfsClient.js"]:::service
    AppConfig["⚙️ appConfig.js"]:::config
    FirebaseCfg["🔥 firebase.js"]:::config
  end

  subgraph Chain["⛓️ Blockchain"]
    GanacheNode["🔷 Ganache :7545"]:::chain
    FileRegistry[("📜 FileRegistry.sol")]:::chain
  end

  subgraph Firebase["🔥 Firebase"]
    Auth["🔐 Firebase Auth"]:::firebase
    DB[("🗄️ Firestore")]:::firebase
  end

  subgraph Storage["📦 File Storage"]
    IPFSApi["🔵 IPFS API :5001"]:::storage
    Gateways["🌍 Public / Local Gateways"]:::storage
  end

  App --> Login & UserDash & ValDash & Skills
  UserDash --> Upload & Files
  ValDash --> Files
  Files --> Download & Delete

  Login --> WalletAuth & ValAuth
  WalletAuth --> Web3 & ContractSvc
  ValAuth --> Auth & DB

  Upload --> IpfsClient & ContractSvc
  Download --> IpfsClient
  Delete --> ContractSvc
  Files --> ContractSvc

  ContractSvc --> GanacheNode --> FileRegistry
  IpfsClient --> IPFSApi & Gateways
````

## 3) Route Map

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#f8fafc', 'lineColor': '#64748b'}}}%%
flowchart LR
  classDef public fill:#fef9c3,stroke:#ca8a04,color:#713f12,font-weight:bold
  classDef protected fill:#dbeafe,stroke:#2563eb,color:#1e3a8a,font-weight:bold
  classDef valuator fill:#fce7f3,stroke:#db2777,color:#831843,font-weight:bold
  classDef catch fill:#f1f5f9,stroke:#94a3b8,color:#475569

  Root(["🏠 /"]):::public --> Login
  Login(["🔑 Login Page"]):::public
  Login -->|"✅ MetaMask success"| User
  Login -->|"✅ Valuator login / signup"| Val
  User(["📋 /dashboard\nUser Dashboard"]):::protected --> Skills
  Skills(["📊 /skills\nSkills Dashboard"]):::protected --> User
  User -->|"🚪 logout"| Login
  Val(["🔍 /valuator\nValuator Dashboard"]):::valuator -->|"🚪 logout"| Login
  Any(["❓ * wildcard"]):::catch -->|"↩ fallback"| Login
```

## 4) Smart Contract Data Model

```mermaid
classDiagram
  note for FileRegistry "Deployed on Ganache\nAll mutations guarded by onlyOwner(userId)"
  note for File "Stored fully on-chain\ncid is a pointer to IPFS content"

  class FileRegistry {
    +mapping~address-string~ userIds
    -mapping~string-File[]~ userFiles
    -mapping~string-address~ userIdToWallet
    +registerUser(userId) void
    +uploadFile(userId, cid, name) void
    +getFiles(userId) File[]
    +getFileCount(userId) uint256
    +deleteFile(userId, index) void
    +getUserId(wallet) string
    +getWalletByUserId(userId) address
    +isUserIdAvailable(userId) bool
    +isWalletRegistered(wallet) bool
  }

  class File {
    +string cid
    +string name
    +uint256 timestamp
  }

  FileRegistry "1" --> "0..*" File : userFiles[userId]
```

## 5) Core Sequence Flows

### 5.1 General User Login (Wallet)

```mermaid
sequenceDiagram
  actor U as 👤 User
  participant UI as 🔑 Login Page
  participant WA as walletAuth.js
  participant W3 as web3.js
  participant MM as 🦊 MetaMask
  participant C as contract.js
  participant FR as ⛓️ FileRegistry

  Note over U,MM: Phase 1 – Wallet Connection
  U->>UI: Click "Connect with MetaMask"
  UI->>WA: loginWithWallet(autoRegister=true)
  WA->>W3: isCorrectNetwork()
  alt wrong network
    W3->>MM: wallet_switchEthereumChain
    MM-->>W3: switched to chainId 1337
  end
  WA->>W3: connectWallet()
  W3->>MM: eth_requestAccounts
  MM-->>W3: 0xWalletAddress

  Note over WA,FR: Phase 2 – Identity Resolution
  WA->>C: getUserId(walletAddress)
  C->>FR: getUserId(wallet) [view — no gas]
  FR-->>C: userId or ""
  alt not yet registered
    WA->>C: registerUser("user_" + addr.slice(2,10))
    C->>FR: registerUser(userId)
    FR-->>C: tx receipt + UserRegistered event
  end
  WA-->>UI: { isAuthenticated, walletAddress, userId }
  UI-->>U: navigate → /dashboard
```

### 5.2 Upload Flow

```mermaid
sequenceDiagram
  actor U as 👤 User
  participant UI as 📤 UploadFile
  participant IPFS as 📦 ipfsClient
  participant C as contract.js
  participant FR as ⛓️ FileRegistry

  Note over U,FR: Two-phase upload — IPFS first, then blockchain metadata
  U->>UI: Select file + click Upload
  UI->>UI: Validate size < 10 MB & allowed type
  UI->>IPFS: uploadToIpfs(file)
  Note right of IPFS: Converts file to ArrayBuffer\nPOSTs to IPFS API :5001
  IPFS-->>UI: CID (e.g. QmXgZAUWd3S6...)
  UI->>C: uploadFileMetadata(userId, cid, fileName)
  C->>FR: uploadFile(userId, cid, fileName)
  Note right of FR: Stores { cid, name, timestamp }\nin userFiles[userId][]
  FR-->>C: tx receipt + FileUploaded event
  C-->>UI: success
  UI-->>U: ✅ File appears in FileList
```

### 5.3 Download Flow

```mermaid
sequenceDiagram
  actor U as 👤 User / 🔍 Valuator
  participant L as 📁 FileList
  participant D as ⬇️ DownloadFile
  participant C as contract.js
  participant FR as ⛓️ FileRegistry
  participant IPFS as 📦 ipfsClient

  Note over U,FR: Phase 1 – Fetch metadata from chain (view call, no gas)
  U->>L: Open file list
  L->>C: getFiles(userId)
  C->>FR: getFiles(userId) [view]
  FR-->>C: File[] [{ cid, name, timestamp }]
  C-->>L: [{ index, cid, name, uploadDate }]
  L-->>U: Renders file table

  Note over D,IPFS: Phase 2 – Retrieve bytes via gateway fallback
  U->>D: Click Download
  D->>IPFS: downloadFromIpfs(cid, fileName)
  loop Try each gateway: ipfs.io → pinata → cloudflare → dweb.link → ...
    IPFS-->>D: 200 OK or timeout / error → try next
  end
  D-->>U: 💾 file blob saved to disk
```

### 5.4 Delete Flow (General User only)

```mermaid
sequenceDiagram
  actor U as 👤 User
  participant Del as 🗑️ DeleteFile
  participant C as contract.js
  participant FR as ⛓️ FileRegistry
  participant L as 📁 FileList

  U->>Del: Click Delete
  Del-->>U: ⚠️ "Delete 'filename'?"
  Note right of Del: Confirmation required\nNo undo after this point
  U->>Del: Click Yes
  Del->>C: deleteFile(userId, fileIndex)
  C->>FR: deleteFile(userId, index)
  Note right of FR: swap-and-pop:\nfiles[index] = files[last]\nfiles.pop() — order may change
  FR-->>C: emit FileDeleted + tx receipt
  C-->>Del: success
  Del->>L: onDeleteComplete()
  L->>C: getFiles(userId)
  C-->>L: updated File[] (length - 1)
  L-->>U: 🔄 Table refreshed
```

### 5.5 Valuator Auth Flow

```mermaid
sequenceDiagram
  actor V as 🔍 Valuator
  participant UI as 🔑 Login Page
  participant VA as valuatorAuth.js
  participant FA as 🔐 Firebase Auth
  participant FS as 🗄️ Firestore

  Note over V,FS: Off-chain auth — Firebase only, no gas cost
  V->>UI: Enter email + password
  UI->>VA: loginAsValuator(email, pwd)\nor signupValuator({email, pwd, name, company})
  VA->>FA: signInWithEmailAndPassword\nor createUserWithEmailAndPassword
  FA-->>VA: userCredential { uid, email }
  alt Sign Up (new account)
    VA->>FS: setDoc(valuators/{uid}, { email, name, companyName, role:'valuator' })
    FS-->>VA: write confirmed
  else Login (existing account)
    VA->>FS: getDoc(valuators/{uid})
    FS-->>VA: { name, companyName }
  end
  VA-->>UI: { isAuthenticated, uid, email, name, companyName }
  VA->>UI: sessionStorage.setItem('valuatorAuth', ...)
  UI-->>V: navigate → /valuator
```

## 6) Trust Boundaries and Responsibilities

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#f8fafc', 'lineColor': '#64748b'}}}%%
flowchart LR
  classDef client fill:#ede9fe,stroke:#7c3aed,color:#3b0764,font-weight:600
  classDef wallet fill:#fef3c7,stroke:#d97706,color:#78350f,font-weight:600
  classDef chain fill:#fed7aa,stroke:#ea580c,color:#7c2d12,font-weight:600
  classDef external fill:#d1fae5,stroke:#059669,color:#064e3b,font-weight:600

  subgraph TrustedClient["💻 Client Runtime"]
    UI["⚛️ React UI"]:::client
    Session["💾 sessionStorage\nauth flags & state"]:::client
  end

  subgraph WalletBoundary["🦊 Wallet Boundary"]
    MM["🦊 MetaMask\nSigns all transactions"]:::wallet
  end

  subgraph ChainBoundary["⛓️ Blockchain Boundary\n(onlyOwner enforced on-chain)"]
    G["🔷 Ganache node"]:::chain
    FR["📜 FileRegistry contract"]:::chain
  end

  subgraph ExternalServices["☁️ External Services"]
    IPFS["📦 IPFS API / Gateways\nFile bytes only"]:::external
    FB["🔥 Firebase Auth / Firestore\nValuator identity only"]:::external
  end

  UI --> Session
  UI <-->|sign txns| MM
  UI -->|JSON-RPC calls| G
  G -->|executes mutations| FR
  UI -->|upload / download bytes| IPFS
  UI -->|auth & profile| FB
```

- Wallet ownership authorization for file mutation is enforced on-chain by `onlyOwner(userId)`.
- Actual file bytes are not on-chain; only metadata (`cid`, `name`, `timestamp`) is stored in contract state.
- Valuator identity and profile are off-chain (Firebase Auth + Firestore).

## 7) Configuration Matrix

| Area               | Source                              | Key Values                                                   |
| ------------------ | ----------------------------------- | ------------------------------------------------------------ |
| Contract + network | `src/config/appConfig.js`           | `contractAddress`, `rpcUrl`, `chainId`                       |
| IPFS behavior      | `src/config/appConfig.js`           | `ipfsGateway`, `ipfsApiUrl`, `useDemoMode`, size/type limits |
| Firebase           | `src/config/firebase.js` + env vars | `REACT_APP_FIREBASE_*`                                       |
| Truffle deployment | `truffle-config.js`                 | `development` host/port/network_id, `solc` version           |
| Firestore security | `firestore.rules`                   | valuator document access constrained to authenticated uid    |

## 8) Deployment View (Development)

```mermaid
%%{init: {'theme': 'base', 'themeVariables': {'primaryColor': '#f8fafc', 'lineColor': '#64748b'}}}%%
flowchart TB
  classDef dev fill:#f1f5f9,stroke:#64748b,color:#1e293b,font-weight:bold
  classDef browser fill:#ede9fe,stroke:#7c3aed,color:#3b0764,font-weight:600
  classDef chain fill:#fed7aa,stroke:#ea580c,color:#7c2d12,font-weight:600
  classDef ipfs fill:#d1fae5,stroke:#059669,color:#064e3b,font-weight:600
  classDef firebase fill:#fce7f3,stroke:#db2777,color:#831843,font-weight:600

  Dev(["💻 Developer Machine"]):::dev

  subgraph BrowserEnv["🌐 Browser"]
    ReactApp["⚛️ React App\n:3000 — npm start"]:::browser
    MetaMaskExt["🦊 MetaMask Extension"]:::browser
  end

  subgraph LocalChain["⛓️ Local Blockchain"]
    Ganache7545["🔷 Ganache RPC :7545"]:::chain
    ContractAddr["📜 Deployed FileRegistry\n0x540637FF..."]:::chain
  end

  subgraph StorageEnv["📦 IPFS Storage"]
    LocalIPFS["🔵 Local IPFS API :5001\n(optional)"]:::ipfs
    PublicGateway["🌍 ipfs.io / pinata / cloudflare\nfallback gateways"]:::ipfs
  end

  subgraph CloudEnv["🔥 Firebase (asia-south1)"]
    FBAuth["🔐 Firebase Auth"]:::firebase
    FSStore[("🗄️ Firestore\nvaluators collection")]:::firebase
    FBAnalytics["📊 Firebase Analytics"]:::firebase
  end

  Dev --> ReactApp
  ReactApp <-->|sign transactions| MetaMaskExt
  ReactApp -->|JSON-RPC| Ganache7545
  Ganache7545 -->|hosts| ContractAddr
  ReactApp -->|upload| LocalIPFS
  ReactApp -->|download fallback| PublicGateway
  ReactApp -->|authenticate| FBAuth
  ReactApp -->|read/write profiles| FSStore
  ReactApp -->|usage events| FBAnalytics
```

## 9) Notes and Constraints

- Smart contract storage is append/remove metadata only; no file versioning or ACL beyond wallet-owner mapping.
- `deleteFile` uses swap-and-pop, so file order can change after deletions.
- IPFS downloads use gateway fallback strategy and timeout handling.
- If running Node 22 with Truffle/Ganache, µWS binary warnings can appear; functionality generally continues with JS fallback.

---

This document reflects the current implementation in the repository and can be used as a handoff reference for onboarding, reviews, and future refactoring.
