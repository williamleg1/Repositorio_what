// ===============================
// WhatsApp Cloud API - BOT BÁSICO
// Centro de Convenciones Cartagena de Indias
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

// Memoria simple de sesiones (luego se puede pasar a BD)
const sessions = {};

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

    if (!message) return res.sendStatus(200);

    const from = message.from;
    const text = (message.text?.body || '').toLowerCase();

    console.log('📩 Mensaje de:', from);
    console.log('✉️ Texto:', text);

    // Crear sesión si no existe
    if (!sessions[from]) {
      sessions[from] = { step: 'menu', human: false };
      await sendTextMessage(from, getWelcomeMessage());
      return res.sendStatus(200);
    }

    // Si ya fue pasado a asesor, no responde el bot
    if (sessions[from].human) {
      console.log('👤 Conversación en manos de asesor');
      return res.sendStatus(200);
    }

    // Detectar solicitud de asesor
    if (
      text.includes('asesor') ||
      text.includes('humano') ||
      text.includes('persona')
    ) {
      sessions[from].human = true;

      await sendTextMessage(
        from,
        '👤 Perfecto, en un momento uno de nuestros asesores continuará la conversación contigo. Por favor espera un momento.'
      );

      return res.sendStatus(200);
    }

    // Opciones del menú
    switch (text) {
      case '1':
        await sendTextMessage(
          from,
          '📅 Con gusto te brindamos información sobre nuestros espacios y tipos de eventos. ¿Qué tipo de evento deseas realizar?'
        );
        break;

      case '2':
        await sendTextMessage(
          from,
          '💼 Para cotizar tu evento, por favor indícanos: tipo de evento, fecha estimada y número de asistentes.'
        );
        break;

      case '3':
        await sendTextMessage(
          from,
          '🏢 Si eres cliente o expositor, indícanos tu solicitud y con gusto te apoyamos.'
        );
        break;

      case '4':
        await sendTextMessage(
          from,
          '🛠️ Cuéntanos tu requerimiento y te brindaremos soporte a la mayor brevedad.'
        );
        break;

      default:
        await sendTextMessage(from, getMenuMessage());
        break;
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Error procesando mensaje:', error.response?.data || error);
    res.sendStatus(500);
  }
});

// -------------------------------
// TEXT MESSAGE FUNCTION
// -------------------------------
async function sendTextMessage(to, body) {
  const url = `https://graph.facebook.com/v22.0/${PHONE_NUMBER_ID}/messages`;

  await axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body }
    },
    {
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json'
      }
    }
  );

  console.log('✅ Texto enviado a:', to);
}

// -------------------------------
// MESSAGES
// -------------------------------
function getWelcomeMessage() {
  return (
    'Hola 👋\n' +
    'Gracias por comunicarte con el *Centro de Convenciones Cartagena de Indias*.\n\n' +
    '¿En qué podemos ayudarte hoy?\n\n' +
    '1️⃣ Quisiera saber más\n' +
    '2️⃣ Quiero cotizar mi evento\n' +
    '3️⃣ Clientes / Expositores\n' +
    '4️⃣ Soporte / Otros'
  );
}

function getMenuMessage() {
  return (
    'Por favor selecciona una opción del menú:\n\n' +
    '1️⃣ Quisiera saber más\n' +
    '2️⃣ Quiero cotizar mi evento\n' +
    '3️⃣ Clientes / Expositores\n' +
    '4️⃣ Soporte / Otros\n\n' +
    '👤 También puedes escribir *asesor* si deseas atención personalizada.'
  );
}

// -------------------------------
// START SERVER
// -------------------------------
app.listen(port, () => {
  console.log(`🚀 Bot activo en puerto ${port}`);
});


