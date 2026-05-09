# 🎤 Voice Call Agent Documentation

## Overview
The voice call agent provides a **natural conversation flow** in Urdu/English for restaurant orders. It uses:
- **Groq API** with **Llama 70B** for intelligent conversation
- **Twilio** for voice handling
- **Whisper Large v3** for Urdu speech-to-text (via OpenAI)
- **Firebase Firestore** for order persistence

## Conversation Flow

```
1. Welcome
   Agent: "Assalam o alaikum! Main Sage and Salt Restaurant se baat kar raha hon. 
           Aap kya order karna chahte hain? Hamara hai Pizza, Burger, Sandwich aur Biryani."

2. Item Selection
   User: "Mera pizza kar du" (I want pizza)
   Agent: Confirms item and asks for size

3. Size & Flavor
   Agent: "Kya size chahiye? Large, Medium ya Small?"
   User: "Large"
   Agent: "Kya flavor pasand hai? Spicy, Cheese, ya Normal?"

4. Confirm Order
   Agent: "Bilkul! Aapka order confirm hua: Pizza, Large, Spicy. Aab apna nam batain."

5. Customer Details
   - Name
   - Phone Number
   - Delivery Address

6. Payment Method
   Agent: "Payment online karna hai ya Cash on Delivery?"

7. Order Complete
   Agent: "Shukriya! Aapka khana 30 minute mein deliver ho jayega!"
   Order saved to Firestore
```

## Setup Instructions

### 1. Environment Variables
Copy `.env.example` to `.env.local`:

```bash
GROQ_API_KEY=sk_xxxxxxxxxxxxx
GROQ_MODEL=llama-70b-8192
OPENAI_API_KEY=sk_xxxxxxxxxxxxx
BASE_URL=https://sage-and-salt.vercel.app
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxxxxx
FIREBASE_PROJECT_ID=your-project-id
# ... see .env.example for full list
```

### 2. Twilio Setup
1. Go to Twilio Console
2. Create/Configure Phone Number
3. Set Voice Webhook to: `https://sage-and-salt.vercel.app/api/voice`

### 3. Firebase Setup
1. Create Firestore database
2. Create collection: `orders`
3. Enable anonymous authentication (or service account)
4. Copy credentials to `.env.local`

### 4. Groq API Setup
1. Get API key from https://console.groq.com
2. Add to `GROQ_API_KEY` in env

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/voice` | POST | Initial call handler, routes to call-agent |
| `/api/call-agent?stage=X` | POST | Conversation stages (welcome, process, size, flavor, name, phone, address, payment) |
| `/api/save-order` | POST | Saves order to Firestore |
| `/api/whatsapp` | POST | WhatsApp messaging handler |

## Order Schema (Firestore)

```json
{
  "callSid": "CA1234567890abcdef",
  "customer": {
    "name": "Ahmed Ali",
    "phone": "0300-1234567",
    "address": "123 Main St, Karachi"
  },
  "orderItems": [
    {
      "item": "Pizza",
      "size": "Large",
      "flavor": "Spicy"
    }
  ],
  "paymentMethod": "Cash on Delivery",
  "source": "voice-call",
  "status": "pending",
  "createdAt": "2024-05-09T10:30:00Z",
  "serverTimestamp": 1715245800000
}
```

## Features

✅ Natural conversation in Urdu
✅ No DTMF (press 1, 2, 3) - uses speech recognition
✅ Groq Llama 70B for smart intent extraction
✅ Multi-stage order collection
✅ Automatic Firebase persistence
✅ Supports both Online and COD payments
✅ Conversation history tracking
✅ Error handling & fallbacks

## Testing Locally

```bash
# Start development server
npm run dev

# Use ngrok for local Twilio webhooks
ngrok http 3000

# Update Twilio webhook to ngrok URL
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "No API key set" | Add GROQ_API_KEY to environment |
| Speech not recognized | Check language setting (ur-PK) |
| Order not saving | Verify Firebase config & network |
| Call disconnects early | Increase timeout in Gather tag |

## Future Improvements

- [ ] Redis for session management (instead of global)
- [ ] Order history tracking
- [ ] Automated SMS confirmations
- [ ] Menu items database integration
- [ ] Real-time order tracking
- [ ] Payment gateway integration (Stripe/JazzCash)

