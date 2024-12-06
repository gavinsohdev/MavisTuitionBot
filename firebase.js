const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
  deleteDoc,
  query,
  where,
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

const placeOrder = async (userId) => {
  const cartRef = firebase.firestore().collection('carts').doc(userId);
  const cartDoc = await cartRef.get();

  if (!cartDoc.exists) throw new Error("Cart not found");

  const cartData = cartDoc.data();

  // Fetch user's coin balance
  const userCoinsRef = firebase.firestore().collection('user_coins').doc(userId);
  const userCoinsDoc = await userCoinsRef.get();
  const userCoins = userCoinsDoc.data();

  if (userCoins.coin < cartData.total_price) throw new Error("Insufficient coins");

  // Deduct coins and create order
  await firebase.firestore().runTransaction(async (transaction) => {
    transaction.update(userCoinsRef, { coin: userCoins.coin - cartData.total_price });
    transaction.set(firebase.firestore().collection('orders').doc(), {
      user_id: userId,
      items: cartData.items,
      total_price: cartData.total_price,
      status: "Pending",
      date_ordered: new Date().toISOString()
    });
    transaction.delete(cartRef); // Clear the cart
  });
};

const executeOrder = async (orderId) => {
  const db = firebase.firestore();
  const orderRef = db.collection('orders').doc(orderId);

  try {
    await db.runTransaction(async (transaction) => {
      // Fetch the order document
      const orderDoc = await transaction.get(orderRef);

      if (!orderDoc.exists) {
        throw new Error("Order not found");
      }

      const orderData = orderDoc.data();

      if (orderData.status !== "Pending") {
        throw new Error("Order is not in a valid state to execute");
      }

      // Loop through items in the order
      for (const item of orderData.items) {
        const rewardRef = db.collection('rewards').doc(item.reward_id);

        // Fetch the reward document
        const rewardDoc = await transaction.get(rewardRef);
        if (!rewardDoc.exists) {
          throw new Error(`Reward with ID ${item.reward_id} not found`);
        }

        const rewardData = rewardDoc.data();

        // Check if the reward has enough quantity
        if (rewardData.quantity < item.quantity) {
          throw new Error(`Insufficient quantity for reward: ${item.name}`);
        }

        // Deduct the quantity
        transaction.update(rewardRef, {
          quantity: rewardData.quantity - item.quantity,
        });
      }

      // Update the order status to "Completed"
      transaction.update(orderRef, {
        status: "Completed",
      });
    });

    console.log("Order executed successfully!");
  } catch (error) {
    console.error("Error executing order:", error.message);
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
  placeOrder,
  executeOrder
};
