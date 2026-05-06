// ─── Sage & Salt — WhatsApp Webhook (Vercel Serverless) ──────────────────────
// No external twilio library needed — returns raw TwiML XML directly
// ─────────────────────────────────────────────────────────────────────────────

const { parse } = require('querystring');

const GREETINGS = ['hi', 'hello', 'start', 'hey', 'salam', 'السلام'];

const WELCOME_MSG =
  `🌿 *Welcome to Sage & Salt Restaurant!*\n\n` +
  `Experience artisan dining with premium taste and fast delivery. ` +
  `From handcrafted burgers to wood-fired pizzas — every dish is made fresh with love.\n\n` +
  `📍 *Place your order here:*\n` +
  `https://sage-and-salt.vercel.app/\n\n` +
  `We Are Excited To Serve You ❤️`;

const FALLBACK_MSG =
  `Please type *"Hi"* to start ordering 🍔\n\n` +
  `Or visit: https://sage-and-salt.vercel.app/`;

// Build TwiML response string (no library needed)
function twiml(message) {
  // Escape XML special chars
  const safe = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
}

module.exports = async (req, res) => {
  // Health check for browser / GET requests
  if (req.method !== 'POST') {
    return res.status(200).json({ status: '✅ Sage & Salt WhatsApp Bot is live!' });
  }

  try {
    // Manually read and parse URL-encoded body (what Twilio sends)
    let rawBody = '';
    for await (const chunk of req) rawBody += chunk;
    const params = parse(rawBody);

    const incomingMsg = (params.Body || '').toString().trim().toLowerCase();
    const from        = params.From || 'unknown';

    console.log(`[Bot] From: ${from} → "${incomingMsg}"`);

    const isGreeting = GREETINGS.some(g => incomingMsg.includes(g));
    const reply      = isGreeting ? WELCOME_MSG : FALLBACK_MSG;

    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml(reply));

  } catch (err) {
    console.error('[Bot] Error:', err);
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml('Sorry, something went wrong. Please try again.'));
  }
};
