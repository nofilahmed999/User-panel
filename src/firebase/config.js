import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
apiKey: "AIzaSyBbSEj9d1Sh7qil6QpzsQzeZArtcgNDpvw",
  authDomain: "authentication-ac3cf.firebaseapp.com",
  projectId:"authentication-ac3cf",
  storageBucket: "authentication-ac3cf.firebasestorage.app",
  messagingSenderId: "22767621913",
  appId: "web:cc31f3c1bc33f723f3d788",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;