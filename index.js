require("dotenv").config();
const jwtSecret = process.env.JWT_SECRET || "default_secret_key";
const jwtExpiration = process.env.JWT_EXPIRATION || "30m";
const jwt = require("jsonwebtoken");
const express = require("express");
const { Telegraf, Markup, session } = require("telegraf");
const { rateLimit } = require("express-rate-limit");
const { slowDown } = require("express-slow-down");
const {
  initializeFirebaseApp,
  registerUser,
  updateUser,
  registerUserCoin,
  getUser,
  getUserCoins,
  updateUserCoins,
  getAllBranches,
  uploadReward,
  getAllRewards,
  updateReward,
  deleteReward,
  addToCart,
  deleteFromCart,
  getAllCart,
  placeOrder,
  updateOrder,
  getAllOrders,
  getAllOrdersWithUsers,
  cancelOrderTransaction,
  approveUser,
} = require("./firebase");

const token = process.env.TELEGRAM_BOT_TOKEN;
const homepage_url = "https://8528-2400-d802-26b8-9200-f83a-fa2f-78e5-1a10.ngrok-free.app";

const limiterRateLimit = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 10000, // each IP can make up to 100 requests per `windowsMs` (5 minutes)
  standardHeaders: true, // add the `RateLimit-*` headers to the response
  legacyHeaders: false, // remove the `X-RateLimit-*` headers from the response
});

const limiterSlowDown = slowDown({
  windowMs: 15 * 60 * 1000, // 5 minutes
  delayAfter: 1000, // allow 10 requests per `windowMs` (5 minutes) without slowing them down
  delayMs: (hits) => hits * 200, // add 200 ms of delay to every request after the 10th
  maxDelayMs: 5000, // max global delay of 5 seconds
});

const app = express();
const bot = new Telegraf(token);

app.use(express.json());

app.use(limiterRateLimit);
app.use(limiterSlowDown);
app.set("trust proxy", true);

initializeFirebaseApp();

app.post("/test", async (req, res) => {
  console.log(`req: ${JSON.stringify(req.body)}`);
  try {
    const chatId = req.body.chatId; // Ensure the request body includes the chat ID
    const message = req.body.message || "Default message"; // Use a default message if none is provided

    // Use bot.telegram.sendMessage to send a message to the chat
    await bot.telegram.sendMessage(chatId, message);
    res.status(200).send("Message sent successfully");
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).send("Failed to send message");
  }
});

// app.post("/verify-signature", async (req, res) => {
//   try {
//     const data = req.body;
//     console.log('data: ' + JSON.stringify(data))
//     res.status(200).send("Message sent successfully");
//   } catch (error) {
//     console.error("Error sending message:", error);
//     res.status(500).send("Failed to send message");
//   }
// });

const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1]; // Expecting "Bearer <token>"

  if (!token) {
    console.error("Token is required");
    return res
      .status(403)
      .send({ status: false, message: "Token is required." });
  }

  jwt.verify(token, jwtSecret, (err, decoded) => {
    if (err) {
      return res.status(401).send({ status: false, message: "Invalid token." });
    }

    req.user = decoded; // Add decoded user data to request object
    next(); // Proceed to the next middleware
  });
};

app.post("/register-user", async (req, res) => {
  const data = req.body;
  try {
    await registerUser(data);
    if (data.role == "Student") {
      await registerUserCoin(data);
    }

    // Generate a JWT token
    const token = jwt.sign({ id: data.id, role: data.role }, jwtSecret, {
      expiresIn: jwtExpiration,
    });

    res.status(200).send({ status: true, token });
  } catch (error) {
    console.error("Error registering user data:", error);
    res.status(500).send({ status: false, message: "Internal server error." });
  }
});

app.post("/update-user", verifyToken, async (req, res) => {
  const data = req.body;
  try {
    await updateUser(data);
    res.status(200).send({ status: true });
  } catch (error) {
    console.error("Error updating user data:", error);
    res.status(500).send({ status: false, message: "Internal server error." });
  }
});

app.post("/initialize-app", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    return res.status(400).send({ status: false, message: "ID is required." });
  }
  try {
    const user = await getUser(id);

    if (user) {
      // Generate token for the existing user
      const token = jwt.sign({ id: user.id, role: user.role }, jwtSecret, {
        expiresIn: jwtExpiration,
      });
      return res.status(200).send({ status: true, dataObj: user, token });
    }

    res
      .status(404)
      .send({ status: false, message: "No user found with the id" });
  } catch (error) {
    console.error("Error initializing app:", error);
    res.status(500).send({ status: false, message: "Internal server error." });
  }
});

app.post("/get-user", verifyToken, async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) {
      return res
        .status(400)
        .send({ status: false, message: "ID is required." });
    }
    const user = await getUser(id);
    if (user) {
      return res.status(200).send({ status: true, dataObj: user });
    }
    res
      .status(200)
      .send({ status: false, message: "No user found with the id" });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).send({ status: false, message: "Internal server error." });
  }
});

// app.post("/checkMembership", async (req, res) => {
//   const { id, first_name, last_name, username, language_code, photo_url } =
//     req.body;
//   const userRef = db.collection("users").doc(id);
//   const doc = await userRef.get();
//   if (!doc.exists) {
//     console.log(`Doc: ${doc}`);
//     return true;
//   } else {
//     console.log("Document data:", doc.data());
//     return false;
//   }
// });

app.post("/get-coins", verifyToken, async (req, res) => {
  const { id } = req.body;
  try {
    const dataResponse = await getUserCoins(id);
    res.status(200).send(dataResponse);
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error." });
  }
});

app.post("/update-coins", verifyToken, async (req, res) => {
  const { id, coinAmount } = req.body;
  try {
    const dataResponse = await updateUserCoins(id, coinAmount);
    res.status(200).send({ status: true, coin: coinAmount });
  } catch (error) {
    res.status(500).send({ status: false, error: "Internal Server Error." });
  }
});

app.post("/get-all-branches", async (req, res) => {
  try {
    const dataResponse = await getAllBranches(); // Call the helper function
    res.status(200).send({ status: true, dataObj: dataResponse }); // Send data back to the client
  } catch (error) {
    console.error("Error retrieving branches:", error);
    res.status(500).send({ error: "Internal Server Error." });
  }
});

app.post("/get-all-rewards", verifyToken, async (req, res) => {
  try {
    const dataResponse = await getAllRewards();
    res.status(200).send({ status: true, dataObj: dataResponse });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error." });
  }
});

app.post("/upload-reward", verifyToken, async (req, res) => {
  const { payload: data } = req.body;
  try {
    const dataResponse = await uploadReward(data);
    res.status(200).send({ status: true });
  } catch (error) {
    console.error("Error uploading reward:", error);
    res.status(500).send({ status: false, message: "Internal server error." });
  }
});

app.post("/update-reward", verifyToken, async (req, res) => {
  const data = req.body;
  try {
    const dataResponse = await updateReward(data?.payload);
    res.status(200).send({ status: true });
  } catch (error) {
    console.error("Error updating reward data:", error);
    res.status(500).send({ status: false, message: "Internal server error." });
  }
});

app.post("/delete-reward", verifyToken, async (req, res) => {
  const { id } = req.body;
  try {
    const dataResponse = await deleteReward(id);
    res.status(200).send({ status: true });
  } catch (error) {
    console.error("Error deleting reward data:", error);
    res.status(500).send({ status: false, message: "Internal server error." });
  }
});

app.post("/get-all-cart", verifyToken, async (req, res) => {
  const { id } = req.body;
  try {
    const dataResponse = await getAllCart(id);
    res.status(200).send({ status: true, dataObj: dataResponse });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error." });
  }
});

app.post("/add-to-cart", verifyToken, async (req, res) => {
  const { id = "", reward = {} } = req.body;
  try {
    const dataResponse = await addToCart(id, reward);
    res.status(200).send({ status: true });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).send({ status: false, message: "Internal server error." });
  }
});

app.post("/delete-from-cart", verifyToken, async (req, res) => {
  const { id = "", itemId = "" } = req.body;
  try {
    const dataResponse = await deleteFromCart(id, itemId);
    res.status(200).send({ status: true });
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).send({ status: false, message: "Internal server error." });
  }
});

app.post("/place-order", verifyToken, async (req, res) => {
  const data = req.body;
  try {
    const dataResponse = await placeOrder(data?.id);
    if (dataResponse === "INSUFFICIENT_COINS") {
      // Handle insufficient coins scenario
      res.status(200).send({
        status: false,
        message: "INSUFFICIENT_COINS",
      });
    } else if (dataResponse === "REWARD_NOT_AVAILABLE_IN_ONE_OR_MORE_BRANCHES") {
      res.status(200).send({
        status: false,
        message: "REWARD_NOT_AVAILABLE_IN_ONE_OR_MORE_BRANCHES",
      });
    } else {
      // Handle successful order placement with new coin balance
      res.status(200).send({
        status: true,
        message: "ORDER SUCCESSFUL",
        newCoinBalance: dataResponse,
      });
    }
  } catch (error) {
    console.error("Error updating reward data:", error);
    res.status(500).send({ status: false, message: "Internal server error." });
  }
});

app.post("/get-all-orders", verifyToken, async (req, res) => {
  const { id } = req.body;
  try {
    const dataResponse = await getAllOrders(id);
    res.status(200).send({ status: true, dataObj: dataResponse });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error." });
  }
});

// app.get("/get-all-orders-with-users", verifyToken, async (req, res) => {
//   try {
//     const dataResponse = await getAllOrdersWithUsers();
//     res.status(200).send({ status: true, dataObj: dataResponse });
//   } catch (error) {
//     res.status(500).send({ error: "Internal Server Error." });
//   }
// });

app.get("/get-all-orders-with-users", verifyToken, async (req, res) => {
  const { limit = 10, startAfterDocId = null } = req.query;
  try {
    const dataResponse = await getAllOrdersWithUsers(Number(limit), startAfterDocId);
    res.status(200).send({ status: true, dataObj: dataResponse });
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error." });
  }
});

app.post("/update-order", verifyToken, async (req, res) => {
  const {
    orderId,
    adminData: { first_name, last_name },
  } = req.body;

  const admin_fullname = `${first_name} ${last_name}`;

  try {
    const dataResponse = await updateOrder(orderId, admin_fullname);

    // Log the response for debugging
    console.log("dataResponse:", JSON.stringify(dataResponse));

    // Check for specific error types and respond accordingly
    if (!dataResponse.success) {
      switch (dataResponse.errorType) {
        case "ORDER_NOT_FOUND":
          res.status(404).send({
            status: false,
            message: "Order not found.",
            data: dataResponse.data,
          });
          break;
        case "INVALID_ORDER_ITEMS":
          res.status(400).send({
            status: false,
            message: "Order items are not in a valid format.",
            data: dataResponse.data,
          });
          break;
        case "INVALID_ORDER_STATUS":
          res.status(400).send({
            status: false,
            message: "Order is not in a valid state to execute.",
            data: dataResponse.data,
          });
          break;
        case "MISSING_REWARD_ID":
          res.status(400).send({
            status: false,
            message: "Reward ID is missing for an item in the order.",
            data: dataResponse.data,
          });
          break;
        case "REWARD_NOT_FOUND":
          res.status(404).send({
            status: false,
            message: `Reward not found for ID: ${dataResponse.data}.`,
            data: dataResponse.data,
          });
          break;
        case "INSUFFICIENT_REWARD_QUANTITY":
          res.status(400).send({
            status: false,
            message: `Insufficient quantity for reward ID: ${dataResponse.data.rewardId}. Available: ${dataResponse.data.available}, Requested: ${dataResponse.data.requested}.`,
            data: dataResponse.data,
          });
          break;
        case "TRANSACTION_ERROR":
          res.status(500).send({
            status: false,
            message: "Transaction error occurred.",
            details: dataResponse.message,
          });
          break;
        default:
          res.status(500).send({
            status: false,
            message: "An unknown error occurred.",
            data: dataResponse.data,
          });
      }
    } else {
      // Success response
      console.log("Order executed successfully!");
      res.status(200).send({
        status: true,
        message: "Order executed successfully.",
        data: dataResponse.data,
      });
    }
  } catch (error) {
    console.error("Error updating order:", error);
    res.status(500).send({
      status: false,
      message: "Internal server error.",
    });
  }
});

app.post("/cancel-order", verifyToken, async (req, res) => {
  const { orderId, totalPrice, adminData } = req.body;
  try {
    const dataResponse = await cancelOrderTransaction(orderId, totalPrice, adminData);

    if (!dataResponse.success) {
      res.status(400).send({
        status: false,
        message: dataResponse.message || "Failed to cancel the order.",
        data: dataResponse.data,
      });
    } else {
      res.status(200).send({
        status: true,
        message: `Order successfully canceled. ${totalPrice} coins refunded to the user. User's new coin balance: ${dataResponse.data.updatedCoins} coins`,
        data: dataResponse.data,
      });
    }
  } catch (error) {
    console.error("Error canceling order:", error);
    res.status(500).send({
      status: false,
      message: "Internal server error.",
    });
  }
});

app.post("/approve-user", verifyToken, async (req, res) => {
  const { userId } = req.body; // Extract userId from the request body
  try {
    const approvalResponse = await approveUser(userId);

    if (approvalResponse === "Student") {
      res
        .status(200)
        .send({ status: false, message: "User is a student." });
    } else if (approvalResponse === "AlreadyApproved") {
      res
        .status(200)
        .send({ status: false, message: "User is already approved." });
    } else if (approvalResponse) {
      res
        .status(200)
        .send({ status: true, message: "User approved successfully." });
    } else {
      res
        .status(404)
        .send({ status: false, message: "User not found or approval failed." });
    }
  } catch (error) {
    console.error("Error approving user:", error);
    res.status(500).send({ error: "Internal Server Error." });
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
    console.error("Error processing request:", error);
    res.status(500).send("Internal server error");
  }
});

function verifyTelegramSignature(data) {
  const { hash, ...userData } = data;
  const sortedData = Object.keys(userData)
    .sort()
    .map((key) => `${key}=${userData[key]}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(BOT_TOKEN).digest();

  const calculatedHash = crypto
    .createHmac("sha256", secretKey)
    .update(sortedData)
    .digest("hex");

  return calculatedHash === hash;
}

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
  const args = ctx.message.text.split(" ");
  if (args.length > 1) {
    const parameter = args[1];
    if (parameter === "promo") {
      ctx.reply("Welcome! Here's a special promotion just for you.");
    } else if (parameter === "support") {
      ctx.reply("How can I assist you today?");
    } else {
      ctx.reply("Thanks for joining! Let's get started.");
    }
  } else {
    ctx.reply(
      "Welcome to Mavis Tutorial Centre!\n\nDo you have Mavis Online Account?\n\n(If the Yes/No buttons are not shown, try switching between a keyboard and buttons by tapping on the icon on the right of the message box)",
      { reply_markup: initialKeyboard }
    );
  }
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

// bot.on("message", (ctx) => {
//   if (ctx.message.web_app_data) {
//     const data = JSON.parse(ctx.message.web_app_data.data);
//     console.log("Received data from WebApp:", data);
//     ctx.reply(`Data received: ${data.status} at ${data.timestamp}`);
//   }
// });

bot.on("message", async (ctx) => {
  if (ctx?.message?.web_app_data) {
    const data = JSON.parse(ctx?.message?.web_app_data?.data);
    // console.log('data: ' + JSON.stringify(ctx))
    if (data.score !== undefined) {
      // console.log("Received score from WebApp:", data);
      const dataResponse = await getUserCoins(String(ctx?.message?.chat?.id));
      ctx.reply(
        `Your score: ${data.score}. Well done ${ctx?.message?.chat?.first_name}! 🎉`
      );
      // console.log('JSON.stringify(dataResponse): ' + JSON.stringify(dataResponse))
      ctx.reply(`You gained ${dataResponse?.coin} coins!`);
    } else {
      console.log("Received data from WebApp:", data);
      ctx.reply(`Data received: ${data.status} at ${data.timestamp}`);
    }
  } else {
    ctx.reply("Send data through the WebApp.");
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
