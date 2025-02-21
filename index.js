require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const { OpenAI } = require('openai'); // Biblioteca oficial de OpenAI

console.log("OpenAI importado:", OpenAI);

// Configuración de APIs
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; // Token de Telegram
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY; // API Key de DeepSeek
const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const openai = new OpenAI({ apiKey: DEEPSEEK_API_KEY });

// Mensaje de bienvenida
bot.onText(/\/start/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(chatId, '¡Hola! Soy Paquito tu bot con inteligencia de DeepSeek. ¿En qué puedo ayudarte?');
});

// Escucha SOLO cuando se usa /ask <pregunta>
bot.onText(/\/ask (.+)/, async (msg, match) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const userQuestion = match[1]; // Captura el texto después de "/ask "

  // Evitar que el bot se responda a sí mismo
  if (msg.from && msg.from.is_bot) return;

  try {
    console.log("Procesando pregunta:", userQuestion);

    // Consultar a OpenAI (DeepSeek)
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "Eres un asistente útil para un grupo de amigos en Telegram. Responde de forma concisa." },
        { role: "user", content: userQuestion }
      ],
      model: "gpt-3.5-turbo", // Cambia a un modelo compatible si es necesario
    });

    console.log("Respuesta completa de OpenAI:", completion);

    const response = completion?.choices?.[0]?.message?.content || "No se pudo obtener una respuesta.";
    
    // Responder mencionando al usuario (opcional)
    const userName = msg.from.username || msg.from.first_name;
    bot.sendMessage(
      chatId, 
      `@${userName} preguntó: *"${userQuestion}"*\n\n${response}`, // Mensaje con formato
      { parse_mode: 'Markdown' } // Permite formato en negritas, etc.
    );
  } catch (error) {
    console.error("Error en /ask:", error.response ? error.response.data : error.message);
    bot.sendMessage(chatId, "❌ Error al procesar tu pregunta. Detalles: " + (error.message || "Desconocido"));
  }
});

// Escucha cuando se escribe solo "/ask" sin texto
bot.onText(/\/ask$/, (msg) => {
  const chatId = msg.chat.id;
  bot.sendMessage(
    chatId, 
    "Por favor, escribe tu pregunta después del comando. Ejemplo:\n`/ask ¿Cuál es la capital de Francia?`\nO intenta con `/help` para ver más comandos.",
    { parse_mode: 'Markdown' }
  );
});

// Comando /help
bot.onText(/\/help/, (msg) => {
  const helpText = `
  Comandos disponibles:
  /start - Inicia el bot
  /help - Muestra esta ayuda
  /joke - Cuenta un chiste
  `;
  bot.sendMessage(msg.chat.id, helpText);
});

// Comando /joke
bot.onText(/\/joke/, async (msg) => {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "Eres un comediante. Cuenta un chiste corto y divertido en español." },
      ],
      model: "gpt-3.5-turbo", // Cambia a un modelo compatible si es necesario
    });
    const response = completion?.choices?.[0]?.message?.content || "No se pudo obtener un chiste.";
    bot.sendMessage(msg.chat.id, response);
  } catch (error) {
    console.error("Error en /joke:", error.response ? error.response.data : error.message);
    bot.sendMessage(msg.chat.id, "Oops, algo salió mal. ¡Inténtalo de nuevo!");
  }
});

bot.on('sticker', (msg) => {
  bot.sendMessage(msg.chat.id, "¡Qué sticker más divertido! 😄");
});