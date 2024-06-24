// Project name in firebase   THREADS.
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";




const firebaseConfig = {
  apiKey: "AIzaSyBmYRM9V4MH4p6QXLQ_kcAI6svoj64ZGis",
  authDomain: "threads-12bd6.firebaseapp.com",
  projectId: "threads-12bd6",
  storageBucket: "threads-12bd6.appspot.com",
  messagingSenderId: "196043436602",
  appId: "1:196043436602:web:ade5535ba1f972daae3b03"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
export const db = getFirestore(app);