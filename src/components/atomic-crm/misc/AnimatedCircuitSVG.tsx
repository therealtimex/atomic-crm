import React from 'react';

export const AnimatedCircuitSVG = () => {
  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent overflow-hidden">
      <svg
        viewBox="0 0 800 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-lg"
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          {/* Gradient for the flowing lines */}
          <linearGradient id="flow-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4338ca" stopOpacity="0.2" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="1" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.2" />
          </linearGradient>

          {/* Glow filter for that "Neon" look */}
          <filter id="glow-filter" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        <style>
          {`
            /* 1. The Data Flow Animation (Moving Dashes) */
            .flow-line {
              stroke-dasharray: 10 10; /* Dash size, Gap size */
              animation: flow 1s linear infinite;
            }
            .flow-line-slow {
              stroke-dasharray: 15 15;
              animation: flow 3s linear infinite;
            }

            /* 2. Rotations */
            .spin-cw { animation: spin 10s linear infinite; transform-origin: 400px 300px; }
            .spin-ccw { animation: spin 15s linear reverse infinite; transform-origin: 400px 300px; }

            /* 3. Pulsing Center */
            .pulse-core { animation: pulse 2s ease-in-out infinite; transform-origin: 400px 300px; }

            /* 4. Scanning Radar Effect */
            .scanner { animation: scan 4s ease-in-out infinite; transform-origin: 400px 300px; }

            @keyframes flow {
              from { stroke-dashoffset: 20; }
              to { stroke-dashoffset: 0; }
            }
            
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }

            @keyframes pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(0.9); opacity: 0.8; }
            }

            @keyframes scan {
              0% { opacity: 0; transform: scale(0.5); }
              50% { opacity: 0.3; transform: scale(1.5); }
              100% { opacity: 0; transform: scale(2.5); }
            }
          `}
        </style>

        {/* --- Background Radar Ripples --- */}
        <circle cx="400" cy="300" r="120" stroke="#4338ca" strokeWidth="1.5" className="scanner" style={{ animationDelay: '0s' }} />
        <circle cx="400" cy="300" r="120" stroke="#4338ca" strokeWidth="1.5" className="scanner" style={{ animationDelay: '2s' }} />

        {/* --- Connecting Lines (The "Wires") --- */}
        {/* Left Wire */}
        <path d="M200 300 L320 300" stroke="#1e1b4b" strokeWidth="4" />
        <path d="M200 300 L320 300" stroke="url(#flow-grad)" strokeWidth="2" className="flow-line" />
        
        {/* Right Wire */}
        <path d="M600 300 L480 300" stroke="#1e1b4b" strokeWidth="4" />
        <path d="M600 300 L480 300" stroke="url(#flow-grad)" strokeWidth="2" className="flow-line" style={{ animationDirection: 'reverse' }} />

        {/* Top Wire */}
        <path d="M400 150 L400 220" stroke="#1e1b4b" strokeWidth="4" />
        <path d="M400 150 L400 220" stroke="url(#flow-grad)" strokeWidth="2" className="flow-line-slow" />

        {/* Diagonal Wires */}
        <path d="M250 450 L350 350" stroke="#1e1b4b" strokeWidth="2" />
        <path d="M250 450 L350 350" stroke="#6366f1" strokeWidth="1" strokeDasharray="5 5" opacity="0.5" />
        
        <path d="M550 150 L450 250" stroke="#1e1b4b" strokeWidth="2" />
        <path d="M550 150 L450 250" stroke="#6366f1" strokeWidth="1" strokeDasharray="5 5" opacity="0.5" />

        {/* --- Central Mechanism --- */}
        
        {/* Outer Ring (Rotating Counter-Clockwise) */}
        <g className="spin-ccw">
          <circle cx="400" cy="300" r="80" stroke="#4f46e5" strokeWidth="2" strokeDasharray="20 40" />
          <circle cx="400" cy="300" r="80" stroke="#4f46e5" strokeWidth="1" opacity="0.3" />
        </g>

        {/* Inner Ring (Rotating Clockwise) */}
        <g className="spin-cw">
           <circle cx="400" cy="300" r="60" stroke="#818cf8" strokeWidth="4" strokeDasharray="10 30" />
        </g>

        {/* Core (Pulsing) */}
        <g className="pulse-core">
          <circle cx="400" cy="300" r="40" fill="#1e1b4b" stroke="#6366f1" strokeWidth="2" />
          {/* Hexagon icon inside core */}
          <path d="M400 280 L417 290 V310 L400 320 L383 310 V290 Z" fill="#4f46e5" filter="url(#glow-filter)" />
        </g>
        
        {/* --- Floating Particles (Data Nodes) --- */}
        <circle cx="200" cy="300" r="5" fill="#818cf8" />
        <circle cx="600" cy="300" r="5" fill="#818cf8" />
        <circle cx="400" cy="150" r="5" fill="#818cf8" />

      </svg>
    </div>
  );
};