// ─── Sage & Salt — WhatsApp Bot (Vercel Serverless Function) ─────────────────
// Deployed at: https://sage-and-salt.vercel.app/api/whatsapp
// ─────────────────────────────────────────────────────────────────────────────

const { MessagingResponse } = require('twilio').twiml;

const GREETINGS = ['hi', 'hello', 'start', 'hey', 'salam', 'assalam', 'السلام'];

module.exports = (req, res) => {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'Sage & Salt WhatsApp Bot is live!' });
  }

  const incomingMsg = (req.body?.Body || '').trim().toLowerCase();
  const from        = req.body?.From || 'unknown';

  console.log(`[WhatsApp] From: ${from} → "${incomingMsg}"`);

  const twiml      = new MessagingResponse();
  const isGreeting = GREETINGS.some(g => incomingMsg.includes(g));

  if (isGreeting) {
    twiml.message(
      `🌿 *Welcome to Sage & Salt Restaurant!*\n\n` +
      `Experience artisan dining with premium taste and fast delivery. ` +
      `From handcrafted burgers to wood-fired pizzas — every dish is made fresh with love.\n\n` +
      `📍 *Place your order here:*\n` +
      `https://sage-and-salt.vercel.app/\n\n` +
      `We Are Excited To Serve You ❤️`
    );
  } else {
    twiml.message(
      `Please type *"Hi"* to start ordering 🍔\n\n` +
      `Or visit us directly:\nhttps://sage-and-salt.vercel.app/`
    );
  }

  res.setHeader('Content-Type', 'text/xml');
  res.status(200).send(twiml.toString());
};
