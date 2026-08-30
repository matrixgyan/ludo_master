import React from 'react';
import { PlayerColor } from '../../../types/game';
import { PawnSkinDefinition } from '../../../game/themeRegistry';
import { Pawn3DRenderer } from './Pawn3DRenderer';

interface PawnSvgRendererProps {
  color: PlayerColor;
  skin: PawnSkinDefinition;
  sizePx?: number;
  isSelected?: boolean;
  isMovable?: boolean;
}

export const PawnSvgRenderer: React.FC<PawnSvgRendererProps> = ({
  color,
  skin,
  sizePx = 36,
  isSelected = false,
  isMovable = false,
}) => {
  return (
    <Pawn3DRenderer
      color={color}
      skinId={skin?.id}
      sizePx={sizePx}
      isSelected={isSelected}
      isMovable={isMovable}
    />
  );
};
