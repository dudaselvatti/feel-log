import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD0avVc3-iPQPaHxflri4hWubvNW2BCKRU",
  authDomain: "feel-log-78ea8.firebaseapp.com",
  projectId: "feel-log-78ea8",
  storageBucket: "feel-log-78ea8.firebasestorage.app",
  messagingSenderId: "181597128985",
  appId: "1:181597128985:web:af8c4282df12560c2e5d88"
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);

export { auth, db };