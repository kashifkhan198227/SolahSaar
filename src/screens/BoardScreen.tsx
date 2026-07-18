import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, PLAYER_LABEL, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useGameStore } from '../store/gameStore';
import { deadCount, onBoardCount, PlayerColor } from '../engine/GameEngine';
import Board from '../components/Board';

const AI_MOVE_DELAY_MS = 500;

interface BoardScreenProps {
  onPause: () => void;
  onVictory: (winner: PlayerColor | null) => void;
}

export default function BoardScreen({ onPause, onVictory }: BoardScreenProps) {
  const {
    gameState, legalMoves, selectedSoldierId, aiConfig, isAIThinking,
    selectSoldier, moveTo, saveCurrentGame, runAIMove, isAITurn,
  } = useGameStore();

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

  useEffect(() => {
    if (!gameState || gameState.phase === 'gameover' || !isAITurn()) return;
    const timer = setTimeout(() => runAIMove(), AI_MOVE_DELAY_MS);
    return () => clearTimeout(timer);
  }, [gameState]);

  if (!gameState) return null;

  const boardLocked = isAITurn() || isAIThinking;
  // vs AI: flip so the fixed human color is always at the bottom. Pass-and-play
  // (no AI): flip per turn so whoever's holding the device sees their own side down.
  const viewerColor = aiConfig ? (aiConfig.color === 'orange' ? 'black' : 'orange') : gameState.currentPlayer;
  const flipped = viewerColor === 'orange';
  const forfeitedSoldier = gameState.soldiers.find(s => s.id === gameState.forfeitedSoldierId);

  const handleNodePress = (node: string) => {
    if (boardLocked) return;
    if (selectedSoldierId !== null) {
      moveTo(node);
    }
  };

  const handleSoldierPress = (soldierId: number) => {
    if (boardLocked) return;
    selectSoldier(soldierId);
  };

  const aiLabel = (color: PlayerColor) => (aiConfig?.color === color ? ` (AI · ${aiConfig.level})` : '');

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.hud}>
        <View style={styles.playerBadge}>
          <View style={[styles.dot, { backgroundColor: COLORS.orange }]} />
          <Text style={styles.hudText}>{PLAYER_LABEL.orange}{aiLabel('orange')} · {onBoardCount(gameState, 'orange')} on board · {deadCount(gameState, 'orange')} out</Text>
        </View>
        <View style={styles.playerBadge}>
          <View style={[styles.dot, { backgroundColor: COLORS.black, borderWidth: 1, borderColor: COLORS.blackRing }]} />
          <Text style={styles.hudText}>{PLAYER_LABEL.black}{aiLabel('black')} · {onBoardCount(gameState, 'black')} on board · {deadCount(gameState, 'black')} out</Text>
        </View>
        <TouchableOpacity onPress={onPause} style={styles.pauseButton}>
          <Text style={styles.pauseText}>II</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.turnBanner}>
        {gameState.turnSkipped != null && (
          <Text style={styles.skipText}>
            {PLAYER_LABEL[gameState.turnSkipped]} had no legal move — turn skipped
          </Text>
        )}
        {forfeitedSoldier && (
          <Text style={styles.skipText}>
            {PLAYER_LABEL[forfeitedSoldier.color]} soldier removed — repeated the same move three times
          </Text>
        )}
        <Text style={styles.turnText}>
          {isAIThinking
            ? `${PLAYER_LABEL[gameState.currentPlayer]} (AI) is thinking…`
            : gameState.chainingSoldierId != null
            ? `${PLAYER_LABEL[gameState.currentPlayer]} — keep capturing!`
            : `${PLAYER_LABEL[gameState.currentPlayer]}'s turn`}
        </Text>
      </View>

      <View style={styles.boardWrap}>
        <Board
          gameState={gameState}
          legalMoves={legalMoves}
          selectedSoldierId={selectedSoldierId}
          onSoldierPress={handleSoldierPress}
          onNodePress={handleNodePress}
          flipped={flipped}
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
