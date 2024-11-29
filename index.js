require("dotenv").config();
const express = require("express");
// const bodyParser = require("body-parser");
const { Telegraf, Markup, session } = require("telegraf");

const token = process.env.TELEGRAM_BOT_TOKEN;
const homepage_url = "https://gavinsohdev.github.io/MavisReactKeyboardMiniApp/";

const cors = require('cors');
const app = express();
const bot = new Telegraf(token);

app.use(cors({ origin: '*', methods: 'GET,POST,OPTIONS,PUT,DELETE' }));
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());
app.use(express.json());

app.post("*", async (req, res) => {
  console.log(`req: ${JSON.stringify(req.body)}`)
  try {
    const chatId = req.body.chatId; // Make sure the request body includes the chat ID
    const message = req.body.message || "Default message"; // Optionally pass a message from the request
    
    // Use bot.telegram.sendMessage to send a message to the chat
    await bot.telegram.sendMessage(chatId, message);
    res.status(200).send("Message sent successfully");
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).send("Failed to send message");
  }
});
app.get("*", async (req, res) => {
  // Access query parameters from the request
  const { chatId, message } = req.query;

  // Check if chatId and message are provided in the query
  if (!chatId || !message) {
    return res.status(400).send("chatId and message are required");
  }

  try {
    // Example logic to process the chatId and message
    console.log(`Received chatId: ${chatId}, message: ${message}`);
    
    // Send a success response
    res.status(200).send({
      success: true,
      chatId,
      message,
    });

  } catch (error) {
    // Handle any errors that occur during processing
    console.error('Error processing request:', error);
    res.status(500).send('Internal server error');
  }
});

const dummyKeyboard = { keyboard: [[{ text: "Yes" }, { text: "No" }]] };

const initialKeyboard = {
  keyboard: [
    [{ text: "Yes" }, { text: "No" }],
    [{ text: "I have a question" }],
    [
      { text: "App", web_app: { url: homepage_url } },
      {
        text: "Schedule",
        web_app: { url: "https://www.mavistutorial.com/schedule/" },
      },
      {
        text: "Branches",
        web_app: { url: "https://www.mavistutorial.com/branches" },
      },
    ],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
};

const stage1_yes_keyboard = {
  keyboard: [
    [
      {
        text: "⭐Login to your Mavis Online Account📝",
        web_app: { url: "https://lms.mavistutorial.com/" },
      },
    ],
    [{ text: "I have a question" }],
    [
      { text: "App", web_app: { url: homepage_url } },
      {
        text: "Schedule",
        web_app: { url: "https://www.mavistutorial.com/schedule/" },
      },
      {
        text: "Branches",
        web_app: { url: "https://www.mavistutorial.com/branches" },
      },
    ],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
};

const stage1_no_keyboard = {
  keyboard: [
    [
      {
        text: "⭐Create a Mavis Online Account📝",
        web_app: { url: "https://www.mavistutorial.com/lmsguide/" },
      },
    ],
    [{ text: "I have a question" }],
    [
      { text: "App", web_app: { url: homepage_url } },
      {
        text: "Schedule",
        web_app: { url: "https://www.mavistutorial.com/schedule/" },
      },
      {
        text: "Branches",
        web_app: { url: "https://www.mavistutorial.com/branches" },
      },
    ],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
};

const questionKeyboard = {
  inline_keyboard: [
    [{ text: "Membership", callback_data: "question_membership" }],
    [{ text: "Question 2", callback_data: "question_2" }],
    [{ text: "Question 3", callback_data: "question_3" }],
  ],
  resize_keyboard: true,
  one_time_keyboard: true,
};

bot.use(session());
bot.use((ctx, next) => {
  ctx.session = ctx.session || {};
  return next();
});

bot.start((ctx) => {
  ctx.reply(
    "Welcome to Mavis Tutorial Centre!\n\nDo you have Mavis Online Account?\n\n(If the Yes/No buttons are not shown, try switching between a keyboard and buttons by tapping on the icon on the right of the message box)",
    { reply_markup: initialKeyboard }
  );
  ctx.session.stage = 1;
});

bot.on("text", (ctx, next) => {
  let stage = ctx.session.stage;
  let text = ctx.message.text;
  switch (true) {
    case text === "Hello":
      ctx.reply(
        "Welcome to Mavis Tutorial Centre!\n\nDo you have Mavis Online Account?\n\n(If the Yes/No buttons are not shown, try switching between a keyboard and buttons by tapping on the icon on the right of the message box)",
        { reply_markup: initialKeyboard }
      );
      ctx.session.stage = 1;
      break;
    case stage === 1 && text === "Yes":
      ctx.reply(
        "Nice!\n\nClick the [⭐Login to your Mavis Online Account📝] button below\n\n(If no buttons are shown, try switching between a keyboard and buttons by tapping on the icon on the right of the message box)",
        { reply_markup: stage1_yes_keyboard }
      );
      ctx.session.stage = 2;
      break;
    case stage === 1 && text === "No":
      ctx.reply(
        "It's easy to create a Mavis Online Account!\n\nGet a free consultation when you sign up today\n\nTo create an account, click the [⭐Create a Mavis Online Account📝] button below",
        { reply_markup: stage1_no_keyboard }
      );
      ctx.session.stage = 2;
      break;
    case text === "I have a question":
      ctx.reply(
        "Good Day! Welcome to Mavis Tutorial Centre! What would you like assistance with?",
        { reply_markup: questionKeyboard }
      );
      ctx.session.stage = 2;
      break;
    default:
      ctx.replyWithMarkdown(
        `Sorry, I did not understand that. Please say *Hello* to restart the conversation.`
      );
  }
  console.log(ctx.session.stage);
  next();
});

bot.on("message", (ctx) => {
  if (ctx.message.web_app_data) {
    const data = JSON.parse(ctx.message.web_app_data.data);
    console.log("Received data from WebApp:", data);
    ctx.reply(`Data received: ${data.status} at ${data.timestamp}`);
  }
});

bot.action("question_membership", (ctx) => {
  ctx.answerCbQuery();
  ctx.reply("Question");
});

bot.action("question_2", (ctx) => {
  ctx.answerCbQuery();
  ctx.reply("Question 2");
});

bot.action("question_3", (ctx) => {
  ctx.answerCbQuery();
  ctx.reply("Question 3");
});

bot.launch();
// bot.startWebhook();

process.once("SIGINT", () => bot.stop("SIGINT"));
process.once("SIGTERM", () => bot.stop("SIGTERM"));

// Start the server
const PORT = 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
