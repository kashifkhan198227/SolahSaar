import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { COLORS } from '../utils/theme';
import { NODES, LINES, ALL_NODE_IDS } from '../engine/BoardLayout';
import { GameState, Move } from '../engine/GameEngine';
import PawnToken from './PawnToken';

// TEMPORARY: numbers each crossing point for reference while discussing board
// layout changes. Remove once the triangle-diagonal change is settled.
const SHOW_NODE_NUMBERS = true;
const NODE_NUMBER: Record<string, number> = (() => {
  const ordered = [...ALL_NODE_IDS].sort((a, b) => {
    const ca = NODES[a], cb = NODES[b];
    return ca.y - cb.y || ca.x - cb.x;
  });
  const map: Record<string, number> = {};
  ordered.forEach((id, i) => { map[id] = i + 1; });
  return map;
})();

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MARGIN = 24;
// x spans 0-4 (5 units), y spans -2 to 6 (8 units)
const X_UNITS = 4;
const Y_UNITS = 8;
const Y_MIN = -2;

const availableWidth = SCREEN_WIDTH - MARGIN * 2;
const availableHeight = SCREEN_HEIGHT * 0.62;
const UNIT = Math.min(availableWidth / X_UNITS, availableHeight / Y_UNITS);

export const BOARD_WIDTH = X_UNITS * UNIT;
export const BOARD_HEIGHT = Y_UNITS * UNIT;

function px(nodeId: string) {
  const c = NODES[nodeId];
  return { x: c.x * UNIT, y: (c.y - Y_MIN) * UNIT };
}

const EDGES: [string, string][] = (() => {
  const seen = new Set<string>();
  const edges: [string, string][] = [];
  for (const line of LINES) {
    for (let i = 0; i < line.length - 1; i++) {
      const a = line[i], b = line[i + 1];
      const key = a < b ? `${a}|${b}` : `${b}|${a}`;
      if (seen.has(key)) continue;
      seen.add(key);
      edges.push([a, b]);
    }
  }
  return edges;
})();

interface BoardProps {
  gameState: GameState;
  legalMoves: Move[];
  selectedSoldierId: number | null;
  revivalTargets: string[];
  onSoldierPress: (soldierId: number) => void;
  onNodePress: (node: string) => void;
}

export default function Board({ gameState, legalMoves, selectedSoldierId, revivalTargets, onSoldierPress, onNodePress }: BoardProps) {
  const targetNodes = useMemo(() => {
    if (revivalTargets.length > 0) return new Set(revivalTargets);
    return new Set(legalMoves.filter(m => m.soldierId === selectedSoldierId).map(m => m.to));
  }, [legalMoves, selectedSoldierId, revivalTargets]);

  const captureTargets = useMemo(
    () => new Set(legalMoves.filter(m => m.soldierId === selectedSoldierId && m.type === 'capture').map(m => m.to)),
    [legalMoves, selectedSoldierId]
  );

  return (
    <View style={[styles.board, { width: BOARD_WIDTH, height: BOARD_HEIGHT }]}>
      <Svg width={BOARD_WIDTH} height={BOARD_HEIGHT} style={StyleSheet.absoluteFill}>
        {EDGES.map(([a, b], i) => {
          const pa = px(a), pb = px(b);
          return <Line key={i} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} stroke={COLORS.boardLines} strokeWidth={2} />;
        })}
      </Svg>

      {ALL_NODE_IDS.map(nodeId => {
        const p = px(nodeId);
        const isTarget = targetNodes.has(nodeId);
        const isCapture = captureTargets.has(nodeId);
        const NODE_HIT = UNIT * 0.6;
        return (
          <TouchableOpacity
            key={nodeId}
            onPress={() => onNodePress(nodeId)}
            style={[
              styles.nodeHit,
              {
                left: p.x - NODE_HIT / 2,
                top: p.y - NODE_HIT / 2,
                width: NODE_HIT,
                height: NODE_HIT,
                borderRadius: NODE_HIT / 2,
              },
            ]}
          >
            <View
              style={[
                styles.nodeDot,
                {
                  backgroundColor: isCapture ? COLORS.captureMove : isTarget ? COLORS.legalMove : COLORS.nodeIdle,
                  width: isTarget ? UNIT * 0.28 : UNIT * 0.16,
                  height: isTarget ? UNIT * 0.28 : UNIT * 0.16,
                  borderRadius: UNIT * 0.14,
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}

      {gameState.soldiers.filter(s => s.node !== null).map(soldier => {
        const p = px(soldier.node as string);
        // Kept below 0.5*UNIT (the tightest node spacing, at the triangle
        // mid-row points) so adjacent pawns never overlap.
        const size = UNIT * 0.38;
        return (
          <View key={soldier.id} style={{ position: 'absolute', left: p.x - size / 2, top: p.y - size / 2 }}>
            <PawnToken
              color={soldier.color}
              size={size}
              isSelected={selectedSoldierId === soldier.id}
              onPress={() => onSoldierPress(soldier.id)}
            />
          </View>
        );
      })}

      {SHOW_NODE_NUMBERS && ALL_NODE_IDS.map(nodeId => {
        const p = px(nodeId);
        const labelSize = UNIT * 0.32;
        return (
          <Text
            key={`label-${nodeId}`}
            style={[
              styles.nodeLabel,
              {
                left: p.x + UNIT * 0.14,
                top: p.y - UNIT * 0.34,
                fontSize: labelSize * 0.55,
                minWidth: labelSize,
              },
            ]}
          >
            {NODE_NUMBER[nodeId]}
          </Text>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  board: {
    position: 'relative',
    backgroundColor: COLORS.boardBackground,
    borderRadius: 8,
  },
  nodeHit: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nodeDot: {
    opacity: 0.85,
  },
  nodeLabel: {
    position: 'absolute',
    color: '#FFEB3B',
    fontWeight: 'bold',
    textShadowColor: '#000',
    textShadowOffset: { width: 0.5, height: 0.5 },
    textShadowRadius: 1,
  },
});
