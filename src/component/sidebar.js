import React, { useState } from "react";
import { Link } from "react-router-dom";
import AccountCircleTwoToneIcon from "@mui/icons-material/AccountCircleTwoTone";
import PersonAddAltTwoToneIcon from "@mui/icons-material/PersonAddAltTwoTone";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";

const Profileicon = ({ isExpanded }) => {
  const userId = localStorage.getItem("userId");

  return (
    <div className="flex flex-col items-center justify-center w-full">
      {/* Profile */}
      <Link
        to={`/profile/${userId}`}
        className="flex items-center gap-2 py-3 sm:p-3 text-white w-full hover:bg-red-600 rounded-md"
      >
        <AccountCircleTwoToneIcon className="text-white text-3xl" />
        {isExpanded && <span className="text-sm">Profile</span>}
      </Link>

      {/* Find People */}
      <Link
        to="/findpeople"
        className="flex items-center gap-2 py-3 sm:p-3 text-white w-full hover:bg-red-600 rounded-md"
      >
        <PersonAddAltTwoToneIcon className="text-white text-3xl" />
        {isExpanded && <span className="text-sm">Find People</span>}
      </Link>
    </div>
  );
};

const Sidebar = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div>
      {/* Sidebar container */}
      <div
        className={`fixed top-28 left-0 h-screen bg-black shadow-lg z-50 transition-all duration-300 
        flex flex-col items-center border-r-2 border-red-500
       ${isExpanded ? "w-40" : "w-8 sm:w-12"}`}   
      >
        {/* Toggle Button */}
        <button
          className="absolute top-4 right-[-16px] bg-red-500 text-white rounded-full p-1 shadow-md"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Icons */}
        <div className="mt-16 w-full flex flex-col gap-2">
          <Profileicon isExpanded={isExpanded} />
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
