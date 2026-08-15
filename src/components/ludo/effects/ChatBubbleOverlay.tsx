import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage } from '../../../types/game';

interface ChatBubbleOverlayProps {
  messages: ChatMessage[];
}

export const ChatBubbleOverlay: React.FC<ChatBubbleOverlayProps> = ({ messages }) => {
  return (
    <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
      <AnimatePresence>
        {messages.slice(-3).map((msg) => {
          // Position relative to player color corners
          let positionClasses = 'top-16 left-4';
          if (msg.senderColor === 'red') positionClasses = 'top-16 right-4';
          if (msg.senderColor === 'green') positionClasses = 'bottom-28 right-4';
          if (msg.senderColor === 'yellow') positionClasses = 'bottom-28 left-4';

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.5, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: -20 }}
              transition={{ duration: 0.3 }}
              className={`absolute ${positionClasses} max-w-[200px] bg-slate-900/90 border-2 border-amber-300 text-white rounded-2xl p-2.5 shadow-2xl backdrop-blur-md flex items-center gap-2`}
            >
              {msg.isEmojiOnly ? (
                <span className="text-3xl animate-bounce">{msg.text}</span>
              ) : (
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-amber-300 uppercase">
                    {msg.senderName}
                  </span>
                  <span className="text-xs font-medium text-slate-100">{msg.text}</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
};
