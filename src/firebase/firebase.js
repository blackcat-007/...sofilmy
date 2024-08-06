
import { initializeApp } from "firebase/app";
import {getFirestore,collection} from "firebase/firestore";



const firebaseConfig = {
  apiKey: "AIzaSyBSUrVV1xiOspPw7jJM6yLFKHxt-RBEdpw",
  authDomain: "movie-library-e8bf5.firebaseapp.com",
  projectId: "movie-library-e8bf5",
  storageBucket: "movie-library-e8bf5.appspot.com",
  messagingSenderId: "163821639086",
  appId: "1:163821639086:web:b283fd64c1fd761f63643f"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db=getFirestore(app);
export const moviesRef=collection(db,"movies");
export const reviewsRef=collection(db,"reviews");
export const usersRef=collection(db,"users");
export default app;