import React from 'react';
import { Menu, Plus, Volume2, VolumeX, Sparkles, ArrowLeft, CreditCard } from 'lucide-react';
import { SoundManager } from '../../../audio/soundManager';

interface TopBarHUDProps {
  onOpenMenu: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  gemsCount?: number;
  balance?: number;
  onBackToLobby?: () => void;
}

export const TopBarHUD: React.FC<TopBarHUDProps> = ({
  onOpenMenu,
  isMuted,
  onToggleMute,
  gemsCount = 1200,
  balance = 0.50,
  onBackToLobby,
}) => {
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
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-b from-blue-400 to-blue-600 border border-cyan-200 shadow-[0_4px_10px_rgba(0,0,0,0.5)] flex items-center justify-center text-white active:scale-95 transition-transform"
          title="Game Settings"
        >
          <Menu className="w-4 h-4 sm:w-5 sm:h-5 drop-shadow" />
        </button>
      </div>

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
          <div className="w-5 h-5 rounded-full bg-purple-950/80 flex items-center justify-center mr-1.5 text-amber-300">
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

