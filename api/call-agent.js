// Twilio Voice webhook for simple Urdu/English voice agent.
// Supports optional Groq LLM: set GROQ_API_KEY and GROQ_API_URL in Vercel env.

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

  console.log(`[call-agent] stage=${stage} callSid=${callSid} speech=${speech}`);

  // Helpers
  const xml = (body) => {
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(body);
  };

  const callGroq = async (prompt) => {
    const key = process.env.GROQ_API_KEY;
    const url = process.env.GROQ_API_URL || 'https://api.groq.com/openai/v1/chat/completions';
    const model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant';
    if (!key) return null;
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            { role: 'system', content: 'You are a concise Urdu restaurant phone assistant.' },
            { role: 'user', content: prompt },
          ],
        }),
      });
      if (!resp.ok) {
        const errText = await resp.text();
        console.error('Groq HTTP error', resp.status, errText);
        return null;
      }
      const data = await resp.json();
      return data?.choices?.[0]?.message?.content || null;
    } catch (e) {
      console.error('Groq error', e);
      return null;
    }
  };

  const parseOrderFromSpeech = (text) => {
    const t = (text || '').toLowerCase();
    let item = '';
    if (t.includes('pizza')) item = 'Pizza';
    else if (t.includes('burger')) item = 'Burger';
    else if (t.includes('pasta')) item = 'Pasta';
    let size = '';
    if (t.includes('large') || t.includes('bara') || t.includes('large')) size = 'Large';
    else if (t.includes('medium') || t.includes('madhyam')) size = 'Medium';
    else if (t.includes('small') || t.includes('chhota')) size = 'Small';
    return { item, size, raw: text };
  };

  const saveOrder = async (order) => {
    try {
      await fetch(`${process.env.BASE_URL || 'https://sage-and-salt.vercel.app'}/api/save-order`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order),
      });
    } catch (e) {
      console.error('saveOrder error', e);
    }
  };

  // Flow stages
  if (stage === 'welcome') {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">Assalam o alaikum. Sage and Salt mein khush aamdeed. Aap kia order karna chahenge? Pizza, Burger ya Pasta bolein.</Say>
  <Gather input="speech" action="${baseUrl}/api/call-agent?stage=process" method="POST" timeout="5"/>
</Response>`;
    return xml(twiml);
  }

  if (stage === 'process') {
    let replyText = '';
    let order = { callSid, item: '', size: '', customer: {}, source: 'call' };

    if (process.env.GROQ_API_KEY) {
      const prompt = `You are a restaurant assistant in Urdu. User said: "${speech}". Reply short in Urdu confirming item and ask to confirm. Example: "Aap ne X order kiya, tasdeeq ke liye 'confirm' kahiye."`;
      const g = await callGroq(prompt);
      replyText = g || 'Aapka order samajh nahi aaya, barah-e-karam dubara batain.';
      const parsed = parseOrderFromSpeech(speech);
      order.item = parsed.item; order.size = parsed.size;
    } else {
      const parsed = parseOrderFromSpeech(speech);
      order.item = parsed.item; order.size = parsed.size;
      if (!order.item) replyText = 'Maazrat, main samajh nahi paaya. Barah-e-karam item ka naam dubara batain.';
      else replyText = `Aap ne ${order.size ? order.size + ' ' : ''}${order.item} kaha. Agar aap tasdeeq karna chahtay hain to "confirm" kahiye warna cancel kahiye.`;
    }

    await saveOrder({ callSid, stage: 'partial', order });

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">${escapeXml(replyText)}</Say>
  <Gather input="speech" action="${baseUrl}/api/call-agent?stage=confirm&item=${encodeURIComponent(order.item)}&size=${encodeURIComponent(order.size)}" method="POST" timeout="5"/>
</Response>`;
    return xml(twiml);
  }

  if (stage === 'confirm') {
    const item = url.searchParams.get('item') || 'item';
    const size = url.searchParams.get('size') || '';
    const spoken = speech.toLowerCase();
    if (spoken.includes('confirm') || spoken.includes('tasdeeq') || spoken.includes('haan') || spoken.includes('confirm karte')) {
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">Shukriya. Barae-meherbani apna naam, phone number aur address mukhtasar tor par batain. Saath hi batain ke payment cash on delivery hoga ya JazzCash.</Say>
  <Gather input="speech" action="${baseUrl}/api/call-agent?stage=collect_details&item=${encodeURIComponent(item)}&size=${encodeURIComponent(size)}" method="POST" timeout="8" />
</Response>`;
      return xml(twiml);
    }

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">Aap ne tasdeeq nahi ki. Agar aap fir se order karna chahte hain to item bata dein.</Say>
  <Gather input="speech" action="${baseUrl}/api/call-agent?stage=process" method="POST" timeout="5" />
</Response>`;
    return xml(twiml);
  }

  if (stage === 'collect_details') {
    const item = url.searchParams.get('item') || 'item';
    const size = url.searchParams.get('size') || '';
    let detailsText = speech;
    let parsed = { name: '', phone: '', address: '', payment: '' };
    if (process.env.GROQ_API_KEY) {
      const prompt = `Extract customer name, phone number, address and payment method (Cash on Delivery or JazzCash) from this Urdu text: "${detailsText}". Return as JSON with keys name, phone, address, payment.`;
      const out = await callGroq(prompt);
      try { parsed = JSON.parse(out); } catch (e) { console.log('parse fail', e); }
    } else {
      const phoneMatch = detailsText.match(/\+?\d{10,14}/);
      parsed.phone = phoneMatch ? phoneMatch[0] : '';
      if (detailsText.toLowerCase().includes('cod') || detailsText.toLowerCase().includes('cash') || detailsText.includes('cash')) parsed.payment = 'COD';
      else if (detailsText.toLowerCase().includes('jazz') || detailsText.toLowerCase().includes('jazzcash')) parsed.payment = 'JazzCash';
      const parts = detailsText.split(/,| aur | address | pata | mera naam /i).map(s=>s.trim()).filter(Boolean);
      parsed.name = parts[0] || '';
      parsed.address = parts.slice(1).join(', ') || '';
    }

    const order = { callSid, item, size, customer: parsed, source: 'call' };
    await saveOrder({ ...order, stage: 'final' });

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">Shukriya ${escapeXml(parsed.name || '')}. Aapka order ${escapeXml(item)} liya ja chuka hai. Hum jald rabta karengay. Khuda hafiz.</Say>
  <Hangup />
</Response>`;
    return xml(twiml);
  }

  const fallback = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">Maazrat. Kuch masla hua. Phir call karein.</Say>
  <Hangup />
</Response>`;
  return xml(fallback);
}

function escapeXml(unsafe) {
  return (unsafe||'').replace(/[<>&"']/g, function (c) {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '"': return '&quot;';
      case "'": return '&apos;';
    }
  });
}

async function getRequestParams(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return fromSearchParams(req.body);

  let rawBody = '';
  for await (const chunk of req) rawBody += chunk;
  return fromSearchParams(rawBody);
}

function fromSearchParams(raw) {
  const out = Object.create(null);
  const sp = new URLSearchParams(raw || '');
  for (const [k, v] of sp.entries()) out[k] = v;
  return out;
}
