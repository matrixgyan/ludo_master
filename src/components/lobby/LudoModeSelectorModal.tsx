import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Crown, Zap, Check, Sparkles, Timer, Flame, ShieldAlert, Award } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';
import ludo2pImg from '../../assets/images/ludo_2player_3d_1786853248900.jpg';
import ludo3pImg from '../../assets/images/ludo_3player_3d_1786853262404.jpg';
import ludo4pImg from '../../assets/images/ludo_4player_3d_1786853274712.jpg';

export type PlayerModeOption = 2 | 3 | 4;

interface LudoModeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (mode: PlayerModeOption, entryFee: number, prizePool: number, gameType: 'classic' | 'supreme') => void;
  balance: number;
  gameType?: 'classic' | 'supreme';
}

// 3D Illustrated Game-Mode Tiles configuration
const MODE_TILES: Record<PlayerModeOption, {
  label: string;
  imageSrc: string;
  glowColor: string;
  activeBorder: string;
  bgGradient: string;
  badgeGradient: string;
}> = {
  2: {
    label: '2 PLAYERS',
    imageSrc: ludo2pImg,
    glowColor: 'rgba(56, 189, 248, 0.45)',
    activeBorder: 'border-cyan-400 ring-4 ring-cyan-400/40 shadow-[0_0_30px_rgba(56,189,248,0.6)]',
    bgGradient: 'from-blue-950/90 via-slate-900/90 to-cyan-950/80',
    badgeGradient: 'from-cyan-500 via-sky-400 to-blue-600',
  },
  3: {
    label: '3 PLAYERS',
    imageSrc: ludo3pImg,
    glowColor: 'rgba(52, 211, 153, 0.45)',
    activeBorder: 'border-emerald-400 ring-4 ring-emerald-400/40 shadow-[0_0_30px_rgba(52,211,153,0.6)]',
    bgGradient: 'from-emerald-950/90 via-slate-900/90 to-teal-950/80',
    badgeGradient: 'from-emerald-500 via-teal-400 to-emerald-600',
  },
  4: {
    label: '4 PLAYERS',
    imageSrc: ludo4pImg,
    glowColor: 'rgba(251, 191, 36, 0.55)',
    activeBorder: 'border-amber-400 ring-4 ring-amber-400/40 shadow-[0_0_30px_rgba(251,191,36,0.7)]',
    bgGradient: 'from-amber-950/90 via-purple-950/90 to-slate-950/80',
    badgeGradient: 'from-amber-500 via-yellow-400 to-amber-600',
  },
};

export const LudoModeSelectorModal: React.FC<LudoModeSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectMode,
  balance,
  gameType = 'supreme',
}) => {
  const [selectedMode, setSelectedMode] = useState<PlayerModeOption>(2);
  const [selectedFee, setSelectedFee] = useState<number>(0.50);

  if (!isOpen) return null;

  const entryFees = [0, 0.50, 1.00, 2.50, 5.00];

  const calculatePrize = (mode: PlayerModeOption, fee: number): number => {
    if (fee === 0) return 0;
    const totalCollected = fee * mode;
    return Number((totalCollected * 0.88).toFixed(2));
  };

  const currentPrize = calculatePrize(selectedMode, selectedFee);

  const handleStartMatching = () => {
    SoundManager.play('click');
    onSelectMode(selectedMode, selectedFee, currentPrize, gameType);
  };

  const isSupreme = gameType === 'supreme';

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          className={`relative w-full max-w-md ${
            isSupreme
              ? 'bg-gradient-to-b from-[#2d050f] via-[#1a0309] to-[#0d0104] border-amber-400/80 shadow-[0_25px_60px_rgba(234,88,12,0.4)]'
              : 'bg-gradient-to-b from-[#1b0833] via-[#120524] to-[#0a0215] border-violet-500/40 shadow-[0_25px_60px_rgba(0,0,0,0.95)]'
          } rounded-3xl border-2 overflow-hidden text-white flex flex-col max-h-[92vh] overflow-y-auto`}
        >
          {/* Ambient Top Glow */}
          <div
            className={`absolute -top-20 left-1/2 -translate-x-1/2 w-72 h-36 rounded-full blur-3xl pointer-events-none ${
              isSupreme ? 'bg-amber-600/30' : 'bg-violet-600/30'
            }`}
          />

          {/* Top Header */}
          <div
            className={`relative px-5 py-3.5 border-b ${
              isSupreme ? 'border-amber-900/50 bg-black/40' : 'border-violet-800/40 bg-black/25'
            } flex items-center justify-between z-10`}
          >
            <div className="flex items-center gap-2.5">
              <div
                className={`w-9 h-9 rounded-xl p-0.5 shadow-lg flex items-center justify-center ${
                  isSupreme
                    ? 'bg-gradient-to-tr from-amber-500 via-rose-500 to-yellow-400'
                    : 'bg-gradient-to-tr from-amber-500 to-yellow-300'
                }`}
              >
                <div
                  className={`w-full h-full rounded-[10px] flex items-center justify-center ${
                    isSupreme ? 'bg-[#2d050f]' : 'bg-[#1b0833]'
                  }`}
                >
                  {isSupreme ? (
                    <Flame className="w-5 h-5 text-amber-400 fill-amber-400 animate-pulse" />
                  ) : (
                    <Crown className="w-4 h-4 text-amber-300 fill-amber-300" />
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-base font-black tracking-tight text-white flex items-center gap-1.5 leading-tight">
                  <span>{isSupreme ? 'Ludo Supreme Speed Arena' : 'Ludo Online Arena'}</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                </h3>
                {isSupreme && (
                  <p className="text-[11px] font-bold text-amber-300/90 tracking-wide flex items-center gap-1">
                    <span>⚡ 2m 60s Speed Points Match</span>
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                SoundManager.play('click');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-4 space-y-3.5 z-10">
            {/* 1. SELECT NUMBER OF PLAYERS (2P, 3P, 4P) */}
            <div>
              <label className="block text-[11px] font-black text-amber-300/90 uppercase tracking-wider mb-2">
                1. Select Players Mode
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {([2, 3, 4] as PlayerModeOption[]).map((mode) => {
                  const tile = MODE_TILES[mode];
                  const isSelected = selectedMode === mode;

                  return (
                    <motion.div
                      key={`tile-${mode}`}
                      whileHover={{ scale: 1.04, y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => {
                        SoundManager.play('click');
                        setSelectedMode(mode);
                      }}
                      className={`relative rounded-2xl p-2 flex flex-col items-center justify-between cursor-pointer transition-all duration-300 border-2 overflow-hidden ${
                        isSelected
                          ? `bg-gradient-to-b ${tile.bgGradient} ${tile.activeBorder}`
                          : 'bg-white/5 border-white/15 hover:border-white/30 hover:bg-white/10 opacity-75 hover:opacity-100'
                      }`}
                    >
                      {/* Selected Active Glow Backdrop */}
                      {isSelected && (
                        <div
                          className="absolute inset-0 blur-xl pointer-events-none opacity-50"
                          style={{ backgroundColor: tile.glowColor }}
                        />
                      )}

                      {/* Top Selection Indicator Dot / Check */}
                      <div className="w-full flex justify-end mb-1 z-10">
                        <div
                          className={`w-5 h-5 rounded-full flex items-center justify-center transition-all ${
                            isSelected
                              ? 'bg-gradient-to-tr from-amber-400 to-yellow-300 text-slate-950 shadow-[0_0_10px_rgba(251,191,36,0.7)]'
                              : 'bg-black/40 border border-white/20'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>

                      {/* Dominant 3D Artwork Container */}
                      <div className="relative w-full aspect-square rounded-xl overflow-hidden bg-slate-950/80 border border-white/20 shadow-[0_6px_16px_rgba(0,0,0,0.6)] flex items-center justify-center">
                        <motion.img
                          src={tile.imageSrc}
                          alt={tile.label}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover select-none"
                          animate={isSelected ? { y: [-2, 2, -2], scale: [1, 1.05, 1] } : {}}
                          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                        />

                        {/* Glossy Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-white/15 pointer-events-none" />

                        {/* Floating Sparkle on Active Selection */}
                        {isSelected && (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                            className="absolute top-1 left-1 pointer-events-none"
                          >
                            <Sparkles className="w-3 h-3 text-yellow-300 drop-shadow-[0_0_4px_#fde047]" />
                          </motion.div>
                        )}
                      </div>

                      {/* Minimalist 3D Golden Label Banner */}
                      <div className="w-full mt-2 z-10">
                        <div
                          className={`w-full py-1 px-1 rounded-lg text-[11px] sm:text-xs font-black text-center tracking-tight uppercase shadow-md transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 border border-yellow-200 shadow-[0_2px_10px_rgba(251,191,36,0.6)]'
                              : 'bg-white/10 text-slate-200 border border-white/10'
                          }`}
                        >
                          {tile.label}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 2. ENTRY FEE SELECTION */}
            <div className="pt-2 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-extrabold uppercase text-amber-300/90 tracking-wide">
                  2. Select Entry Fee
                </span>
                <span className="text-slate-300">
                  Wallet: <strong className="text-amber-300 font-black">${balance.toFixed(2)}</strong>
                </span>
              </div>

              {/* Stake Chips */}
              <div className="grid grid-cols-5 gap-1.5">
                {entryFees.map((fee) => (
                  <button
                    key={fee}
                    onClick={() => {
                      SoundManager.play('click');
                      setSelectedFee(fee);
                    }}
                    className={`py-2 px-1 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center ${
                      selectedFee === fee
                        ? 'bg-gradient-to-b from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-[0_0_15px_rgba(251,191,36,0.6)] border border-yellow-200 scale-105'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
                    }`}
                  >
                    <span>{fee === 0 ? 'FREE' : `$${fee.toFixed(2)}`}</span>
                  </button>
                ))}
              </div>

              {/* Prize Pool Display */}
              <div className="flex items-center justify-between bg-black/40 rounded-xl px-3 py-2 border border-amber-400/30">
                <span className="text-[11px] font-bold text-slate-300">Winner Takes Pool:</span>
                <span className="text-sm font-black text-amber-300">
                  {currentPrize > 0 ? `$${currentPrize.toFixed(2)} USD` : 'Free Practice'}
                </span>
              </div>
            </div>

            {/* 3. LUDO SUPREME RULES BANNER */}
            {isSupreme && (
              <div className="bg-gradient-to-br from-amber-950/40 via-red-950/30 to-black/60 rounded-2xl p-3 border border-amber-500/30 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-1.5 text-amber-400 font-black text-xs">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>SUPREME SPEED RULES</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-slate-300">
                  <div className="flex items-start gap-1 bg-black/30 p-1.5 rounded-lg border border-white/5">
                    <Timer className="w-3.5 h-3.5 text-amber-300 shrink-0 mt-0.5" />
                    <span><strong>2m 60s (3 Min)</strong>: Highest score at timer wins!</span>
                  </div>
                  <div className="flex items-start gap-1 bg-black/30 p-1.5 rounded-lg border border-white/5">
                    <Zap className="w-3.5 h-3.5 text-cyan-300 shrink-0 mt-0.5" />
                    <span><strong>Open Pawns</strong>: All start outside, no 6 needed!</span>
                  </div>
                  <div className="flex items-start gap-1 bg-black/30 p-1.5 rounded-lg border border-white/5">
                    <Award className="w-3.5 h-3.5 text-emerald-300 shrink-0 mt-0.5" />
                    <span><strong>1st/2nd Home</strong>: Total score doubles (2X)!</span>
                  </div>
                  <div className="flex items-start gap-1 bg-black/30 p-1.5 rounded-lg border border-white/5">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                    <span><strong>Cut Pawn</strong>: Captured player score goes minus!</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Action Button */}
          <div
            className={`p-4 border-t ${
              isSupreme ? 'border-amber-900/50 bg-[#160206]' : 'border-violet-800/40 bg-[#0d021c]'
            } z-10`}
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleStartMatching}
              className={`w-full py-3.5 px-5 rounded-2xl font-black text-sm ${
                isSupreme
                  ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-amber-500 text-white shadow-[0_4px_25px_rgba(244,63,94,0.6)] border border-amber-300'
                  : 'bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-500 text-slate-950 shadow-[0_4px_25px_rgba(251,191,36,0.5)] border border-yellow-200'
              } flex items-center justify-center gap-2 transition-all cursor-pointer uppercase tracking-wider`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>START {selectedMode} PLAYER {isSupreme ? 'SUPREME MATCH' : 'BATTLE'}</span>
            </motion.button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
