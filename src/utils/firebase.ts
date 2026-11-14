import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAIjDYut1aw81yJE0mD60FSs0a7Yajjpq0", 
  authDomain: "last-pick-legends.firebaseapp.com",
  projectId: "last-pick-legends",
  storageBucket: "last-pick-legends.firebasestorage.app",
  messagingSenderId: "758127389197",
  appId: "1:758127389197:web:71a2296240d05ace298344"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);