import React, { useState } from "react";
import { TailSpin } from "react-loader-spinner";
import { Link } from "react-router-dom";
import {getAuth, RecaptchaVerifier, signInWithPhoneNumber,createUserWithEmailAndPassword,signInWithPopup,
  GoogleAuthProvider} from 'firebase/auth'
import app from '../firebase/firebase'
import swal from "sweetalert";
import { addDoc } from "firebase/firestore";
import { usersRef } from "../firebase/firebase";
import { useNavigate } from "react-router-dom";
import bcrypt from 'bcryptjs';
 const auth = getAuth(app);

const Signup = () => {
  const provider = new GoogleAuthProvider();

  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    mobile: "",
    password: "",
    email: "",
  });
 
 // const [showEmailForm, setShowEmailForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [OTP, setOTP] = useState("");
 //const [method, setMethod] = useState(""); // "email" | "phone" | ""

  const [isPhoneShow, setIsPhoneShow] = useState(true);

  const handlePhoneSignup = () => {
    setIsPhoneShow(!isPhoneShow);
    //setMethod("phone");
  };
  const generateRecaptha = () => {
    if (!window.recaptchaVerifier){
    window.recaptchaVerifier = new RecaptchaVerifier(auth,'recaptcha-container', {
      'size': 'invisible',
      'callback': (response) => {
        // reCAPTCHA solved, allow signInWithPhoneNumber.
        console.log("reCAPTCHA VERIFIED");
      },
      'expired-callback': () => {
      console.log("reCAPTCHA expired");
    }
      
    });
  }
  }
  const requestOtp = () => {
   
      setLoading(true);
      generateRecaptha();
      const auth = getAuth(app);
      
        signInWithPhoneNumber(auth, `+91${form.mobile}`,  window.recaptchaVerifier)
        .then(confirmationResult => {
          window.confirmationResult = confirmationResult;
          swal({
            text: "OTP Sent",
            icon: "success",
            buttons: false,
            timer: 3000,
          });
          setOtpSent(true);
          setLoading(false);
        })
        .catch((error) => {
          console.log(error)
          swal({
            text: "unable to sent OTP",
            icon: "error",
            buttons: true,
            
          });
          setLoading(false);
        })
  }

  const verifyOTP = () => {
    try {
      setLoading(true);
      window.confirmationResult.confirm(OTP).then((result) => {
        uploadData();
        swal({
          text: "Sucessfully Registered",
          icon: "success",
          buttons: false,
          timer: 3000,
        });
        navigate('/login')
        setLoading(false); 
      })
    } catch (error) {
      console.log(error);
      swal({
        text: "unable to sent OTP",
        icon: "error",
        buttons: true,
        
      });
    }
  }

  const uploadData = async () => {
    try {
      const salt = bcrypt.genSaltSync(10);
      var hash = bcrypt.hashSync(form.password, salt);
      await addDoc(usersRef, {
        uid: window.confirmationResult.user.uid,
        name: form.name,
        password: hash,
        mobile: form.mobile
      });
    } catch(err) {
      console.log(err);
    }
  }
  const handleEmailSignup = async () => {
  setLoading(true);
 
  try {
    const result = await createUserWithEmailAndPassword(auth, `${form.email}`, form.password);
    await addDoc(usersRef, {
      uid: result.user.uid,
      email: form.email,
      password: bcrypt.hashSync(form.password, 10), // Hash the password
      createdAt: new Date(),
      name: form.name,
      //mobile: form.mobile,
      authProvider: "email"
    });
    swal("Success", "Account created with email/password!", "success");
    navigate("/login");
  } catch (error) {
    console.log(error);
    swal("Error", error.message, "error");
  }
  setLoading(false);
};
const handleGoogleSignup = async () => {
  setLoading(true);
  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;

    await addDoc(usersRef, {
      uid: user.uid,
      createdAt: new Date(),
      name: user.displayName,
      mobile: user.phoneNumber || "N/A",
      authProvider: "google",
      email: user.email
    });

    swal("Success", "Signed in with Google!", "success");
    navigate("/");
  } catch (err) {
    console.error(err);
    swal("Error", err.message, "error");
  }
  setLoading(false);
};


  return (
    <div className="w-full flex flex-col mt-8 items-center">
      <h1 className="text-xl font-bold">Sign up</h1>
      {isPhoneShow ? (otpSent ? (
      <>
        <div class="p-2 w-full md:w-1/3">
        <div class="relative">
          <label for="message" class="leading-7 text-sm text-gray-300">
            OTP
          </label>
          <input
            id="message"
            name="message"
            value={OTP}
            onChange={(e) => setOTP(e.target.value)}
            class="w-full bg-white rounded border border-gray-300 focus:border-green-500 focus:bg-red-400 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
          />
        </div>
        </div>
        <div class="p-2 w-full">
        <button
          onClick={verifyOTP}
          class="flex mx-auto text-white bg-green-600 border-0 py-2 px-8 focus:outline-none hover:bg-green-700 rounded text-lg"
        >
          {loading ? <TailSpin height={25} color="white" /> : "Confirm OTP"}
        </button>
      </div>

      </>)
      :
        <>
      <div class="p-2 w-full md:w-1/3">
        <div class="relative">
          <label for="message" class="leading-7 text-sm text-gray-300">
            Name
          </label>
          <input
            id="message"
            name="message"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            class="w-full bg-white rounded border border-gray-300 focus:border-green-500 focus:bg-red-400 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
          />
        </div>
      </div>
      <div class="p-2 w-full md:w-1/3">
        <div class="relative">
          <label for="message" class="leading-7 text-sm text-gray-300">
            Mobile No.
          </label>
          <input
            type={"number"}
            id="message"
            name="message"
            value={form.mobile}
            onChange={(e) => setForm({ ...form, mobile: e.target.value })}
            class="w-full bg-white rounded border border-gray-300 focus:border-green-500 focus:bg-red-400 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
          />
        </div>
      </div>
      <div class="p-2 w-full md:w-1/3">
        <div class="relative">
          <label for="message" class="leading-7 text-sm text-gray-300">
            Password
          </label>
          <input
            type={'password'}
            id="message"
            name="message"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            class="w-full bg-white rounded border border-gray-300 focus:border-green-500 focus:bg-red-400 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
          />
        </div>
      </div>
      <div class="p-2 w-full">
        <button
          onClick={requestOtp}
          class="flex mx-auto text-white bg-green-600 border-0 py-2 px-8 focus:outline-none hover:bg-green-700 rounded text-lg"
        >
          {loading ? <TailSpin height={25} color="white" /> : "Request OTP"}
        </button>
      </div>
      </>)
      :<>{/* Email Signup Form */}

  <div className="p-2 w-full md:w-1/3">
    <label className="leading-7 text-sm text-gray-300">Email</label>
    <input
      type="email"
      value={form.email}
      onChange={(e) => setForm({ ...form, email: e.target.value })}
      className="w-full bg-white rounded border border-gray-300 focus:border-green-500 focus:bg-red-400 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
    />
  </div> 
    <div class="p-2 w-full md:w-1/3">
        <div class="relative">
          <label for="message" class="leading-7 text-sm text-gray-300">
            Password
          </label>
          <input
            type={'password'}
            id="message"
            name="message"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            class="w-full bg-white rounded border border-gray-300 focus:border-green-500 focus:bg-red-400 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
          />
        </div>
      </div>
   <button
          onClick={handleEmailSignup}
          class="flex mx-auto text-white bg-green-600 border-0 py-2 px-8 focus:outline-none hover:bg-green-700 rounded text-lg"
        >
          {loading ? <TailSpin height={25} color="white" /> : "verify Email"}
        </button></>
      }
      <div className="p-2 w-full flex flex-col md:flex-row gap-4 justify-center items-center">
 
  <button
    onClick={handleGoogleSignup} // define this function
    className="flex items-center justify-center gap-3 border border-gray-300 rounded-md py-2 px-4 hover:shadow-md  bg-gray-100 transition duration-200"
  >
    <img src="https://cdn1.iconfinder.com/data/icons/google-s-logo/150/Google_Icons-09-512.png" alt="Google Logo" className="w-5 h-5" />
    <span className="text-sm font-medium text-gray-700">Google</span>
  </button>

{isPhoneShow ? <button
  onClick={handlePhoneSignup}
  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded flex gap-2"
>
   <img src="https://cdn4.iconfinder.com/data/icons/social-media-logos-6/512/112-gmail_email_mail-512.png" alt="Email Logo" className="w-5 h-5" />
  Email
</button> : <button
  onClick={handlePhoneSignup}

  className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded flex gap-2"
>
  <img src="https://cdn3.iconfinder.com/data/icons/google-material-design-icons/48/ic_local_phone_48px-512.png" alt="Phone Logo" className="w-5 h-5" />
  Phone
</button>}




</div>

      <div>
        <p>Already have an account <Link to={'/login'}><span className="text-blue-500">Login</span></Link></p>
      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
};

export default Signup;