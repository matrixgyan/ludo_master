import React from 'react';
import { motion } from 'motion/react';

export const RealisticLudoDiceAndPawns: React.FC = () => {
  return (
    <div className="relative w-44 h-32 select-none flex items-center justify-center overflow-visible">
      {/* 3D Ambient Floor Shadows */}
      <div className="absolute bottom-1 left-2 w-40 h-8 bg-black/60 rounded-full blur-md pointer-events-none" />

      {/* SVG Canvas for Photorealistic 3D Isometric Dice & Glossy Clashing Pawns */}
      <svg
        viewBox="0 0 240 180"
        className="w-full h-full overflow-visible drop-shadow-[0_10px_20px_rgba(0,0,0,0.7)]"
      >
        <defs>
          {/* ================= DICE 3D SHADING & TEXTURES ================= */}
          {/* Top Face Gradient (Bright Overhead Light) */}
          <linearGradient id="diceTopFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="30%" stopColor="#f1f5f9" />
            <stop offset="80%" stopColor="#cbd5e1" />
            <stop offset="100%" stopColor="#94a3b8" />
          </linearGradient>

          {/* Left Face Gradient (Midtone Side Light) */}
          <linearGradient id="diceLeftFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#e2e8f0" />
            <stop offset="50%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>

          {/* Right Face Gradient (Deep Shadow Side) */}
          <linearGradient id="diceRightFace" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="50%" stopColor="#64748b" />
            <stop offset="100%" stopColor="#334155" />
          </linearGradient>

          {/* Recessed Dice Pip Shading (Deep Inset Hole) */}
          <radialGradient id="dicePipRed" cx="40%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#f43f5e" />
            <stop offset="40%" stopColor="#e11d48" />
            <stop offset="80%" stopColor="#9f1239" />
            <stop offset="100%" stopColor="#4c0519" />
          </radialGradient>

          <radialGradient id="dicePipBlack" cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="45%" stopColor="#1e293b" />
            <stop offset="85%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#020617" />
          </radialGradient>

          {/* ================= 3D PAWN SHADING: RED PAWN ================= */}
          {/* Red Pawn Head Sphere (True 3D Radial Specular) */}
          <radialGradient id="redPawnHead" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#fff1f2" />
            <stop offset="15%" stopColor="#fda4af" />
            <stop offset="45%" stopColor="#f43f5e" />
            <stop offset="75%" stopColor="#be123c" />
            <stop offset="95%" stopColor="#881337" />
            <stop offset="100%" stopColor="#4c0519" />
          </radialGradient>

          {/* Red Pawn Body Cone */}
          <linearGradient id="redPawnBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#881337" />
            <stop offset="25%" stopColor="#e11d48" />
            <stop offset="45%" stopColor="#fda4af" />
            <stop offset="65%" stopColor="#e11d48" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>

          {/* Red Pawn Base Rim */}
          <linearGradient id="redPawnBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="35%" stopColor="#e11d48" />
            <stop offset="70%" stopColor="#9f1239" />
            <stop offset="100%" stopColor="#4c0519" />
          </linearGradient>

          {/* ================= 3D PAWN SHADING: BLUE PAWN ================= */}
          {/* Blue Pawn Head Sphere (True 3D Radial Specular) */}
          <radialGradient id="bluePawnHead" cx="35%" cy="30%" r="70%">
            <stop offset="0%" stopColor="#ecfeff" />
            <stop offset="18%" stopColor="#67e8f9" />
            <stop offset="45%" stopColor="#06b6d4" />
            <stop offset="75%" stopColor="#0284c7" />
            <stop offset="95%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#082f49" />
          </radialGradient>

          {/* Blue Pawn Body Cone */}
          <linearGradient id="bluePawnBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#075985" />
            <stop offset="25%" stopColor="#0284c7" />
            <stop offset="45%" stopColor="#a5f3fc" />
            <stop offset="65%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#082f49" />
          </linearGradient>

          {/* Blue Pawn Base Rim */}
          <linearGradient id="bluePawnBase" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a5f3fc" />
            <stop offset="35%" stopColor="#0284c7" />
            <stop offset="70%" stopColor="#0369a1" />
            <stop offset="100%" stopColor="#082f49" />
          </linearGradient>

          {/* Gold Collar Ring Gradients */}
          <linearGradient id="goldCollar" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="25%" stopColor="#fef08a" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="75%" stopColor="#fef08a" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>

          {/* Impact Flare Shading */}
          <radialGradient id="sparkGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="35%" stopColor="#fde047" />
            <stop offset="70%" stopColor="#f97316" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        {/* 1. FLOATING 3D ISOMETRIC DICE */}
        <motion.g
          id="realistic-3d-dice"
          animate={{
            y: [0, -10, 0],
            rotateZ: [-3, 4, -3],
            rotateX: [6, -4, 6],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="origin-center"
        >
          {/* Dice Soft Ambient Ground Cast Shadow */}
          <ellipse cx="118" cy="85" rx="22" ry="7" fill="black" opacity="0.3" filter="blur(3px)" />

          {/* 3D Isometric Cube Center at (118, 48) */}
          {/* --- TOP FACE --- */}
          <polygon
            points="118,12 148,27 118,42 88,27"
            fill="url(#diceTopFace)"
            stroke="#ffffff"
            strokeWidth="0.8"
            strokeLinejoin="round"
          />

          {/* Top Face Center Pip (Big Red Star/Circle Pip #1) */}
          <ellipse
            cx="118"
            cy="27"
            rx="5.5"
            ry="3.2"
            fill="url(#dicePipRed)"
            stroke="#ffe4e6"
            strokeWidth="0.6"
          />
          <ellipse cx="117" cy="26" rx="1.5" ry="0.8" fill="#ffffff" opacity="0.8" />

          {/* --- LEFT FACE --- */}
          <polygon
            points="88,27 118,42 118,78 88,63"
            fill="url(#diceLeftFace)"
            stroke="#cbd5e1"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />

          {/* Left Face Pips (Pip #3: 3 recessed black pips along diagonal) */}
          {/* Top-Left */}
          <ellipse cx="98" cy="38" rx="2.5" ry="3.5" fill="url(#dicePipBlack)" />
          <ellipse cx="97.5" cy="37" rx="0.8" ry="1.2" fill="#ffffff" opacity="0.6" />
          {/* Center */}
          <ellipse cx="103" cy="52" rx="2.5" ry="3.5" fill="url(#dicePipBlack)" />
          <ellipse cx="102.5" cy="51" rx="0.8" ry="1.2" fill="#ffffff" opacity="0.6" />
          {/* Bottom-Right */}
          <ellipse cx="108" cy="66" rx="2.5" ry="3.5" fill="url(#dicePipBlack)" />
          <ellipse cx="107.5" cy="65" rx="0.8" ry="1.2" fill="#ffffff" opacity="0.6" />

          {/* --- RIGHT FACE --- */}
          <polygon
            points="118,42 148,27 148,63 118,78"
            fill="url(#diceRightFace)"
            stroke="#94a3b8"
            strokeWidth="0.6"
            strokeLinejoin="round"
          />

          {/* Right Face Pips (Pip #2: 2 recessed black pips) */}
          {/* Top-Right Pip */}
          <ellipse cx="138" cy="40" rx="2.6" ry="3.5" fill="url(#dicePipBlack)" />
          <ellipse cx="137.5" cy="39" rx="0.8" ry="1.2" fill="#ffffff" opacity="0.6" />
          {/* Bottom-Left Pip */}
          <ellipse cx="128" cy="64" rx="2.6" ry="3.5" fill="url(#dicePipBlack)" />
          <ellipse cx="127.5" cy="63" rx="0.8" ry="1.2" fill="#ffffff" opacity="0.6" />

          {/* Crisp 3D Edge Bevel Highlights */}
          <line x1="118" y1="12" x2="118" y2="42" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
          <line x1="88" y1="27" x2="118" y2="42" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />
          <line x1="118" y1="42" x2="148" y2="27" stroke="#ffffff" strokeWidth="0.8" opacity="0.8" />
          <line x1="118" y1="42" x2="118" y2="78" stroke="#ffffff" strokeWidth="1.2" opacity="0.6" />
        </motion.g>

        {/* 2. REALISTIC 3D RED PAWN (LUNGING FROM LEFT) */}
        <motion.g
          id="realistic-3d-red-pawn"
          animate={{
            x: [0, 6, 0],
            rotate: [-10, 2, -10],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="origin-bottom"
        >
          {/* Pawn Ground Shadow */}
          <ellipse cx="56" cy="155" rx="20" ry="6" fill="black" opacity="0.45" filter="blur(3px)" />

          {/* Base Tier 1 (Bottom Pedestal) */}
          <path
            d="M 38 148 C 38 143 74 143 74 148 L 74 153 C 74 157 38 157 38 153 Z"
            fill="url(#redPawnBase)"
            stroke="#9f1239"
            strokeWidth="0.5"
          />
          {/* Base Rim Highlight */}
          <ellipse cx="56" cy="148" rx="18" ry="4" fill="#fda4af" opacity="0.6" />

          {/* Base Tier 2 (Upper Stepped Pedestal) */}
          <path
            d="M 44 140 C 44 137 68 137 68 140 L 68 145 C 68 148 44 148 44 145 Z"
            fill="url(#redPawnBase)"
          />
          <ellipse cx="56" cy="140" rx="12" ry="2.8" fill="#fda4af" opacity="0.8" />

          {/* Conical Flared Body */}
          <path
            d="M 51 108 C 48 118 42 134 44 140 C 48 142 64 142 68 140 C 70 134 64 118 61 108 Z"
            fill="url(#redPawnBody)"
            stroke="#be123c"
            strokeWidth="0.5"
          />

          {/* Golden Metallic Collar Ring */}
          <path
            d="M 49 104 C 49 102 63 102 63 104 L 63 108 C 63 110 49 110 49 108 Z"
            fill="url(#goldCollar)"
            stroke="#fef08a"
            strokeWidth="0.5"
          />
          <ellipse cx="56" cy="104" rx="7" ry="2" fill="#fffbeb" opacity="0.9" />

          {/* Spherical Head with Specular Glint */}
          <circle cx="56" cy="90" r="14" fill="url(#redPawnHead)" />
          {/* Specular White Shine Spot */}
          <ellipse cx="52" cy="85" rx="4.5" ry="3" fill="#ffffff" opacity="0.85" />
          <circle cx="50" cy="84" r="1.5" fill="#ffffff" />
          {/* Subtle Ambient Bottom Bounce Light */}
          <path
            d="M 46 98 C 50 103 62 103 66 98"
            fill="none"
            stroke="#fda4af"
            strokeWidth="1.2"
            opacity="0.6"
          />
        </motion.g>

        {/* 3. REALISTIC 3D BLUE PAWN (LUNGING FROM RIGHT) */}
        <motion.g
          id="realistic-3d-blue-pawn"
          animate={{
            x: [0, -6, 0],
            rotate: [10, -2, 10],
          }}
          transition={{
            duration: 1.8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="origin-bottom"
        >
          {/* Pawn Ground Shadow */}
          <ellipse cx="178" cy="155" rx="22" ry="6.5" fill="black" opacity="0.45" filter="blur(3px)" />

          {/* Base Tier 1 (Bottom Pedestal) */}
          <path
            d="M 158 147 C 158 142 198 142 198 147 L 198 153 C 198 158 158 158 158 153 Z"
            fill="url(#bluePawnBase)"
            stroke="#0369a1"
            strokeWidth="0.5"
          />
          {/* Base Rim Highlight */}
          <ellipse cx="178" cy="147" rx="20" ry="4.5" fill="#a5f3fc" opacity="0.7" />

          {/* Base Tier 2 (Upper Stepped Pedestal) */}
          <path
            d="M 164 138 C 164 135 192 135 192 138 L 192 144 C 192 147 164 147 164 144 Z"
            fill="url(#bluePawnBase)"
          />
          <ellipse cx="178" cy="138" rx="14" ry="3.2" fill="#a5f3fc" opacity="0.8" />

          {/* Conical Flared Body */}
          <path
            d="M 172 102 C 168 114 162 132 164 138 C 169 141 187 141 192 138 C 194 132 188 114 184 102 Z"
            fill="url(#bluePawnBody)"
            stroke="#0284c7"
            strokeWidth="0.5"
          />

          {/* Golden Metallic Collar Ring */}
          <path
            d="M 170 98 C 170 96 186 96 186 98 L 186 102 C 186 104 170 104 170 102 Z"
            fill="url(#goldCollar)"
            stroke="#fef08a"
            strokeWidth="0.5"
          />
          <ellipse cx="178" cy="98" rx="8" ry="2.2" fill="#fffbeb" opacity="0.9" />

          {/* Spherical Head with Specular Glint */}
          <circle cx="178" cy="82" r="16" fill="url(#bluePawnHead)" />
          {/* Specular White Shine Spot */}
          <ellipse cx="173" cy="76" rx="5" ry="3.5" fill="#ffffff" opacity="0.9" />
          <circle cx="171" cy="75" r="1.8" fill="#ffffff" />
          {/* Subtle Ambient Bottom Bounce Light */}
          <path
            d="M 167 92 C 171 97 185 97 189 92"
            fill="none"
            stroke="#a5f3fc"
            strokeWidth="1.5"
            opacity="0.6"
          />
        </motion.g>

        {/* 4. CLASHING ENERGY IMPACT SPARKS & STARBURST */}
        <g id="clashing-sparks-fx">
          {/* Central Bright Starburst Energy Core */}
          <motion.ellipse
            cx="116"
            cy="114"
            rx="14"
            ry="14"
            fill="url(#sparkGlow)"
            animate={{
              scale: [0.7, 1.4, 0.7],
              opacity: [0.6, 1, 0.6],
            }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="origin-center pointer-events-none"
          />

          {/* Dynamic Laser Sparkles */}
          {[
            { x1: 116, y1: 114, x2: 98, y2: 100 },
            { x1: 116, y1: 114, x2: 134, y2: 98 },
            { x1: 116, y1: 114, x2: 104, y2: 130 },
            { x1: 116, y1: 114, x2: 128, y2: 128 },
            { x1: 116, y1: 114, x2: 116, y2: 88 },
          ].map((spark, i) => (
            <motion.line
              key={`spark-${i}`}
              x1={spark.x1}
              y1={spark.y1}
              x2={spark.x2}
              y2={spark.y2}
              stroke="#fef08a"
              strokeWidth="2"
              strokeLinecap="round"
              animate={{
                opacity: [0.2, 1, 0.2],
                scale: [0.8, 1.2, 0.8],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.15,
              }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
};
