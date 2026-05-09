
const GREETINGS = ['hi', 'hello', 'start', 'hey', 'salam', 'السلام'];

const MENU_ITEMS = [
  { name: 'Classic Burger', price: 'Rs 350', spicy: 'Mild', special: true },
  { name: 'Spicy Chicken Burger', price: 'Rs 400', spicy: 'Extra Hot', special: false },
  { name: 'Cheese Burger Deluxe', price: 'Rs 450', spicy: 'Mild', special: true },
  { name: 'Margherita Pizza', price: 'Rs 550', spicy: 'Mild', special: false },
  { name: 'Pepperoni Pizza', price: 'Rs 600', spicy: 'Medium', special: false },
  { name: 'BBQ Chicken Pizza', price: 'Rs 650', spicy: 'Extra Hot', special: true },
  { name: 'Grilled Chicken Sandwich', price: 'Rs 380', spicy: 'Mild', special: false },
  { name: 'Spicy Paneer Sandwich', price: 'Rs 420', spicy: 'Extra Hot', special: false },
  { name: 'Biryani (Chicken)', price: 'Rs 480', spicy: 'Medium', special: false },
  { name: 'Biryani (Mutton)', price: 'Rs 580', spicy: 'Extra Hot', special: false },
];

const SPECIALS = MENU_ITEMS.filter(item => item.special);

const WELCOME_MSG =
  `*Welcome To Sage & Salt Restaurant!*\n\n` +
  `Experience Artisan Dining With Premium Taste And Fast Delivery. ` +
  `From Handcrafted Burgers To Wood-Fired Pizzas Every Dish Is Made Fresh With Love.\n\n` +
  `*What would you like to know?*\n` +
  `1️⃣ Type *"menu"* to see our full menu\n` +
  `2️⃣ Type *"special"* to see today's specials\n` +
  `3️⃣ Type *"spicy"* to see spicy items\n` +
  `📍 *Place Your Order Here:*\n` +
  `https://sage-and-salt.vercel.app/\n\n` +
  `We Are Excited To Serve You ❤️`;

const MENU_MSG = () => {
  let msg = `*🍔 SAGE & SALT MENU 🍕*\n\n`;
  MENU_ITEMS.forEach(item => {
    msg += `📌 *${item.name}* - ${item.price}\n   Level: ${item.spicy}\n\n`;
  });
  msg += `\n*Order now:* https://sage-and-salt.vercel.app/`;
  return msg;
};

const SPECIALS_MSG = () => {
  let msg = `*⭐ TODAY'S SPECIALS ⭐*\n\n`;
  SPECIALS.forEach(item => {
    msg += `🌟 *${item.name}* - ${item.price}\n   Level: ${item.spicy}\n\n`;
  });
  msg += `\n*Order now:* https://sage-and-salt.vercel.app/`;
  return msg;
};

const SPICY_ITEMS_MSG = () => {
  const spicyItems = MENU_ITEMS.filter(item => item.spicy === 'Hot' || item.spicy === 'Extra Hot');
  let msg = `*🔥 SPICY ITEMS 🔥*\n\n`;
  spicyItems.forEach(item => {
    msg += `🌟 *${item.name}* - ${item.price}\n   Level: ${item.spicy}\n\n`;
  });
  msg += `\n*Order now:* https://sage-and-salt.vercel.app/`;
  return msg;
};

const FALLBACK_MSG =
  `😊 Type *"hi"* to see our menu\n` +
  `Or ask about: *"menu"*, *"special"*, *"spicy"*\n\n` +
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

    let reply = FALLBACK_MSG;
    
    if (isGreetingMessage(incomingMsg)) {
      reply = WELCOME_MSG;
    } else if (incomingMsg.includes('menu')) {
      reply = MENU_MSG();
    } else if (incomingMsg.includes('special')) {
      reply = SPECIALS_MSG();
    } else if (incomingMsg.includes('spicy')) {
      reply = SPICY_ITEMS_MSG();
    } else if (incomingMsg.includes('price') || incomingMsg.includes('cost')) {
      reply = MENU_MSG();
    } else if (incomingMsg.includes('what') && incomingMsg.includes('have')) {
      reply = MENU_MSG();
    }

    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml(reply));

  } catch (err) {
    console.error('[Bot] Error:', err);
    res.setHeader('Content-Type', 'text/xml');
    return res.status(200).send(twiml('Sorry, something went wrong. Please try again.'));
  }
}
