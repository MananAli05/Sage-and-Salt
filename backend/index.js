require('dotenv').config();

const express    = require('express');
const bodyParser = require('body-parser');
const cors       = require('cors');
const { MessagingResponse } = require('twilio').twiml;

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({ status: 'ok', service: 'Sage & Salt WhatsApp Bot', version: '1.0.0' });
});

// ─── WhatsApp Webhook ─────────────────────────────────────────────────────────
// Twilio sends a POST to this endpoint every time a user messages your sandbox
app.post('/whatsapp', (req, res) => {
  const incomingMsg = (req.body.Body || '').trim().toLowerCase();
  const from        = req.body.From || 'unknown';

  console.log(`[WhatsApp] Message from ${from}: "${incomingMsg}"`);

  const twiml = new MessagingResponse();

  // ── Greeting keywords ─────────────────────────────────────────────────────
  const greetings = ['hi', 'hello', 'start', 'hey', 'salam', 'assalam', 'السلام'];
  const isGreeting = greetings.some(g => incomingMsg.includes(g));

  if (isGreeting) {
    // ── Welcome Message ───────────────────────────────────────────────────────
    twiml.message(
      `*Welcome To Sage & Salt Restaurant!*\n\n` +
      `Experience Artisan Dining With Premium Taste And Fast Delivery. ` +
      `From Handcrafted Burgers To Wood-Fired Pizzas And Rich Pastas ` +
      `Every Dish Is Made Fresh With Love.\n\n` +
      `📍 *Place Your Order Here:*\n` +
      `https://sage-and-salt.vercel.app/\n\n` +
      `We Are Excited To Serve You ❤️`
    );
  } else {
    // ── Default Fallback ──────────────────────────────────────────────────────
    twiml.message(
      `Please type *"Hi"* to start ordering 🍔\n\n` +
      `Or visit us directly:\n` +
      `https://sage-and-salt.vercel.app/`
    );
  }

  res.type('text/xml');
  res.send(twiml.toString());
});

// ─── Start Server ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ Sage & Salt Bot running on http://localhost:${PORT}`);
  console.log(`📲 WhatsApp webhook: http://localhost:${PORT}/whatsapp`);
  console.log(`🌐 For Twilio: use ngrok → ngrok http ${PORT}`);
});

// ─── Future Integration Placeholders ─────────────────────────────────────────
// TODO: Firebase — save incoming messages to Firestore
// TODO: Groq AI  — generate smart AI replies for complex questions
// TODO: Orders   — parse order intent and create order in Firebase
