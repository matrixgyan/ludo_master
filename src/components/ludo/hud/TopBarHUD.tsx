import React from 'react';
import { Menu, Volume2, VolumeX, ArrowLeft, CreditCard, Timer, Flame, Trophy } from 'lucide-react';
import { SoundManager } from '../../../audio/soundManager';

interface TopBarHUDProps {
  onOpenMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  balance?: number;
  onBackToLobby?: () => void;
  gameType?: 'classic' | 'supreme';
  matchTimeLeft?: number;
  prizePool?: number;
}

export const TopBarHUD: React.FC<TopBarHUDProps> = ({
  onOpenMenu,
  isMuted,
  onToggleMute,
  balance = 0.50,
  onBackToLobby,
  gameType = 'supreme',
  matchTimeLeft = 180,
  prizePool = 0,
}) => {
  const isSupreme = gameType === 'supreme';
  const minutes = Math.floor(matchTimeLeft / 60);
  const seconds = matchTimeLeft % 60;
  const timeFormatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const isUrgent = matchTimeLeft <= 30;

  return (
    <div className="w-full flex items-center justify-between px-2 py-1 select-none z-30">
      {/* Left: Back to Lobby & Menu Button */}
      <div className="flex items-center gap-2">
        {onBackToLobby && (
          <button
            onClick={() => {
              SoundManager.play('click');
              onBackToLobby();
            }}
            className="flex items-center gap-1 bg-white/15 hover:bg-white/25 border border-white/20 px-3 py-1.5 rounded-full text-white text-xs font-black shadow-md active:scale-95 transition-all"
            title="Return to Game Lobby"
          >
            <ArrowLeft className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Lobby</span>
          </button>
        )}

        <button
          onClick={() => {
            SoundManager.play('click');
            onOpenMenu();
          }}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 border border-cyan-200 shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center text-white active:scale-95 transition-transform"
          title="Game Settings"
        >
          <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5 drop-shadow" />
        </button>
      </div>

      {/* Center: Ludo Supreme Speed Match Countdown Clock & Prize Pool */}
      {isSupreme && (
        <div className="flex items-center gap-2">
          {/* Match Countdown Clock */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full border shadow-lg backdrop-blur-md transition-all ${
              isUrgent
                ? 'bg-gradient-to-r from-red-600 to-rose-700 text-white border-red-300 animate-pulse shadow-red-500/50'
                : 'bg-black/70 text-amber-300 border-amber-500/40 shadow-amber-500/20'
            }`}
          >
            {isUrgent ? (
              <Flame className="w-4 h-4 text-yellow-300 animate-bounce" />
            ) : (
              <Timer className="w-4 h-4 text-amber-400" />
            )}
            <span className="font-mono text-sm sm:text-base font-black tracking-wider">
              {timeFormatted}
            </span>
          </div>

          {/* Prize Tag */}
          {prizePool > 0 && (
            <div className="hidden sm:flex items-center gap-1 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 px-2.5 py-1 rounded-full font-black text-xs border border-yellow-200 shadow-md">
              <Trophy className="w-3.5 h-3.5 fill-slate-950" />
              <span>${prizePool.toFixed(2)}</span>
            </div>
          )}
        </div>
      )}

      {/* Right Controls: Mute Toggle + Dollar Currency Banner */}
      <div className="flex items-center gap-2">
        {/* Mute Button */}
        <button
          onClick={onToggleMute}
          className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-900/80 border border-slate-600 text-amber-400 flex items-center justify-center shadow-md active:scale-90"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Currency Pill with DOLLAR ($) symbol */}
        <div className="relative flex items-center bg-[#371380] border border-purple-400/40 rounded-full pl-2.5 pr-2 py-1 shadow-lg">
          <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-purple-950/80 flex items-center justify-center mr-1.5 text-amber-300">
            <CreditCard className="w-3 h-3" />
          </div>

          <span className="text-white font-black text-xs sm:text-sm mr-1.5 tracking-wide">
            ${balance.toFixed(2)}
          </span>
        </div>
      </div>
    </div>
  );
};

