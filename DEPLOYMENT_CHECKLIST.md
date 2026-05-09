# 🚀 Deployment & Final Setup Guide

## ✅ Completed Tasks

### 1. **Code Updates** ✓
- Updated `api/call-agent.js` with full natural conversation workflow using Groq Llama 70B
- Updated `api/voice.js` to route incoming calls to the agent
- Updated `api/save-order.js` with Firebase Firestore integration
- Updated `api/whatsapp.js` message capitalization (Pizzas → Pizzas)
- Updated `package.json` with firebase-admin dependency
- Created `.env.example` with all required environment variables
- Created `VOICE_AGENT_SETUP.md` with complete documentation

### 2. **Git Commit** ✓
```
Commit: feat: implement natural Urdu voice call agent with Groq Llama 70B
Branch: main
Remote: https://github.com/MananAli05/Sage-and-Salt
```

### 3. **Git Push** ✓
Successfully pushed to `origin/main`

---

## 📋 Next Steps for Vercel Deployment

### Option 1: Automatic Deployment (GitHub Integration)
1. Go to https://vercel.com/dashboard
2. Connect your GitHub repository (if not already)
3. **Vercel will automatically deploy** the latest push
4. Check deployment status at: https://vercel.com/dashboard

### Option 2: Manual Vercel Deployment
```bash
npm install -g vercel
vercel login
cd d:\RestaurentManagementsystem
vercel --prod
```

---

## 🔐 Quick Setup: Groq API Key

**Your setup just got simpler!** You're now using **Groq for everything**:

### Get Groq API Key (2 minutes)
1. Go to https://console.groq.com/keys
2. Click **"Create API Key"**
3. Copy the key (format: `gsk_xxxxx` or `sk_xxxxx`)
4. Add to Vercel:
   - Dashboard → Settings → Environment Variables
   - Name: `GROQ_API_KEY`
   - Value: `(your key)`
   - Click Save & Deploy

### What Groq Provides
| Service | Purpose | Included |
|---------|---------|----------|
| **Whisper Large v3** | Urdu speech-to-text | ✅ Free tier |
| **LLaMA 70B** | Intent extraction & NLU | ✅ Free tier |
| **Models** | 5+ other models available | ✅ Included |

✓ **No need for OpenAI key anymore!**


## 🔑 Environment Variables Setup (IMPORTANT!)

Go to Vercel Dashboard → Settings → Environment Variables and add:

```
GROQ_API_KEY = sk_xxxxxxxxxxxxx
GROQ_MODEL = llama-70b-8192


TWILIO_ACCOUNT_SID = ACxxxxxxxxxxx
TWILIO_AUTH_TOKEN = xxxxxxxxxxxxx
TWILIO_PHONE_NUMBER = +15551234567

FIREBASE_API_KEY = AIzaSyxxxxxxxxxxxxxx
FIREBASE_AUTH_DOMAIN = your-project.firebaseapp.com
FIREBASE_PROJECT_ID = your-project-id
FIREBASE_STORAGE_BUCKET = your-project.appspot.com
FIREBASE_MESSAGING_SENDER_ID = 123456789
FIREBASE_APP_ID = 1:123456789:web:abcdefg

BASE_URL = https://sage-and-salt.vercel.app

NODE_ENV = production
```

**Important:** Do NOT commit these to git. Add `.env.local` to `.gitignore` if you haven't already.

---

## 🔌 Twilio Configuration

### Phone Number Webhook
1. Go to Twilio Console → Phone Numbers
2. Select your voice-enabled number
3. In "Voice & Fax" section, set:
   - **Webhook URL:** `https://sage-and-salt.vercel.app/api/voice`
   - **HTTP Method:** POST
   - **On Call:** (leave blank, will use webhook)

### WhatsApp Webhook
1. Go to Twilio Console → WhatsApp Sandbox
2. Set webhook URL: `https://sage-and-salt.vercel.app/api/whatsapp`
3. HTTP Method: POST

---

## 🔥 Firebase Setup

### Create Firestore Collection
1. Go to Firebase Console → Firestore Database
2. Create collection: `orders`
3. Add document structure (auto-created on first order):
```json
{
  "callSid": "string",
  "customer": {
    "name": "string",
    "phone": "string",
    "address": "string"
  },
  "orderItems": [
    {
      "item": "string",
      "size": "string",
      "flavor": "string"
    }
  ],
  "paymentMethod": "string",
  "source": "string",
  "status": "string",
  "createdAt": "timestamp",
  "serverTimestamp": "timestamp"
}
```

### Enable Anonymous Authentication
1. Go to Firebase Console → Authentication
2. Click "Sign-in method"
3. Enable "Anonymous"

---

## 🧪 Testing Before Production

### 1. Test Voice Call Flow
```bash
# Call your Twilio number
# You should hear: "Assalam o alaikum! Main Sage and Salt..."
# Say: "Pizza"
# Agent asks: "Kya size chahiye?"
# Say: "Large"
# Continue through the conversation...
```

### 2. Test WhatsApp Integration
```bash
# Send "Hi" to Twilio WhatsApp sandbox number
# You should receive the welcome message with capitalized "Pizzas"
```

### 3. Verify Firebase Orders
```bash
# After completing a voice call order
# Go to Firebase Console → Firestore
# Check "orders" collection for new document
```

### 4. Check Vercel Logs
```bash
# Go to Vercel Dashboard → Project → Deployments
# Click latest deployment → Functions logs
# Look for "[call-agent]" and "[save-order]" logs
```

---

## 📊 Conversation Flow Diagram

```
📞 User Calls → Twilio → /api/voice
                          ↓
                   Redirect to /api/call-agent?stage=welcome
                          ↓
1️⃣ Welcome (Groq Llama 70B): "Assalam o alaikum..."
   User: "Pizza mera"
                          ↓
2️⃣ Process Item (Llama 70B NLU): Extracts "Pizza"
   User: "Large"
                          ↓
3️⃣ Size Selection: Confirms size
   User: "Spicy"
                          ↓
4️⃣ Flavor: Confirms flavor
   User: "Ahmed Ali"
                          ↓
5️⃣ Name Collection
   User: "0300-1234567"
                          ↓
6️⃣ Phone Collection
   User: "123 Main St, Karachi"
                          ↓
7️⃣ Address Collection
   User: "COD"
                          ↓
8️⃣ Payment Method
   ✓ Save to Firestore
   ✓ Hangup
```

---

## 🔗 API Endpoints Summary

| Endpoint | Method | Purpose | WebhookURL |
|----------|--------|---------|-----------|
| `/api/voice` | POST | Twilio incoming call handler | From Twilio phone number config |
| `/api/call-agent` | POST | Natural conversation agent | Internal redirect from /api/voice |
| `/api/save-order` | POST | Save order to Firestore | Called from call-agent stage=payment |
| `/api/whatsapp` | POST | WhatsApp message handler | From Twilio WhatsApp webhook |

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| "Groq API Key not set" | Add GROQ_API_KEY to Vercel environment |
| "Firebase config incomplete" | Verify all FIREBASE_* vars are set |
| Order not saving | Check Firestore permissions (allow anonymous writes) |
| Speech not recognized | Ensure language="ur-PK" in TwiML |
| Twilio returns 404 | Verify webhook URL matches Vercel domain |

---

## 📝 Deployment Checklist

- [x] Code committed to main branch
- [x] Pushed to GitHub
- [ ] Environment variables added to Vercel
- [ ] Twilio webhook URLs updated
- [ ] Firebase Firestore collection created
- [ ] Firebase anonymous auth enabled
- [ ] Groq API key obtained
- [ ] OpenAI API key obtained
- [ ] Test voice call completed
- [ ] Test WhatsApp message completed
- [ ] Firebase order document verified
- [ ] Vercel deployment successful

---
- [ ] Groq API key created (https://console.groq.com/keys)
---

**Status:** ✅ Ready for Deployment  
**Last Updated:** 2024-05-09  
**Version:** 1.0.0

