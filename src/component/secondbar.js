import React, { useState } from "react";
import Analysis from "./analysis";
import MovieLists from "./movielists";
import Explore from "./newreleases";
import AISuggestion from "./aisuggestion";
import { ToastContainer, toast } from 'react-toastify';
const options = [
    { label: "Analysis", value: "analysis" },
    { label: "Lists", value: "lists" },
    { label: "Explore", value: "explore" },
    { label: "AI Suggestion", value: "ai-suggestion" }
];

export default function SecondBar() {
    const [selected, setSelected] = useState("analysis");
    const notify = () => toast("Feature coming soon!🍿🎞️ 🎥");
    const renderComponent = () => {
        switch (selected) {
            case "analysis":
                return <Analysis />;
            case "lists":
                return <MovieLists />;
            case "explore":
                return <Explore />;
            case "ai-suggestion":
                return <AISuggestion />;
            default:
                return null;
        }
    };

    return (
       <div>
  <div className="fixed top-[4.5rem] left-0 w-full z-20 mt-2 sm:mt-7">
    <div className="backdrop-blur  bg-black/70 flex items-center justify-between px-6 py-3">
      
      {/* 🔘 Option Buttons - Left Side */}
      <div className="flex space-x-8 ml-10">
        {options.map((option) => (
          <button
            key={option.value}
            onClick={() => {
              // Notify for new releases and movie lists
              if ( option.value === "lists") notify();
              else setSelected(option.value);
            }}
            className={`text-white font-semibold text-lg transition-colors ${
              selected === option.value
                ? "text-red-500 border-b-2 border-red-500"
                : "hover:text-red-400"
            } pb-1`}
          >
            {option.label}
          </button>
         
        ))}
       <ToastContainer position="top-right"  autoClose={3000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover toastStyle={{ backgroundColor: "black", color: "white",
  }}
  progressStyle={{
    background: "linear-gradient(to right, red, green)",
  }}
/>

      </div>

      {/* 🔍 Search Bar - Right Side */}
     { /*<div className="relative w-full max-w-sm">
        <input
          type="text"
          placeholder="Search..."
          className="w-full pl-10 pr-4 py-2 rounded-md bg-white/10 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-red-500 transition"
        />
        <svg
          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/60 w-5 h-5 pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
        </svg>
      </div>*/}
    </div>
  </div>

  {/* Your main content */}
  <div className="mt-16 px-6">
     {renderComponent()}
   
  </div>
</div>

    );
}