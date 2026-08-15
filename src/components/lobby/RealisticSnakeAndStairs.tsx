import React from 'react';
import { motion } from 'motion/react';
import ultraRealSnakeImage from '../../assets/images/ultra_real_snake_ladder_1786712239732.jpg';

export const RealisticSnakeAndStairs: React.FC = () => {
  return (
    <div className="relative w-48 sm:w-52 h-32 select-none flex items-center justify-center overflow-visible">
      {/* Dynamic 3D Ground Shadow */}
      <div className="absolute -bottom-1 left-2 w-44 h-8 bg-black/80 rounded-full blur-lg pointer-events-none" />

      {/* Main 3D Stage Card */}
      <motion.div
        animate={{
          y: [0, -5, 0],
          rotateZ: [-0.5, 0.8, -0.5],
        }}
        transition={{
          duration: 3.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="relative w-44 sm:w-48 h-28 rounded-2xl overflow-hidden shadow-[0_14px_30px_rgba(0,0,0,0.85)] border border-emerald-400/40 bg-[#03150d] group"
      >
        {/* Ultra-Realistic Macro Photography / 3D Render Image */}
        <img
          src={ultraRealSnakeImage}
          alt="Realistic Snake and Stairs"
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover object-center filter brightness-105 contrast-110 group-hover:scale-105 transition-transform duration-700 ease-out"
        />

        {/* Cinematic Vignette for Atmospheric Depth */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#02110a] via-transparent to-[#02110a]/40 opacity-70 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#02110a]/80 pointer-events-none" />

        {/* Dynamic Specular Ray Trace Light Sweep over Polished Brass Ladder */}
        <motion.div
          animate={{
            x: ['-150%', '250%'],
          }}
          transition={{
            duration: 3.2,
            repeat: Infinity,
            repeatDelay: 2.5,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg] pointer-events-none"
        />

        {/* Emerald Scale Glint Effect */}
        <motion.div
          animate={{
            opacity: [0.2, 0.9, 0.2],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-2 left-3 w-5 h-5 rounded-full bg-emerald-300/40 blur-sm pointer-events-none"
        />

        {/* Metallic Gold Staircase Glow */}
        <motion.div
          animate={{
            opacity: [0.3, 0.8, 0.3],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute bottom-2 right-2 w-8 h-8 rounded-full bg-amber-400/30 blur-md pointer-events-none"
        />
      </motion.div>

      {/* Floating Gold & Emerald Light Particles */}
      <motion.div
        animate={{
          y: [0, -7, 0],
          opacity: [0.3, 1, 0.3],
        }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute -top-1.5 left-1 w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_10px_#fde047] pointer-events-none"
      />
      <motion.div
        animate={{
          y: [0, 6, 0],
          opacity: [0.4, 1, 0.4],
        }}
        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
        className="absolute -bottom-1 right-2 w-2.5 h-2.5 rounded-full bg-emerald-300 shadow-[0_0_10px_#6ee7b7] pointer-events-none"
      />
    </div>
  );
};
