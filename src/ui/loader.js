import React from "react";

const CubeLoader = () => {
  // Example letters to show inside each cube
  const letters = ["L", "O", "A", "D", "I", "N", "G"];

  return (
    <div className="flex items-center justify-center ">
      <div className="wrapper-grid">
        {letters.map((letter, index) => (
          <div key={index} className="cube">
            <div className="face face-front">{letter}</div>
            <div className="face face-back"></div>
            <div className="face face-left"></div>
            <div className="face face-right"></div>
            <div className="face face-top"></div>
            <div className="face face-bottom"></div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .wrapper-grid {
          --animation-duration: 2.1s;
          --cube-color: #0000;
          --highlight-color: #00cc44;
          --cube-width: 48px;
          --cube-height: 48px;
          --font-size: 1.8em;
          position: relative;
          inset: 0;
          display: grid;
          grid-template-columns: repeat(7, var(--cube-width));
          grid-template-rows: auto;
          grid-gap: 0;
          width: calc(7 * var(--cube-width));
          height: var(--cube-height);
          perspective: 350px;
          font-family: "Poppins", sans-serif;
          font-size: var(--font-size);
          font-weight: 800;
          color: transparent;
        }

        .cube {
          position: relative;
          transform-style: preserve-3d;
          animation: translate-z var(--animation-duration) ease-in-out infinite;
        }

        .cube:nth-child(1) {
          z-index: 0;
          animation-delay: 0s;
        }
        .cube:nth-child(2) {
          z-index: 1;
          animation-delay: 0.2s;
        }
        .cube:nth-child(3) {
          z-index: 2;
          animation-delay: 0.4s;
        }
        .cube:nth-child(4) {
          z-index: 3;
          animation-delay: 0.6s;
        }
        .cube:nth-child(5) {
          z-index: 2;
          animation-delay: 0.8s;
        }
        .cube:nth-child(6) {
          z-index: 1;
          animation-delay: 1s;
        }
        .cube:nth-child(7) {
          z-index: 0;
          animation-delay: 1.2s;
        }

        .face {
          position: absolute;
          display: flex;
          align-items: center;
          justify-content: center;
          width: var(--cube-width);
          height: var(--cube-height);
          background-color: var(--cube-color);
          animation: face-color var(--animation-duration) ease-in-out infinite,
            edge-glow var(--animation-duration) ease-in-out infinite;
          animation-delay: inherit;
          font-size: calc(var(--cube-width) * 0.5);
        }

        .face-left,
        .face-right,
        .face-back,
        .face-front {
          box-shadow: inset 0 0 2px 1px #0001, inset 0 0 12px 1px #fff1;
        }

        .face-front {
          transform: rotateY(0deg) translateZ(calc(var(--cube-width) / 2));
          animation: face-color var(--animation-duration) ease-in-out infinite,
            face-glow var(--animation-duration) ease-in-out infinite,
            edge-glow var(--animation-duration) ease-in-out infinite;
          animation-delay: inherit;
          color: var(--highlight-color);
        }

        .face-back {
          transform: rotateY(180deg) translateZ(calc(var(--cube-width) / 2));
          opacity: 0.6;
        }
        .face-left {
          transform: rotateY(-90deg) translateZ(calc(var(--cube-width) / 2));
          opacity: 0.6;
        }
        .face-right {
          transform: rotateY(90deg) translateZ(calc(var(--cube-width) / 2));
          opacity: 0.6;
        }
        .face-top {
          height: var(--cube-width);
          transform: rotateX(90deg) translateZ(calc(var(--cube-width) / 2));
          opacity: 0.8;
        }
        .face-bottom {
          height: var(--cube-width);
          transform: rotateX(-90deg)
            translateZ(calc(var(--cube-height) - var(--cube-width) * 0.5));
          opacity: 0.8;
        }

        @keyframes translate-z {
          0%,
          40%,
          100% {
            transform: translateZ(-2px);
          }
          30% {
            transform: translateZ(16px) translateY(-1px);
          }
        }

        @keyframes face-color {
          0%,
          50%,
          100% {
            background-color: var(--cube-color);
          }
          10% {
            background-color: var(--highlight-color);
          }
        }

        @keyframes face-glow {
          0%,
          50%,
          100% {
            color: #fff0;
            filter: none;
          }
          30% {
            color: #fff;
            filter: drop-shadow(0 14px 10px var(--highlight-color));
          }
        }

        @keyframes edge-glow {
          0%,
          40%,
          100% {
            box-shadow: inset 0 0 2px 1px #0001, inset 0 0 12px 1px #fff1;
          }
          30% {
            box-shadow: 0 0 2px 0px var(--highlight-color);
          }
        }
      `}</style>
    </div>
  );
};

export default CubeLoader;
