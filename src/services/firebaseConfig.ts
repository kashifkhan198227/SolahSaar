/**
 * Firebase project credentials for Solah Saar's online play.
 *
 * These values are NOT secret — Firebase web/client config is safe to ship in
 * the app; access is controlled by Firestore security rules, not by hiding
 * this file. Still, this is a placeholder: online play won't connect to
 * anything until you paste in your own project's values.
 *
 * To get them:
 *   1. Go to https://console.firebase.google.com, create a project (free).
 *   2. Project settings → General → "Your apps" → Add app → Web (</>).
 *   3. Copy the `firebaseConfig` object it gives you into FIREBASE_CONFIG below.
 *   4. Build → Authentication → Get started → enable the "Anonymous" sign-in provider.
 *   5. Build → Firestore Database → Create database (start in production mode).
 *   6. Deploy the security rules from `firestore.rules` in this repo (Firebase
 *      console → Firestore → Rules tab → paste and Publish).
 */

export const FIREBASE_CONFIG = {
  apiKey: 'REPLACE_ME',
  authDomain: 'REPLACE_ME.firebaseapp.com',
  projectId: 'REPLACE_ME',
  storageBucket: 'REPLACE_ME.appspot.com',
  messagingSenderId: 'REPLACE_ME',
  appId: 'REPLACE_ME',
};

export const FIREBASE_CONFIGURED = FIREBASE_CONFIG.apiKey !== 'REPLACE_ME';
