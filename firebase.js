const { initializeApp } = require("firebase/app");
const {
  runTransaction,
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  where
} = require("firebase/firestore");

const {
  FIREBASE_API_KEY,
  FIREBASE_AUTH_DOMAIN,
  FIREBASE_PROJECT_ID,
  FIREBASE_STORAGE_BUCKET,
  FIREBASE_MESSAGE_SENDER_ID,
  FIREBASE_APP_ID,
  FIREBASE_MEASUREMENT_ID,
} = process.env;

const firebaseConfig = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
  storageBucket: FIREBASE_STORAGE_BUCKET,
  messagingSenderId: FIREBASE_MESSAGE_SENDER_ID,
  appId: FIREBASE_APP_ID,
  measurementId: FIREBASE_MEASUREMENT_ID,
};

let app;
let firestoreDb;

const initializeFirebaseApp = () => {
  try {
    app = initializeApp(firebaseConfig);
    firestoreDb = getFirestore();
    return app;
  } catch (error) {
    console.log(error);
  }
};

const registerUser = async (data) => {
  try {
    const document = doc(firestoreDb, "users", data?.id);
    let dataUpdated = await setDoc(document, data);
    return dataUpdated;
  } catch (error) {
    console.log(error);
  }
};

const updateUser = async ({ data, id }) => {
  const documentRef = doc(firestoreDb, "users", id);

  try {
    // Fetch the current document data
    const currentDoc = await getDoc(documentRef);

    if (currentDoc.exists()) {
      const currentData = currentDoc.data();
      const updatedFields = {};

      // Check for changes in fields
      for (const key in data) {
        if (data[key] !== currentData[key]) {
          updatedFields[key] = data[key];
        }
      }

      // If there are changes, update the document
      if (Object.keys(updatedFields).length > 0) {
        await updateDoc(documentRef, updatedFields);
        console.log("Document updated with fields:", updatedFields);
        return updatedFields;
      } else {
        console.log("No changes detected.");
        return null;
      }
    } else {
      console.error("Document does not exist. Consider registering the user.");
    }
  } catch (error) {
    console.error("Error updating user data:", error);
  }
};

const registerUserCoin = async (data) => {
  const dataToUpload = { coin: 0, id: String(data?.id), last_updated: new Date().toISOString() };
  try {
    const document = doc(firestoreDb, "user_coins", String(data?.id));
    let dataUpdated = await setDoc(document, dataToUpload);
    return dataUpdated;
  } catch (error) {
    console.log(error);
  }
};

// const getUsers = async (id) => {
//   try {
//     const collectionRef = collection(firestoreDb, "users");
//     const finalData = [];
//     const q = query(collectionRef, where("id", "==", id));

//     const docSnap = await getDocs(q);

//     docSnap.forEach((doc) => {
//       finalData.push(doc.data());
//     });
//     return finalData;
//   } catch (error) {
//     console.log(error);
//   }
// };

const getUser = async (id) => {
  try {
    // Reference to the document based on the provided `id`
    const userDocRef = doc(firestoreDb, "users", id);

    // Fetch the document
    const docSnap = await getDoc(userDocRef);

    // Check if the document exists
    if (docSnap.exists()) {
      return docSnap.data(); // Return the data if the document exists
    }

    // Return null if the document does not exist
    return null;
  } catch (error) {
    console.log(error);
    throw new Error("Error fetching user data.");
  }
};

const getUserCoins = async (id) => {
  const coinDocRef = doc(firestoreDb, "user_coins", id);
  const docSnap = await getDoc(coinDocRef);
  if (docSnap.exists()) {
    return docSnap.data();
  } else {
    console.log("No coin data found for user:", id);
    return null;
  }
};

const updateUserCoins = async (id, coinAmount) => {
  const coinDocRef = doc(firestoreDb, "user_coins", id);
  await setDoc(
    coinDocRef,
    {
      id,
      coin: coinAmount,
      last_updated: new Date().toISOString(),
    },
    { merge: true }
  );
  console.log(`Coins for user ${id} updated to ${coinAmount}`);
};

const uploadReward = async (data) => {
  try {
    const document = doc(firestoreDb, "rewards", data.id);
    let dataUpdated = await setDoc(document, data);
    return dataUpdated;
  } catch (error) {
    console.log(error);
  }
};

const getAllRewards = async () => {
  try {
    // Reference the "rewards" collection
    const rewardsCollection = collection(firestoreDb, "rewards");
    
    // Fetch all documents in the "rewards" collection
    const snapshot = await getDocs(rewardsCollection);
    
    // Map through the documents and extract their data
    const rewards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    return rewards;
  } catch (error) {
    console.error("Error retrieving rewards:", error);
    return [];
  }
};

const updateReward = async (data) => {
  const documentRef = doc(firestoreDb, "rewards", data.id);

  try {
    // Fetch the current document data
    const currentDoc = await getDoc(documentRef);

    if (currentDoc.exists()) {
      const currentData = currentDoc.data();
      const updatedFields = {};
      // Check for changes in fields
      for (const key in data) {
        if (data[key] !== currentData[key]) {
          updatedFields[key] = data[key];
        }
      }

      // If there are changes, update the document
      if (Object.keys(updatedFields).length > 0) {
        await updateDoc(documentRef, updatedFields);
        return updatedFields;
      } else {
        console.log("No changes detected.");
        return null;
      }
    } else {
      console.error("Reward document does not exist.");
    }
  } catch (error) {
    console.error("Error updating reward data:", error);
  }
};

const deleteReward = async (id) => {
  try {
    // Reference the specific document in the "rewards" collection
    const documentRef = doc(firestoreDb, "rewards", id);

    // Delete the document
    await deleteDoc(documentRef);

    console.log(`Reward with ID ${id} deleted successfully.`);
    return true;
  } catch (error) {
    console.error(`Error deleting reward with ID ${id}:`, error);
    return false;
  }
};

const addToCart = async (userId, reward) => {
  const documentRef = doc(firestoreDb, "carts", userId);
  const cartDoc = await getDoc(documentRef);

  if (cartDoc.exists()) {
    const cartData = cartDoc.data();
    const existingItemIndex = cartData.items.findIndex(item => item.id === reward.id);
    if (existingItemIndex >= 0) {
      cartData.items[existingItemIndex].quantity += 1;
    } else {
      cartData.items.push({ ...reward, quantity: 1 });
    }
    cartData.total_price = cartData.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    await setDoc(
      documentRef,
      cartData,
      { merge: true }
    );
  } else {
    const newCart = {
      id: userId,
      items: [{ ...reward, quantity: 1 }],
      total_price: reward.price,
      last_updated: new Date().toISOString()
    };
    await setDoc(
      documentRef,
      newCart
    );
  }
};

const deleteFromCart = async (userId, itemId) => {
  const documentRef = doc(firestoreDb, "carts", userId);
  const cartDoc = await getDoc(documentRef);

  if (cartDoc.exists()) {
    const cartData = cartDoc.data();
    const itemIndex = cartData.items.findIndex(item => item.id === itemId);

    if (itemIndex >= 0) {
      const item = cartData.items[itemIndex];
      
      // Decrease quantity or remove item
      if (item.quantity > 1) {
        cartData.items[itemIndex].quantity -= 1;
      } else {
        cartData.items.splice(itemIndex, 1); // Remove the item if quantity is 1
      }

      // Recalculate total price
      cartData.total_price = cartData.items.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      // Update last_updated timestamp
      cartData.last_updated = new Date().toISOString();

      // Save updated cart to Firestore
      await setDoc(documentRef, cartData, { merge: true });
    } else {
      console.error("Item not found in the cart");
    }
  } else {
    console.error("Cart not found for user:", userId);
  }
};

const getAllCart = async (userId) => {
  try {
    const documentRef = doc(firestoreDb, "carts", userId);
    const cartDoc = await getDoc(documentRef);

    if (cartDoc.exists()) {
      return cartDoc.data(); // Return the cart data
    } else {
      console.error("Cart not found for user:", userId);
      return null; // Return null if the cart doesn't exist
    }
  } catch (error) {
    console.error("Error retrieving cart:", error);
    throw error; // Re-throw the error for upstream handling
  }
};

const getAllOrders = async (userId) => {
  try {
    const ordersCollectionRef = collection(firestoreDb, "orders"); // Replace "orders" with the actual collection name
    const q = query(ordersCollectionRef, where("user_id", "==", userId)); // Query orders for matching user_id

    const querySnapshot = await getDocs(q);

    const orders = [];

    querySnapshot.forEach((doc) => {
      const orderData = doc.data();
      orders.push(orderData); // Add each order's data to the orders array
    });

    if (orders.length > 0) {
      return orders; // Return the array of orders with matching user_id
    } else {
      console.error("No orders found for user:", userId);
      return null; // Return null if no orders are found for the user
    }
  } catch (error) {
    console.error("Error retrieving orders:", error);
    throw error; // Re-throw the error for upstream handling
  }
};

const placeOrder = async (userId) => {
  try {
    const cartRef = doc(firestoreDb, "carts", userId);
    const userCoinsRef = doc(firestoreDb, "user_coins", userId);
    const ordersCollectionRef = collection(firestoreDb, "orders");

    const result = await runTransaction(firestoreDb, async (transaction) => {
      // Fetch cart data
      const cartDoc = await transaction.get(cartRef);
      if (!cartDoc.exists()) throw new Error("Cart not found");
      const cartData = cartDoc.data();

      // Fetch user's coin balance
      const userCoinsDoc = await transaction.get(userCoinsRef);
      if (!userCoinsDoc.exists()) throw new Error("User coins not found");
      const userCoins = userCoinsDoc.data();

      // Check if the user has sufficient coins
      if (userCoins.coin < cartData.total_price) {
        // Return a specific value indicating insufficient coins
        return "INSUFFICIENT_COINS";
      }

      // Deduct coins
      const newCoinBalance = userCoins.coin - cartData.total_price;
      transaction.update(userCoinsRef, { coin: newCoinBalance });

      // Create a new order
      const newOrderRef = doc(ordersCollectionRef); // Automatically generates an ID
      transaction.set(newOrderRef, {
        user_id: userId,
        items: cartData.items,
        total_price: cartData.total_price,
        status: "Pending",
        date_ordered: new Date().toISOString(),
        date_completed: { date: null, completed_by: null }
      });

      // Clear the user's cart
      transaction.delete(cartRef);

      return newCoinBalance; // Return the new coin balance
    });

    console.log(`${result}`);
    return result;
  } catch (error) {
    console.error("Error placing order:", error);
    throw error;
  }
};

const getAllOrdersWithUsers = async () => {
  try {
    const ordersCollectionRef = collection(firestoreDb, "orders"); // Reference to orders collection
    const ordersQuerySnapshot = await getDocs(ordersCollectionRef);

    const ordersWithUsers = [];

    for (const orderDoc of ordersQuerySnapshot.docs) {
      const orderData = orderDoc.data();
      const orderId = orderDoc.id; // Retrieve the document ID of the order
      const userId = orderData.user_id;

      if (userId) {
        const userDocRef = doc(firestoreDb, "users", userId); // Reference to user document
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Combine the order data, document ID, and user data
          ordersWithUsers.push({
            order: { ...orderData, id: orderId }, // Include document ID in the order object
            user: userData,
          });
        } else {
          console.error(`User not found for userId: ${userId}`);
          ordersWithUsers.push({
            order: { ...orderData, id: orderId }, // Include document ID even if user is missing
            user: null, // Indicate user details were not found
          });
        }
      } else {
        console.error("Order does not have a userId.");
        ordersWithUsers.push({
          order: { ...orderData, id: orderId }, // Include document ID
          user: null,
        });
      }
    }

    return ordersWithUsers; // Return the combined data
  } catch (error) {
    console.error("Error retrieving orders with user details:", error);
    throw error; // Re-throw the error for upstream handling
  }
};

const updateOrder = async (orderId, admin_fullname) => {
  const orderRef = doc(firestoreDb, "orders", orderId);

  try {
    const result = await runTransaction(firestoreDb, async (transaction) => {
      // Fetch the order document
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists()) {
        console.error("Order not found");
        return { success: false, errorType: "ORDER_NOT_FOUND", data: orderId };
      }

      const orderData = orderDoc.data();

      // Validate order data
      if (!Array.isArray(orderData.items)) {
        console.error("Order items is not an array");
        return { success: false, errorType: "INVALID_ORDER_ITEMS", data: orderId };
      }

      if (orderData.status !== "Pending") {
        console.error("Order is not in a valid state to execute");
        return { success: false, errorType: "INVALID_ORDER_STATUS", data: orderId };
      }

      // Prepare to collect reward updates
      const rewardUpdates = [];

      for (const item of orderData.items) {
        // Validate reward item
        if (!item.id) {
          console.error("Reward ID is missing for an item in the order");
          return { success: false, errorType: "MISSING_REWARD_ID", data: item };
        }

        const rewardRef = doc(firestoreDb, "rewards", item.id);

        // Fetch the reward document
        const rewardDoc = await transaction.get(rewardRef);
        if (!rewardDoc.exists()) {
          console.error(`Reward with ID ${item.id} not found`);
          return { success: false, errorType: "REWARD_NOT_FOUND", data: item.id };
        }

        const rewardData = rewardDoc.data();

        // Check reward quantity
        if (rewardData.quantity < item.quantity) {
          console.error(`Insufficient quantity for reward: ${item.name}`);
          return {
            success: false,
            errorType: "INSUFFICIENT_REWARD_QUANTITY",
            data: { rewardId: item.id, available: rewardData.quantity, requested: item.quantity },
          };
        }

        // Prepare update for reward
        rewardUpdates.push({
          rewardRef,
          newQuantity: rewardData.quantity - item.quantity,
        });
      }

      // Perform all reward updates
      for (const { rewardRef, newQuantity } of rewardUpdates) {
        transaction.update(rewardRef, { quantity: newQuantity });
      }

      // Update order status
      transaction.update(orderRef, {
        status: "Completed",
        date_completed: {
          date: new Date().toISOString(),
          completed_by: admin_fullname,
        },
      });

      return { success: true, data: { orderId, updatedBy: admin_fullname } };
    });

    return result; // Return result of the transaction
  } catch (error) {
    console.error("Error executing order:", error.message);
    return { success: false, errorType: "TRANSACTION_ERROR", message: error.message };
  }
};

const getFirebaseApp = () => app;

module.exports = {
  initializeFirebaseApp,
  getFirebaseApp,
  registerUser,
  updateUser,
  registerUserCoin,
  getUser,
  getUserCoins,
  updateUserCoins,
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
  getAllOrdersWithUsers
};
