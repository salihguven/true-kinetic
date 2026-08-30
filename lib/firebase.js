// lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyANFT8CC8d7KwNHCk5-Tr5iTSrFHQyfYjQ",
  authDomain: "truekineticlogin.firebaseapp.com",
  projectId: "truekineticlogin",
  storageBucket: "truekineticlogin.firebasestorage.app",
  messagingSenderId: "942300265578",
  appId: "1:942300265578:web:b408c4347d72807c271e13",
  measurementId: "G-8M61D20VCP"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);
export const db = getFirestore(app);

// Master Admin E-Postan
export const ADMIN_EMAILS = [
  "minecraftbruh5050@gmail.com"
];