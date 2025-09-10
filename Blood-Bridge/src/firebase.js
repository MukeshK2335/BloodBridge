import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyBGAGkE-CMGWC3SY7RhfyOw7qXSKiYCY4E",
  authDomain: "linkeredge-d97a2.firebaseapp.com",
  projectId: "linkeredge-d97a2",
  storageBucket: "linkeredge-d97a2.appspot.com",
  messagingSenderId: "1070926387193",
  appId: "1:1070926387193:web:12a1f730052fcdf90e8f28",
  measurementId: "G-BWXG3JSL20"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
