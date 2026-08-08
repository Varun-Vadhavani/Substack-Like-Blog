// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: process.env.FIREBASE,
  authDomain: "blog-32576.firebaseapp.com",
  projectId: "blog-32576",
  storageBucket: "blog-32576.firebasestorage.app",
  messagingSenderId: "379252227030",
  appId: "1:379252227030:web:e1354a658f60ad2f52c277"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);