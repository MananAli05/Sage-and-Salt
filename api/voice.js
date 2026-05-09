export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(200).json({ status: 'ok', service: 'voice' });
  }

  try {
    const params = req.body || {};
    const callSid = params.CallSid || 'unknown';
    const from = params.From || 'unknown';
    const baseUrl = process.env.BASE_URL || `https://${req.headers.host}`;

    console.log(`[Voice] Incoming call from ${from}, CallSid: ${callSid}`);

    // Route to call-agent welcome stage
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Redirect>${baseUrl}/api/call-agent?stage=welcome</Redirect>
</Response>`;

    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(twiml);
  } catch (err) {
    console.error('[Voice] Error:', err);
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="ur-PK" voice="alice">Kuch masla aya. Barah-e-karam baad mein call karain.</Say>
  <Hangup/>
</Response>`;
    res.setHeader('Content-Type', 'application/xml');
    return res.status(200).send(errorTwiml);
  }
}
  }

  res.setHeader('Content-Type', 'application/xml');
  return res.status(200).send(twiml);
}
