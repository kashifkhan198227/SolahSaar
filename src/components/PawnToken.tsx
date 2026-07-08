import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { COLORS } from '../utils/theme';
import { PlayerColor } from '../engine/GameEngine';

interface PawnTokenProps {
  color: PlayerColor;
  size: number;
  isSelected: boolean;
  onPress: () => void;
}

export default function PawnToken({ color, size, isSelected, onPress }: PawnTokenProps) {
  const fill = color === 'orange' ? COLORS.orange : COLORS.black;
  const ringColor = isSelected ? COLORS.selected : color === 'black' ? COLORS.blackRing : 'rgba(255,255,255,0.5)';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
      style={[
        styles.pawn,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: fill,
          borderWidth: isSelected ? 3 : 1.5,
          borderColor: ringColor,
        },
      ]}
    >
      <View style={[styles.shine, { width: size * 0.32, height: size * 0.32, borderRadius: size * 0.16 }]} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pawn: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 3,
  },
  shine: {
    backgroundColor: 'rgba(255,255,255,0.35)',
    position: 'absolute',
    top: '14%',
    left: '14%',
  },
});
