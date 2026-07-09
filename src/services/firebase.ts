import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, initializeAuth, signInAnonymously, onAuthStateChanged, Auth, User } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FIREBASE_CONFIG } from './firebaseConfig';

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(FIREBASE_CONFIG);

// Web persists auth in the browser automatically; native RN needs to be told
// to persist the anonymous session in AsyncStorage or it re-signs-in (a new
// uid) on every app restart.
export const auth: Auth = Platform.OS === 'web'
  ? getAuth(app)
  : initializeAuth(app, { persistence: require('firebase/auth').getReactNativePersistence(AsyncStorage) });

export const db: Firestore = getFirestore(app);

let signInPromise: Promise<User> | null = null;

/** Resolves once the device has an (anonymous) Firebase auth session, creating one if needed. */
export function ensureSignedIn(): Promise<User> {
  if (signInPromise) return signInPromise;
  signInPromise = new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      if (user) {
        resolve(user);
        return;
      }
      signInAnonymously(auth).then(cred => resolve(cred.user)).catch(reject);
    }, reject);
  });
  return signInPromise;
}
