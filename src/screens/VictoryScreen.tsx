import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, PLAYER_LABEL, SPACING, BORDER_RADIUS } from '../utils/theme';
import { PlayerColor } from '../engine/GameEngine';

interface VictoryScreenProps {
  winner: PlayerColor | null;
  onPlayAgain: () => void;
  onHome: () => void;
}

export default function VictoryScreen({ winner, onPlayAgain, onHome }: VictoryScreenProps) {
  const isDraw = winner === null;
  return (
    <View style={styles.container}>
      {!isDraw && (
        <View style={[styles.badge, { backgroundColor: winner === 'orange' ? COLORS.orange : COLORS.black, borderColor: winner === 'black' ? COLORS.blackRing : 'transparent', borderWidth: winner === 'black' ? 2 : 0 }]} />
      )}
      <Text style={styles.title}>{isDraw ? 'Draw' : `${PLAYER_LABEL[winner!]} Wins!`}</Text>
      <Text style={styles.subtitle}>
        {isDraw ? 'Neither side has a legal move left.' : 'All opposing soldiers were eliminated.'}
      </Text>

      <TouchableOpacity style={styles.primaryButton} onPress={onPlayAgain}>
        <Text style={styles.primaryButtonText}>Play Again</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.secondaryButton} onPress={onHome}>
        <Text style={styles.secondaryButtonText}>Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  badge: { width: 64, height: 64, borderRadius: 32, marginBottom: SPACING.lg },
  title: { color: COLORS.primary, fontSize: 28, fontWeight: 'bold', marginBottom: SPACING.sm },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.xxl },
  primaryButton: { backgroundColor: COLORS.primary, paddingVertical: SPACING.md, paddingHorizontal: SPACING.xxl, borderRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md },
  primaryButtonText: { color: COLORS.background, fontSize: 18, fontWeight: 'bold' },
  secondaryButton: { padding: SPACING.sm },
  secondaryButtonText: { color: COLORS.textSecondary, fontSize: 15 },
});
