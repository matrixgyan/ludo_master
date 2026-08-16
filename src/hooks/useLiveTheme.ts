import { useState, useEffect, useCallback } from 'react';
import {
  getActiveThemeConfig,
  saveLocalThemeConfig,
  CompleteThemeConfig,
  LOBBY_THEMES,
  BOARD_THEMES,
  DICE_SKINS,
  PAWN_SKINS,
  LobbyThemeDefinition,
  BoardThemeDefinition,
  DiceSkinDefinition,
  PawnSkinDefinition,
} from '../game/themeRegistry';

export interface UseLiveThemeReturn {
  themeConfig: CompleteThemeConfig;
  activeLobbyId: string;
  activeBoardId: string;
  activeDiceId: string;
  activePawnId: string;
  lobbyTheme: LobbyThemeDefinition;
  boardTheme: BoardThemeDefinition;
  diceSkin: DiceSkinDefinition;
  pawnSkin: PawnSkinDefinition;
  allLobbies: LobbyThemeDefinition[];
  allBoards: BoardThemeDefinition[];
  allDice: DiceSkinDefinition[];
  allPawns: PawnSkinDefinition[];
  setActiveLobby: (id: string) => void;
  setActiveBoard: (id: string) => void;
  setActiveDice: (id: string) => void;
  setActivePawn: (id: string) => void;
  refreshTheme: () => Promise<void>;
  isLoading: boolean;
}

export function useLiveTheme(): UseLiveThemeReturn {
  const [themeConfig, setThemeConfig] = useState<CompleteThemeConfig>(() => getActiveThemeConfig());
  const [isLoading, setIsLoading] = useState(false);

  // Synchronize state with theme registry
  const refreshFromLocal = useCallback(() => {
    const fresh = getActiveThemeConfig();
    setThemeConfig(fresh);
  }, []);

  // Fetch deployed theme configuration from live server
  const refreshTheme = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/theme-config');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.themeConfig) {
          saveLocalThemeConfig({
            activeLobbyId: data.themeConfig.activeLobbyId,
            activeBoardId: data.themeConfig.activeBoardId,
            activeDiceId: data.themeConfig.activeDiceId,
            activePawnId: data.themeConfig.activePawnId,
          });
          refreshFromLocal();
        }
      }
    } catch {
      // Fallback to local storage if offline or server is unreachable
      refreshFromLocal();
    } finally {
      setIsLoading(false);
    }
  }, [refreshFromLocal]);

  useEffect(() => {
    // Initial fetch from server
    refreshTheme();

    // Listen for local updates across tabs / components
    const handleThemeChanged = () => {
      refreshFromLocal();
    };

    window.addEventListener('ludo_theme_changed', handleThemeChanged);
    window.addEventListener('storage', handleThemeChanged);

    return () => {
      window.removeEventListener('ludo_theme_changed', handleThemeChanged);
      window.removeEventListener('storage', handleThemeChanged);
    };
  }, [refreshTheme, refreshFromLocal]);

  const setActiveLobby = useCallback((id: string) => {
    saveLocalThemeConfig({ activeLobbyId: id });
    refreshFromLocal();
  }, [refreshFromLocal]);

  const setActiveBoard = useCallback((id: string) => {
    saveLocalThemeConfig({ activeBoardId: id });
    refreshFromLocal();
  }, [refreshFromLocal]);

  const setActiveDice = useCallback((id: string) => {
    saveLocalThemeConfig({ activeDiceId: id });
    refreshFromLocal();
  }, [refreshFromLocal]);

  const setActivePawn = useCallback((id: string) => {
    saveLocalThemeConfig({ activePawnId: id });
    refreshFromLocal();
  }, [refreshFromLocal]);

  return {
    themeConfig,
    activeLobbyId: themeConfig.activeLobbyId,
    activeBoardId: themeConfig.activeBoardId,
    activeDiceId: themeConfig.activeDiceId,
    activePawnId: themeConfig.activePawnId,
    lobbyTheme: themeConfig.lobby,
    boardTheme: themeConfig.board,
    diceSkin: themeConfig.dice,
    pawnSkin: themeConfig.pawn,
    allLobbies: LOBBY_THEMES,
    allBoards: BOARD_THEMES,
    allDice: DICE_SKINS,
    allPawns: PAWN_SKINS,
    setActiveLobby,
    setActiveBoard,
    setActiveDice,
    setActivePawn,
    refreshTheme,
    isLoading,
  };
}
