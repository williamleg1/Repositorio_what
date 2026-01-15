// Import Express.js
const express = require('express');

// fetch (compatible con Node < 18)
const fetch = global.fetch || require('node-fetch');

// Create an Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Set port and verify_token
const port = process.env.PORT || 3000;
const verifyToken = process.env.VERIFY_TOKEN;

/**
 * =====================================================
 * GET /  -> Verificación del Webhook (Meta)
 * =====================================================
 */
app.get('/', (req, res) => {
  const {
    'hub.mode': mode,
    'hub.challenge': challenge,
    'hub.verify_token': token
  } = req.query;

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('✅ WEBHOOK VERIFIED');
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

/**
 * =====================================================
 * POST / -> Recibir mensajes y responder
 * =====================================================
 */
app.post('/', async (req, res) => {
  const entry = req.body.entry?.[0];
  const changes = entry?.changes?.[0];
  const value = changes?.value;
  const message = value?.messages?.[0];

  // Si no hay mensaje, responder OK
  if (!message) {
    return res.sendStatus(200);
  }

  const from = message.from;       // número del usuario
  const text = message.text?.body; // texto recibido

  console.log('📩 Mensaje recibido de:', from);
  console.log('✉️ Texto:', text);

  // Respuesta automática
  await sendMessage(
    from,
    'Hola 👋 gracias por escribirnos.\nEn un momento te atendemos.'
  );

  res.sendStatus(200);
});

/**
 * =====================================================
 * Función para enviar mensajes por WhatsApp Cloud API
 * =====================================================
 */
async function sendMessage(to, text) {
  try {
    await fetch(
      `https://graph.facebook.com/v19.0/${process.env.PHONE_NUMBER_ID}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to,
          text: { body: text }
        })
      }
    );
  } catch (error) {
    console.error('❌ Error enviando mensaje:', error);
  }
}

/**
 * =====================================================
 * Start the server
 * =====================================================
 */
app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
