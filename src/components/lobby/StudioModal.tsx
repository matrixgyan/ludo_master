import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Video, Play, Sparkles, Flame, Eye } from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

interface StudioModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StudioModal: React.FC<StudioModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const episodes = [
    {
      id: 1,
      title: 'Ludo Supreme: Secret Pro 6s Strategy',
      ep: 'EP 01',
      views: '450K',
      duration: '0:45',
      thumbnail: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=300&auto=format&fit=crop&q=80',
    },
    {
      id: 2,
      title: 'How to Climb Ladders & Avoid Snake Traps',
      ep: 'EP 02',
      views: '890K',
      duration: '1:10',
      thumbnail: 'https://images.unsplash.com/photo-1579373903781-fd5c0c30c4cd?w=300&auto=format&fit=crop&q=80',
    },
    {
      id: 3,
      title: 'Winning $50,000 Free Mega Tournament',
      ep: 'EP 03',
      views: '1.2M',
      duration: '0:58',
      thumbnail: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80',
    },
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md select-none">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative w-full max-w-md rounded-3xl bg-[#0e102b] border border-pink-500/30 p-5 shadow-2xl text-white max-h-[85vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-pink-600/30 border border-pink-400/40 flex items-center justify-center text-pink-300">
                <Video className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-lg font-black text-white">Zupee Studio</h3>
                <span className="text-[11px] text-pink-300">Chote episodes • Bada mazaa!</span>
              </div>
            </div>

            <button
              onClick={() => {
                SoundManager.play('click');
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Featured Mini Series Banner */}
          <div className="mt-4 relative rounded-2xl overflow-hidden border border-purple-400/40 bg-gradient-to-r from-purple-900 to-indigo-950 p-4 shadow-lg">
            <div className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-full mb-2">
              <Flame className="w-3 h-3 fill-slate-950" /> TRENDING NOW
            </div>
            <h4 className="text-base font-black text-white">The Ludo Grand Championship</h4>
            <p className="text-xs text-slate-300 mt-1">Watch master plays, pro tips, and epic moments in quick 60s shorts.</p>
          </div>

          {/* Episode List */}
          <div className="mt-4 space-y-3">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Episodes</h4>
            {episodes.map((ep) => (
              <div
                key={ep.id}
                className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer group"
                onClick={() => SoundManager.play('click')}
              >
                {/* Thumbnail */}
                <div className="relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-slate-800">
                  <img src={ep.thumbnail} alt={ep.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center text-slate-950 shadow-md">
                      <Play className="w-3 h-3 fill-slate-950" />
                    </div>
                  </div>
                  <span className="absolute bottom-1 right-1 bg-black/80 text-[9px] font-bold px-1 rounded text-white">
                    {ep.duration}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 text-[10px] text-pink-300 font-bold">
                    <span>{ep.ep}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 text-slate-400">
                      <Eye className="w-2.5 h-2.5" /> {ep.views}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-white truncate mt-0.5">{ep.title}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
