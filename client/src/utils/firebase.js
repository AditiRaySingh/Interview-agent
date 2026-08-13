// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_APIKEY,
  
  authDomain: "interviewiq-77b3e.firebaseapp.com",
  projectId: "interviewiq-77b3e",
  storageBucket: "interviewiq-77b3e.firebasestorage.app",
  messagingSenderId: "906326481275",
  appId: "1:906326481275:web:d4560160d6f9302432c5de",
  measurementId: "G-7J369705XC"
};
console.log(import.meta.env.VITE_FIREBASE_APIKEY);

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth=getAuth(app);
const provider=new GoogleAuthProvider();

export{auth,provider}

