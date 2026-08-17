import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Volume2,
  VolumeX,
  Globe,
  Copy,
  Check,
  Cloud,
  RefreshCw,
  HelpCircle,
  FileText,
  ShieldCheck,
  Sparkles,
  Send,
  MessageSquare,
  ChevronRight,
  Download,
  Upload,
  User,
  Trophy,
  Award,
  Swords,
  Zap,
} from 'lucide-react';
import { SoundManager } from '../../audio/soundManager';

interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance?: number;
  userName?: string;
  userAvatar?: string;
}

type SubModalType = null | 'save_load' | 'support' | 'terms' | 'privacy' | 'language' | 'player_profile';

const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', native: 'Español', flag: '🇪🇸' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇦🇪' },
  { code: 'pt', name: 'Portuguese', native: 'Português', flag: '🇧🇷' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', native: 'Deutsch', flag: '🇩🇪' },
  { code: 'id', name: 'Indonesian', native: 'Bahasa', flag: '🇮🇩' },
  { code: 'ru', name: 'Russian', native: 'Русский', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', native: '日本語', flag: '🇯🇵' },
];

export const GameSettingsModal: React.FC<GameSettingsModalProps> = ({
  isOpen,
  onClose,
  balance = 0.50,
  userName = 'Player 1',
  userAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
}) => {
  // Volume & Preferences State
  const [sfxVolume, setSfxVolumeState] = useState<number>(() => {
    return SoundManager.getSfxVolume();
  });
  const [musicVolume, setMusicVolumeState] = useState<number>(() => {
    return SoundManager.getMusicVolume();
  });
  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const v = localStorage.getItem('ludo_vibration');
      return v !== null ? v === 'true' : true;
    }
    return true;
  });
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const n = localStorage.getItem('ludo_notifications');
      return n !== null ? n === 'true' : true;
    }
    return true;
  });

  const [currentLanguage, setCurrentLanguage] = useState<{ code: string; name: string; flag: string }>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ludo_selected_language');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // fallback
        }
      }
    }
    return { code: 'en', name: 'English', flag: '🇺🇸' };
  });

  // Active Sub-Modal
  const [activeSubModal, setActiveSubModal] = useState<SubModalType>(null);
  const [copiedSupportId, setCopiedSupportId] = useState(false);
  const [supportId] = useState('TM-KRSMQWLQSKMPTTLN');

  // Support Form State
  const [ticketSubject, setTicketSubject] = useState('');
  const [ticketMessage, setTicketMessage] = useState('');
  const [ticketSent, setTicketSent] = useState(false);

  // Cloud Save State
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [cloudSyncSuccess, setCloudSyncSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setSfxVolumeState(SoundManager.getSfxVolume());
      setMusicVolumeState(SoundManager.getMusicVolume());
    }
  }, [isOpen]);

  const handleSfxChange = (newVal: number) => {
    setSfxVolumeState(newVal);
    SoundManager.setSfxVolume(newVal);
    SoundManager.play('click');
  };

  const handleMusicChange = (newVal: number) => {
    setMusicVolumeState(newVal);
    SoundManager.previewMusicVolume(newVal);
  };

  const handleToggleVibration = () => {
    SoundManager.play('click');
    const nextVal = !vibrationEnabled;
    setVibrationEnabled(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ludo_vibration', String(nextVal));
      if (nextVal && 'vibrate' in navigator) {
        navigator.vibrate(50);
      }
    }
  };

  const handleToggleNotifications = async () => {
    SoundManager.play('click');
    const nextVal = !notificationsEnabled;
    setNotificationsEnabled(nextVal);
    if (typeof window !== 'undefined') {
      localStorage.setItem('ludo_notifications', String(nextVal));
      if (nextVal && 'Notification' in window && Notification.permission !== 'granted') {
        try {
          await Notification.requestPermission();
        } catch {
          // Ignore
        }
      }
    }
  };

  const handleCopySupportId = () => {
    SoundManager.play('turn');
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(supportId).catch(() => {});
    }
    setCopiedSupportId(true);
    setTimeout(() => setCopiedSupportId(false), 2500);
  };

  const handleTriggerCloudSync = () => {
    SoundManager.play('turn');
    setIsCloudSyncing(true);
    setCloudSyncSuccess(false);
    setTimeout(() => {
      setIsCloudSyncing(false);
      setCloudSyncSuccess(true);
      SoundManager.play('match-found');
    }, 1200);
  };

  const handleExportSaveData = () => {
    SoundManager.play('click');
    const data = {
      user: userName,
      balance,
      supportId,
      sfxVolume,
      musicVolume,
      timestamp: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `LudoSave_${supportId}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md select-none overflow-y-auto">
        {/* Soft Background Ambiance */}
        <div
          className="absolute inset-0 bg-gradient-to-b from-emerald-950/40 via-black/70 to-slate-950/80 -z-10"
          onClick={onClose}
        />

        {/* MAIN SETTINGS KIOSK CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 20 }}
          transition={{ type: 'spring', damping: 22, stiffness: 320 }}
          className="relative w-full max-w-[340px] sm:max-w-[360px] my-auto flex flex-col items-center"
        >
          {/* ========================================================================= */}
          {/* 1. TOP 3D STYLIZED GIRL CHARACTER LEANING OVER AWNING */}
          {/* ========================================================================= */}
          <div className="relative w-full flex justify-center -mb-8 z-20 pointer-events-none">
            <motion.div
              animate={{
                y: [0, -4, 0],
                rotate: [0, 0.5, -0.5, 0],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
              className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-end justify-center drop-shadow-[0_12px_20px_rgba(0,0,0,0.45)]"
            >
              {/* Stylized 3D Girl Game Character Image */}
              <img
                src="/src/assets/images/stylized_3d_girl_game_character_1786884733837.jpg"
                alt="3D Stylized Girl Game Character"
                referrerPolicy="no-referrer"
                className="w-full h-full object-contain rounded-3xl filter saturate-[1.1] contrast-[1.05]"
              />

              {/* Sparkle FX */}
              <motion.div
                animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.6, 1, 0.6] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="absolute -top-1 right-2 text-amber-300 pointer-events-none"
              >
                <Sparkles className="w-5 h-5 fill-amber-300" />
              </motion.div>
            </motion.div>
          </div>

          {/* ========================================================================= */}
          {/* 2. TOP SCALLOPED CANDY AWNING ROOF & CONTROLS */}
          {/* ========================================================================= */}
          <div className="relative w-full z-10">
            {/* Hanging Rope with Postcard / Envelope Tag on Left */}
            <div className="absolute -top-16 left-3 sm:left-4 z-30 flex flex-col items-center pointer-events-auto">
              {/* Rope */}
              <div className="w-1.5 h-14 bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 rounded-full shadow-inner" />

              {/* Hanging Postal Envelope Tag */}
              <motion.button
                id="settings-mail-btn"
                whileHover={{ rotate: 8, scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => {
                  SoundManager.play('click');
                  setActiveSubModal('player_profile');
                }}
                className="relative -mt-1 w-12 h-9 bg-gradient-to-b from-[#fff7ed] to-[#fed7aa] border-2 border-[#ea580c]/60 rounded-lg shadow-[0_4px_10px_rgba(0,0,0,0.35)] flex items-center justify-center p-1 group cursor-pointer"
                title="View Player Profile & Records"
              >
                {/* Envelope fold styling */}
                <div className="relative w-full h-full border border-amber-300/80 rounded bg-[#fffbeb] flex items-center justify-center overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-3 bg-amber-200/60 border-b border-amber-300 transform -skew-y-3" />
                  <div className="w-4 h-4 rounded-full bg-emerald-600 border border-emerald-300 flex items-center justify-center text-white text-[9px] font-black z-10 shadow-sm">
                    ✉
                  </div>
                </div>
              </motion.button>
            </div>

            {/* Red Circular 3D Close Button on Right */}
            <motion.button
              id="settings-close-btn"
              whileHover={{ scale: 1.12, rotate: 90 }}
              whileTap={{ scale: 0.88 }}
              onClick={() => {
                SoundManager.play('click');
                onClose();
              }}
              className="absolute -top-3 -right-2 z-30 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-gradient-to-b from-[#f87171] via-[#ef4444] to-[#b91c1c] border-2 border-white/80 shadow-[0_5px_15px_rgba(239,68,68,0.5),inset_0_2px_4px_rgba(255,255,255,0.6)] flex items-center justify-center text-white font-black cursor-pointer active:brightness-95"
              title="Close Settings"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6 stroke-[3.5] drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]" />
            </motion.button>

            {/* Striped Canopy Awning */}
            <div className="relative w-full rounded-t-3xl pt-7 pb-4 px-4 bg-gradient-to-b from-[#fbbf24] via-[#f59e0b] to-[#d97706] shadow-[0_8px_20px_rgba(0,0,0,0.3)] border-t-2 border-x-2 border-amber-200 overflow-hidden">
              {/* Awning Vertical Stripes Pattern */}
              <div className="absolute inset-0 opacity-20 pointer-events-none bg-[repeating-linear-gradient(90deg,#ffffff,#ffffff_22px,#d97706_22px,#d97706_44px)]" />

              {/* Central "Settings" Title Badge */}
              <div className="relative flex items-center justify-center">
                <div className="relative px-6 py-1">
                  <h2
                    className="text-2xl sm:text-3xl font-black tracking-wide text-[#f87171] uppercase drop-shadow-[0_2px_0_#ffffff] filter"
                    style={{
                      fontFamily: 'system-ui, -apple-system, sans-serif',
                      textShadow: '0 2px 0 #ffffff, 0 3px 6px rgba(185,28,28,0.4)',
                    }}
                  >
                    Settings
                  </h2>
                </div>
              </div>

              {/* Scalloped Bottom Edge of Awning */}
              <div className="absolute -bottom-2.5 inset-x-0 flex justify-center gap-1 overflow-hidden pointer-events-none">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-9 h-5 bg-gradient-to-b from-[#d97706] to-[#fbbf24] rounded-b-full shadow-[0_3px_5px_rgba(0,0,0,0.2)] border-b border-amber-200/60"
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* 3. CARD BODY (WARM CREAM CASUAL GAME PANEL) */}
          {/* ========================================================================= */}
          <div className="relative w-full bg-[#fdfbf2] border-x-4 border-b-4 border-[#e6d8ba] rounded-b-[2.5rem] pt-6 pb-6 px-5 sm:px-6 shadow-[0_20px_45px_rgba(0,0,0,0.5),inset_0_2px_6px_rgba(255,255,255,0.8)] text-slate-800 flex flex-col items-center space-y-4">
            {/* SFX VOLUME SLIDER */}
            <div className="w-full flex flex-col items-center">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#78350f] mb-1.5 drop-shadow-[0_1px_0_#ffffff]">
                SFX
              </span>
              <div className="w-full flex items-center gap-2.5">
                {/* Mute Icon */}
                <button
                  onClick={() => handleSfxChange(sfxVolume > 0 ? 0 : 0.8)}
                  className="text-[#92400e] hover:text-[#78350f] transition-colors p-1"
                  title="Toggle SFX Mute"
                >
                  {sfxVolume === 0 ? (
                    <VolumeX className="w-5 h-5 text-rose-600 stroke-[2.5]" />
                  ) : (
                    <VolumeX className="w-5 h-5 opacity-60 stroke-[2.5]" />
                  )}
                </button>

                {/* Wooden Style Track & Slider */}
                <div className="relative flex-1 flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={sfxVolume}
                    onChange={(e) => handleSfxChange(parseFloat(e.target.value))}
                    className="w-full h-3.5 bg-[#d4c39e] rounded-full appearance-none cursor-pointer accent-[#b45309] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-[#b8a57e]"
                  />
                </div>

                {/* Full Sound Icon */}
                <button
                  onClick={() => handleSfxChange(1)}
                  className="text-[#92400e] hover:text-[#78350f] transition-colors p-1"
                  title="Max SFX Volume"
                >
                  <Volume2 className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* MUSIC VOLUME SLIDER */}
            <div className="w-full flex flex-col items-center">
              <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-[#78350f] mb-1.5 drop-shadow-[0_1px_0_#ffffff]">
                Music
              </span>
              <div className="w-full flex items-center gap-2.5">
                {/* Mute Icon */}
                <button
                  onClick={() => handleMusicChange(musicVolume > 0 ? 0 : 0.6)}
                  className="text-[#92400e] hover:text-[#78350f] transition-colors p-1"
                  title="Toggle Music Mute"
                >
                  {musicVolume === 0 ? (
                    <VolumeX className="w-5 h-5 text-rose-600 stroke-[2.5]" />
                  ) : (
                    <VolumeX className="w-5 h-5 opacity-60 stroke-[2.5]" />
                  )}
                </button>

                {/* Wooden Style Track & Slider */}
                <div className="relative flex-1 flex items-center">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={musicVolume}
                    onChange={(e) => handleMusicChange(parseFloat(e.target.value))}
                    className="w-full h-3.5 bg-[#d4c39e] rounded-full appearance-none cursor-pointer accent-[#b45309] shadow-[inset_0_2px_4px_rgba(0,0,0,0.3)] border border-[#b8a57e]"
                  />
                </div>

                {/* Full Sound Icon */}
                <button
                  onClick={() => handleMusicChange(1)}
                  className="text-[#92400e] hover:text-[#78350f] transition-colors p-1"
                  title="Max Music Volume"
                >
                  <Volume2 className="w-5 h-5 stroke-[2.5]" />
                </button>
              </div>
            </div>

            {/* CHECKBOXES: VIBRATION & NOTIFICATIONS */}
            <div className="w-full flex flex-col space-y-2.5 pt-1">
              {/* Vibration Checkbox */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleToggleVibration}
                className="flex items-center gap-3.5 group cursor-pointer text-left"
              >
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shadow-[inset_0_2px_3px_rgba(0,0,0,0.15)] ${
                    vibrationEnabled
                      ? 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] border-[#b45309] text-white shadow-[0_2px_6px_rgba(217,119,6,0.4)]'
                      : 'bg-[#ede3ce] border-[#cbb892] text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3.5]" />
                </div>
                <span className="text-sm font-black text-[#5e2b0c] group-hover:text-[#451a03] transition-colors">
                  Vibration
                </span>
              </motion.button>

              {/* Notifications Checkbox */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleToggleNotifications}
                className="flex items-center gap-3.5 group cursor-pointer text-left"
              >
                <div
                  className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all shadow-[inset_0_2px_3px_rgba(0,0,0,0.15)] ${
                    notificationsEnabled
                      ? 'bg-gradient-to-b from-[#f59e0b] to-[#d97706] border-[#b45309] text-white shadow-[0_2px_6px_rgba(217,119,6,0.4)]'
                      : 'bg-[#ede3ce] border-[#cbb892] text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3.5]" />
                </div>
                <span className="text-sm font-black text-[#5e2b0c] group-hover:text-[#451a03] transition-colors">
                  Notifications
                </span>
              </motion.button>
            </div>

            {/* ========================================================================= */}
            {/* 4. TACTILE 3D ACTION BUTTONS */}
            {/* ========================================================================= */}
            <div className="w-full flex flex-col space-y-2.5 pt-2">
              {/* SAVE / LOAD PROGRESS BUTTON (GLOSSY GREEN WITH CLOUD ICON) */}
              <div className="relative w-full">
                {/* Floating Cloud Sync Icon Badge on top-left of button */}
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                  className="absolute -top-3 -left-2 z-10 w-9 h-9 rounded-2xl bg-gradient-to-tr from-cyan-400 to-sky-200 border-2 border-white shadow-[0_4px_10px_rgba(6,182,212,0.4)] flex items-center justify-center text-sky-950 pointer-events-none"
                >
                  <RefreshCw className="w-4 h-4 text-sky-900 animate-spin" style={{ animationDuration: '8s' }} />
                </motion.div>

                <motion.button
                  id="settings-save-load-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    SoundManager.play('click');
                    setActiveSubModal('save_load');
                  }}
                  className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-b from-[#86efac] via-[#22c55e] to-[#15803d] border-t-2 border-x border-[#bbf7d0] shadow-[0_5px_0_#14532d,0_8px_15px_rgba(21,128,61,0.35)] flex items-center justify-center text-white font-black text-sm tracking-wide active:translate-y-1 active:shadow-[0_2px_0_#14532d] transition-all cursor-pointer drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                >
                  <span className="ml-5">Save/Load Progress</span>
                </motion.button>
              </div>

              {/* CONTACT SUPPORT BUTTON (GLOSSY BLUE) */}
              <motion.button
                id="settings-support-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  SoundManager.play('click');
                  setActiveSubModal('support');
                }}
                className="w-full py-2.5 px-4 rounded-2xl bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] border-t-2 border-x border-[#bae6fd] shadow-[0_5px_0_#075985,0_8px_15px_rgba(2,132,199,0.35)] flex items-center justify-center text-white font-black text-sm tracking-wide active:translate-y-1 active:shadow-[0_2px_0_#075985] transition-all cursor-pointer drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
              >
                <span>Contact Support</span>
              </motion.button>

              {/* TERMS OF SERVICE & PRIVACY POLICY SPLIT BUTTONS */}
              <div className="w-full grid grid-cols-2 gap-2.5">
                {/* Terms of Service */}
                <motion.button
                  id="settings-terms-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    SoundManager.play('click');
                    setActiveSubModal('terms');
                  }}
                  className="py-2 px-2 rounded-2xl bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] border-t-2 border-x border-[#bae6fd] shadow-[0_4px_0_#075985,0_6px_12px_rgba(2,132,199,0.3)] flex items-center justify-center text-center text-white font-black text-xs leading-tight active:translate-y-1 active:shadow-[0_2px_0_#075985] transition-all cursor-pointer drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                >
                  <span>Terms of<br />Service</span>
                </motion.button>

                {/* Privacy Policy */}
                <motion.button
                  id="settings-privacy-btn"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => {
                    SoundManager.play('click');
                    setActiveSubModal('privacy');
                  }}
                  className="py-2 px-2 rounded-2xl bg-gradient-to-b from-[#38bdf8] via-[#0284c7] to-[#0369a1] border-t-2 border-x border-[#bae6fd] shadow-[0_4px_0_#075985,0_6px_12px_rgba(2,132,199,0.3)] flex items-center justify-center text-center text-white font-black text-xs leading-tight active:translate-y-1 active:shadow-[0_2px_0_#075985] transition-all cursor-pointer drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                >
                  <span>Privacy<br />Policy</span>
                </motion.button>
              </div>

              {/* LANGUAGE SELECTOR BUTTON (GLOSSY GREEN WITH 3D GLOBE) */}
              <motion.button
                id="settings-language-btn"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => {
                  SoundManager.play('click');
                  setActiveSubModal('language');
                }}
                className="w-full py-2 px-4 rounded-2xl bg-gradient-to-b from-[#86efac] via-[#22c55e] to-[#15803d] border-t-2 border-x border-[#bbf7d0] shadow-[0_5px_0_#14532d,0_8px_15px_rgba(21,128,61,0.35)] flex items-center justify-between text-white font-black text-sm tracking-wide active:translate-y-1 active:shadow-[0_2px_0_#14532d] transition-all cursor-pointer drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
              >
                {/* 3D Globe Badge */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 border border-white/80 flex items-center justify-center shadow-md">
                  <Globe className="w-5 h-5 text-white" />
                </div>

                {/* Selected Language Label */}
                <div className="flex items-center gap-2">
                  <span className="text-base">{currentLanguage.flag}</span>
                  <span className="font-black text-base">{currentLanguage.name}</span>
                </div>

                <div className="text-white/80 text-xs font-bold uppercase tracking-wider">
                  Change ▾
                </div>
              </motion.button>
            </div>

            {/* ========================================================================= */}
            {/* 5. SUPPORT ID FOOTER WITH ORNAMENTS & COPY TOOLTIP */}
            {/* ========================================================================= */}
            <div className="w-full pt-3 flex flex-col items-center">
              {/* Decorative flourish ornament */}
              <div className="flex items-center justify-center gap-1.5 text-[#a16207]/70 font-serif text-xs">
                <span>❧ ◈</span>
                <span className="font-sans font-bold text-[11px] uppercase tracking-wider text-[#78350f]">
                  Support ID
                </span>
                <span>◈ ☙</span>
              </div>

              {/* Alphanumeric ID string (Click to Copy) */}
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleCopySupportId}
                className="mt-1 flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#ede3ce]/60 hover:bg-[#ede3ce] border border-[#d6c7a7] transition-all group cursor-pointer"
                title="Click to Copy Support ID"
              >
                <span className="font-mono font-black text-xs sm:text-sm text-[#78350f] tracking-wider">
                  {supportId}
                </span>
                {copiedSupportId ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[3]" />
                ) : (
                  <Copy className="w-3.5 h-3.5 text-[#92400e] group-hover:text-[#78350f] transition-colors" />
                )}
              </motion.button>

              {/* Copied Feedback Toast */}
              {copiedSupportId && (
                <motion.span
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-[10px] font-black text-emerald-700 mt-1"
                >
                  ✓ Copied to clipboard!
                </motion.span>
              )}
            </div>
          </div>
        </motion.div>

        {/* ========================================================================= */}
        {/* SUB-MODALS (Save/Load, Support, Terms, Privacy, Language, Profile) */}
        {/* ========================================================================= */}
        {activeSubModal && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full max-w-sm rounded-3xl bg-[#0f172a] border-2 border-amber-400/40 p-5 shadow-2xl text-white select-none max-h-[85vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <div className="flex items-center gap-2">
                  {activeSubModal === 'save_load' && <Cloud className="w-5 h-5 text-emerald-400" />}
                  {activeSubModal === 'support' && <MessageSquare className="w-5 h-5 text-sky-400" />}
                  {activeSubModal === 'terms' && <FileText className="w-5 h-5 text-amber-400" />}
                  {activeSubModal === 'privacy' && <ShieldCheck className="w-5 h-5 text-cyan-400" />}
                  {activeSubModal === 'language' && <Globe className="w-5 h-5 text-teal-400" />}
                  {activeSubModal === 'player_profile' && <User className="w-5 h-5 text-purple-400" />}

                  <h3 className="text-lg font-black text-white capitalize">
                    {activeSubModal === 'save_load' && 'Save / Load Progress'}
                    {activeSubModal === 'support' && 'Player Support Desk'}
                    {activeSubModal === 'terms' && 'Terms of Service'}
                    {activeSubModal === 'privacy' && 'Privacy Policy'}
                    {activeSubModal === 'language' && 'Select Game Language'}
                    {activeSubModal === 'player_profile' && 'Player Game Passport'}
                  </h3>
                </div>

                <button
                  onClick={() => {
                    SoundManager.play('click');
                    setActiveSubModal(null);
                  }}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 1. SAVE / LOAD PROGRESS SUB-MODAL */}
              {activeSubModal === 'save_load' && (
                <div className="space-y-4 pt-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                      <Cloud className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">Cloud Sync Active</h4>
                      <p className="text-xs text-emerald-300">
                        Player Data: <span className="font-mono font-bold text-white">{supportId}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleTriggerCloudSync}
                      disabled={isCloudSyncing}
                      className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 font-black text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                    >
                      <RefreshCw className={`w-4 h-4 ${isCloudSyncing ? 'animate-spin' : ''}`} />
                      <span>{isCloudSyncing ? 'Syncing to Cloud...' : 'Backup Progress to Cloud'}</span>
                    </motion.button>

                    {cloudSyncSuccess && (
                      <p className="text-center text-xs font-bold text-emerald-400">
                        ✓ All match records, themes & wallet balance saved successfully!
                      </p>
                    )}

                    <motion.button
                      whileTap={{ scale: 0.97 }}
                      onClick={handleExportSaveData}
                      className="w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/10 font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-amber-300" />
                      <span>Export Save File (.json)</span>
                    </motion.button>
                  </div>
                </div>
              )}

              {/* 2. CONTACT SUPPORT SUB-MODAL */}
              {activeSubModal === 'support' && (
                <div className="space-y-3 pt-3">
                  <div className="p-3 rounded-2xl bg-sky-950/40 border border-sky-500/30 text-xs text-sky-200">
                    <p className="font-bold text-white mb-1">24/7 VIP Player Help Desk</p>
                    <p>Have an issue with a match, deposit, or rules? Our team responds within 5 minutes.</p>
                  </div>

                  {ticketSent ? (
                    <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
                      <div className="w-10 h-10 mx-auto rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
                        <Check className="w-5 h-5 stroke-[3]" />
                      </div>
                      <h4 className="text-sm font-black text-white">Ticket Submitted!</h4>
                      <p className="text-xs text-slate-300">
                        Ticket Ref: <span className="font-mono text-emerald-300">#TK-{Math.floor(100000 + Math.random() * 900000)}</span>
                      </p>
                      <button
                        onClick={() => setTicketSent(false)}
                        className="text-xs text-sky-400 underline font-bold"
                      >
                        Submit another query
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (!ticketMessage.trim()) return;
                        SoundManager.play('match-found');
                        setTicketSent(true);
                        setTicketSubject('');
                        setTicketMessage('');
                      }}
                      className="space-y-2.5"
                    >
                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Issue Category</label>
                        <select
                          value={ticketSubject}
                          onChange={(e) => setTicketSubject(e.target.value)}
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-400"
                        >
                          <option value="Gameplay & Dice Rules">Gameplay & Dice Rules</option>
                          <option value="Deposit / USDT Wallet">Deposit / USDT Wallet</option>
                          <option value="Tournament Rank">Tournament Rank</option>
                          <option value="Bug Report / Feedback">Bug Report / Feedback</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-300 mb-1">Message</label>
                        <textarea
                          rows={3}
                          value={ticketMessage}
                          onChange={(e) => setTicketMessage(e.target.value)}
                          placeholder="Describe your issue or feedback..."
                          className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-400 resize-none"
                          required
                        />
                      </div>

                      <motion.button
                        whileTap={{ scale: 0.97 }}
                        type="submit"
                        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 font-black text-xs flex items-center justify-center gap-2 shadow-md cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Support Message</span>
                      </motion.button>
                    </form>
                  )}
                </div>
              )}

              {/* 3. TERMS OF SERVICE */}
              {activeSubModal === 'terms' && (
                <div className="space-y-3 pt-3 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-bold text-white mb-1">1. Fair Play & Anti-Cheat Guarantee</h4>
                    <p>All dice rolls are governed by cryptographically audited PRNG (Pseudorandom Number Generators) ensuring equal probability for all players.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-bold text-white mb-1">2. Prize Pool & Wallet Settlement</h4>
                    <p>Winnings are settled immediately in USDT tokens with zero platform lock-in. Players are responsible for their network gas and EVM keys.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-bold text-white mb-1">3. Consecutive Sixes & Safe Havens</h4>
                    <p>Rolling 3 consecutive 6s immediately forfeits turn. Star tiles and home columns are immutable safe zones.</p>
                  </div>
                </div>
              )}

              {/* 4. PRIVACY POLICY */}
              {activeSubModal === 'privacy' && (
                <div className="space-y-3 pt-3 text-xs text-slate-300 leading-relaxed max-h-[60vh] overflow-y-auto pr-1">
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-bold text-white mb-1">🔒 Decentralized Data Ownership</h4>
                    <p>We do not sell personal data. Your gameplay telemetry and wallet signatures are stored encrypted on-device and in isolated cloud partitions.</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                    <h4 className="font-bold text-white mb-1">🌐 Cookies & Local Storage</h4>
                    <p>Local state is used solely for audio preferences, theme customization, and rapid reconnection to live matches.</p>
                  </div>
                </div>
              )}

              {/* 5. LANGUAGE SELECTOR SUB-MODAL */}
              {activeSubModal === 'language' && (
                <div className="grid grid-cols-2 gap-2 pt-3">
                  {AVAILABLE_LANGUAGES.map((lang) => {
                    const isSelected = currentLanguage.code === lang.code;
                    return (
                      <motion.button
                        key={lang.code}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          SoundManager.play('click');
                          setCurrentLanguage(lang);
                          if (typeof window !== 'undefined') {
                            localStorage.setItem('ludo_selected_language', JSON.stringify(lang));
                          }
                          setActiveSubModal(null);
                        }}
                        className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-400 text-white font-black'
                            : 'bg-white/5 border-white/10 hover:bg-white/10 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{lang.flag}</span>
                          <div>
                            <span className="text-xs block leading-tight font-bold">{lang.name}</span>
                            <span className="text-[10px] text-slate-400">{lang.native}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* 6. PLAYER GAME PASSPORT (PROFILE) */}
              {activeSubModal === 'player_profile' && (
                <div className="space-y-3 pt-3">
                  <div className="flex flex-col items-center">
                    <div className="relative w-16 h-16 rounded-full border-2 border-amber-400 p-0.5 shadow-lg bg-indigo-900">
                      <img
                        src={userAvatar}
                        alt="Avatar"
                        className="w-full h-full object-cover rounded-full"
                      />
                      <div className="absolute -bottom-1 -right-1 bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 py-0.5 rounded-full">
                        LVL 18
                      </div>
                    </div>

                    <h4 className="text-base font-black text-white mt-1.5">{userName}</h4>
                    <span className="text-[11px] text-amber-300 font-bold">Ludo Supreme Champion</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                      <Trophy className="w-4 h-4 text-amber-400 mx-auto mb-0.5" />
                      <span className="text-[10px] text-slate-400">Total Winnings</span>
                      <span className="block text-sm font-black text-white">${balance.toFixed(2)}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                      <Swords className="w-4 h-4 text-rose-400 mx-auto mb-0.5" />
                      <span className="text-[10px] text-slate-400">Win Rate</span>
                      <span className="block text-sm font-black text-emerald-400">74.5%</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                      <Zap className="w-4 h-4 text-cyan-400 mx-auto mb-0.5" />
                      <span className="text-[10px] text-slate-400">Matches</span>
                      <span className="block text-sm font-black text-white">128</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-center">
                      <Award className="w-4 h-4 text-purple-400 mx-auto mb-0.5" />
                      <span className="text-[10px] text-slate-400">Rank</span>
                      <span className="block text-sm font-black text-amber-300">#59</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </AnimatePresence>
  );
};
