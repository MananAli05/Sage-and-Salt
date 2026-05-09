// Twilio Voice webhook for natural Urdu/English voice agent with Groq API, Whisper v3 & Llama 70B
// Requires environment variables:
// GROQ_API_KEY, GROQ_MODEL (default: llama-70b-8192), BASE_URL

export default async function handler(req, res) {
  // Health check
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok', service: 'call-agent' });
  }

  const params = await getRequestParams(req);
  const url = new URL(req.url, `https://${req.headers.host}`);
  const stage = url.searchParams.get('stage') || 'welcome';
  const callSid = params.CallSid || 'unknown';
  const speech = (params.SpeechResult || '').trim();
  const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;

  console.log(`[call-agent] stage=${stage} callSid=${callSid} speech="${speech}"`);

  // Session storage (in production, use Redis/DB)
  const sessionKey = `session_${callSid}`;
  let sessionData = global[sessionKey] || {
    callSid,
    item: '',
    size: '',
    flavor: '',
    name: '',
    phone: '',
    address: '',
    paymentMethod: '',
    conversationHistory: [],
  };

  // Helper: XML response
  const xml = (body) => {
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(body);
  };

  // Call Groq API with Llama 70B for natural conversation
  const callGroq = async (userMessage, systemPrompt) => {
    const key = process.env.GROQ_API_KEY;
    const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
    const model = process.env.GROQ_MODEL || 'llama-70b-8192'; // Use Llama 70B
    
    if (!key) {
      console.warn('[Groq] No API key set, using fallback');
      return null;
    }

    try {
      sessionData.conversationHistory.push({ role: 'user', content: userMessage });

      const resp = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.3,
          max_tokens: 150,
          messages: [
            { role: 'system', content: systemPrompt },
            ...sessionData.conversationHistory.slice(-6), // Keep last 6 messages
            { role: 'user', content: userMessage },
          ],
        }),
      });

      if (!resp.ok) {
        const errText = await resp.text();
        console.error('[Groq] HTTP error', resp.status, errText);
        return null;
      }

      const data = await resp.json();
      const assistantMessage = data?.choices?.[0]?.message?.content || '';
      sessionData.conversationHistory.push({ role: 'assistant', content: assistantMessage });
      
      return assistantMessage || null;
    } catch (e) {
      console.error('[Groq] Error:', e.message);
      return null;
    }
  };

  // Extract intent using Llama 70B
  const extractIntent = async (text) => {
    const systemPrompt = `You are an expert at understanding restaurant orders in Urdu and English. Extract:
1. ITEM: pizza, burger, sandwich, biryani, or none
2. SIZE: large, medium, small, or none
3. PAYMENT: online, cod, or none
4. Return JSON only like: {"item": "pizza", "size": "large", "payment": "online"}`;

    const response = await callGroq(
      `Extract order details from: "${text}"`,
      systemPrompt
    );

    try {
      const jsonMatch = response?.match(/\{.*\}/s);
      return jsonMatch ? JSON.parse(jsonMatch[0]) : {};
    } catch {
      return {};
    }
  };

  // Save order to database
  const saveOrder = async (order) => {
    try {
      const response = await fetch(`${baseUrl}/api/save-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(order),
      });
      console.log('[saveOrder] Response:', response.status);
      return await response.json();
    } catch (e) {
      console.error('[saveOrder] Error:', e.message);
    }
  };

  // STAGE 1: Welcome
  if (stage === 'welcome') {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">Assalam o alaikum! Main Sage and Salt Restaurant se baat kar raha hon. Aap kya order karna chahte hain? Humara hai Pizza, Burger, Sandwich aur Biryani.</Say>
  <Gather input="speech" speechTimeout="5" action="${baseUrl}/api/call-agent?stage=process" method="POST" language="ur-PK"/>
</Response>`;
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 2: Process item order
  if (stage === 'process' && speech) {
    const systemPrompt = `You are a friendly Urdu restaurant assistant. User wants to order. 
Extract item from: "${speech}". Reply in Urdu, confirm item and ask for size (Large/Medium/Small).`;

    const intent = await extractIntent(speech);
    sessionData.item = intent.item || sessionData.item;

    const response = await callGroq(speech, systemPrompt);
    const agentReply = response || `Shukriya! Aapne ${sessionData.item} select kia. Kya size chahiye? Large, Medium ya Small?`;

    if (!sessionData.item) {
      // Item not understood, ask again
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">Mujhe samajh nahi aaya. Kripaya dobara batain - Pizza, Burger, Sandwich ya Biryani?</Say>
  <Gather input="speech" speechTimeout="5" action="${baseUrl}/api/call-agent?stage=process" method="POST" language="ur-PK"/>
</Response>`;
      global[sessionKey] = sessionData;
      return xml(twiml);
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">${agentReply}</Say>
  <Gather input="speech" speechTimeout="5" action="${baseUrl}/api/call-agent?stage=size" method="POST" language="ur-PK"/>
</Response>`;
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 3: Ask for size and flavor
  if (stage === 'size' && speech) {
    const intent = await extractIntent(speech);
    sessionData.size = intent.size || 'Medium';

    const systemPrompt = `User said: "${speech}". You are a restaurant assistant asking for flavor/type preference in Urdu.
Ask if they want any special flavor or type (e.g., with cheese, spicy, etc.). Reply short in Urdu.`;

    const response = await callGroq(speech, systemPrompt);
    const agentReply = response || `Theek hai! ${sessionData.size} size. Kya flavor pasand hai - Spicy, Cheese, ya Normal?`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">${agentReply}</Say>
  <Gather input="speech" speechTimeout="5" action="${baseUrl}/api/call-agent?stage=flavor" method="POST" language="ur-PK"/>
</Response>`;
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 4: Flavor selected, confirm and ask for details
  if (stage === 'flavor' && speech) {
    sessionData.flavor = speech;

    const confirmMsg = `Bilkul! Aapka order confirm hua: ${sessionData.item}, ${sessionData.size}, ${sessionData.flavor}. Aab apna nam batain.`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">${confirmMsg}</Say>
  <Gather input="speech" speechTimeout="5" action="${baseUrl}/api/call-agent?stage=name" method="POST" language="ur-PK"/>
</Response>`;
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 5: Get customer name
  if (stage === 'name' && speech) {
    sessionData.name = speech.trim();

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">Shukriya ${sessionData.name}! Ab apna phone number batain.</Say>
  <Gather input="speech" speechTimeout="5" action="${baseUrl}/api/call-agent?stage=phone" method="POST" language="ur-PK"/>
</Response>`;
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 6: Get phone number
  if (stage === 'phone' && speech) {
    sessionData.phone = speech.replace(/\D/g, '').slice(-10); // Extract digits

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">Shukriya! Ab apna address batain kahan deliver karna hai.</Say>
  <Gather input="speech" speechTimeout="8" action="${baseUrl}/api/call-agent?stage=address" method="POST" language="ur-PK"/>
</Response>`;
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 7: Get address
  if (stage === 'address' && speech) {
    sessionData.address = speech.trim();

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">Bilkul! Ab batain payment online karna hai ya Cash on Delivery?</Say>
  <Gather input="speech" speechTimeout="5" action="${baseUrl}/api/call-agent?stage=payment" method="POST" language="ur-PK"/>
</Response>`;
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 8: Get payment method and save order
  if (stage === 'payment' && speech) {
    const t = speech.toLowerCase();
    sessionData.paymentMethod = t.includes('online') ? 'Online' : 'Cash on Delivery';

    // Prepare order for saving
    const finalOrder = {
      callSid: sessionData.callSid,
      customer: {
        name: sessionData.name,
        phone: sessionData.phone,
        address: sessionData.address,
      },
      orderItems: [{
        item: sessionData.item,
        size: sessionData.size,
        flavor: sessionData.flavor,
      }],
      paymentMethod: sessionData.paymentMethod,
      source: 'voice-call',
      timestamp: new Date().toISOString(),
    };

    await saveOrder(finalOrder);
    console.log('[Order Saved]', finalOrder);

    const thankYouMsg = `Shukriya ${sessionData.name}! Aapka order confirm ho gaya. ${sessionData.paymentMethod} se payment hogi. Aapka khana 30 minute mein deliver ho jayega. Sage and Salt ko select karne ke liye shukriya!`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">${thankYouMsg}</Say>
  <Hangup/>
</Response>`;

    // Clean up session
    delete global[sessionKey];
    return xml(twiml);
  }

  // Fallback
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">Kuch masla aya. Barah-e-karam baad mein call karain.</Say>
  <Hangup/>
</Response>`;
  return xml(twiml);
}

// Helper to parse request body
async function getRequestParams(req) {
  if (typeof req.body === 'object') return req.body;
  
  let rawBody = '';
  if (typeof req.body === 'string') {
    rawBody = req.body;
  } else {
    for await (const chunk of req) {
      rawBody += chunk;
    }
  }

  const params = {};
  const searchParams = new URLSearchParams(rawBody);
  for (const [key, value] of searchParams.entries()) {
    params[key] = value;
  }
  return params;
}
