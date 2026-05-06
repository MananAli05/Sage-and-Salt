# Sage & Salt Restaurant Management System

Restaurant ordering web app (React + Vite) with Twilio WhatsApp Sandbox chatbot webhook deployed on Vercel.

## Web App

- Production URL: https://sage-and-salt.vercel.app/
- Place order flow is available in the app UI.

## WhatsApp Sandbox Chatbot Flow

When a WhatsApp user sends a greeting (`hi`, `hello`, `start`, `hey`, `salam`, `السلام`), the bot replies with:

1. Welcome message
2. Short restaurant description
3. Order link: https://sage-and-salt.vercel.app/

For non-greeting messages, the bot sends a fallback message asking the user to type `Hi`.

## Twilio Sandbox Message Meaning

If you receive this from Twilio:

`Twilio Sandbox: ✅ You are all set! The sandbox can now send/receive messages from whatsapp:+14155238886.`

It means your WhatsApp number has joined your Twilio Sandbox successfully. Next, you must set your webhook URL in Twilio to connect sandbox messages to your app logic.

## Twilio + Vercel Setup (Important)

1. Deploy this project to Vercel.
2. Use this webhook URL in Twilio Sandbox settings:
	- `https://sage-and-salt.vercel.app/api/whatsapp`
3. Twilio Console path:
	- Messaging -> Try it out -> Send a WhatsApp message -> Sandbox settings
4. Under `When a message comes in`, paste the webhook URL above.
5. Set method to `HTTP POST`.
6. Save.
7. From your WhatsApp, send `Hi` to `+1 415 523 8886` (Twilio sandbox number).

Expected result: you receive the Sage & Salt welcome + order link response.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Git Update Commands

```bash
git add api/whatsapp.js README.md
git commit -m "feat: improve Twilio WhatsApp webhook and sandbox setup guide"
git push origin main
```
