import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Info, Check, Sparkles, ChevronRight, Play, Trophy } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import arabAvatarImg from '../../assets/images/arab_avatar_man_1787143002600.jpg';
import woodBgImg from '../../assets/images/wood_plank_bg_1787143024792.jpg';

export type PlayerModeOption = 2 | 3 | 4;
export type GameVariation = 'Classic' | 'Master' | 'Quick';

export interface PlayerConfig {
  id: string;
  name: string;
  color: 'red' | 'yellow' | 'green' | 'blue';
  avatarUrl: string;
  isHuman: boolean;
}

interface LudoModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (
    mode: PlayerModeOption,
    entryFee: number,
    prizePool: number,
    gameType: 'classic' | 'supreme',
    variation?: GameVariation,
    playersConfig?: PlayerConfig[]
  ) => void;
  balance: number;
  gameType?: 'classic' | 'supreme';
}

const COLOR_MAP: Record<string, { bg: string; border: string; name: string }> = {
  red: { bg: '#f23c4d', border: '#b91c1c', name: 'Red' },
  yellow: { bg: '#f7d800', border: '#ca8a04', name: 'Yellow' },
  green: { bg: '#2ecc71', border: '#15803d', name: 'Green' },
  blue: { bg: '#3498db', border: '#1d4ed8', name: 'Blue' },
};

const COLOR_KEYS: ('red' | 'yellow' | 'green' | 'blue')[] = ['red', 'yellow', 'green', 'blue'];

const AVAILABLE_AVATARS = [
  { id: 'arab_man', url: arabAvatarImg, label: 'Desert King' },
  { id: 'player_f1', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', label: 'Luna' },
  { id: 'player_m1', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', label: 'Viper' },
  { id: 'player_f2', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', label: 'Aura' },
  { id: 'player_m2', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', label: 'Blaze' },
];

export const LudoModeSelectorModal: React.FC<LudoModeSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  balance,
  gameType = 'supreme',
}) => {
  const [variation, setVariation] = useState<GameVariation>('Classic');
  const [selectedMode, setSelectedMode] = useState<PlayerModeOption>(2);
  const [selectedFee, setSelectedFee] = useState<number>(0.50);
  const [showInfoModal, setShowInfoModal] = useState<boolean>(false);
  const [activeColorPickerIndex, setActiveColorPickerIndex] = useState<number | null>(null);
  const [activeAvatarPickerIndex, setActiveAvatarPickerIndex] = useState<number | null>(null);

  // Default Player Customizations (matching the screenshot)
  const [players, setPlayers] = useState<PlayerConfig[]>([
    {
      id: 'p1',
      name: 'Muonimoon',
      color: 'red',
      avatarUrl: arabAvatarImg,
      isHuman: true,
    },
    {
      id: 'p2',
      name: 'Player 2',
      color: 'yellow',
      avatarUrl: arabAvatarImg,
      isHuman: false,
    },
    {
      id: 'p3',
      name: 'Player 3',
      color: 'green',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
      isHuman: false,
    },
    {
      id: 'p4',
      name: 'Player 4',
      color: 'blue',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      isHuman: false,
    },
  ]);

  if (!isOpen) return null;

  const entryFees = [0, 0.50, 1.00, 2.50, 5.00];

  const calculatePrize = (mode: PlayerModeOption, fee: number): number => {
    if (fee === 0) return 0;
    const totalCollected = fee * mode;
    return Number((totalCollected * 0.88).toFixed(2));
  };

  const currentPrize = calculatePrize(selectedMode, selectedFee);

  const handleNameChange = (index: number, newName: string) => {
    setPlayers((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], name: newName };
      }
      return next;
    });
  };

  const handleColorChange = (index: number, newColor: 'red' | 'yellow' | 'green' | 'blue') => {
    SoundManager.play('click');
    setPlayers((prev) => {
      const next = [...prev];
      const oldColor = next[index].color;
      if (oldColor === newColor) return next;

      // Swap color with any other player who has this color
      const existingIdx = next.findIndex((p, i) => i !== index && p.color === newColor);
      if (existingIdx !== -1) {
        next[existingIdx] = { ...next[existingIdx], color: oldColor };
      }
      next[index] = { ...next[index], color: newColor };
      return next;
    });
    setActiveColorPickerIndex(null);
  };

  const handleAvatarChange = (index: number, avatarUrl: string) => {
    SoundManager.play('click');
    setPlayers((prev) => {
      const next = [...prev];
      if (next[index]) {
        next[index] = { ...next[index], avatarUrl };
      }
      return next;
    });
    setActiveAvatarPickerIndex(null);
  };

  const handleStartGame = () => {
    SoundManager.play('click');
    const activePlayers = players.slice(0, selectedMode);
    onSelectMode(selectedMode, selectedFee, currentPrize, gameType, variation, activePlayers);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 select-none overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/85 backdrop-blur-sm"
        />

        {/* 1. WOODEN PLANK BACKGROUND CONTAINER */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-sm sm:max-w-md rounded-3xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.95)] border-4 border-[#5c2411]/80 my-auto"
          style={{
            backgroundImage: `url(${woodBgImg})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundColor: '#8b4513',
          }}
        >
          {/* Warm Conical Spotlight from Top */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(255, 238, 187, 0.42) 0%, rgba(0, 0, 0, 0.55) 100%)',
            }}
          />

          {/* Close button (top right of wooden canvas) */}
          <button
            onClick={() => {
              SoundManager.play('click');
              onClose();
            }}
            className="absolute top-3 right-3 z-30 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 text-amber-100 flex items-center justify-center border border-amber-300/40 shadow-lg cursor-pointer transition-transform active:scale-95"
            title="Close"
          >
            <X className="w-4 h-4 stroke-[2.5]" />
          </button>

          {/* Inner Padding Container */}
          <div className="relative z-10 px-3.5 sm:px-5 py-6 flex flex-col items-center">
            {/* 2. THE TORN PARCHMENT SCROLL BOARD */}
            <div className="relative w-full max-w-[360px] sm:max-w-[390px] filter drop-shadow-[0_15px_25px_rgba(0,0,0,0.7)]">
              {/* TOP PUSHPINS (Deep Glossy Violet 3D Spheres with specularity and cast shadow) */}
              {/* Left Pushpin */}
              <div className="absolute -top-2 left-3 z-30 pointer-events-none">
                <div className="relative w-5 h-5 rounded-full bg-gradient-to-tr from-[#3b0764] via-[#581c87] to-[#7e22ce] shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.6)] border border-[#a855f7]/60 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/90 absolute top-1 left-1 blur-[0.3px]" />
                </div>
                <div className="w-4 h-2 bg-black/40 rounded-full blur-[1px] absolute -bottom-0.5 left-0.5" />
              </div>

              {/* Right Pushpin */}
              <div className="absolute -top-2 right-3 z-30 pointer-events-none">
                <div className="relative w-5 h-5 rounded-full bg-gradient-to-tr from-[#3b0764] via-[#581c87] to-[#7e22ce] shadow-[0_3px_6px_rgba(0,0,0,0.8),inset_0_2px_4px_rgba(255,255,255,0.6)] border border-[#a855f7]/60 flex items-center justify-center">
                  <div className="w-1.5 h-1.5 rounded-full bg-white/90 absolute top-1 left-1 blur-[0.3px]" />
                </div>
                <div className="w-4 h-2 bg-black/40 rounded-full blur-[1px] absolute -bottom-0.5 left-0.5" />
              </div>

              {/* Parchment Body */}
              <div
                className="relative w-full bg-gradient-to-b from-[#fde79b] via-[#fde492] to-[#f8d47b] text-[#5c2411] px-5 pt-6 pb-8 shadow-inner overflow-hidden border border-[#dfb35e]/60"
                style={{
                  clipPath: `polygon(
                    0% 0%, 
                    100% 0%, 
                    100% 32%, 
                    97% 34%, 
                    100% 36%, 
                    100% 68%, 
                    96.5% 70%, 
                    100% 72%, 
                    100% 94%, 
                    97% 96%, 
                    94% 94%, 
                    85% 96%, 
                    75% 94%, 
                    65% 98%, 
                    50% 93%, 
                    35% 97%, 
                    25% 94%, 
                    15% 96%, 
                    5% 94%, 
                    0% 97%, 
                    0% 75%, 
                    3.5% 73%, 
                    0% 71%, 
                    0% 40%, 
                    3.5% 38%, 
                    0% 36%
                  )`,
                }}
              >
                {/* Vintage Corner Flourishes / Filigree SVG */}
                {/* Top-Left Filigree */}
                <svg className="absolute top-2 left-2 w-8 h-8 text-[#caa050]/40 pointer-events-none" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
                </svg>
                {/* Top-Right Filigree */}
                <svg className="absolute top-2 right-2 w-8 h-8 text-[#caa050]/40 pointer-events-none rotate-90" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
                </svg>
                {/* Bottom-Left Filigree */}
                <svg className="absolute bottom-6 left-2 w-8 h-8 text-[#caa050]/40 pointer-events-none -rotate-90" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
                </svg>
                {/* Bottom-Right Filigree */}
                <svg className="absolute bottom-6 right-2 w-8 h-8 text-[#caa050]/40 pointer-events-none rotate-180" viewBox="0 0 100 100" fill="currentColor">
                  <path d="M10,10 Q40,15 50,40 Q25,35 15,60 Q10,35 10,10 Z M20,10 Q60,10 70,50 Q40,30 20,10 Z" />
                </svg>

                {/* 3. GAME MODE HEADER & INFO BUTTON */}
                <div className="relative flex flex-col items-center mb-4 text-center">
                  {/* Sky-Blue Beveled Info Button (Top Right) */}
                  <button
                    onClick={() => {
                      SoundManager.play('click');
                      setShowInfoModal(true);
                    }}
                    className="absolute -top-1 right-0 w-8 h-8 rounded-lg bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] border-2 border-[#7dd3fc] shadow-[0_3px_8px_rgba(2,132,199,0.5),inset_0_2px_3px_rgba(255,255,255,0.7)] flex items-center justify-center text-white font-serif font-black text-sm active:scale-95 transition-transform cursor-pointer"
                    title="Game Variation Rules"
                  >
                    i
                  </button>

                  <h2 className="text-sm sm:text-base font-black text-[#5c2411] tracking-wider uppercase drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                    GAME MODE
                  </h2>
                  <h1 className="text-2xl sm:text-3xl font-black text-[#5c2411] tracking-tight leading-none mt-0.5">
                    {gameType === 'supreme' ? 'Ludo Supreme' : 'Local Arena'}
                  </h1>
                </div>

                {/* 4. SELECT VARIATION SECTION */}
                <div className="mb-4">
                  <h3 className="text-xs sm:text-sm font-black text-[#5c2411] uppercase tracking-wider text-center mb-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                    SELECT VARIATION
                  </h3>

                  <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                    {(['Classic', 'Master', 'Quick'] as GameVariation[]).map((v) => {
                      const isSelected = variation === v;
                      return (
                        <button
                          key={v}
                          onClick={() => {
                            SoundManager.play('click');
                            setVariation(v);
                          }}
                          className={`relative py-2 px-1 rounded-2xl font-black text-xs sm:text-sm tracking-wide transition-all cursor-pointer shadow-md ${
                            isSelected
                              ? 'bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] text-white border-2 border-[#bae6fd] shadow-[0_4px_10px_rgba(2,132,199,0.5),inset_0_2px_4px_rgba(255,255,255,0.7)] scale-105'
                              : 'bg-gradient-to-b from-[#8da0bd] via-[#7487a5] to-[#5a6d89] text-white border-2 border-[#b8c7dc] hover:brightness-105 shadow-[0_2px_5px_rgba(0,0,0,0.3),inset_0_1px_2px_rgba(255,255,255,0.5)]'
                          }`}
                        >
                          {/* Beveled Top Highlight */}
                          <div className="absolute inset-x-2 top-0.5 h-[2px] bg-white/40 rounded-full" />
                          <span>{v}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 5. PLAYER INFORMATION & COUNT SELECTOR */}
                <div className="mb-4">
                  <h3 className="text-xs sm:text-sm font-black text-[#5c2411] uppercase tracking-wider text-center mb-2 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                    PLAYER INFORMATION
                  </h3>

                  {/* 2P, 3P, 4P Capsule Selectors */}
                  <div className="flex items-center justify-center gap-2 sm:gap-2.5 mb-3">
                    {([2, 3, 4] as PlayerModeOption[]).map((mode) => {
                      const isSelected = selectedMode === mode;
                      return (
                        <motion.button
                          key={`mode-${mode}`}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            SoundManager.play('click');
                            setSelectedMode(mode);
                          }}
                          className="flex items-center gap-1.5 bg-gradient-to-b from-[#944a69] via-[#813a58] to-[#6a2b45] text-white px-3 py-1.5 rounded-full border-2 border-[#b86d8c] shadow-[0_4px_8px_rgba(0,0,0,0.35),inset_0_2px_3px_rgba(255,255,255,0.4)] cursor-pointer"
                        >
                          <span className="font-black text-xs sm:text-sm tracking-wide">{mode}P</span>

                          {/* Checkbox Square (Green with check when selected, lavender box when unselected) */}
                          <div
                            className={`w-4 h-4 sm:w-5 sm:h-5 rounded-md flex items-center justify-center transition-all ${
                              isSelected
                                ? 'bg-gradient-to-b from-[#4ade80] to-[#22c55e] border border-[#bbf7d0] shadow-[inset_0_1px_2px_rgba(255,255,255,0.6)] text-white'
                                : 'bg-gradient-to-b from-[#9aa3b8] to-[#7f889e] border border-[#c3cbd9] shadow-inner'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3.5]" />}
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>

                  {/* 6. PLAYER ROWS (Pawn Color Square | Avatar | Wooden Name Input Box) */}
                  <div className="space-y-2">
                    {players.slice(0, selectedMode).map((player, idx) => {
                      const colorInfo = COLOR_MAP[player.color] || COLOR_MAP.red;

                      return (
                        <div key={player.id} className="flex items-center gap-2">
                          {/* 1. Pawn Color Selection Square */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                SoundManager.play('click');
                                setActiveColorPickerIndex(activeColorPickerIndex === idx ? null : idx);
                              }}
                              className="w-10 h-10 sm:w-11 sm:h-11 rounded-md p-0.5 shadow-[0_3px_6px_rgba(0,0,0,0.3)] transition-transform active:scale-95 cursor-pointer border"
                              style={{ backgroundColor: colorInfo.border }}
                              title="Click to change pawn color"
                            >
                              <div
                                className="w-full h-full rounded-[4px] border-2 border-white flex items-center justify-center"
                                style={{ backgroundColor: colorInfo.bg }}
                              />
                            </button>

                            {/* Color Picker Dropdown Popover */}
                            {activeColorPickerIndex === idx && (
                              <div className="absolute top-12 left-0 z-40 bg-[#3e1709] border-2 border-[#fbd682] p-1.5 rounded-xl shadow-2xl flex items-center gap-1.5">
                                {COLOR_KEYS.map((cKey) => (
                                  <button
                                    key={cKey}
                                    onClick={() => handleColorChange(idx, cKey)}
                                    className="w-7 h-7 rounded-md p-0.5 border border-white/80 active:scale-90 transition-transform"
                                    style={{ backgroundColor: COLOR_MAP[cKey].bg }}
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 2. Player Avatar Square */}
                          <div className="relative">
                            <button
                              onClick={() => {
                                SoundManager.play('click');
                                setActiveAvatarPickerIndex(activeAvatarPickerIndex === idx ? null : idx);
                              }}
                              className="w-10 h-10 sm:w-11 sm:h-11 rounded-md bg-white border-2 border-white p-0.5 shadow-[0_3px_6px_rgba(0,0,0,0.3)] overflow-hidden cursor-pointer active:scale-95 transition-transform flex items-center justify-center"
                              title="Click to choose avatar"
                            >
                              <img
                                src={player.avatarUrl}
                                alt={player.name}
                                className="w-full h-full object-cover rounded-[3px]"
                              />
                            </button>

                            {/* Avatar Picker Dropdown */}
                            {activeAvatarPickerIndex === idx && (
                              <div className="absolute top-12 left-0 z-40 bg-[#3e1709] border-2 border-[#fbd682] p-2 rounded-xl shadow-2xl flex items-center gap-2">
                                {AVAILABLE_AVATARS.map((av) => (
                                  <button
                                    key={av.id}
                                    onClick={() => handleAvatarChange(idx, av.url)}
                                    className="w-8 h-8 rounded-md overflow-hidden border-2 border-white/80 hover:border-yellow-400 active:scale-90 transition-transform"
                                  >
                                    <img src={av.url} alt={av.label} className="w-full h-full object-cover" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* 3. Caramel-Wood Name Input Box */}
                          <div className="flex-1 relative">
                            <input
                              type="text"
                              maxLength={15}
                              value={player.name}
                              onChange={(e) => handleNameChange(idx, e.target.value)}
                              className="w-full bg-[#cf7d54] hover:bg-[#d8875e] focus:bg-[#b86b44] text-white font-black text-xs sm:text-sm px-3.5 py-2.5 rounded-md shadow-[inset_0_2px_4px_rgba(0,0,0,0.35),0_2px_4px_rgba(0,0,0,0.2)] border border-[#e2936a]/80 outline-none placeholder-white/60 tracking-wide text-left transition-colors"
                              placeholder={`Player ${idx + 1}`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 7. ENTRY FEES & STAKES SELECTION */}
                <div className="mb-4 pt-2 border-t border-[#dfb35e]/70">
                  <div className="flex items-center justify-between text-[11px] font-black text-[#5c2411] uppercase tracking-wider mb-1.5 drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)]">
                    <span>ENTRY FEE & STAKES</span>
                    <span className="text-[#3b0764] font-extrabold">
                      Pool: {currentPrize > 0 ? `$${currentPrize.toFixed(2)}` : 'Practice'}
                    </span>
                  </div>

                  <div className="grid grid-cols-5 gap-1.5">
                    {entryFees.map((fee) => {
                      const isFeeSelected = selectedFee === fee;
                      return (
                        <button
                          key={fee}
                          onClick={() => {
                            SoundManager.play('click');
                            setSelectedFee(fee);
                          }}
                          className={`py-1.5 px-1 rounded-xl text-[11px] sm:text-xs font-black transition-all cursor-pointer shadow-sm ${
                            isFeeSelected
                              ? 'bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] text-white border-2 border-[#bae6fd] scale-105 shadow-[0_2px_8px_rgba(2,132,199,0.6)]'
                              : 'bg-[#e2af65]/40 hover:bg-[#e2af65]/70 text-[#5c2411] border border-[#caa050]/80'
                          }`}
                        >
                          {fee === 0 ? 'FREE' : `$${fee.toFixed(2)}`}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 8. PLAY NOW / START GAME BUTTON */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleStartGame}
                  className="w-full py-3 px-4 rounded-2xl bg-gradient-to-b from-[#22c55e] via-[#16a34a] to-[#15803d] hover:from-[#4ade80] hover:to-[#16a34a] text-white font-black text-sm sm:text-base tracking-wider uppercase shadow-[0_6px_15px_rgba(22,163,74,0.6),inset_0_2px_4px_rgba(255,255,255,0.7)] border-2 border-[#86efac] flex items-center justify-center gap-2 cursor-pointer transition-all active:brightness-95"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>START {selectedMode}P {variation.toUpperCase()} MATCH</span>
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* RULES INFO POPUP MODAL */}
        {showInfoModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-gradient-to-b from-[#fde79b] to-[#f8d47b] text-[#5c2411] border-4 border-[#5c2411] rounded-3xl p-5 max-w-xs w-full shadow-2xl"
            >
              <div className="flex items-center justify-between mb-3 border-b border-[#caa050]/70 pb-2">
                <h4 className="font-black text-base uppercase">Game Variations</h4>
                <button
                  onClick={() => setShowInfoModal(false)}
                  className="w-7 h-7 rounded-full bg-[#5c2411] text-amber-200 flex items-center justify-center"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-2 text-xs font-bold leading-relaxed">
                <p>
                  <strong className="text-[#3b0764]">Classic:</strong> Standard Ludo rules with full board rotation, home slot entry, and capturing.
                </p>
                <p>
                  <strong className="text-[#3b0764]">Master:</strong> Requires exact dice roll to capture safe zones with strategic blocking.
                </p>
                <p>
                  <strong className="text-[#3b0764]">Quick / Supreme:</strong> Fast-paced timer match. Pawns start open and highest points win!
                </p>
              </div>

              <button
                onClick={() => setShowInfoModal(false)}
                className="mt-4 w-full py-2 bg-[#5c2411] text-amber-200 rounded-xl font-black text-xs uppercase"
              >
                Got It!
              </button>
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
