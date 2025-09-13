import React from "react";
import { motion } from "framer-motion";
import "@fontsource/dancing-script"; // cursive font

const Loader = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-black">
      <motion.div
        className="relative flex items-center gap-2"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        {/* soFilmy text */}
        <h1
          className="text-6xl font-bold"
          style={{ fontFamily: "Dancing Script, cursive" }}
        >
          s
        </h1>

        {/* Rotating film reel as "o" */}
        <motion.div
          className="w-14 h-14 rounded-full border-4 border-red-600 border-dashed flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
        >
          <div className="w-3 h-3 bg-red-600 rounded-full"></div>
        </motion.div>

        <h1
          className="text-6xl font-bold"
          style={{ fontFamily: "Dancing Script, cursive" }}
        >
          Filmy
        </h1>

        {/* Filmstrip underline animation */}
        <div
        className="loader"
        style={{
          '--s': '40px'
        }}
      ></div>

      {/* Custom styles */}
      <style jsx>{`
        .loader {
          height: calc(var(--s) * 0.9);
          width: calc(var(--s) * 5);
          --v1: transparent, #000 0.5deg 108deg, #0000 109deg;
          --v2: transparent, #000 0.5deg 36deg, #0000 37deg;
          -webkit-mask: 
            conic-gradient(from 54deg at calc(var(--s) * 0.68) calc(var(--s) * 0.57), var(--v1)),
            conic-gradient(from 90deg at calc(var(--s) * 0.02) calc(var(--s) * 0.35), var(--v2)),
            conic-gradient(from 126deg at calc(var(--s) * 0.5)  calc(var(--s) * 0.7), var(--v1)),
            conic-gradient(from 162deg at calc(var(--s) * 0.5) 0, var(--v2));
          -webkit-mask-size: var(--s) var(--s);
          -webkit-mask-composite: xor, destination-over;
                  mask-composite: exclude, add;
          -webkit-mask-repeat: repeat-x;
          background: linear-gradient(#ffb940 0 0) left / 0% 100% #ddd no-repeat;
          animation: l20 2s infinite linear;
        }

        @keyframes l20 {
          90%, 100% {
            background-size: 100% 100%;
          }
        }
      `}</style>
      </motion.div>
      

    </div>
  );
};

export default Loader;
