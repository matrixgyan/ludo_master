import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Smile, MessageSquare, Mic, MicOff, X, Send } from 'lucide-react';
import { SoundManager } from '../../../audio/soundManager';
import { ChatMessage, PlayerColor } from '../../../types/game';
import { useBackHandler } from '../../../hooks/useBackHandler';

interface BottomControlsProps {
  isMutedMic: boolean;
  onToggleMic: () => void;
  onSendChat: (text: string, isEmoji?: boolean) => void;
  activeColor: PlayerColor;
  statusText: string;
}

const EMOJI_LIST = ['🎉', '🚀', '👑', '🎲', '🔥', '😭', '😂', '👏', '🏆', '💎', '😎', '⚡'];

const QUICK_CHATS = [
  'Good Luck!',
  'Roll a 6 please! 🎲',
  'Nice move! 👏',
  'So close! 😅',
  'Oops! 🙈',
  'GG WP! 🏆',
];

export const BottomControls: React.FC<BottomControlsProps> = ({
  isMutedMic,
  onToggleMic,
  onSendChat,
  statusText,
}) => {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showChatBox, setShowChatBox] = useState(false);
  const [customInput, setCustomInput] = useState('');

  // Mobile Back Handlers for Overlays
  useBackHandler(
    showEmojiPicker,
    () => {
      setShowEmojiPicker(false);
    },
    'hud_emoji_picker',
    'Emoji Picker'
  );

  useBackHandler(
    showChatBox,
    () => {
      setShowChatBox(false);
    },
    'hud_chat_box',
    'Quick Chat'
  );

  const handleSendEmoji = (emoji: string) => {
    SoundManager.play('click');
    onSendChat(emoji, true);
    setShowEmojiPicker(false);
  };

  const handleSendText = (text: string) => {
    if (!text.trim()) return;
    SoundManager.play('click');
    onSendChat(text, false);
    setCustomInput('');
    setShowChatBox(false);
  };

  return (
    <div className="relative w-full flex flex-col items-center gap-2 select-none z-30 pb-2">
      {/* Turn Status Instruction Banner */}
      <div className="bg-slate-900/90 border border-slate-700/80 px-4 py-1.5 rounded-full shadow-lg flex items-center justify-center backdrop-blur-sm">
        <span className="text-xs sm:text-sm font-extrabold text-amber-300 tracking-wider uppercase drop-shadow">
          {statusText}
        </span>
      </div>

      {/* Action Buttons Row */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-1">
        {/* Emoji Button */}
        <button
          onClick={() => {
            SoundManager.play('click');
            setShowEmojiPicker(!showEmojiPicker);
            setShowChatBox(false);
          }}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-amber-300 to-amber-500 border-2 border-yellow-100 shadow-[0_6px_14px_rgba(0,0,0,0.5)] flex items-center justify-center text-slate-950 active:scale-90 transition-transform"
          title="Send Emoji"
        >
          <Smile className="w-6 h-6 sm:w-7 sm:h-7 fill-amber-200 stroke-[2.5]" />
        </button>

        {/* Chat Button */}
        <button
          onClick={() => {
            SoundManager.play('click');
            setShowChatBox(!showChatBox);
            setShowEmojiPicker(false);
          }}
          className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 border-2 border-cyan-100 shadow-[0_6px_14px_rgba(0,0,0,0.5)] flex items-center justify-center text-white active:scale-90 transition-transform"
          title="Quick Chat"
        >
          <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
        </button>

        {/* Voice Mic Toggle Button */}
        <button
          onClick={() => {
            SoundManager.play('mic-toggle');
            onToggleMic();
          }}
          className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full border-2 border-cyan-100 shadow-[0_6px_14px_rgba(0,0,0,0.5)] flex items-center justify-center text-white active:scale-90 transition-transform ${
            isMutedMic
              ? 'bg-gradient-to-b from-slate-600 to-slate-800 text-slate-300'
              : 'bg-gradient-to-b from-cyan-400 to-blue-500 text-white'
          }`}
          title={isMutedMic ? 'Enable Mic' : 'Mute Mic'}
        >
          {isMutedMic ? (
            <MicOff className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
          ) : (
            <Mic className="w-6 h-6 sm:w-7 sm:h-7 stroke-[2.5]" />
          )}
        </button>
      </div>

      {/* Emoji Picker Modal */}
      <AnimatePresence>
        {showEmojiPicker && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 bg-slate-900/95 border-2 border-amber-400/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md w-72 max-w-[90vw] z-50"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-700 mb-2">
              <span className="text-xs font-bold text-amber-300 uppercase">Reactions</span>
              <button
                onClick={() => setShowEmojiPicker(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2 text-2xl text-center">
              {EMOJI_LIST.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleSendEmoji(emoji)}
                  className="p-2 hover:bg-slate-800 rounded-xl transition-transform active:scale-125"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Chat Overlay Modal */}
      <AnimatePresence>
        {showChatBox && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-20 bg-slate-900/95 border-2 border-blue-400/80 rounded-2xl p-3 shadow-2xl backdrop-blur-md w-80 max-w-[90vw] z-50 flex flex-col gap-2"
          >
            <div className="flex items-center justify-between pb-1 border-b border-slate-700">
              <span className="text-xs font-bold text-cyan-300 uppercase">Quick Chat</span>
              <button
                onClick={() => setShowChatBox(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Preset phrases */}
            <div className="grid grid-cols-1 gap-1.5 max-h-40 overflow-y-auto">
              {QUICK_CHATS.map((msg) => (
                <button
                  key={msg}
                  onClick={() => handleSendText(msg)}
                  className="w-full text-left text-xs font-semibold text-slate-200 bg-slate-800/80 hover:bg-blue-600/60 p-2 rounded-lg border border-slate-700 transition-colors"
                >
                  {msg}
                </button>
              ))}
            </div>

            {/* Custom input */}
            <div className="flex items-center gap-1.5 pt-1">
              <input
                type="text"
                placeholder="Type message..."
                value={customInput}
                onChange={(e) => setCustomInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendText(customInput)}
                className="flex-1 bg-slate-800 text-white text-xs px-3 py-2 rounded-lg border border-slate-600 focus:outline-none focus:border-cyan-400"
              />
              <button
                onClick={() => handleSendText(customInput)}
                className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
