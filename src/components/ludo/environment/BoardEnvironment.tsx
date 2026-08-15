import React from 'react';
import { motion } from 'motion/react';

export const BoardEnvironment: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="relative min-h-screen w-full bg-[#0d3b66] overflow-x-hidden flex flex-col justify-between select-none">
      {/* Background Pattern SVG */}
      <div
        className="absolute inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 20px 20px, rgba(255, 255, 255, 0.4) 2px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Decorative Subtle Background Doodles */}
      <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <g fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round">
            {/* Planes, Palms, Cars doodle shapes */}
            <path d="M 50 100 Q 70 80 90 100 T 130 100" />
            <circle cx="15%" cy="20%" r="25" strokeDasharray="4 4" />
            <circle cx="85%" cy="30%" r="40" strokeDasharray="6 6" />
            <path d="M 80% 75% Q 85% 65% 90% 75%" />
            <circle cx="20%" cy="80%" r="30" strokeDasharray="5 5" />
          </g>
        </svg>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 w-full max-w-[900px] mx-auto flex flex-col min-h-screen px-1.5 sm:px-3 py-1.5 justify-between">
        {children}
      </div>

      {/* Bottom Soft Shadow Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none z-0" />
    </div>
  );
};
