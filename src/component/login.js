import React, { useState, useContext } from "react";
import { TailSpin } from "react-loader-spinner";
import { Link, useNavigate } from "react-router-dom";
import { query, where, getDocs,addDoc } from "firebase/firestore";
import { usersRef } from "../firebase/firebase";
import { Appstate } from "../App";
import bcrypt from "bcryptjs";
import swal from "sweetalert";


import {
  getAuth,
  signInWithEmailAndPassword,
  setPersistence,
  browserLocalPersistence,
  signInWithPopup,
  GoogleAuthProvider
} from "firebase/auth";
import app from "../firebase/firebase";

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

function Login() {
  const navigate = useNavigate();
  const useAppstate = useContext(Appstate);

  const [method, setMethod] = useState(""); // "phone", "email"
  const [loading, setLoading] = useState(false);

  const [phoneForm, setPhoneForm] = useState({
    mobile: "",
    password: "",
  });

  const [emailForm, setEmailForm] = useState({
    email: "",
    password: "",
  });

  const handlePhoneLogin = async () => {
    setLoading(true);
    try {
      const quer = query(usersRef, where("mobile", "==", phoneForm.mobile));
      const querySnapshot = await getDocs(quer);
      let userFound = false;

      querySnapshot.forEach((doc) => {
        const _data = doc.data();
        const isUser = bcrypt.compareSync(phoneForm.password, _data.password);
        if (isUser) {
          userFound = true;
          useAppstate.setLogin(true);
          useAppstate.setUsername(_data.name);
         // useAppstate.setUserId(doc.id);

          localStorage.setItem("login", "true");
          localStorage.setItem("username", _data.name);
          localStorage.setItem("userId", doc.id);

          swal({
            title: "Logged In",
            icon: "success",
            buttons: false,
            timer: 3000,
          });
          navigate("/");
        }
      });

      if (!userFound) {
        swal({
          title: "Invalid Credentials",
          icon: "error",
          buttons: false,
          timer: 3000,
        });
      }
    } catch (error) {
      swal({
        title: error.message,
        icon: "error",
        buttons: false,
        timer: 3000,
      });
    }
    setLoading(false);
  };

  const handleEmailLogin = async () => {
    setLoading(true);
    try {
      await setPersistence(auth, browserLocalPersistence); // Keep logged in for 1 week
      const userCred = await signInWithEmailAndPassword(
        auth,
        emailForm.email,
        emailForm.password
      );

      const user = userCred.user;

      useAppstate.setLogin(true);
      useAppstate.setUsername(user.displayName || "User");
      //useAppstate.setUserId(user.uid);
      localStorage.setItem("login", "true");
      localStorage.setItem("username", user.displayName || "User");
      localStorage.setItem("userId", user.uid);


      swal({
        title: "Logged In",
        icon: "success",
        buttons: false,
        timer: 3000,
      });

      navigate("/");
    } catch (error) {
      swal({
        title: "Invalid Email/Password",
        icon: "error",
        buttons: false,
        timer: 3000,
      });
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
  try {
    setLoading(true);
    await setPersistence(auth, browserLocalPersistence);

    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    // Set app state and localStorage
    useAppstate.setLogin(true);
    useAppstate.setUsername(user.displayName);
    //useAppstate.setUserId(user.uid);
    localStorage.setItem("login", "true");
    localStorage.setItem("username", user.displayName);
    localStorage.setItem("userId", user.uid);
    
    localStorage.setItem("accessToken", user.stsTokenManager.accessToken);
    localStorage.setItem("userImage", user.photoURL);
    // Check if user already exists in Firestore
    const quer = query(usersRef, where("uid", "==", user.uid));
    const querySnapshot = await getDocs(quer);

    if (querySnapshot.empty) {
      // If user doesn't exist, add to Firestore
      await addDoc(usersRef, {
  uid: user.uid,
  name: user.displayName,
  image: user.photoURL,
  email: user.email,
  createdAt: new Date(),
  authProvider: "google",
});

    }

    swal("Success", "Logged in with Google", "success");
    navigate("/");
  } catch (error) {
    swal("Error", error.message, "error");
  }
  setLoading(false);
};


  return (
    <div className="w-full flex flex-col mt-8 items-center">
      <h1 className="text-xl font-bold text-white mb-6">Login</h1>

      {/* Toggle Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={() => setMethod("phone")}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded flex gap-2"
        >
         <img src="https://cdn3.iconfinder.com/data/icons/google-material-design-icons/48/ic_local_phone_48px-512.png" alt="Phone Logo" className="w-5 h-5" />
  Phone
        </button>
        <button
          onClick={() => setMethod("email")}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex gap-2"
        >
           <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/112-gmail_email_mail-512.png" alt="Email Logo" className="w-5 h-5" />
  Email
        </button>
        <button
          onClick={handleGoogleLogin}
          className="bg-gray-50  text-black px-4 py-2 rounded flex gap-2"
        >
           <img src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png" alt="Google Logo" className="w-5 h-5" />
    <span className="text-sm font-medium text-gray-700">Google</span>
        </button>
      </div>

      {/* Phone Login Form */}
      {method === "phone" && (
        <>
          <div className="p-2 w-full md:w-1/3">
            <label className="leading-7 text-sm text-gray-300">Mobile No.</label>
            <input
              type="number"
              value={phoneForm.mobile}
              onChange={(e) =>
                setPhoneForm({ ...phoneForm, mobile: e.target.value })
              }
              className="w-full bg-white rounded border border-gray-300 text-gray-700 py-2 px-3"
            />
          </div>
          <div className="p-2 w-full md:w-1/3">
            <label className="leading-7 text-sm text-gray-300">Password</label>
            <input
              type="password"
              value={phoneForm.password}
              onChange={(e) =>
                setPhoneForm({ ...phoneForm, password: e.target.value })
              }
              className="w-full bg-white rounded border border-gray-300 text-gray-700 py-2 px-3"
            />
          </div>
          <div className="p-2 w-full">
            <button
              onClick={handlePhoneLogin}
              className="flex mx-auto text-white bg-green-600 border-0 py-2 px-8 hover:bg-green-700 rounded text-lg"
            >
              {loading ? <TailSpin height={25} color="white" /> : "Login"}
            </button>
          </div>
        </>
      )}

      {/* Email Login Form */}
      {method === "email" && (
        <>
          <div className="p-2 w-full md:w-1/3">
            <label className="leading-7 text-sm text-gray-300">Email</label>
            <input
              type="email"
              value={emailForm.email}
              onChange={(e) =>
                setEmailForm({ ...emailForm, email: e.target.value })
              }
              className="w-full bg-white rounded border border-gray-300 text-gray-700 py-2 px-3"
            />
          </div>
          <div className="p-2 w-full md:w-1/3">
            <label className="leading-7 text-sm text-gray-300">Password</label>
            <input
              type="password"
              value={emailForm.password}
              onChange={(e) =>
                setEmailForm({ ...emailForm, password: e.target.value })
              }
              className="w-full bg-white rounded border border-gray-300 text-gray-700 py-2 px-3"
            />
          </div>
          <div className="p-2 w-full">
            <button
              onClick={handleEmailLogin}
              className="flex mx-auto text-white bg-blue-600 border-0 py-2 px-8 hover:bg-blue-700 rounded text-lg"
            >
              {loading ? <TailSpin height={25} color="white" /> : "Login"}
            </button>
          </div>
        </>
      )}

      {/* Signup Redirect */}
      <div className="mt-4 text-gray-300">
        Don’t have an account?{" "}
        <Link to={"/signup"}>
          <span className="text-blue-400 hover:underline">Sign Up</span>
        </Link>
      </div>
    </div>
  );
}

export default Login;
