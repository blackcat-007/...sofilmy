import React, { useContext } from "react";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import MarkUnreadChatAltIcon from '@mui/icons-material/MarkUnreadChatAlt';
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
    <div className="sticky top-0 z-10 header text-3xl text-red-500 font-bold p-3 border-b-2 flex justify-between items-center border-cyan-100">
      <Link to={'/'}>
        <span>...So<span className="text-white">Filmy</span></span>
      </Link>

      {isLoggedIn ? (
        <div className="flex">
          <Link to={'/chatsection'}>
            <h1 className="text-lg cursor-pointer">
              <Button className="hover: bg-slate-900">
                <span className="text-green-400">Chat</span>
                <MarkUnreadChatAltIcon className="ml-2 text-white" />
              </Button>
            </h1>
          </Link>

          <Link to={'/addmovies'}>
            <h1 className="text-lg cursor-pointer">
              <Button>
                <span className="text-green-400">Post New</span>
                <AddCircleIcon className="ml-2 text-white" />
              </Button>
            </h1>
          </Link>
          <Logout1 />
        </div>
      ) : (
        <Link to={'/login'}>
          <h1 className="text-lg cursor-pointer">
            <Button>
              <span className="text-green-400">
                Login <span className="text-xl">/</span> Signup
              </span>
              <LoginIcon className="ml-2 text-white" />
            </Button>
          </h1>
        </Link>
      )}
    </div>
  );
}

export default Header;
