import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Crown,
  Gamepad2,
  Check,
  Copy,
  UserCheck,
  KeyRound,
  Layers,
  Flame,
  ShieldAlert,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { SoundManager } from '../../audio/soundManager';
import { AuthClientService, AuthUser } from '../../services/authClientService';

interface AuthModalProps {
  isOpen: boolean;
  onClose?: () => void;
  onSuccess: (user: AuthUser) => void;
  initialTab?: 'register' | 'login';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialTab = 'register',
}) => {
  const [tab, setTab] = useState<'register' | 'login'>(initialTab);
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [registeredUser, setRegisteredUser] = useState<AuthUser | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  if (!isOpen) return null;

  const handleTabSwitch = (newTab: 'register' | 'login') => {
    SoundManager.play('click');
    setTab(newTab);
    setErrorMsg(null);
  };

  const handleGenderSelect = (selectedGender: 'male' | 'female') => {
    SoundManager.play('click');
    setGender(selectedGender);
  };

  // Password strength calculation
  const getPasswordStrength = () => {
    if (!password) return 0;
    let score = 0;
    if (password.length >= 6) score += 1;
    if (password.length >= 8) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password) || /[A-Z]/.test(password)) score += 1;
    return score;
  };
  const passwordStrength = getPasswordStrength();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMsg('Please enter a valid email address.');
      SoundManager.play('score-minus');
      return;
    }

    if (!password || password.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      SoundManager.play('score-minus');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg('Passwords do not match. Please verify.');
      SoundManager.play('score-minus');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthClientService.register({
        email: cleanEmail,
        password,
        gender,
      });

      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'Registration failed. Please try again.');
        SoundManager.play('score-minus');
        setIsLoading(false);
        return;
      }

      // Success
      SoundManager.play('score-double');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#fbbf24', '#f59e0b', '#3b82f6', '#10b981', '#ec4899'],
      });

      setRegisteredUser(res.user);
      setIsLoading(false);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Unexpected network error during registration.');
      setIsLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail || !cleanEmail.includes('@')) {
      setErrorMsg('Please enter your valid email address.');
      SoundManager.play('score-minus');
      return;
    }

    if (!password) {
      setErrorMsg('Please enter your password.');
      SoundManager.play('score-minus');
      return;
    }

    setIsLoading(true);
    try {
      const res = await AuthClientService.login({
        email: cleanEmail,
        password,
      });

      if (!res.success || !res.user) {
        setErrorMsg(res.error || 'Invalid email or password.');
        SoundManager.play('score-minus');
        setIsLoading(false);
        return;
      }

      SoundManager.play('match-found');
      setIsLoading(false);
      onSuccess(res.user);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Network error during sign in.');
      setIsLoading(false);
    }
  };

  const handleCopyUserId = () => {
    if (registeredUser?.id) {
      SoundManager.play('turn');
      navigator.clipboard.writeText(registeredUser.id).catch(() => {});
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2500);
    }
  };

  const handleCompleteRegistration = () => {
    if (registeredUser) {
      SoundManager.play('click');
      onSuccess(registeredUser);
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      {/* Dynamic Animated Ambient Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <motion.div
          animate={{
            scale: [1, 1.25, 1],
            opacity: [0.15, 0.28, 0.15],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500/25 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{
            duration: 9,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: 1,
          }}
          className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-600/25 rounded-full blur-[100px]"
        />
      </div>

      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: -10 }}
        transition={{ type: 'spring', damping: 25, stiffness: 320 }}
        className="relative w-full max-w-md bg-gradient-to-b from-[#161f30] via-[#0f172a] to-[#090d16] border border-amber-500/30 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_35px_rgba(245,158,11,0.15)] overflow-hidden text-white my-auto"
      >
        {/* Top Gold Accent Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-600 shadow-[0_0_12px_rgba(251,191,36,0.6)]" />

        {/* ========================================================================= */}
        {/* VIEW 1: REGISTRATION SUCCESS CELEBRATION MODAL */}
        {/* ========================================================================= */}
        {registeredUser ? (
          <div className="p-6 sm:p-7 text-center flex flex-col items-center">
            {/* Crown & Avatar Badge */}
            <div className="relative mb-4 mt-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 14, stiffness: 200 }}
                className="relative"
              >
                <div className="w-24 h-24 rounded-3xl p-1 bg-gradient-to-tr from-amber-500 via-yellow-300 to-amber-600 shadow-[0_0_25px_rgba(245,158,11,0.5)]">
                  <img
                    src={registeredUser.avatarUrl}
                    alt="Assigned Avatar"
                    referrerPolicy="no-referrer"
                    className="w-full h-full rounded-[22px] object-cover bg-slate-900"
                  />
                </div>
                <div className="absolute -top-3 -right-2 bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 p-1.5 rounded-full shadow-lg border border-white">
                  <Crown className="w-4 h-4 fill-slate-950" />
                </div>
              </motion.div>
            </div>

            <motion.h2
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl sm:text-2xl font-black text-white tracking-wide flex items-center gap-2 justify-center"
            >
              <span>Account Created!</span>
              <Sparkles className="w-5 h-5 text-amber-400 fill-amber-400" />
            </motion.h2>

            <p className="text-xs text-slate-300 mt-1 max-w-xs">
              Welcome to the Ludo Arena. Your permanent, cryptographically isolated 10-digit ID has been generated:
            </p>

            {/* Permanent 10-Digit ID Display Card */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-full mt-4 p-4 rounded-2xl bg-gradient-to-b from-slate-800/90 to-slate-900/90 border-2 border-amber-400/50 shadow-inner flex flex-col items-center gap-2"
            >
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-300 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                Your Permanent 10-Digit User ID
              </span>

              <div className="flex items-center justify-center gap-3 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-700/70 w-full">
                <span className="font-mono text-xl sm:text-2xl font-black text-amber-400 tracking-[0.25em]">
                  {registeredUser.id}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUserId}
                  className="p-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors cursor-pointer shrink-0"
                  title="Copy 10-Digit User ID"
                >
                  {copiedId ? (
                    <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <span className="text-[10px] text-slate-400">
                Default {registeredUser.gender === 'female' ? 'Female' : 'Male'} avatar applied. You can upload custom photos in Profile anytime.
              </span>
            </motion.div>

            {/* Enter Arena CTA */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              onClick={handleCompleteRegistration}
              className="w-full mt-5 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-sm uppercase tracking-wider shadow-[0_10px_25px_rgba(245,158,11,0.35)] flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Enter Game Arena</span>
              <ArrowRight className="w-4 h-4 stroke-[3]" />
            </motion.button>
          </div>
        ) : (
          /* ========================================================================= */
          /* VIEW 2: AUTHENTICATION FORM (SIGN IN / CREATE ACCOUNT) */
          /* ========================================================================= */
          <div className="p-6 sm:p-7">
            {/* Header / Logo */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-400/20 border border-amber-500/40 mb-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                <Crown className="w-6 h-6 text-amber-400 fill-amber-400/20" />
              </div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-wide">
                LUDO GRAND CHAMPIONSHIP
              </h1>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {tab === 'register'
                  ? 'Join now to get your unique permanent 10-digit ID'
                  : 'Enter with your email & password'}
              </p>
            </div>

            {/* Animated Tab Switch Pill */}
            <div className="relative p-1 bg-slate-950/80 rounded-2xl border border-slate-800 flex mb-5 shadow-inner">
              <button
                type="button"
                onClick={() => handleTabSwitch('register')}
                className={`relative flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer z-10 flex items-center justify-center gap-1.5 ${
                  tab === 'register' ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Create Account</span>
              </button>

              <button
                type="button"
                onClick={() => handleTabSwitch('login')}
                className={`relative flex-1 py-2 rounded-xl text-xs font-black transition-all cursor-pointer z-10 flex items-center justify-center gap-1.5 ${
                  tab === 'login' ? 'text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>

              {/* Background Slider Indicator */}
              <motion.div
                layout
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                className="absolute inset-y-1 rounded-xl bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 shadow-md"
                style={{
                  width: 'calc(50% - 4px)',
                  left: tab === 'register' ? '4px' : 'calc(50% + 0px)',
                }}
              />
            </div>

            {/* Error Message Toast */}
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-4 p-3 bg-rose-500/15 border border-rose-500/40 rounded-xl text-xs text-rose-300 flex items-center gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMsg}</span>
              </motion.div>
            )}

            {/* ========================================================================= */}
            {/* REGISTER FORM */}
            {/* ========================================================================= */}
            {tab === 'register' && (
              <form onSubmit={handleRegister} className="space-y-4">
                {/* 1. Gender Radio Selection (Male / Female) */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-2">
                    Gender <span className="text-amber-400">*</span>
                  </label>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Male Radio */}
                    <label
                      onClick={() => handleGenderSelect('male')}
                      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer select-none ${
                        gender === 'male'
                          ? 'bg-amber-500/15 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value="male"
                        checked={gender === 'male'}
                        onChange={() => handleGenderSelect('male')}
                        className="hidden"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                          gender === 'male' ? 'border-amber-400 bg-amber-400/20' : 'border-slate-600'
                        }`}
                      >
                        {gender === 'male' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                      </div>
                      <span className="text-xs font-bold tracking-wide">Male</span>
                    </label>

                    {/* Female Radio */}
                    <label
                      onClick={() => handleGenderSelect('female')}
                      className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all cursor-pointer select-none ${
                        gender === 'female'
                          ? 'bg-amber-500/15 border-amber-400 text-white shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                          : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
                      }`}
                    >
                      <input
                        type="radio"
                        name="gender"
                        value="female"
                        checked={gender === 'female'}
                        onChange={() => handleGenderSelect('female')}
                        className="hidden"
                      />
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                          gender === 'female' ? 'border-amber-400 bg-amber-400/20' : 'border-slate-600'
                        }`}
                      >
                        {gender === 'female' && <div className="w-2 h-2 rounded-full bg-amber-400" />}
                      </div>
                      <span className="text-xs font-bold tracking-wide">Female</span>
                    </label>
                  </div>
                </div>

                {/* 2. Email Address */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Email Address <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@domain.com"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* 3. Password */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1 flex items-center justify-between">
                    <span>Password <span className="text-amber-400">*</span></span>
                    <span className="text-[10px] text-slate-500">min 6 chars</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {/* Password Strength Indicator */}
                  {password.length > 0 && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <div className="flex-1 grid grid-cols-4 gap-1">
                        <div className={`h-1 rounded-full ${passwordStrength >= 1 ? 'bg-rose-500' : 'bg-slate-800'}`} />
                        <div className={`h-1 rounded-full ${passwordStrength >= 2 ? 'bg-amber-500' : 'bg-slate-800'}`} />
                        <div className={`h-1 rounded-full ${passwordStrength >= 3 ? 'bg-yellow-400' : 'bg-slate-800'}`} />
                        <div className={`h-1 rounded-full ${passwordStrength >= 4 ? 'bg-emerald-400' : 'bg-slate-800'}`} />
                      </div>
                      <span className="text-[9px] font-bold text-slate-400">
                        {passwordStrength <= 1 ? 'Weak' : passwordStrength === 2 ? 'Fair' : passwordStrength === 3 ? 'Good' : 'Strong'}
                      </span>
                    </div>
                  )}
                </div>

                {/* 4. Confirm Password */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Confirm Password <span className="text-amber-400">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="reg-confirm-password-input"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <span className="text-[10px] text-rose-400 mt-1 block">Passwords do not match</span>
                  )}
                  {confirmPassword && password === confirmPassword && (
                    <span className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" /> Passwords match
                    </span>
                  )}
                </div>

                {/* Submit Register Button */}
                <motion.button
                  id="auth-register-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.01 }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_8px_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-2"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>CREATE ACCOUNT</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </motion.button>
              </form>
            )}

            {/* ========================================================================= */}
            {/* LOGIN FORM */}
            {/* ========================================================================= */}
            {tab === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4 pt-1">
                {/* Email Address */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-email-input"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="player@domain.com"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl pl-10 pr-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      id="login-password-input"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-slate-950/80 border border-slate-800 focus:border-amber-400 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Submit Login Button */}
                <motion.button
                  id="auth-login-submit-btn"
                  type="submit"
                  disabled={isLoading}
                  whileTap={{ scale: 0.98 }}
                  whileHover={{ scale: 1.01 }}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 hover:from-amber-400 hover:to-yellow-300 text-slate-950 font-black text-xs uppercase tracking-wider shadow-[0_8px_20px_rgba(245,158,11,0.3)] flex items-center justify-center gap-2 cursor-pointer transition-all disabled:opacity-50 mt-4"
                >
                  {isLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>SIGN IN</span>
                      <ArrowRight className="w-4 h-4 stroke-[2.5]" />
                    </>
                  )}
                </motion.button>

                <div className="text-center pt-2">
                  <p className="text-[11px] text-slate-400">
                    New player?{' '}
                    <button
                      type="button"
                      onClick={() => handleTabSwitch('register')}
                      className="text-amber-400 font-bold hover:underline cursor-pointer ml-1"
                    >
                      Create account & get 10-digit ID
                    </button>
                  </p>
                </div>
              </form>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
};
