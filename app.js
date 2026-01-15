// ===============================
// WhatsApp Cloud API - Webhook
// ===============================

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// Environment variables
const port = process.env.PORT || 3000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN;
const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// -------------------------------
// WEBHOOK VERIFICATION (GET)
// -------------------------------
app.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WEBHOOK VERIFIED');
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

// -------------------------------
// RECEIVE MESSAGES (POST)
// -------------------------------
app.post('/', async (req, res) => {
  try {
    const entry = req.body.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const message = value?.messages?.[0];

    if (!message) {
      return res.sendStatus(200);
    }

    const from = message.from;
    const text = message.text?.body || '';

    console.log('📩 Mensaje de:', from);
    console.log('✉️ Texto:', text);

    // Auto reply
    await sendMessage(
      from,
      'Hola 👋\nGracias por escribirnos.\nEn un momento te atenderemos.'
    );

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error procesando mensaje:', error.response?.data || error);
    res.sendStatus(500);
  }
});

// -------------------------------
// SEND MESSAGE FUNCTION
// -------------------------------
async function sendMessage(to, message) {
  const url = `https://graph.facebook.com/v19.0/${PHONE_NUMBER_ID}/messages`;

  await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to: to,
      text: { body: message }
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('✅ Respuesta enviada a:', to);
}

// -------------------------------
// START SERVER
// -------------------------------
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});

