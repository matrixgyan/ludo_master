import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LobbyHeader } from './LobbyHeader';
import { LobbyCardOnlineMultiplayer } from './LobbyCardOnlineMultiplayer';
import { LobbyCardSnakeLudo } from './LobbyCardSnakeLudo';
import { LobbyCardLudoSupreme } from './LobbyCardLudoSupreme';
import { LobbyCardBigRewards } from './LobbyCardBigRewards';
import { LobbyCardFeaturedTrio } from './LobbyCardFeaturedTrio';
import { SupremeLeagueModal } from './SupremeLeagueModal';
import { FloatingRankWidget } from './FloatingRankWidget';
import { BottomNav, NavTab } from './BottomNav';
import { StudioModal } from './StudioModal';
import { ReferModal } from './ReferModal';
import { ProfileModal } from './ProfileModal';
import { NotificationsModal } from './NotificationsModal';
import { PlayerModeOption, LudoModeSelectorModal, GameVariation, PlayerConfig } from './LudoModeSelectorModal';
import { AssetsView } from '../wallet/AssetsView';
import { useLiveTheme } from '../../hooks/useLiveTheme';
import { Sparkles, Shield, Crown } from 'lucide-react';

interface GameLobbyProps {
  balance: number;
  onAddFunds: (amount: number) => void;
  onPlayLudo: () => void;
  onPlaySnakeLudo: () => void;
  onStartOnlineMatch: (
    mode: PlayerModeOption,
    entryFee: number,
    prizePool: number,
    gameType?: 'classic' | 'supreme',
    variation?: GameVariation,
    playersConfig?: PlayerConfig[]
  ) => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  balance,
  onAddFunds,
  onPlayLudo,
  onPlaySnakeLudo,
  onStartOnlineMatch,
}) => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isReferOpen, setIsReferOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLeagueModalOpen, setIsLeagueModalOpen] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState('$0.00');

  // Dynamic Theme state
  const { lobbyTheme } = useLiveTheme();

  // Mode Selection Modal State
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [modalGameType, setModalGameType] = useState<'classic' | 'supreme'>('supreme');

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'studio') setIsStudioOpen(true);
    if (tab === 'refer') setIsReferOpen(true);
  };

  const handleOpenModeSelect = (gameType: 'classic' | 'supreme') => {
    setModalGameType(gameType);
    setIsModeSelectorOpen(true);
  };

  const handleSelectGameModeAndStart = (
    mode: PlayerModeOption,
    entryFee: number,
    prizePool: number,
    gameType: 'classic' | 'supreme',
    variation?: GameVariation,
    playersConfig?: PlayerConfig[]
  ) => {
    setIsModeSelectorOpen(false);
    onStartOnlineMatch(mode, entryFee, prizePool, gameType, variation, playersConfig);
  };

  return (
    <div
      className={`relative min-h-screen w-full ${lobbyTheme.bodyBgClass} flex flex-col items-center justify-start text-slate-900 pb-24 select-none transition-colors duration-500 overflow-x-hidden`}
    >
      {/* ATMOSPHERIC BACKGROUND EFFECTS BASED ON ACTIVE LOBBY THEME */}
      {lobbyTheme.atmosphere === 'grid' && (
        <div className="absolute inset-0 pointer-events-none opacity-25 z-0 bg-[linear-gradient(to_right,#06b6d415_1px,transparent_1px),linear-gradient(to_bottom,#06b6d415_1px,transparent_1px)] bg-[size:24px_24px]" />
      )}
      {lobbyTheme.atmosphere === 'aurora' && (
        <div className="absolute inset-0 pointer-events-none opacity-30 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-500/20 via-teal-900/10 to-transparent" />
      )}
      {lobbyTheme.atmosphere === 'bokeh' && (
        <div className="absolute inset-0 pointer-events-none opacity-30 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-rose-600/20 via-amber-700/10 to-transparent" />
      )}
      {lobbyTheme.atmosphere === 'stars' && (
        <div className="absolute inset-0 pointer-events-none opacity-30 z-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-500/20 via-pink-700/10 to-transparent" />
      )}

      {/* DEDICATED ASSETS / WALLET VIEW OR HOME LOBBY CARDS */}
      {activeTab === 'assets' ? (
        <AssetsView
          userId="user_guest_default"
          onBack={() => setActiveTab('home')}
          onBalanceUpdate={(newBal) => setUsdtBalance(`$${Number(newBal).toFixed(2)}`)}
        />
      ) : (
        <>
          {/* 1. TOP HEADER (Brand | Bell | USDT Vault | Profile) */}
          <div className="w-full max-w-lg z-10">
            <LobbyHeader
              usdtBalance={usdtBalance}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenWallet={() => setActiveTab('assets')}
            />
          </div>

          {/* 2. MAIN SCROLLABLE LOBBY CONTAINER */}
          <main className="w-full max-w-lg px-3.5 pt-3.5 space-y-3.5 flex-1 flex flex-col items-center z-10">
            {/* CARD 1: LUDO ONLINE ARENA */}
            <LobbyCardOnlineMultiplayer onOpenModeSelect={() => handleOpenModeSelect('classic')} />

            {/* CARD 2: SNAKE LUDO */}
            <LobbyCardSnakeLudo onPlay={onPlaySnakeLudo} />

            {/* CARD 3: LUDO SUPREME */}
            <LobbyCardLudoSupreme onPlay={() => handleOpenModeSelect('supreme')} />

            {/* CARD 4: BIG REWARDS - LUDO SUPREME LEAGUE */}
            <LobbyCardBigRewards onOpenLeague={() => setIsLeagueModalOpen(true)} />

            {/* CARD 5: 3-TYPE ASYMMETRICAL FEATURED TRIO (LUDO SUPREME LEAGUE + SNAKES & LADDERS + LUDO TURBO) */}
            <LobbyCardFeaturedTrio
              onPlaySupreme={() => setIsLeagueModalOpen(true)}
              onPlaySnakesLadders={onPlaySnakeLudo}
              onPlayLudoTurbo={() => handleOpenModeSelect('supreme')}
            />
          </main>

          {/* FLOATING STUCK RANK BADGE ON THE RIGHT DISPLAY */}
          <FloatingRankWidget rank={59} onOpenLeaderboard={() => setIsProfileOpen(true)} />
        </>
      )}

      {/* 3. BOTTOM NAVIGATION BAR (Lobby, Arenas, Play, Rewards, Assets) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onBattle={() => handleOpenModeSelect('supreme')}
      />

      {/* 4. DEDICATED 3D GAME MODE SELECTION SECTION WITH 3 SEPARATE 3D TILES */}
      <LudoModeSelectorModal
        isOpen={isModeSelectorOpen}
        onClose={() => setIsModeSelectorOpen(false)}
        onSelectMode={handleSelectGameModeAndStart}
        balance={balance}
        gameType={modalGameType}
      />

      <SupremeLeagueModal
        isOpen={isLeagueModalOpen}
        onClose={() => setIsLeagueModalOpen(false)}
        onJoinLeague={() => {
          setIsLeagueModalOpen(false);
          onStartOnlineMatch(4, 0, 50, 'supreme');
        }}
        balance={balance}
      />

      <StudioModal
        isOpen={isStudioOpen}
        onClose={() => {
          setIsStudioOpen(false);
          setActiveTab('home');
        }}
      />

      <ReferModal
        isOpen={isReferOpen}
        onClose={() => {
          setIsReferOpen(false);
          setActiveTab('home');
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        balance={balance}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
      />
    </div>
  );
};
