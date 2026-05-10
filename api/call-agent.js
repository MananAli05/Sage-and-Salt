// Twilio Voice webhook — Urdu ordering agent
// Voices: Polly.Joanna (female, en-GB) — Urdu language (ur-PK) NOT supported by Twilio Polly
// Using English instead. See line 20 fix below.
// Session: passed via URL query params (serverless-safe, no global/Redis needed)
// Requires env vars: GROQ_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, BASE_URL

// ── XML helper (was missing — caused ReferenceError → HTTP 500) ───────────────
function escapeXml(str) {
  return String(str || '')
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&apos;');
}

// ── Build a Say+Record TwiML block ────────────────────────────────────────────
function promptAndRecord(message, actionUrl) {
  // & in URLs must be &amp; inside XML attributes — bare & = parse failure (error 12100)
  const safeUrl = actionUrl.replace(/&/g, '&amp;');
  return `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="en-GB" voice="Polly.Joanna">${escapeXml(message)}</Say>
  <Record action="${safeUrl}" method="POST" maxLength="15" timeout="6" playBeep="true" trim="trim-silence" />
</Response>`;
}

// ── Build next-stage URL — carries ALL session state in query params ──────────
// This replaces global[] which doesn't persist across Vercel serverless calls
function buildNextUrl(baseUrl, stage, session) {
  const p = new URLSearchParams({
    stage,
    item:    session.item    || '',
    size:    session.size    || '',
    flavor:  session.flavor  || '',
    name:    session.name    || '',
    phone:   session.phone   || '',
    address: session.address || '',
    payment: session.payment || '',
  });
  return `${baseUrl}/api/call-agent?${p.toString()}`;
}

// ── Parse request body (URL-encoded from Twilio) ──────────────────────────────
async function getRequestParams(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  let rawBody = '';
  if (typeof req.body === 'string') {
    rawBody = req.body;
  } else {
    for await (const chunk of req) rawBody += chunk;
  }
  const params = {};
  for (const [k, v] of new URLSearchParams(rawBody).entries()) params[k] = v;
  return params;
}

// ── Transcribe recording with Groq Whisper ────────────────────────────────────
async function transcribeRecording(recordingUrl) {
  if (!recordingUrl) {
    console.warn('[Whisper] No recording URL provided');
    return '';
  }
  try {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken  = process.env.TWILIO_AUTH_TOKEN;
    const groqKey    = process.env.GROQ_API_KEY;
    
    if (!accountSid || !authToken) {
      console.error('[Whisper] Missing TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN');
      return '';
    }
    if (!groqKey) {
      console.error('[Whisper] Missing GROQ_API_KEY');
      return '';
    }

    console.log('[Whisper] Fetching audio from:', recordingUrl);
    const auth = `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`;
    let audioResp = await fetch(`${recordingUrl}.mp3`, { headers: { Authorization: auth } });
    if (!audioResp.ok) {
      console.log('[Whisper] MP3 failed, trying WAV...');
      audioResp = await fetch(`${recordingUrl}.wav`, { headers: { Authorization: auth } });
    }
    if (!audioResp.ok) {
      console.error('[Whisper] Cannot fetch recording:', audioResp.status, audioResp.statusText);
      return '';
    }

    const audioBuffer = Buffer.from(await audioResp.arrayBuffer());
    console.log('[Whisper] Audio fetched, size:', audioBuffer.length, 'bytes');
    
    const form = new FormData();
    form.append('file',  new Blob([audioBuffer]), 'recording.mp3');
    form.append('model', 'whisper-large-v3');

    console.log('[Whisper] Sending to Groq...');
    const resp = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${groqKey}` },
      body: form,
    });
    
    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[Whisper] API Error:', resp.status, errText);
      return '';
    }
    
    const result = await resp.json();
    const transcribed = (result?.text || '').trim();
    console.log('[Whisper] Transcribed:', transcribed);
    return transcribed;
  } catch (e) {
    console.error('[Whisper] Exception:', e.message, e.stack);
    return '';
  }
}

// ── Simple keyword matching (fallback when Groq fails) ────────────────────────
function keywordMatch(text) {
  if (!text) return {};
  const lower = text.toLowerCase();
  const result = {};

  // Check for item
  if (lower.includes('pizza')) result.item = 'pizza';
  else if (lower.includes('burger')) result.item = 'burger';
  else if (lower.includes('sandwich')) result.item = 'sandwich';
  else if (lower.includes('biryani')) result.item = 'biryani';

  // Check for size
  if (lower.includes('large') || lower.includes('bada')) result.size = 'large';
  else if (lower.includes('small') || lower.includes('chota')) result.size = 'small';
  else if (lower.includes('medium') || lower.includes('medium')) result.size = 'medium';

  // Check for payment
  if (lower.includes('online') || lower.includes('card') || lower.includes('easypaisa')) result.payment = 'online';
  else if (lower.includes('cash') || lower.includes('COD')) result.payment = 'cash';

  return result;
}

// ── Extract order intent via Groq Llama ──────────────────────────────────────
async function extractIntent(speech) {
  const groqKey = process.env.GROQ_API_KEY;
  if (!speech) {
    console.warn('[Intent] Empty speech, returning empty object');
    return {};
  }

  // First try keyword matching (fast, reliable)
  const keywordResult = keywordMatch(speech);
  if (keywordResult.item || keywordResult.size || keywordResult.payment) {
    console.log('[Intent] Keyword match found:', keywordResult);
    return keywordResult;
  }

  // Then try Groq LLM (more sophisticated)
  if (!groqKey) {
    console.warn('[Intent] No GROQ_API_KEY, skipping LLM');
    return keywordResult;
  }

  try {
    console.log('[Intent] Sending to Groq LLM:', speech);
    const resp = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${groqKey}` },
      body: JSON.stringify({
        model: 'llama3-70b-8192',
        temperature: 0.2,
        max_tokens: 80,
        messages: [
          {
            role: 'system',
            content: `You extract restaurant order details from Urdu/English speech.
Return ONLY valid JSON like: {"item":"burger","size":"large","payment":"cash"}
Allowed items: pizza, burger, sandwich, biryani
Allowed sizes: large, medium, small
Allowed payment: online, cash
Use null for fields not mentioned.`,
          },
          { role: 'user', content: `Speech: "${speech}"` },
        ],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[Intent] Groq API error:', resp.status, errText);
      return keywordResult;
    }

    const text = (await resp.json())?.choices?.[0]?.message?.content || '';
    console.log('[Intent] Groq response:', text);
    const match = text.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : {};
    console.log('[Intent] Parsed:', parsed);
    return parsed;
  } catch (e) {
    console.error('[Intent] Exception:', e.message);
    return keywordResult;
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  // Health check
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok', service: 'call-agent', voice: 'Polly.Joanna (en-GB)' });
  }

  const reply = (twiml) => {
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(twiml);
  };

  try {
    const body    = await getRequestParams(req);
    const url     = new URL(req.url, `https://${req.headers.host}`);
    const q       = url.searchParams;
    const stage   = q.get('stage') || 'welcome';
    const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;

    // ── Read session from URL params (serverless-safe) ──────────────────────
    const session = {
      item:    q.get('item')    || '',
      size:    q.get('size')    || '',
      flavor:  q.get('flavor')  || '',
      name:    q.get('name')    || '',
      phone:   q.get('phone')   || '',
      address: q.get('address') || '',
      payment: q.get('payment') || '',
    };

    // ── Transcribe user recording ────────────────────────────────────────────
    console.log(`[call-agent] ====== REQUEST START ======`);
    console.log(`[call-agent] stage=${stage}`);
    console.log(`[call-agent] RecordingUrl=${body.RecordingUrl || 'none'}`);
    
    const speech = (body.SpeechResult || '').trim() || await transcribeRecording(body.RecordingUrl);
    
    console.log(`[call-agent] Final speech text: "${speech}"`);
    console.log(`[call-agent] Speech length: ${speech.length} chars`);

    // ════════════════════════════════════════════════════════════════════════
    // STAGE: welcome — greet and ask for item
    // ════════════════════════════════════════════════════════════════════════
    if (stage === 'welcome') {
      const nextUrl = buildNextUrl(baseUrl, 'item', session);
      return reply(promptAndRecord(
        'Assalam o alaikum! Sage aur Salt mein khush aamdeed. Aap kya order karna chahenge? Pizza, Burger, Sandwich ya Biryani bolain.',
        nextUrl
      ));
    }

    // ════════════════════════════════════════════════════════════════════════
    // STAGE: item — detect what food item
    // ════════════════════════════════════════════════════════════════════════
    if (stage === 'item') {
      console.log(`[call-agent:item] Extracting intent from: "${speech}"`);
      const intent = await extractIntent(speech);
      console.log(`[call-agent:item] Intent result:`, intent);
      session.item = intent.item || session.item;

      if (!session.item) {
        console.log(`[call-agent:item] No item detected, asking again`);
        const nextUrl = buildNextUrl(baseUrl, 'item', session);
        return reply(promptAndRecord(
          'Maafi chahta hoon, samajh nahi aaya. Sirf item bolain: Pizza, Burger, Sandwich ya Biryani.',
          nextUrl
        ));
      }

      console.log(`[call-agent:item] Item detected: ${session.item}, moving to size stage`);
      const nextUrl = buildNextUrl(baseUrl, 'size', session);
      return reply(promptAndRecord(
        `${session.item} — bilkul theek hai. Ab size bolain: Large, Medium ya Small.`,
        nextUrl
      ));
    }

    // ════════════════════════════════════════════════════════════════════════
    // STAGE: size — detect size
    // ════════════════════════════════════════════════════════════════════════
    if (stage === 'size') {
      const intent = await extractIntent(speech);
      session.size = intent.size || 'medium';

      const nextUrl = buildNextUrl(baseUrl, 'name', session);
      return reply(promptAndRecord(
        `${session.size} size — theek hai. Ab apna naam bolain.`,
        nextUrl
      ));
    }

    // ════════════════════════════════════════════════════════════════════════
    // STAGE: name — customer name
    // ════════════════════════════════════════════════════════════════════════
    if (stage === 'name') {
      session.name = speech.trim() || 'Customer';
      const nextUrl = buildNextUrl(baseUrl, 'phone', session);
      return reply(promptAndRecord(
        `${session.name} — shukriya. Ab apna phone number bolain.`,
        nextUrl
      ));
    }

    // ════════════════════════════════════════════════════════════════════════
    // STAGE: phone — phone number
    // ════════════════════════════════════════════════════════════════════════
    if (stage === 'phone') {
      session.phone = speech.replace(/\D/g, '').slice(-11) || speech.trim();
      const nextUrl = buildNextUrl(baseUrl, 'address', session);
      return reply(promptAndRecord(
        'Shukriya. Ab apna delivery address bolain.',
        nextUrl
      ));
    }

    // ════════════════════════════════════════════════════════════════════════
    // STAGE: address — delivery address
    // ════════════════════════════════════════════════════════════════════════
    if (stage === 'address') {
      session.address = speech.trim() || 'Not provided';
      const nextUrl = buildNextUrl(baseUrl, 'payment', session);
      return reply(promptAndRecord(
        'Theek hai. Payment ka tareeqa bolain: Online ya Cash on Delivery.',
        nextUrl
      ));
    }

    // ════════════════════════════════════════════════════════════════════════
    // STAGE: payment — finalize and save order
    // ════════════════════════════════════════════════════════════════════════
    if (stage === 'payment') {
      const t = speech.toLowerCase();
      session.payment = t.includes('online') ? 'Online' : 'Cash on Delivery';

      // Save to Firestore via save-order API
      try {
        await fetch(`${baseUrl}/api/save-order`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            customerName:  session.name,
            phone:         session.phone,
            address:       session.address,
            city:          '',
            note:          '',
            paymentMethod: session.payment,
            items: [{
              name:     session.item,
              qty:      1,
              price:    0,
              subtotal: 0,
              size:     session.size,
            }],
            subtotal:    0,
            tax:         0,
            deliveryFee: 150,
            total:       0,
            tableNo:     'Walk-in',
            source:      'call',
            status:      'new',
          }),
        });
        console.log('[call-agent] Order saved for', session.name);
      } catch (e) {
        console.error('[call-agent] Save order failed:', e.message);
      }

      const thanks = `Shukriya ${session.name}! Aapka order confirm ho gaya. ${session.item} ${session.size} size. ${session.payment} se payment hogi. Aapka khana 30 minute mein deliver ho jayega. Sage aur Salt ko choose karne ka shukriya. Khuda hafiz!`;

      return reply(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="Polly.Raza">${escapeXml(thanks)}</Say>
  <Hangup/>
</Response>`);
    }

    // ════════════════════════════════════════════════════════════════════════
    // FALLBACK
    // ════════════════════════════════════════════════════════════════════════
    return reply(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="Polly.Raza">Kuch masla aagaya. Baad mein call karain. Shukriya.</Say>
  <Hangup/>
</Response>`);

  } catch (err) {
    console.error('[call-agent] Unhandled error:', err);
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(`<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="Polly.Raza">Kuch masla aagaya. Baad mein call karain. Shukriya.</Say>
  <Hangup/>
</Response>`);
  }
}
