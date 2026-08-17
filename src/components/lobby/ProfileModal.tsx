import React from 'react';
import { GameSettingsModal } from './GameSettingsModal';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  balance: number;
  userName?: string;
  userAvatar?: string;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  balance,
  userName = 'Player 1',
  userAvatar = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80',
}) => {
  return (
    <GameSettingsModal
      isOpen={isOpen}
      onClose={onClose}
      balance={balance}
      userName={userName}
      userAvatar={userAvatar}
    />
  );
};
