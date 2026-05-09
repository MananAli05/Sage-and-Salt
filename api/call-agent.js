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
  const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;

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

  const promptAndRecord = (message, nextStage) => {
    const nextUrl = `${baseUrl}/api/call-agent?stage=${nextStage}`;
    return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">${escapeXml(message)}</Say>
  <Record action="${nextUrl}" method="POST" maxLength="12" timeout="6" playBeep="true" trim="trim-silence" />
</Response>`;
  };

  const extractUserSpeech = async (requestParams) => {
    const directSpeech = (requestParams.SpeechResult || '').trim();
    if (directSpeech) return directSpeech;

    const recordingUrl = requestParams.RecordingUrl;
    if (!recordingUrl) return '';

    try {
      const accountSid = process.env.TWILIO_ACCOUNT_SID;
      const authToken = process.env.TWILIO_AUTH_TOKEN;
      const groqKey = process.env.GROQ_API_KEY;

      if (!accountSid || !authToken || !groqKey) {
        console.warn('[Speech] Missing credentials for recording transcription');
        return '';
      }

      const authHeader = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
      let audioResp = await fetch(`${recordingUrl}.mp3`, {
        headers: { Authorization: authHeader },
      });

      if (!audioResp.ok) {
        audioResp = await fetch(`${recordingUrl}.wav`, {
          headers: { Authorization: authHeader },
        });
      }

      if (!audioResp.ok) {
        console.error('[Speech] Unable to fetch recording', audioResp.status);
        return '';
      }

      const audioBuffer = Buffer.from(await audioResp.arrayBuffer());
      const formData = new FormData();
      formData.append('file', new Blob([audioBuffer]), 'recording.mp3');
      formData.append('model', process.env.GROQ_WHISPER_MODEL || 'whisper-large-v3');

      const transcribeResp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${groqKey}`,
        },
        body: formData,
      });

      if (!transcribeResp.ok) {
        const errText = await transcribeResp.text();
        console.error('[Speech] Groq transcription failed', transcribeResp.status, errText);
        return '';
      }

      const data = await transcribeResp.json();
      return (data?.text || '').trim();
    } catch (error) {
      console.error('[Speech] Transcription error', error.message);
      return '';
    }
  };

  const speech = await extractUserSpeech(params);
  console.log(`[call-agent] stage=${stage} callSid=${callSid} transcribed="${speech}"`);

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
    const twiml = promptAndRecord(
      'Assalam o alaikum. Sirf item ka naam bolain: pizza, burger, sandwich ya biryani.',
      'process'
    );
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 2: Process item order
  if (stage === 'process') {
    const intent = await extractIntent(speech);
    sessionData.item = intent.item || sessionData.item;

    if (!sessionData.item) {
      const twiml = promptAndRecord(
        'Mujhe samajh nahi aaya. Dobara sirf item ka naam bolain: pizza, burger, sandwich ya biryani.',
        'process'
      );
      global[sessionKey] = sessionData;
      return xml(twiml);
    }

    const twiml = promptAndRecord(
      `${sessionData.item} theek hai. Ab size bolain: large, medium ya small.`,
      'size'
    );
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 3: Ask for size and flavor
  if (stage === 'size') {
    const intent = await extractIntent(speech);
    sessionData.size = intent.size || 'Medium';

    const twiml = promptAndRecord(
      `${sessionData.size} size theek hai. Ab flavor bolain, jaise spicy ya cheese.`,
      'flavor'
    );
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 4: Flavor selected, confirm and ask for details
  if (stage === 'flavor') {
    sessionData.flavor = speech;

    const confirmMsg = `Bilkul! Aapka order confirm hua: ${sessionData.item}, ${sessionData.size}, ${sessionData.flavor}. Aab apna nam batain.`;

    const twiml = promptAndRecord(confirmMsg, 'name');
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 5: Get customer name
  if (stage === 'name') {
    sessionData.name = speech.trim();

    const twiml = promptAndRecord(
      `${sessionData.name}! Ab apna phone number bolain.`,
      'phone'
    );
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 6: Get phone number
  if (stage === 'phone') {
    sessionData.phone = speech.replace(/\D/g, '').slice(-10); // Extract digits

    const twiml = promptAndRecord(
      'Shukriya. Ab apna address bolain.',
      'address'
    );
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 7: Get address
  if (stage === 'address') {
    sessionData.address = speech.trim();

    const twiml = promptAndRecord(
      'Ab payment method bolain: online ya cash on delivery.',
      'payment'
    );
    global[sessionKey] = sessionData;
    return xml(twiml);
  }

  // STAGE 8: Get payment method and save order
  if (stage === 'payment') {
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
