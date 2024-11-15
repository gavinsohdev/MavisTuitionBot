require("dotenv").config();

// const TelegramBot = require('node-telegram-bot-api');
// const axios = require("axios");
const { Telegraf, Markup, session } = require("telegraf");
// const { message } = require("telegraf/filters");

const token = process.env.TELEGRAM_BOT_TOKEN;
const homepage_url = "https://78de-106-184-152-126.ngrok-free.app";

// const bot = new TelegramBot(token, {polling: true});
const bot = new Telegraf(token);

// const initialKeyboard = Markup.keyboard([
//   ['Yes', 'No'],
// ])
const dummyKeyboard = { keyboard: [[{ text: "Yes" }, { text: "No" }]] };

const initialKeyboard = {
  keyboard: [
    [
      { text: "Yes" },
      { text: "No" }
    ],
    [
      { text: "I have a question" }
    ],
    [
      { text: "App", web_app: { url: homepage_url } },
      { text: "Schedule", web_app: { url: "https://www.mavistutorial.com/schedule/" } },
      { text: "Branches", web_app: { url: "https://www.mavistutorial.com/branches" } }
    ],
  ],
  resize_keyboard: true, // Adjusts keyboard size to fit buttons
  one_time_keyboard: false, // Hides keyboard after a button is pressed
}

const stage1_yes_keyboard = {
  keyboard: [
    [
      { text: "⭐Login to your Mavis Online Account📝", web_app: { url: "https://lms.mavistutorial.com/" } }
    ],
    [
      { text: "I have a question" }
    ],
    [
      { text: "App", web_app: { url: homepage_url } },
      { text: "Schedule", web_app: { url: "https://www.mavistutorial.com/schedule/" } },
      { text: "Branches", web_app: { url: "https://www.mavistutorial.com/branches" } }
    ],
  ],
  resize_keyboard: true, // Adjusts keyboard size to fit buttons
  one_time_keyboard: false, // Hides keyboard after a button is pressed
}

const stage1_no_keyboard = {
  keyboard: [
    [
      { text: "⭐Create a Mavis Online Account📝", web_app: { url: "https://www.mavistutorial.com/lmsguide/" } }
    ],
    [
      { text: "I have a question" }
    ],
    [
      { text: "App", web_app: { url: homepage_url } },
      { text: "Schedule", web_app: { url: "https://www.mavistutorial.com/schedule/" } },
      { text: "Branches", web_app: { url: "https://www.mavistutorial.com/branches" } }
    ],
  ],
  resize_keyboard: true, // Adjusts keyboard size to fit buttons
  one_time_keyboard: false, // Hides keyboard after a button is pressed
}

const questionKeyboard = {
  inline_keyboard: [
    [
      { text: "Membership", callback_data: "question_membership" },
    ],
    [
      { text: "Question 2", callback_data: "question_2" },
    ],
    [
      { text: "Question 3", callback_data: "question_3" },
    ],
  ],
  resize_keyboard: true, // Adjusts keyboard size to fit buttons
  one_time_keyboard: true, // Hides keyboard after a button is pressed
}

bot.use(session());
bot.use((ctx, next) => {
  ctx.session = ctx.session || {};
  return next();
});

// Start command to send the first keyboard
bot.start((ctx) => {
  ctx.reply('Welcome to Mavis Tutorial Centre!\n\nDo you have Mavis Online Account?\n\n(If the Yes/No buttons are not shown, try switching between a keyboard and buttons by tapping on the icon on the right of the message box)', { reply_markup: initialKeyboard });
  ctx.session.stage = 1;
});

// First handler for "Button 1"
bot.on('text', (ctx, next) => {
  let stage = ctx.session.stage
  let text = ctx.message.text
  switch (true) {
    case (text === "Hello"):
      ctx.reply('Welcome to Mavis Tutorial Centre!\n\nDo you have Mavis Online Account?\n\n(If the Yes/No buttons are not shown, try switching between a keyboard and buttons by tapping on the icon on the right of the message box)', { reply_markup: initialKeyboard });
      ctx.session.stage = 1;
      break;
    case ((stage === 1) && (text === "Yes")):
      ctx.reply("Nice!\n\nClick the [⭐Login to your Mavis Online Account📝] button below\n\n(If no buttons are shown, try switching between a keyboard and buttons by tapping on the icon on the right of the message box)", { reply_markup: stage1_yes_keyboard });
      ctx.session.stage = 2;
      break;
    case ((stage === 1) && (text === "No")):
      ctx.reply("It's easy to create a Mavis Online Account!\n\nGet a free consultation when you sign up today\n\nTo create an account, click the [⭐Create a Mavis Online Account📝] button below", { reply_markup: stage1_no_keyboard });
      ctx.session.stage = 2;
      break;
    case (text === "I have a question"):
      ctx.reply("Good Day! Welcome to Mavis Tutorial Centre! What would you like assistance with?", { reply_markup: questionKeyboard });
      ctx.session.stage = 2;
      break;
    default:
      ctx.replyWithMarkdown(`Sorry, I did not understand that. Please say *Hello* to restart the conversation.`)
  }  
  console.log(ctx.session.stage)
  // if (ctx.session.stage == 1 && ctx.message.text === 'Yes') {
  //   ctx.reply('You clicked Button 1 after /start!');
  //   ctx.session.stage = 2;
  // } else if (ctx.session.stage == 1 && ctx.message.text === 'Yes')
  // {
  //     ctx.reply('Please use /start before pressing Button 1.');
  // }
  next();
});

bot.on('message', (ctx) => {
  if (ctx.message.web_app_data) {
    const data = JSON.parse(ctx.message.web_app_data.data);
    console.log('Received data from WebApp:', data);
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

// Fallback handler for any other text
// bot.on('text', (ctx) => {
//   ctx.reply("I didn't understand that command.");
// });

bot.launch();

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))