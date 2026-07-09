import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, PLAYER_LABEL, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useOnlineStore } from '../store/onlineStore';
import { computeRevivalTargets, deadCount, onBoardCount } from '../engine/GameEngine';
import { PlayerColor } from '../engine/GameEngine';
import Board from '../components/Board';

interface OnlineBoardScreenProps {
  onLeave: () => void;
  onVictory: (winner: PlayerColor | null) => void;
}

export default function OnlineBoardScreen({ onLeave, onVictory }: OnlineBoardScreenProps) {
  const { gameDoc, legalMoves, selectedSoldierId, myColor, selectSoldier, moveTo, reviveAt, isMyTurn, leaveAndReset } = useOnlineStore();

  useEffect(() => {
    if (gameDoc?.gameState.phase === 'gameover') {
      onVictory(gameDoc.gameState.winner);
    }
  }, [gameDoc?.gameState.phase]);

  if (!gameDoc || !myColor) return null;

  const { gameState } = gameDoc;
  const revivalTargets = computeRevivalTargets(gameState);
  const isReviving = gameState.phase === 'reviving';
  const opponentColor: PlayerColor = myColor === 'orange' ? 'black' : 'orange';
  const opponentWaiting = gameDoc.guestUid === null;
  const boardLocked = !isMyTurn();

  const handleNodePress = (node: string) => {
    if (boardLocked) return;
    if (isReviving) {
      reviveAt(node);
      return;
    }
    if (selectedSoldierId !== null) {
      moveTo(node);
    }
  };

  const handleSoldierPress = (soldierId: number) => {
    if (boardLocked) return;
    selectSoldier(soldierId);
  };

  const handleLeave = () => {
    leaveAndReset();
    onLeave();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.hud}>
        <View style={styles.playerBadge}>
          <View style={[styles.dot, { backgroundColor: COLORS.orange }]} />
          <Text style={styles.hudText}>
            {PLAYER_LABEL.orange}{myColor === 'orange' ? ' (you)' : ''} · {onBoardCount(gameState, 'orange')} on board · {deadCount(gameState, 'orange')} out
          </Text>
        </View>
        <View style={styles.playerBadge}>
          <View style={[styles.dot, { backgroundColor: COLORS.black, borderWidth: 1, borderColor: COLORS.blackRing }]} />
          <Text style={styles.hudText}>
            {PLAYER_LABEL.black}{myColor === 'black' ? ' (you)' : ''} · {onBoardCount(gameState, 'black')} on board · {deadCount(gameState, 'black')} out
          </Text>
        </View>
        <TouchableOpacity onPress={handleLeave} style={styles.leaveButton}>
          <Text style={styles.leaveText}>Leave</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.turnBanner}>
        {opponentWaiting ? (
          <Text style={styles.turnText}>Waiting for {PLAYER_LABEL[opponentColor]} to reconnect…</Text>
        ) : (
          <>
            {gameState.turnSkipped != null && (
              <Text style={styles.skipText}>
                {PLAYER_LABEL[gameState.turnSkipped]} had no legal move — turn skipped
              </Text>
            )}
            <Text style={styles.turnText}>
              {isReviving
                ? `${PLAYER_LABEL[gameState.reviveEligiblePlayer!]}${gameState.reviveEligiblePlayer === myColor ? ' (you)' : ''} reached the edge — tap an empty node to revive a soldier`
                : gameState.chainingSoldierId != null
                ? `${PLAYER_LABEL[gameState.currentPlayer]}${gameState.currentPlayer === myColor ? ' (you)' : ''} — keep capturing!`
                : boardLocked
                ? `${PLAYER_LABEL[gameState.currentPlayer]}'s turn`
                : "Your turn"}
            </Text>
          </>
        )}
      </View>

      <View style={styles.boardWrap}>
        <Board
          gameState={gameState}
          legalMoves={legalMoves}
          selectedSoldierId={selectedSoldierId}
          revivalTargets={revivalTargets}
          onSoldierPress={handleSoldierPress}
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
  leaveButton: {
    paddingHorizontal: SPACING.sm, paddingVertical: SPACING.xs, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1, borderColor: COLORS.error,
  },
  leaveText: { color: COLORS.error, fontWeight: 'bold', fontSize: 12 },
  turnBanner: { alignItems: 'center', paddingVertical: SPACING.sm },
  turnText: { color: COLORS.textPrimary, fontSize: 15, fontWeight: '600' },
  skipText: { color: COLORS.warning, fontSize: 12, marginBottom: SPACING.xs },
  boardWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
