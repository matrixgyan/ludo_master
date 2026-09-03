import React, { useState, useEffect } from 'react';
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
import { LeaderboardModal } from './LeaderboardModal';
import { PlayerModeOption, LudoModeSelectorModal, GameVariation, PlayerConfig } from './LudoModeSelectorModal';
import { MatchArenaListView } from './MatchArenaListView';
import { AssetsView } from '../wallet/AssetsView';
import { useLiveTheme } from '../../hooks/useLiveTheme';
import { useBackHandler } from '../../hooks/useBackHandler';
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
    gameType?: 'classic' | 'supreme' | 'snake',
    variation?: GameVariation,
    playersConfig?: PlayerConfig[],
    tournamentId?: string
  ) => void;
  userId?: string;
  userName?: string;
  userAvatar?: string;
  userEmail?: string;
  onLogout?: () => void;
  onAvatarUpdate?: (newAvatarUrl: string) => void;
  onRefreshBalance?: () => void;
}

export const GameLobby: React.FC<GameLobbyProps> = ({
  balance,
  onAddFunds,
  onPlayLudo,
  onPlaySnakeLudo,
  onStartOnlineMatch,
  userId = 'user_guest_default',
  userName = 'Player 1',
  userAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
  userEmail,
  onLogout,
  onAvatarUpdate,
  onRefreshBalance,
}) => {
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [isLeaderboardOpen, setIsLeaderboardOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isReferOpen, setIsReferOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isLeagueModalOpen, setIsLeagueModalOpen] = useState(false);
  const [usdtBalance, setUsdtBalance] = useState('$0.00');
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(2);

  // Poll for real unread notification counts from backend
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const res = await fetch(`/api/notifications?userId=${encodeURIComponent(userId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.success && typeof data.unreadCount === 'number') {
            setUnreadNotificationsCount(data.unreadCount);
          }
        }
      } catch (err) {
        // silent fallback
      }
    };

    fetchUnreadCount();
    const timer = setInterval(fetchUnreadCount, 12000);
    return () => clearInterval(timer);
  }, [userId]);

  // Dynamic Theme state
  const { lobbyTheme } = useLiveTheme();

  // Match Arena List View Modal State (Real Online Match List)
  const [isMatchListOpen, setIsMatchListOpen] = useState(false);
  const [matchListMode, setMatchListMode] = useState<'classic' | 'supreme' | 'snake'>('classic');

  // Local Pass & Play Customizer Modal State
  const [isModeSelectorOpen, setIsModeSelectorOpen] = useState(false);
  const [modalGameType, setModalGameType] = useState<'classic' | 'supreme' | 'snake'>('classic');

  // Mobile Back Button Navigation Handlers (LIFO Stack)
  useBackHandler(
    isMatchListOpen,
    () => {
      setIsMatchListOpen(false);
    },
    'lobby_match_list',
    'Match Arena List'
  );

  useBackHandler(
    isModeSelectorOpen,
    () => {
      setIsModeSelectorOpen(false);
    },
    'lobby_mode_selector',
    'Mode Selector'
  );

  useBackHandler(
    isLeagueModalOpen,
    () => {
      setIsLeagueModalOpen(false);
    },
    'lobby_league_modal',
    'Supreme League'
  );

  useBackHandler(
    isLeaderboardOpen,
    () => {
      setIsLeaderboardOpen(false);
      setActiveTab('home');
    },
    'lobby_leaderboard',
    'Leaderboard'
  );

  useBackHandler(
    isStudioOpen,
    () => {
      setIsStudioOpen(false);
      setActiveTab('home');
    },
    'lobby_studio',
    'Studio'
  );

  useBackHandler(
    isReferOpen,
    () => {
      setIsReferOpen(false);
      setActiveTab('home');
    },
    'lobby_refer',
    'Refer & Earn'
  );

  useBackHandler(
    isProfileOpen,
    () => {
      setIsProfileOpen(false);
    },
    'lobby_profile',
    'Profile'
  );

  useBackHandler(
    isNotificationsOpen,
    () => {
      setIsNotificationsOpen(false);
    },
    'lobby_notifications',
    'Notifications'
  );

  useBackHandler(
    activeTab !== 'home' && !isLeaderboardOpen && !isStudioOpen && !isReferOpen && !isMatchListOpen,
    () => {
      setActiveTab('home');
    },
    'lobby_tab_home',
    'Main Lobby'
  );

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    if (tab === 'leaderboard' || tab === 'studio') {
      setIsLeaderboardOpen(true);
    } else if (tab === 'battle') {
      handleOpenOnlineMatchList('supreme');
    } else if (tab === 'refer') {
      setIsReferOpen(true);
    }
  };

  const handleOpenOnlineMatchList = (gameType: 'classic' | 'supreme' | 'snake') => {
    setMatchListMode(gameType);
    setIsMatchListOpen(true);
  };

  const handleSelectGameModeAndStart = (
    mode: PlayerModeOption,
    entryFee: number,
    prizePool: number,
    gameType: 'classic' | 'supreme' | 'snake',
    variation?: GameVariation,
    playersConfig?: PlayerConfig[]
  ) => {
    setIsMatchListOpen(false);
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
          userId={userId}
          onBack={() => setActiveTab('home')}
          onBalanceUpdate={(newBal) => {
            const parsed = parseFloat(newBal);
            if (!isNaN(parsed)) {
              onAddFunds(parsed - balance);
            }
          }}
        />
      ) : (
        <>
          {/* 1. TOP HEADER (Brand | Bell | USDT Vault | Profile) */}
          <div className="w-full max-w-lg z-10">
            <LobbyHeader
              balance={balance}
              usdtBalance={`$${balance.toFixed(2)}`}
              unreadNotificationsCount={unreadNotificationsCount}
              onOpenNotifications={() => setIsNotificationsOpen(true)}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenWallet={() => setActiveTab('assets')}
            />
          </div>

          {/* 2. MAIN SCROLLABLE LOBBY CONTAINER */}
          <main className="w-full max-w-lg px-3.5 pt-3.5 space-y-3.5 flex-1 flex flex-col items-center z-10">
            {/* CARD 1: LUDO ONLINE ARENA (CLICK TO VIEW ONLINE MATCH ROOMS & POOLS) */}
            <LobbyCardOnlineMultiplayer onOpenModeSelect={() => handleOpenOnlineMatchList('classic')} />

            {/* CARD 2: SNAKE LUDO (CLICK TO VIEW SNAKE MATCH ROOMS & POOLS) */}
            <LobbyCardSnakeLudo onPlay={() => handleOpenOnlineMatchList('snake')} />

            {/* CARD 3: LUDO SUPREME (CLICK TO VIEW SUPREME 5-MIN MATCH ROOMS & POOLS) */}
            <LobbyCardLudoSupreme onPlay={() => handleOpenOnlineMatchList('supreme')} />

            {/* CARD 4: BIG REWARDS - LUDO SUPREME LEAGUE */}
            <LobbyCardBigRewards onOpenLeague={() => setIsLeagueModalOpen(true)} />

            {/* CARD 5: 3-TYPE ASYMMETRICAL FEATURED TRIO (LUDO SUPREME LEAGUE + SNAKES & LADDERS + LUDO TURBO) */}
            <LobbyCardFeaturedTrio
              onPlaySupreme={() => setIsLeagueModalOpen(true)}
              onPlaySnakesLadders={() => handleOpenOnlineMatchList('snake')}
              onPlayLudoTurbo={() => handleOpenOnlineMatchList('supreme')}
            />
          </main>

          {/* FLOATING STUCK RANK BADGE ON THE RIGHT DISPLAY */}
          <FloatingRankWidget
            userId={userId}
            onOpenLeaderboard={() => setIsLeaderboardOpen(true)}
            onOpenLeague={() => setIsLeagueModalOpen(true)}
          />
        </>
      )}

      {/* 3. BOTTOM NAVIGATION BAR (Lobby, Leaderboard, Play, Rewards, Assets) */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onBattle={() => handleOpenOnlineMatchList('supreme')}
      />

      {/* 4. REAL ONLINE MATCH ARENA LIST VIEW (ROOMS & DETERMINISTIC POOLS) */}
      <MatchArenaListView
        isOpen={isMatchListOpen}
        initialMode={matchListMode}
        balance={balance}
        userId={userId}
        userName={userName}
        onClose={() => setIsMatchListOpen(false)}
        onSelectAndJoinMatch={handleSelectGameModeAndStart}
        onOpenDeposit={() => setActiveTab('assets')}
        onOpenLocalPassAndPlay={() => {
          setModalGameType(matchListMode);
          setIsModeSelectorOpen(true);
        }}
      />

      {/* 5. LOCAL PASS & PLAY CUSTOMIZER */}
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
        userId={userId}
        balance={balance}
        onPlayTournamentMatch={(gType, tId) => {
          setIsLeagueModalOpen(false);
          onStartOnlineMatch(4, 0, 50, gType, undefined, undefined, tId);
        }}
        onRefreshBalance={onRefreshBalance}
        onOpenDeposit={() => setActiveTab('assets')}
      />

      <LeaderboardModal
        isOpen={isLeaderboardOpen}
        onClose={() => {
          setIsLeaderboardOpen(false);
          setActiveTab('home');
        }}
        userId={userId}
        onPlayGame={() => {
          setIsLeaderboardOpen(false);
          setIsLeagueModalOpen(true);
        }}
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
        onAddFunds={() => {
          setIsReferOpen(false);
          setActiveTab('assets');
        }}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        balance={balance}
        userId={userId}
        userName={userName}
        userAvatar={userAvatar}
        userEmail={userEmail}
        onLogout={onLogout}
        onAvatarUpdate={onAvatarUpdate}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        userId={userId}
        onUnreadCountChange={(count) => setUnreadNotificationsCount(count)}
      />
    </div>
  );
};
