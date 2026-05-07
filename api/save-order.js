// Simple order receiver for demo — logs order to server console.
// In production replace with Firebase / database persistence.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(200).json({ status: 'ok' });
  try {
    const order = req.body;
    console.log('Received order:', JSON.stringify(order, null, 2));
    // TODO: persist to Firestore or other DB
    return res.status(200).json({ status: 'saved', order });
  } catch (e) {
    console.error('save-order error', e);
    return res.status(500).json({ error: 'failed' });
  }
}
