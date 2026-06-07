import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId:     import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// authReady resolves once we have a confirmed auth user (anonymous or otherwise).
// Components must await this before attaching Firestore listeners to avoid
// permission-denied errors caused by the sign-in/listener race condition.
export const authReady = new Promise((resolve, reject) => {
  let settled = false;
  let unsubscribe = () => {};
  const finish = (fn, value) => {
    if (settled) return;
    settled = true;
    clearTimeout(timeoutId);
    unsubscribe();
    fn(value);
  };

  const timeoutId = setTimeout(() => {
    finish(
      reject,
      new Error('Firebase anonymous sign-in timed out. Check Firebase Authentication, API key restrictions, and network access.')
    );
  }, 10000);

  // onAuthStateChanged fires immediately with null if not signed in yet,
  // then fires again once sign-in completes.
  unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log('Firebase auth ready:', user.uid);
      finish(resolve, user);
    }
  }, (err) => finish(reject, err));

  // Kick off anonymous sign-in
  signInAnonymously(auth).catch((err) => {
    console.error('Firebase anonymous auth failed:', err);
    finish(reject, err);
  });
});
