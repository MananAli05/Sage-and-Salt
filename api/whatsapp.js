
const GREETINGS = ['hi', 'hello', 'start', 'hey', 'salam', 'السلام'];

const WELCOME_MSG =
  `*Welcome To Sage & Salt Restaurant!*\n\n` +
  `Experience Artisan Dining With Premium Taste And Fast Delivery. ` +
  `From Handcrafted Burgers To Wood-Fired Pizzas Every Dish Is Made Fresh With Love.\n\n` +
  `📍 *Place Your Order Here:*\n` +
  `https://sage-and-salt.vercel.app/\n\n` +
  `We Are Excited To Serve You ❤️`;

const FALLBACK_MSG =
  `Please type *"Hi"* to start ordering 🍔\n\n` +
  `Or visit: https://sage-and-salt.vercel.app/`;

function isGreetingMessage(text) {
  if (!text) return false;
  const normalized = text.trim().toLowerCase();
  return GREETINGS.some((greeting) => {
    const pattern = new RegExp(`(^|\\s)${greeting}(\\s|$)`, 'i');
    return pattern.test(normalized);
  });
}

function parseFormBody(rawBody) {
  const params = Object.create(null);
  const searchParams = new URLSearchParams(rawBody || '');
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
}

// Build TwiML response string (no library needed)
function twiml(message) {
  // Escape XML special chars
  const safe = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${safe}</Message></Response>`;
}

export default async function handler(req, res) {
  // Health check for browser / GET requests
  if (req.method !== 'POST') {
    return res.status(200).json({ status: '✅ Sage & Salt WhatsApp Bot is live!' });
  }

  try {
    // Twilio sends x-www-form-urlencoded data. Depending on runtime,
    // body may already be parsed or still available as a raw stream.
    let params = {};

    if (req.body && typeof req.body === 'object') {
      params = req.body;
    } else if (typeof req.body === 'string') {
      params = parseFormBody(req.body);
    } else {
      let rawBody = '';
      for await (const chunk of req) rawBody += chunk;
      params = parseFormBody(rawBody);
    }

    const incomingMsg = (params.Body || '').toString().trim().toLowerCase();
    const from        = params.From || 'unknown';

    console.log(`[Bot] From: ${from} → "${incomingMsg}"`);

    const isGreeting = isGreetingMessage(incomingMsg);
    const reply      = isGreeting ? WELCOME_MSG : FALLBACK_MSG;

    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml(reply));

  } catch (err) {
    console.error('[Bot] Error:', err);
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml('Sorry, something went wrong. Please try again.'));
  }
}
