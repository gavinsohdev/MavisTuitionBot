const { initializeApp } = require("firebase/app");
const {
  getFirestore,
  doc,
  setDoc,
  collection,
  getDocs,
  query,
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
  const dataToUpload = data || { key1: "test", key2: 123, key3: new Date() };
  try {
    const document = doc(firestoreDb, "users", String(data?.id || "some test id"););
    let dataUpdated = await setDoc(document, dataToUpload);
    return dataUpdated;
  } catch (error) {
    console.log(error);
  }
};

const getTheData = async (from, to) => {
  try {
    const collectionRef = collection(firestoreDb, "users");
    const finalData = [];
    const q = query(collectionRef);

    const docSnap = await getDocs(q);

    docSnap.forEach((doc) => {
      finalData.push(doc.data());
    });
  } catch (error) {
    console.log(error);
  }
};

const getFirebaseApp = () => app;

module.exports = {
  initializeFirebaseApp,
  getFirebaseApp,
  uploadProcessedData,
  getTheData,
};
