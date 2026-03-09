/**
 * Valuator Authentication with Firebase
 * 
 * This module handles valuator authentication using Firebase Auth
 * with email/password and stores additional profile data in Firestore.
 * 
 * Features:
 * - Signup with email, password, name, and company name
 * - Login with email/password
 * - Password hashing handled by Firebase Auth
 * - Profile data stored in Firestore
 */

import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc 
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * Valuator authentication state
 */
let valuatorAuthState = {
  isAuthenticated: false,
  uid: null,
  email: null,
  name: null,
  companyName: null
};

// Auth state change listeners
let authListeners = [];

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} Unsubscribe function
 */
export const subscribeToAuthChanges = (callback) => {
  authListeners.push(callback);
  return () => {
    authListeners = authListeners.filter(cb => cb !== callback);
  };
};

/**
 * Notify all listeners of auth state change
 */
const notifyListeners = () => {
  authListeners.forEach(cb => cb(valuatorAuthState));
};

/**
 * Get current valuator authentication state
 * @returns {Object} The current auth state
 */
export const getValuatorAuthState = () => ({ ...valuatorAuthState });

/**
 * Sign up a new valuator
 * @param {Object} data - Signup data
 * @param {string} data.email - Email address (used as username)
 * @param {string} data.password - Password (min 6 characters)
 * @param {string} data.name - Full name
 * @param {string} data.companyName - Company name
 * @returns {Promise<Object>} The auth state after signup
 */
export const signupValuator = async ({ email, password, name, companyName }) => {
  // Validate inputs
  if (!email || !password || !name || !companyName) {
    throw new Error('All fields are required.');
  }

  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }

  try {
    // Create user with Firebase Auth (password is automatically hashed)
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Store additional profile data in Firestore
    await setDoc(doc(db, 'valuators', user.uid), {
      email: email,
      name: name,
      companyName: companyName,
      createdAt: new Date().toISOString(),
      role: 'valuator'
    });

    // Update state
    valuatorAuthState = {
      isAuthenticated: true,
      uid: user.uid,
      email: email,
      name: name,
      companyName: companyName
    };

    // Store in session
    sessionStorage.setItem('valuatorAuth', JSON.stringify(valuatorAuthState));
    notifyListeners();

    return valuatorAuthState;
  } catch (error) {
    console.error('Signup error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('An account with this email already exists.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password is too weak. Use at least 6 characters.');
    }
    
    throw new Error(error.message || 'Failed to create account.');
  }
};

/**
 * Login as a valuator
 * @param {string} email - The valuator's email
 * @param {string} password - The valuator's password
 * @returns {Promise<Object>} The auth state after login
 */
export const loginAsValuator = async (email, password) => {
  // Validate inputs
  if (!email || !password) {
    throw new Error('Please enter both email and password.');
  }

  try {
    // Sign in with Firebase Auth
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Get additional profile data from Firestore
    const docRef = doc(db, 'valuators', user.uid);
    const docSnap = await getDoc(docRef);

    let name = email;
    let companyName = '';

    if (docSnap.exists()) {
      const data = docSnap.data();
      name = data.name || email;
      companyName = data.companyName || '';
    }

    // Update state
    valuatorAuthState = {
      isAuthenticated: true,
      uid: user.uid,
      email: email,
      name: name,
      companyName: companyName
    };

    // Store in session
    sessionStorage.setItem('valuatorAuth', JSON.stringify(valuatorAuthState));
    notifyListeners();

    return valuatorAuthState;
  } catch (error) {
    console.error('Login error:', error);
    
    // Handle specific Firebase errors
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password.');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Please enter a valid email address.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    }
    
    throw new Error(error.message || 'Failed to login.');
  }
};

/**
 * Check if valuator is logged in (including from session storage)
 * @returns {Object} The auth state
 */
export const checkValuatorAuthStatus = () => {
  // Check session storage first
  const stored = sessionStorage.getItem('valuatorAuth');
  
  if (stored) {
    try {
      valuatorAuthState = JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing stored auth state:', error);
      valuatorAuthState = {
        isAuthenticated: false,
        uid: null,
        email: null,
        name: null,
        companyName: null
      };
    }
  }

  return valuatorAuthState;
};

/**
 * Logout valuator
 */
export const logoutValuator = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  }

  valuatorAuthState = {
    isAuthenticated: false,
    uid: null,
    email: null,
    name: null,
    companyName: null
  };
  
  // Clear session storage
  sessionStorage.removeItem('valuatorAuth');
  notifyListeners();
};

/**
 * Check if a user is a valuator (not a wallet user)
 * @returns {boolean} True if logged in as valuator
 */
export const isValuator = () => {
  return valuatorAuthState.isAuthenticated;
};

/**
 * Initialize auth state listener
 * Automatically updates state when Firebase auth changes
 */
export const initializeAuthListener = () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // User is signed in, get profile data
      try {
        const docRef = doc(db, 'valuators', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          valuatorAuthState = {
            isAuthenticated: true,
            uid: user.uid,
            email: user.email,
            name: data.name || user.email,
            companyName: data.companyName || ''
          };
          sessionStorage.setItem('valuatorAuth', JSON.stringify(valuatorAuthState));
          notifyListeners();
        }
      } catch (error) {
        console.error('Error fetching valuator profile:', error);
      }
    }
  });
};

export default {
  getValuatorAuthState,
  loginAsValuator,
  signupValuator,
  checkValuatorAuthStatus,
  logoutValuator,
  isValuator,
  initializeAuthListener
};
