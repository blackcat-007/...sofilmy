import React, { useContext } from "react";
import LoupeTwoToneIcon from '@mui/icons-material/LoupeTwoTone';
import CommentBankTwoToneIcon from '@mui/icons-material/CommentBankTwoTone';
import LoginIcon from '@mui/icons-material/Login';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { Appstate } from "../App";
import Logout1 from "./logout";
import AnimatedSubtitle from "./subtitle";

function Header() {
   const { login, username } = useContext(Appstate);

  return (
    <div className="sticky top-0 z-20 bg-gradient-to-br from-black from-50% to-green-900/20 text-red-500   px-4 py-2 flex flex-row items-center justify-between gap-2 overflow-x-auto whitespace-nowrap">

      {/* Logo */}
     < div className="flex flex-col">
     <Link to={"/"} className="flex-shrink-0">
  <span className="flex items-center">
    {/* ...SO (Red Glow) */}
    <span className="block py-2 font-opensans bg-gradient-to-b from-red-400 to-red-700 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent drop-shadow-[0_0_8px_rgba(220,38,38,0.8)]">
      ...SO
    </span>

    {/* Filmy (Green Glow) */}
    <span className="py-2 font-cursive bg-gradient-to-bl from-green-600 to-white bg-clip-text text-2xl font-extrabold tracking-tight text-transparent drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]">
      Filmy
    </span>

    <AnimatedSubtitle />
  </span>
</Link>

{login ? (<span className=" md:ml-2 sm:text-xs text-[10px] bg-gradient-to-b from-red-400 to-red-600 bg-clip-text">Welcome, {username} 👋</span>) : null}
</div>
      {/* Buttons */}
      <div className="flex flex-row items-center gap-2 sm:gap-4 ml-auto flex-wrap">

        {login ? (
          <>
            {/* Chat Button */}
            <Link to={'/filmychat'}>
              <div className="relative group">
                <Button className="hover:bg-slate-900 flex items-center overflow-hidden px-3 py-2">
                  {/* Sliding Text */}
                  <div className="absolute left-0 top-0 bottom-0 flex items-center pr-3">
                    <div className="bg-gradient-to-b from-green-400 to-green-600 text-black font-semibold text-sm px-3 py-1
                                    transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out rounded-md"
                      style={{
                        clipPath: "polygon(0 23%, 9% 12%, 0 0, 100% 0, 100% 100%, 0 100%, 9% 89%, 0 76%, 9% 64%, 0 51%, 10% 37%)"
                      }}>
                      Filmy <br />Chat
                    </div>
                  </div>

                  {/* Icon */}
                  <CommentBankTwoToneIcon
                    fontSize="large"
                    className="text-white ml-3 transition-opacity duration-300 group-hover:opacity-0"
                  />
                </Button>
              </div>
            </Link>

            {/* Add Movie Button */}
            <Link to={'/addmovies'}>
              <div className="relative group">
                <Button className="hover:bg-slate-900 flex items-center overflow-hidden px-3 py-2 ">
                  {/* Sliding Text */}
                  <div className="absolute left-0 top-0 bottom-0 flex items-center pr-3">
                    <div className="bg-gradient-to-b from-green-400 to-green-600 text-black font-semibold text-sm px-3 py-1
                                    transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out rounded-md"
                      style={{
                        clipPath: "polygon(0 23%, 9% 12%, 0 0, 100% 0, 100% 100%, 0 100%, 9% 89%, 0 76%, 9% 64%, 0 51%, 10% 37%)"
                      }}>
                      Post<br />New

                    </div>
                  </div>

                  {/* Icon */}
                  <LoupeTwoToneIcon
                    fontSize="large"
                    className="text-white ml-3 transition-opacity duration-300 group-hover:opacity-0"
                  />
                </Button>
              </div>
            </Link>

           
          </>
        ) : (
          <Link to={'/login'}>
            <Button className="hover:bg-slate-900 flex items-center px-3 py-2">
              <span className="block bg-gradient-to-b from-green-400 to-green-600 bg-clip-text md:text-xl text-sm tracking-tight text-transparent">
                Login/Signup</span>

             
              <LoginIcon className="ml-2 text-white" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default Header;
