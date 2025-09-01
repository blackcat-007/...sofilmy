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
        className="flex items-center gap-2 py-3 px-5 sm:p-3 text-white w-full hover:bg-red-600 rounded-md"
      >
        <AccountCircleTwoToneIcon className="text-white text-3xl" />
        {isExpanded && <span className="text-sm">Profile</span>}
      </Link>

      {/* Find People */}
      <Link
        to="/findpeople"
        className="flex items-center gap-2 py-3 px-5 sm:p-3 text-white w-full hover:bg-red-600 rounded-md"
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
      {/* -------- Desktop Sidebar -------- */}
      <div
        className={`hidden sm:flex fixed top-28 left-0 h-screen bg-black shadow-lg z-50 transition-all duration-300 
        flex-col items-center border-r-2 border-red-500
        ${isExpanded ? "w-40" : "w-12"}`}
      >
        {/* Toggle Button */}
        <button
          className="absolute sm:top-4 top-4 sm:right-[-16px] right-[-35px] bg-red-500 text-white rounded-full p-1 shadow-md"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? <CloseIcon /> : <MenuIcon />}
        </button>

        {/* Icons */}
        <div className="mt-16 w-full flex flex-col gap-2">
          <Profileicon isExpanded={isExpanded} />
        </div>
      </div>

      {/* -------- Mobile Sidebar (Drawer style) -------- */}
      <div
        className={`sm:hidden fixed top-28 left-0 h-full bg-black shadow-lg z-40 transition-transform duration-300 
        ${isExpanded ? "translate-x-0 w-56" : "-translate-x-full w-56"}`}
      >
        {/* Close Button */}
        <button
          className="absolute  right-4 bg-red-500 text-white rounded-full p-2 shadow-md"
          onClick={() => setIsExpanded(false)}
        >
          <CloseIcon />
        </button>

        {/* Icons */}
        <div className="mt-16 w-full flex flex-col gap-2">
          <Profileicon isExpanded={true} />
        </div>
      </div>

      {/* Mobile-only toggle button (when sidebar is closed) */}
      {!isExpanded && (
        <div className="sm:hidden fixed top-28 left-4 z-50">
          <button
            className="bg-red-500 text-white rounded-full p-2 shadow-md "
            onClick={() => setIsExpanded(true)}
          >
            <MenuIcon />
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
