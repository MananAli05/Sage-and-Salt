// Sage & Salt — Twilio Voice IVR (Vercel Serverless)
// Restaurant menu + order collection via phone keypad

export default async function handler(req, res) {
  // Determine which stage of the call we're in via the 'Digits' parameter
  const digits = req.body.Digits || '';
  const stage = req.body.stage || 'welcome';

  // Generate TwiML response
  let twiml = '';

  if (stage === 'welcome') {
    // Stage 1: Welcome greeting + main menu
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">
    Welcome to Sage and Salt Restaurant. 
    Press 1 for Pizza. Press 2 for Burger. Press 3 for Pasta.
  </Say>
  <Gather numDigits="1" action="https://sage-and-salt.vercel.app/api/voice?stage=menu" method="POST" />
</Response>`;

  } else if (stage === 'menu') {
    // Stage 2: User selected a category, show subcategory
    let category = '';
    let categoryName = '';

    if (digits === '1') {
      category = '1'; // Pizza
      categoryName = 'Pizza';
    } else if (digits === '2') {
      category = '2'; // Burger
      categoryName = 'Burger';
    } else if (digits === '3') {
      category = '3'; // Pasta
      categoryName = 'Pasta';
    } else {
      // Invalid choice
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Invalid choice. Please try again.</Say>
  <Gather numDigits="1" action="https://sage-and-salt.vercel.app/api/voice?stage=welcome" method="POST" />
</Response>`;
      res.setHeader('Content-Type', 'application/xml');
      return res.status(200).send(twiml);
    }

    // Show subcategory options
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">
    You selected ${categoryName}. Press 1 for Special. Press 2 for Popular. Press 3 for Classic.
  </Say>
  <Gather numDigits="1" action="https://sage-and-salt.vercel.app/api/voice?stage=flavor&category=${category}" method="POST" />
</Response>`;

  } else if (stage === 'flavor') {
    // Stage 3: Flavor selected, confirm order + collect details
    const category = req.body.category || '1';
    const flavor = digits; // 1=Special, 2=Popular, 3=Classic

    let itemName = '';
    if (category === '1') {
      itemName = flavor === '1' ? 'Special Pizza' : flavor === '2' ? 'Popular Pizza' : 'Classic Pizza';
    } else if (category === '2') {
      itemName = flavor === '1' ? 'Special Burger' : flavor === '2' ? 'Popular Burger' : 'Classic Burger';
    } else if (category === '3') {
      itemName = flavor === '1' ? 'Special Pasta' : flavor === '2' ? 'Popular Pasta' : 'Classic Pasta';
    }

    // Collect customer details (name, address, phone, payment)
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">
    You ordered ${itemName}. Please listen carefully. Your total is 500 rupees. 
    Press 1 to confirm and provide your details, or press 0 to cancel.
  </Say>
  <Gather numDigits="1" action="https://sage-and-salt.vercel.app/api/voice?stage=confirm&item=${itemName}" method="POST" />
</Response>`;

  } else if (stage === 'confirm') {
    // Stage 4: Confirmation (in trial, just confirm; after upgrade, ask for voice input)
    const item = req.body.item || 'Order';

    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice" language="en-US">
    Thank you! Your order for ${item} has been confirmed. 
    For customer details, please visit our website or call us back. 
    Your order will be delivered soon. Thank you for choosing Sage and Salt!
  </Say>
  <Hangup />
</Response>`;

    // (Optional: Save order to database here in production)
    // For now, just confirm
  } else {
    // Fallback
    twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Sorry, something went wrong. Goodbye.</Say>
  <Hangup />
</Response>`;
  }

  res.setHeader('Content-Type', 'application/xml');
  return res.status(200).send(twiml);
}
