import React from 'react';
import styled from 'styled-components';

const SuggestionLoader = () => {
  return (
    <StyledWrapper>
      <div id="wifi-loader">
        <svg viewBox="0 0 86 86" className="circle-outer">
          <circle r={40} cy={43} cx={43} className="back" />
          <circle r={40} cy={43} cx={43} className="front" />
          <circle r={40} cy={43} cx={43} className="new" />
        </svg>
        <svg viewBox="0 0 60 60" className="circle-middle">
          <circle r={27} cy={30} cx={30} className="back" />
          <circle r={27} cy={30} cx={30} className="front" />
        </svg>
        <div data-text="Finding For You..." className="text" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  #wifi-loader {
    --background: #4caf50;       /* Green base */
    --front-color: #ef4d4d;      /* Red front */
    --front-color-in: #4caf50;   /* Green inner */
    --back-color: #c3c8de;
    --text-color: #ffffff;
    width: 64px;
    height: 64px;
    border-radius: 50px;
    position: relative;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  #wifi-loader svg {
    position: absolute;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  #wifi-loader svg circle {
    position: absolute;
    fill: none;
    stroke-width: 6px;
    stroke-linecap: round;
    stroke-linejoin: round;
    transform: rotate(-100deg);
    transform-origin: center;
  }

  #wifi-loader svg circle.back {
    stroke: var(--back-color);
  }

  #wifi-loader svg circle.front {
    stroke: var(--front-color);
  }

  #wifi-loader svg.circle-outer {
    height: 86px;
    width: 86px;
  }

  #wifi-loader svg.circle-outer circle {
    stroke-dasharray: 62.75 188.25;
  }

  #wifi-loader svg.circle-outer circle.back {
    animation: circle-outer135 1.8s ease infinite 0.3s;
  }

  #wifi-loader svg.circle-outer circle.front {
    animation: circle-outer135 1.8s ease infinite 0.15s;
  }

  #wifi-loader svg.circle-middle {
    height: 60px;
    width: 60px;
  }

  #wifi-loader svg.circle-middle circle {
    stroke: var(--front-color-in);
    stroke-dasharray: 42.5 127.5;
  }

  #wifi-loader svg.circle-middle circle.back {
    animation: circle-middle6123 1.8s ease infinite 0.25s;
  }

  #wifi-loader svg.circle-middle circle.front {
    animation: circle-middle6123 1.8s ease infinite 0.1s;
  }

  #wifi-loader .text {
    position: absolute;
    bottom: -40px;
    display: flex;
    justify-content: center;
    align-items: center;
    text-transform: lowercase;
    font-weight: 500;
    font-size: 14px;
    letter-spacing: 0.2px;
    color: var(--text-color);
  }

  #wifi-loader .text::after {
    color: var(--front-color-in);
    animation: text-animation76 3.6s ease infinite;
    position: absolute;
    left: 0;
  }

  @keyframes circle-outer135 {
    0% { stroke-dashoffset: 25; }
    25% { stroke-dashoffset: 0; }
    65% { stroke-dashoffset: 301; }
    80% { stroke-dashoffset: 276; }
    100% { stroke-dashoffset: 276; }
  }

  @keyframes circle-middle6123 {
    0% { stroke-dashoffset: 17; }
    25% { stroke-dashoffset: 0; }
    65% { stroke-dashoffset: 204; }
    80% { stroke-dashoffset: 187; }
    100% { stroke-dashoffset: 187; }
  }

  @keyframes text-animation76 {
    0% { clip-path: inset(0 100% 0 0); }
    50% { clip-path: inset(0); }
    100% { clip-path: inset(0 0 0 100%); }
  }
`;

export default SuggestionLoader;
