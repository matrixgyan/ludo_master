import React, { useState } from 'react';
import { LobbyHeader } from './LobbyHeader';
import { LobbyCardLudo } from './LobbyCardLudo';
import { LobbyCardSnakeLudo } from './LobbyCardSnakeLudo';
import { LobbyCardTournament } from './LobbyCardTournament';
import { FloatingRankWidget } from './FloatingRankWidget';
import { BottomNav, NavTab } from './BottomNav';
import { EvmWalletModal } from './EvmWalletModal';
import { MysteryBoxModal } from './MysteryBoxModal';
import { StudioModal } from './StudioModal';
import { ReferModal } from './ReferModal';
import { ProfileModal } from './ProfileModal';
import { NotificationsModal } from './NotificationsModal';

interface GameLobbyProps {
  balance: number;
  onAddFunds: (amount: number) => void;
  onPlayLudo: () => void;
  onPlaySnakeLudo: () => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  balance,
  onAddFunds,
  onPlayLudo,
  onPlaySnakeLudo,
}) => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isWalletOpen, setIsWalletOpen] = useState(false);
  const [isMysteryBoxOpen, setIsMysteryBoxOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isReferOpen, setIsReferOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'studio') setIsStudioOpen(true);
    if (tab === 'refer') setIsReferOpen(true);
    if (tab === 'wallet') setIsWalletOpen(true);
  };

  return (
    <div className="relative min-h-screen w-full bg-white flex flex-col items-center justify-start text-slate-900 pb-24 select-none">
      {/* 1. TOP HEADER (Gift Box "Open" | Bell | Balance in $ | Profile) */}
      <div className="w-full max-w-lg">
        <LobbyHeader
          balance={balance}
          onOpenMysteryBox={() => setIsMysteryBoxOpen(true)}
          onOpenWallet={() => setIsWalletOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
          onOpenProfile={() => setIsProfileOpen(true)}
        />
      </div>

      {/* 2. MAIN SCROLLABLE LOBBY CONTAINER (3 Main Cards) */}
      <main className="w-full max-w-lg px-3.5 pt-3.5 space-y-3.5 flex-1 flex flex-col items-center">
        {/* CARD 1: LUDO SUPREME */}
        <LobbyCardLudo onPlay={onPlayLudo} />

        {/* CARD 2: SNAKE LUDO (Middle card customized for Snake Ludo game) */}
        <LobbyCardSnakeLudo onPlay={onPlaySnakeLudo} />

        {/* CARD 3: MEGA TOURNAMENT (Win up to $50K Cash!) */}
        <LobbyCardTournament onPlay={onPlayLudo} />
      </main>

      {/* FLOATING STUCK RANK BADGE ON THE RIGHT DISPLAY */}
      <FloatingRankWidget rank={59} onOpenLeaderboard={() => setIsProfileOpen(true)} />

      {/* 3. BOTTOM NAVIGATION BAR (Home, Studio, Refer & Earn, Assets) */}
      <BottomNav activeTab={activeTab} onSelectTab={handleSelectTab} />

      {/* 4. MODALS & POPUPS */}
      <EvmWalletModal
        isOpen={isWalletOpen}
        onClose={() => {
          setIsWalletOpen(false);
          setActiveTab('home');
        }}
        balance={balance}
        onAddFunds={onAddFunds}
        onDeductFunds={(amt) => onAddFunds(-amt)}
      />

      <MysteryBoxModal
        isOpen={isMysteryBoxOpen}
        onClose={() => setIsMysteryBoxOpen(false)}
        onClaimReward={onAddFunds}
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
