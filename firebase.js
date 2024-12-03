const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  getDocs,
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

const updateUser = async (data) => {
  const documentRef = doc(firestoreDb, "users", data?.id);

  try {
    // Fetch the current document data
    const currentDoc = await getDoc(documentRef);

    if (currentDoc.exists()) {
      const currentData = currentDoc.data();
      const updatedFields = {};

      // Check for changes in fields
      for (const key in data) {
        if (data[key] !== currentData[key]) {
          updatedFields[key] = String(data[key]);
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

const uploadProcessedDataCoin = async (data) => {
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

const getFirebaseApp = () => app;

module.exports = {
  initializeFirebaseApp,
  getFirebaseApp,
  registerUser,
  updateUser,
  uploadProcessedDataCoin,
  getUser,
  getUserCoins,
  updateUserCoins,
};
