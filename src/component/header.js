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

  // Check localStorage along with Appstate
  const isLoggedIn = useAppstate.login || localStorage.getItem("login") === "true";

  return (
    <div className="sticky top-0 z-10 header text-2xl sm:text-3xl text-red-500 font-bold p-4 sm:p-3 border-b-2 flex  sm:flex-row justify-between  border-cyan-100 bg-black">
      <Link to={'/'}>
        <span className="text-2xl sm:text-3xl">...So<span className="text-white">Filmy</span></span>
      </Link>

      {isLoggedIn ? (
        <div className="flex  sm:flex-row  gap-2 sm:gap-4 mt-2 sm:mt-0">
          <Link to={'/chatsection'}>
           <div className="relative group">
      <Button className="hover:bg-slate-900 flex items-center overflow-hidden px-3 py-2">
        {/* Sliding text container */}
        <div className="absolute left-0 top-0 bottom-0 flex items-center pr-3">
          <div className="bg-green-400 text-black font-semibold text-sm  px-3 py-1
                          transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out " style={{
            clipPath: "polygon(20px 0%, 100% 0%, 100% 100%, 20px 100%, 0% 50%)"
          }}>
            Filmy Chat
          </div>
        </div>

        {/* Icon disappears */}
        <CommentBankTwoToneIcon
  fontSize="large"
  className="text-white ml-3 transition-opacity duration-300 group-hover:opacity-0"
/>

      </Button>
    </div>
           
          </Link>

          <Link to={'/addmovies'}>
           <div className="relative group">
      <Button className="hover:bg-slate-900 flex items-center overflow-hidden px-3 py-2">
        {/* Sliding text container */}
        <div className="absolute left-0 top-0 bottom-0 flex items-center pr-3">
          <div className="bg-green-400 text-black font-semibold text-sm  px-3 py-1
                          transform -translate-x-full group-hover:translate-x-0 transition-transform duration-300 ease-in-out" style={{
            clipPath: "polygon(20px 0%, 100% 0%, 100% 100%, 20px 100%, 0% 50%)"
          }}>
            Post New
          </div>
        </div>

        {/* Icon disappears */}
        <LoupeTwoToneIcon
        fontSize="large" 
          className="text-white ml-3 transition-opacity duration-300 group-hover:opacity-0"
        />
      </Button>
    </div>
          </Link>

          <Logout1 />
        </div>
      ) : (
        <Link to={'/login'}>
          <Button className="mt-2 sm:mt-0 hover:bg-slate-900">
            <span className="text-green-400 text-lg">
              Login <span className="text-xl">/</span> Signup
            </span>
            <LoginIcon className="ml-2 text-white" />
          </Button>
        </Link>
      )}
    </div>
  );
}

export default Header;
