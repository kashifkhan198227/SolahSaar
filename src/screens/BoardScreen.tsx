import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useGameStore } from '../store/gameStore';
import { computeRevivalTargets, deadCount, onBoardCount, PlayerColor } from '../engine/GameEngine';
import Board from '../components/Board';

interface BoardScreenProps {
  onPause: () => void;
  onVictory: (winner: PlayerColor | null) => void;
}

export default function BoardScreen({ onPause, onVictory }: BoardScreenProps) {
  const { gameState, legalMoves, selectedSoldierId, selectSoldier, moveTo, reviveAt, saveCurrentGame } = useGameStore();

  useEffect(() => {
    if (gameState?.phase === 'gameover') {
      onVictory(gameState.winner);
    }
  }, [gameState?.phase]);

  useEffect(() => {
    if (gameState && gameState.phase !== 'gameover') {
      saveCurrentGame();
    }
  }, [gameState]);

  if (!gameState) return null;

  const revivalTargets = computeRevivalTargets(gameState);
  const isReviving = gameState.phase === 'reviving';

  const handleNodePress = (node: string) => {
    if (isReviving) {
      reviveAt(node);
      return;
    }
    if (selectedSoldierId !== null) {
      moveTo(node);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.hud}>
        <View style={styles.playerBadge}>
          <View style={[styles.dot, { backgroundColor: COLORS.orange }]} />
          <Text style={styles.hudText}>Orange · {onBoardCount(gameState, 'orange')} on board · {deadCount(gameState, 'orange')} out</Text>
        </View>
        <View style={styles.playerBadge}>
          <View style={[styles.dot, { backgroundColor: COLORS.black, borderWidth: 1, borderColor: COLORS.blackRing }]} />
          <Text style={styles.hudText}>Black · {onBoardCount(gameState, 'black')} on board · {deadCount(gameState, 'black')} out</Text>
        </View>
        <TouchableOpacity onPress={onPause} style={styles.pauseButton}>
          <Text style={styles.pauseText}>II</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.turnBanner}>
        {gameState.turnSkipped != null && (
          <Text style={styles.skipText}>
            {gameState.turnSkipped === 'orange' ? 'Orange' : 'Black'} had no legal move — turn skipped
          </Text>
        )}
        <Text style={styles.turnText}>
          {isReviving
            ? `${gameState.reviveEligiblePlayer === 'orange' ? 'Orange' : 'Black'} reached the edge — tap an empty node to revive a soldier`
            : gameState.chainingSoldierId != null
            ? `${gameState.currentPlayer === 'orange' ? 'Orange' : 'Black'} — keep capturing!`
            : `${gameState.currentPlayer === 'orange' ? "Orange's" : "Black's"} turn`}
        </Text>
      </View>

      <View style={styles.boardWrap}>
        <Board
          gameState={gameState}
          legalMoves={legalMoves}
          selectedSoldierId={selectedSoldierId}
          revivalTargets={revivalTargets}
          onSoldierPress={selectSoldier}
          onNodePress={handleNodePress}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  hud: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SPACING.md },
  playerBadge: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  dot: { width: 12, height: 12, borderRadius: 6, marginRight: SPACING.xs },
  hudText: { color: COLORS.textSecondary, fontSize: 11 },
  pauseButton: {
    width: 36, height: 36, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center',
  },
  pauseText: { color: COLORS.primary, fontWeight: 'bold' },
  turnBanner: { alignItems: 'center', paddingVertical: SPACING.sm },
  turnText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  skipText: { color: COLORS.warning, fontSize: 12, marginBottom: SPACING.xs },
  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
