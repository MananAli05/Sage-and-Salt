// Save orders to Firebase Firestore
// Requires FIREBASE_CONFIG env variable with connection details

import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

let db = null;

const initFirebase = () => {
  if (db) return db;

  try {
    const firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
    };

    if (!firebaseConfig.projectId) {
      console.warn('[Firebase] Config incomplete - using local logging only');
      return null;
    }

    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    console.log('[Firebase] Connected to Firestore');
    return db;
  } catch (e) {
    console.error('[Firebase] Init error:', e.message);
    return null;
  }
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok', service: 'save-order' });
  }

  try {
    const order = req.body;

    // Validate order data
    if (!order.customer || !order.customer.phone) {
      return res.status(400).json({ error: 'Missing customer or phone number' });
    }

    console.log('[save-order] Processing order:', order);

    // Initialize Firebase
    const database = initFirebase();

    if (database) {
      // Save to Firestore
      const orderRef = await addDoc(collection(database, 'orders'), {
        ...order,
        serverTimestamp: serverTimestamp(),
        status: 'pending',
        createdAt: new Date().toISOString(),
      });
      console.log('[Firestore] Order saved with ID:', orderRef.id);

      return res.status(200).json({
        status: 'saved',
        orderId: orderRef.id,
        message: 'Order saved to database',
      });
    } else {
      // Fallback: Log to console only
      console.log('[Local] Order saved to logs:', JSON.stringify(order, null, 2));

      return res.status(200).json({
        status: 'saved_local',
        message: 'Order logged (Firebase not configured)',
        order,
      });
    }
  } catch (e) {
    console.error('[save-order] Error:', e.message);
    return res.status(500).json({
      error: 'Failed to save order',
      details: e.message,
    });
  }
}
