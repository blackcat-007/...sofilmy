import React from "react";

const GlowLoader = () => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-md flex items-center justify-center z-50">
      <div className="relative loader-wrapper w-[180px] aspect-square rounded-full font-sans text-[1.6em] font-semibold select-none">
        <div className="loader rounded-full"></div>
        <div className="loader-bg-1 rounded-full"></div>
        <div className="loader-bg-2 rounded-full"></div>

        <div className="absolute inset-0 flex items-center justify-center">
          {"LOADING...".split("").map((letter, index) => (
            <span
              key={index}
              className="loader-letter"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {letter}
            </span>
          ))}
        </div>

        <style jsx>{`
          .loader-wrapper {
            background-color: rgba(0, 0, 0, 0.25);
          }
          .loader {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            aspect-ratio: 1 / 1;
            border-radius: inherit;
            z-index: 1;
            background-color: rgba(196, 208, 204, 0.13);
            backdrop-filter: blur(40px);
            -webkit-backdrop-filter: blur(40px);
            box-shadow:
              0 0 10px 0 rgba(255, 255, 255, 0.1) inset,
              0 0 4px 4px #f8924e inset,
              0 0 8px 8px rgba(28, 161, 132, 0.47) inset,
              0 0 20px 2px rgba(0, 0, 0, 0.4),
              0 0 20px 4px rgba(255, 0, 149, 0.93),
              0 12px 80px 8px rgba(255, 41, 95, 1);
            animation: rotate-anim 4s linear infinite;
          }
          @keyframes rotate-anim {
            0% {
              transform: rotate(0deg);
            }
            100% {
              transform: rotate(360deg);
            }
          }
          .loader-bg-1,
          .loader-bg-2 {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: inherit;
            opacity: 0.5;
            filter: blur(40px);
            -webkit-filter: blur(40px);
            z-index: 0;
            animation: bg-transform 4s linear infinite;
          }
          .loader-bg-1 {
            background-color: #fac193;
          }
          .loader-bg-2 {
            background-color: #10c488;
            animation: bg-transform 6s linear infinite reverse;
          }
          @keyframes bg-transform {
            0%,
            100% {
              transform: translate(-80%, 0%);
              clip-path: circle(50% at 130% 50%);
            }
            25% {
              transform: translate(0%, -80%);
              clip-path: circle(50% at 50% 130%);
            }
            50% {
              transform: translate(80%, 0%);
              clip-path: circle(50% at -30% 50%);
            }
            75% {
              transform: translate(0%, 80%);
              clip-path: circle(50% at 50% -30%);
            }
          }
          .loader-letter {
            display: inline-block;
            opacity: 0.7;
            transform: translateY(0);
            animation: loader-letter-anim 1.5s infinite ease;
            z-index: 2;
            color: rgba(0, 0, 0, 0.3);
            text-shadow: 0 -1px 0 #fffd;
            filter: drop-shadow(0 6px 3px rgba(0, 0, 0, 0.1));
          }
          @keyframes loader-letter-anim {
            0%,
            100% {
              opacity: 0.5;
              transform: translateY(0);
            }
            40% {
              opacity: 0.5;
              transform: translateY(-0px) rotate(-5deg);
            }
            60% {
              opacity: 0.9;
              transform: translateY(0px) scale(1.05) rotate(10deg);
            }
          }
        `}</style>
      </div>
    </div>
  );
};

export default GlowLoader;
