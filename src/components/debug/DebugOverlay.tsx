import React from 'react';
import { X, Play, RotateCcw, Bug, Volume2, VolumeX } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

interface DebugOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  onForceDiceRoll: (value: number) => void;
  onResetGame: () => void;
  isDebugGridVisible: boolean;
  onToggleDebugGrid: () => void;
  isAutoPlay: boolean;
  onToggleAutoPlay: () => void;
  onTestAngelFlight?: () => void;
}

export const DebugOverlay: React.FC<DebugOverlayProps> = ({
  isOpen,
  onClose,
  onForceDiceRoll,
  onResetGame,
  isDebugGridVisible,
  onToggleDebugGrid,
  isAutoPlay,
  onToggleAutoPlay,
  onTestAngelFlight,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-slate-900 border-2 border-cyan-400/80 rounded-2xl p-4 text-white shadow-2xl flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-700">
          <div className="flex items-center gap-2">
            <Bug className="w-5 h-5 text-cyan-400" />
            <h3 className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-cyan-300">
              Game Menu & Tools
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-slate-700"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>
        </div>

        {/* Force Dice Roll Controls */}
        <div className="flex flex-col gap-2">
          <span className="text-xs font-bold text-slate-400 uppercase">Test Dice Value</span>
          <div className="grid grid-cols-6 gap-2">
            {[1, 2, 3, 4, 5, 6].map((num) => (
              <button
                key={num}
                onClick={() => {
                  SoundManager.play('click');
                  onForceDiceRoll(num);
                  onClose();
                }}
                className="bg-slate-800 hover:bg-cyan-600 text-white font-extrabold py-2 rounded-xl border border-slate-700 hover:border-cyan-300 transition-all active:scale-95 text-sm"
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* Option Switches */}
        <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
          {onTestAngelFlight && (
            <button
              onClick={() => {
                onTestAngelFlight();
                onClose();
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500/20 via-yellow-500/30 to-amber-500/20 border border-yellow-400 text-yellow-200 font-extrabold text-xs flex items-center justify-between hover:brightness-110 active:scale-95 transition-all shadow-[0_0_12px_rgba(234,179,8,0.3)]"
            >
              <div className="flex items-center gap-2">
                <span>🪽</span>
                <span>Test Angelic Pawn Return</span>
              </div>
              <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-yellow-400 text-slate-950">
                PLAY
              </span>
            </button>
          )}

          <button
            onClick={() => {
              SoundManager.play('click');
              onToggleDebugGrid();
            }}
            className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-between transition-colors ${
              isDebugGridVisible
                ? 'bg-cyan-900/60 border-cyan-400 text-cyan-200'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <span>Show Grid Coordinates (15x15)</span>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-black/40">
              {isDebugGridVisible ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => {
              SoundManager.play('click');
              onToggleAutoPlay();
            }}
            className={`w-full py-2.5 px-3 rounded-xl border font-bold text-xs flex items-center justify-between transition-colors ${
              isAutoPlay
                ? 'bg-emerald-900/60 border-emerald-400 text-emerald-200'
                : 'bg-slate-800 border-slate-700 text-slate-300'
            }`}
          >
            <span>Auto-Play AI Opponents</span>
            <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-black/40">
              {isAutoPlay ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>

        {/* Reset Game */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={() => {
              SoundManager.play('click');
              onResetGame();
              onClose();
            }}
            className="w-full bg-rose-600 hover:bg-rose-500 text-white font-bold py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 border border-rose-400 shadow-md transition-transform active:scale-95 text-xs"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset Board & Start Over</span>
          </button>
        </div>
      </div>
    </div>
  );
};
