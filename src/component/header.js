import React, { useContext } from "react";
import LoupeTwoToneIcon from '@mui/icons-material/LoupeTwoTone';
import CommentBankTwoToneIcon from '@mui/icons-material/CommentBankTwoTone';
import LoginIcon from '@mui/icons-material/Login';
import { Button } from '@mui/material';
import { Link } from 'react-router-dom';
import { Appstate } from "../App";
import Logout1 from "./logout";

function Header() {
  const useAppstate = useContext(Appstate);
  const isLoggedIn = useAppstate.login || localStorage.getItem("login") === "true";

  return (
    <div className="sticky top-0 z-20 bg-black text-red-500 border-b-2 border-cyan-100 px-4 py-3 flex flex-row items-center justify-between gap-2 overflow-x-auto whitespace-nowrap">

      {/* Logo */}
      <Link to={'/'} className="flex-shrink-0">
        <span className="block bg-gradient-to-b from-red-400 to-red-600 bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">
                ...So<span className=" bg-gradient-to-b from-gray-400 to-white bg-clip-text text-2xl font-extrabold tracking-tight text-transparent">Filmy</span>
              </span>
              <span className="text-xs text-zinc-400">Cinephile Club</span>
      </Link>

      {/* Buttons */}
      <div className="flex flex-row items-center gap-2 sm:gap-4 ml-auto flex-wrap">

        {isLoggedIn ? (
          <>
            {/* Chat Button */}
            <Link to={'/filmychat'}>
              <div className="relative group">
                <Button className="hover:bg-slate-900 flex items-center overflow-hidden px-3 py-2">
                  {/* Sliding Text */}
                  <div className="absolute left-0 top-0 bottom-0 flex items-center pr-3">
                    <div className="bg-green-400 text-black font-semibold text-sm px-3 py-1
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
                    <div className="bg-green-400 text-black font-semibold text-sm px-3 py-1
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
              <span className="text-green-400 text-lg">
                Login <span className="text-xl">/</span> Signup
              </span>
              <LoginIcon className="ml-2 text-white" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

export default Header;
