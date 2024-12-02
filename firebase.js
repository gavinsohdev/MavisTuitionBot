const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  getDoc,
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

const uploadProcessedData = async (data) => {
  const dataToUpload = data;
  try {
    const document = doc(firestoreDb, "users", String(data?.id));
    let dataUpdated = await setDoc(document, dataToUpload);
    return dataUpdated;
  } catch (error) {
    console.log(error);
  }
};

const uploadProcessedDataCoin = async (data) => {
  const dataToUpload = { coin: 100, id: String(data?.id), last_updated: new Date().toISOString() };
  try {
    const document = doc(firestoreDb, "user_coins", String(data?.id));
    let dataUpdated = await setDoc(document, dataToUpload);
    return dataUpdated;
  } catch (error) {
    console.log(error);
  }
};

const getUserData = async (id) => {
  try {
    const collectionRef = collection(firestoreDb, "users");
    const finalData = [];
    const q = query(collectionRef, where("id", "==", id));

    const docSnap = await getDocs(q);

    docSnap.forEach((doc) => {
      finalData.push(doc.data());
    });
    return finalData;
  } catch (error) {
    console.log(error);
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
  uploadProcessedData,
  uploadProcessedDataCoin,
  getUserData,
  getUserCoins,
  updateUserCoins,
};
