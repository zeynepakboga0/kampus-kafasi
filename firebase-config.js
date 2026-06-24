import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCr1oghsRDSYgr1ouJLalrHL-JDsx0zU44",
  authDomain: "kampuskafasi-ecb39.firebaseapp.com",
  projectId: "kampuskafasi-ecb39",
  storageBucket: "kampuskafasi-ecb39.firebasestorage.app",
  messagingSenderId: "668573668128",
  appId: "1:668573668128:web:d273767fa8ff12e7b4bd45"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);