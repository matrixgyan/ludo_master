import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smartphone, Info } from 'lucide-react';

interface BackExitToastProps {
  message: string | null;
}

export const BackExitToast: React.FC<BackExitToastProps> = ({ message }) => {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: 'spring', damping: 20, stiffness: 300 }}
          className="fixed bottom-20 left-1/2 -translate-x-1/2 z-[110] pointer-events-none max-w-[90vw]"
        >
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-slate-950/95 border border-amber-400/60 shadow-[0_10px_25px_rgba(0,0,0,0.8)] backdrop-blur-md">
            <Smartphone className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
            <span className="text-xs font-bold text-amber-200 tracking-wide whitespace-nowrap">
              {message}
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
