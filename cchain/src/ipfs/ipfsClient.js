/**
 * IPFS Client
 * 
 * This module handles all IPFS operations:
 * - Uploading files to IPFS
 * - Downloading files from IPFS
 * - Generating gateway URLs
 * 
 * NOTE: For local development without IPFS Desktop, 
 * set useDemoMode = true in config to use simulated CIDs.
 */

import config from '../config/appConfig';

// IPFS client instance
let ipfsClient = null;

// Fallback public IPFS gateways (tried in order if primary fails)
const FALLBACK_GATEWAYS = [
  'https://ipfs.io/ipfs',
  'https://gateway.pinata.cloud/ipfs',
  'https://cloudflare-ipfs.com/ipfs',
  'https://dweb.link/ipfs',
  'https://w3s.link/ipfs',
];

// Timeout for gateway requests (ms)
const GATEWAY_TIMEOUT = 15000;

/**
 * Fetch with timeout helper
 */
const fetchWithTimeout = async (url, timeout = GATEWAY_TIMEOUT) => {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    // Make aborts easier to understand
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
};

/**
 * Normalize and build the ordered gateway list
 */
const buildGatewayList = () => {
  const sanitize = (gateway) => gateway.replace(/\/+$/, '').replace(/\/ipfs\/?$/, '') + '/ipfs';

  const gateways = new Set();

  // Primary from config
  if (config.ipfsGateway) {
    gateways.add(sanitize(config.ipfsGateway));
  }

  // If using a local IPFS API, prefer the local gateway first
  try {
    const apiUrl = new URL(config.ipfsApiUrl || '');
    const host = apiUrl.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      gateways.add('http://127.0.0.1:8080/ipfs');
    }
  } catch (_) {
    // Ignore URL parse issues and proceed with defaults
  }

  // Public fallbacks
  FALLBACK_GATEWAYS.forEach((g) => gateways.add(sanitize(g)));

  return Array.from(gateways);
};

/**
 * Check if we should use demo mode (no real IPFS)
 */
const isDemoMode = () => {
  return config.useDemoMode === true;
};

/**
 * Generate a fake CID for demo mode
 * In real IPFS, CID is a hash of the content
 */
const generateDemoCid = (file) => {
  // Create a pseudo-random CID based on file properties
  const timestamp = Date.now();
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `Qm${randomPart}${timestamp.toString(36)}Demo`;
};

/**
 * Get or create the IPFS client
 * @returns {Object} The IPFS client instance
 */
export const getIpfsClient = async () => {
  if (isDemoMode()) {
    console.log('IPFS running in DEMO MODE - files are not actually stored');
    return null;
  }

  if (!ipfsClient) {
    try {
      // Dynamically import ipfs-http-client
      const { create } = await import('ipfs-http-client');
      
      // Parse the API URL to get host and port
      const url = new URL(config.ipfsApiUrl);
      ipfsClient = create({
        host: url.hostname,
        port: url.port || 5001,
        protocol: url.protocol.replace(':', '')
      });
    } catch (error) {
      console.error('Error creating IPFS client:', error);
      throw new Error(
        'Failed to connect to IPFS. Either:\n' +
        '1. Install and run IPFS Desktop (https://docs.ipfs.tech/install/ipfs-desktop/)\n' +
        '2. Or set useDemoMode: true in src/config/appConfig.js for testing'
      );
    }
  }
  return ipfsClient;
};

/**
 * Upload a file to IPFS
 * @param {File} file - The file object to upload
 * @returns {Promise<string>} The CID (Content Identifier) of the uploaded file
 */
export const uploadToIpfs = async (file) => {
  try {
    // Validate file size
    if (config.maxFileSize && file.size > config.maxFileSize) {
      throw new Error(`File size exceeds maximum allowed size of ${config.maxFileSize / (1024 * 1024)}MB`);
    }

    // Validate file type if restrictions exist
    if (config.allowedFileTypes && config.allowedFileTypes.length > 0) {
      const fileType = file.type || 'application/octet-stream';
      if (!config.allowedFileTypes.includes(fileType)) {
        throw new Error(`File type ${fileType} is not allowed`);
      }
    }

    // Demo mode - return fake CID
    if (isDemoMode()) {
      console.log('DEMO MODE: Simulating IPFS upload for', file.name);
      const fakeCid = generateDemoCid(file);
      console.log('DEMO MODE: Generated fake CID:', fakeCid);
      return fakeCid;
    }

    const client = await getIpfsClient();
    
    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    
    // Upload to IPFS
    const result = await client.add(buffer, {
      progress: (prog) => console.log(`Uploaded: ${prog} bytes`)
    });

    console.log('File uploaded to IPFS:', result.path);
    return result.path; // This is the CID
  } catch (error) {
    console.error('Error uploading to IPFS:', error);
    
    // Provide helpful error message
    if (error.message.includes('ERR_CONNECTION_REFUSED') || error.message.includes('fetch')) {
      throw new Error(
        'Cannot connect to IPFS. Please either:\n' +
        '1. Install and run IPFS Desktop\n' +
        '2. Or enable demo mode in config for testing'
      );
    }
    
    throw new Error(`Failed to upload file to IPFS: ${error.message}`);
  }
};

/**
 * Upload raw data to IPFS
 * @param {Buffer|Uint8Array|string} data - The data to upload
 * @returns {Promise<string>} The CID of the uploaded data
 */
export const uploadDataToIpfs = async (data) => {
  try {
    const client = getIpfsClient();
    const result = await client.add(data);
    return result.path;
  } catch (error) {
    console.error('Error uploading data to IPFS:', error);
    throw new Error(`Failed to upload data to IPFS: ${error.message}`);
  }
};

/**
 * Get the gateway URL for a CID
 * @param {string} cid - The Content Identifier
 * @returns {string} The full gateway URL
 */
export const getGatewayUrl = (cid) => {
  // Remove trailing slash from gateway if present
  const gateway = config.ipfsGateway.endsWith('/')
    ? config.ipfsGateway.slice(0, -1)
    : config.ipfsGateway;
  
  return `${gateway}/${cid}`;
};

/**
 * Download a file from IPFS using multiple gateway fallbacks
 * @param {string} cid - The Content Identifier
 * @param {string} fileName - The original file name for download
 * @returns {Promise<void>}
 */
export const downloadFromIpfs = async (cid, fileName) => {
  const safeCid = encodeURIComponent(String(cid || ''));
  const fileParam = fileName ? `?filename=${encodeURIComponent(String(fileName))}` : '';
  
  // Build list of gateways to try (configured + fallbacks + local if available)
  const gateways = buildGatewayList();
  
  let lastError = null;
  
  for (const gateway of gateways) {
    const url = `${gateway}/${safeCid}${fileParam}`;
    console.log(`Trying IPFS gateway: ${gateway}`);
    
    try {
      const response = await fetchWithTimeout(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Success - download the file
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName || '';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('File downloaded:', fileName);
      return; // Success, exit
    } catch (error) {
      console.warn(`Gateway ${gateway} failed:`, error.message);
      lastError = error;
      // Continue to next gateway
    }
  }
  
  // All gateways failed
  throw new Error(`Failed to download from all gateways. Last error: ${lastError?.message || 'Unknown'}`);
};

/**
 * Fetch file content from IPFS
 * @param {string} cid - The Content Identifier
 * @returns {Promise<Blob>} The file content as a Blob
 */
export const fetchFromIpfs = async (cid) => {
  try {
    const url = getGatewayUrl(cid);
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file: ${response.statusText}`);
    }
    
    return await response.blob();
  } catch (error) {
    console.error('Error fetching from IPFS:', error);
    throw new Error(`Failed to fetch file from IPFS: ${error.message}`);
  }
};

/**
 * Check if IPFS is available
 * @returns {Promise<boolean>} True if IPFS is reachable
 */
export const isIpfsAvailable = async () => {
  try {
    const client = getIpfsClient();
    await client.version();
    return true;
  } catch (error) {
    console.error('IPFS not available:', error);
    return false;
  }
};

/**
 * Pin a file to keep it available
 * @param {string} cid - The Content Identifier to pin
 * @returns {Promise<void>}
 */
export const pinFile = async (cid) => {
  try {
    const client = getIpfsClient();
    await client.pin.add(cid);
    console.log('File pinned:', cid);
  } catch (error) {
    console.error('Error pinning file:', error);
    throw new Error(`Failed to pin file: ${error.message}`);
  }
};

/**
 * Unpin a file
 * @param {string} cid - The Content Identifier to unpin
 * @returns {Promise<void>}
 */
export const unpinFile = async (cid) => {
  try {
    const client = getIpfsClient();
    await client.pin.rm(cid);
    console.log('File unpinned:', cid);
  } catch (error) {
    console.error('Error unpinning file:', error);
    throw new Error(`Failed to unpin file: ${error.message}`);
  }
};

export default {
  getIpfsClient,
  uploadToIpfs,
  uploadDataToIpfs,
  getGatewayUrl,
  downloadFromIpfs,
  fetchFromIpfs,
  isIpfsAvailable,
  pinFile,
  unpinFile
};
