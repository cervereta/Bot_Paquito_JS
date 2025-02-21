require('dotenv').config();
const TelegramBot = require('node-telegram-bot-api');
const OpenAI = require('openai-api'); // Ensure correct import
console.log("OpenAI importado:", OpenAI);

// Configuración de APIs
const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN; // Token de Telegram
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY; // API Key de DeepSeek

const bot = new TelegramBot(TELEGRAM_TOKEN, { polling: true });
const openai = new OpenAI(DEEPSEEK_API_KEY); // Ensure correct configuration


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
  if (msg.from.is_bot) return;

  try {
    // Consultar a DeepSeek
    const completion = await openai.chat.completions.create({
      messages: [
        { 
          role: "system", 
          content: "Eres un asistente útil para un grupo de amigos en Telegram. Responde de forma concisa." 
        },
        { role: "user", content: userQuestion }
      ],
      model: "deepseek-chat",
    });

    const response = completion.choices && completion.choices.length > 0 ? completion.choices[0].message.content : "No se pudo obtener una respuesta.";
    
    // Responder mencionando al usuario (opcional)
    const userName = msg.from.username || msg.from.first_name;
    bot.sendMessage(
      chatId, 
      `@${userName} preguntó: *"${userQuestion}"*\n\n${response}`, // Mensaje con formato
      { parse_mode: 'Markdown' } // Permite formato en negritas, etc.
    );
    
} catch (error) {
  console.error("Error en /ask:", error.response ? error.response.data : error);
  bot.sendMessage(chatId, "❌ Error al procesar tu pregunta. Intenta de nuevo.");
}

});

// Escucha cuando se escribe solo "/ask" sin texto
bot.onText(/\/ask$/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(
      chatId, 
      "¡Hola! Por favor, escribe tu pregunta después del comando. Ejemplo:\n`/ask ¿Cuánto es 5+5?`",
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
      model: "deepseek-chat",
    });
    const response = completion.choices && completion.choices.length > 0 ? completion.choices[0].message.content : "No se pudo obtener un chiste.";
    bot.sendMessage(msg.chat.id, response);
  } catch (error) {
    console.error("Error en /joke:", error.response ? error.response.data : error);
    bot.sendMessage(msg.chat.id, "Oops, algo salió mal. ¡Inténtalo de nuevo!");
  }
});

bot.on('sticker', (msg) => {
  bot.sendMessage(msg.chat.id, "¡Qué sticker más divertido! 😄");
});