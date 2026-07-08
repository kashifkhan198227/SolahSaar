import {
  ADJACENCY,
  JUMP_TRIPLES,
  ORANGE_START,
  BLACK_START,
  ORANGE_TARGET_EDGE,
  BLACK_TARGET_EDGE,
  ALL_NODE_IDS,
} from './BoardLayout';

export type PlayerColor = 'orange' | 'black';

export interface Soldier {
  id: number;
  color: PlayerColor;
  node: string | null; // null = captured, off the board
}

export type GamePhase = 'playing' | 'reviving' | 'gameover';

export interface Move {
  type: 'move' | 'capture';
  soldierId: number;
  from: string;
  to: string;
  capturedId?: number;
  capturedNode?: string;
}

export interface GameState {
  soldiers: Soldier[];
  currentPlayer: PlayerColor;
  phase: GamePhase;
  winner: PlayerColor | null;
  lastMove: Move | null;
  reviveEligiblePlayer: PlayerColor | null;
  /** Set right after a capture if the same soldier can capture again; only that
   *  soldier's further captures are legal until the chain runs out. */
  chainingSoldierId: number | null;
  /** Set for one state when a player had zero legal moves and their turn was
   *  auto-passed to the opponent, so the UI can surface why. Cleared on the next action. */
  turnSkipped: PlayerColor | null;
}

const TARGET_EDGE: Record<PlayerColor, Set<string>> = {
  orange: new Set(ORANGE_TARGET_EDGE),
  black: new Set(BLACK_TARGET_EDGE),
};

export function opponentOf(color: PlayerColor): PlayerColor {
  return color === 'orange' ? 'black' : 'orange';
}

export function createInitialGameState(startingPlayer?: PlayerColor): GameState {
  let id = 0;
  const soldiers: Soldier[] = [
    ...ORANGE_START.map(node => ({ id: id++, color: 'orange' as const, node })),
    ...BLACK_START.map(node => ({ id: id++, color: 'black' as const, node })),
  ];
  const currentPlayer = startingPlayer ?? (Math.random() < 0.5 ? 'orange' : 'black');
  return {
    soldiers,
    currentPlayer,
    phase: 'playing',
    winner: null,
    lastMove: null,
    reviveEligiblePlayer: null,
    chainingSoldierId: null,
    turnSkipped: null,
  };
}

export function occupantAt(state: GameState, node: string): Soldier | undefined {
  return state.soldiers.find(s => s.node === node);
}

function captureMovesFor(state: GameState, soldier: Soldier): Move[] {
  const moves: Move[] = [];
  const from = soldier.node as string;
  for (const [a, b, c] of JUMP_TRIPLES) {
    let mid: string, to: string;
    if (a === from) { mid = b; to = c; }
    else if (c === from) { mid = b; to = a; }
    else continue;
    const midOccupant = occupantAt(state, mid);
    if (midOccupant && midOccupant.color !== state.currentPlayer && !occupantAt(state, to)) {
      moves.push({ type: 'capture', soldierId: soldier.id, from, to, capturedId: midOccupant.id, capturedNode: mid });
    }
  }
  return moves;
}

export function computeLegalMoves(state: GameState): Move[] {
  if (state.phase !== 'playing') return [];

  // Mid capture-chain: only further captures by the same soldier are legal.
  if (state.chainingSoldierId != null) {
    const soldier = state.soldiers.find(s => s.id === state.chainingSoldierId);
    if (!soldier || soldier.node === null) return [];
    return captureMovesFor(state, soldier);
  }

  const moves: Move[] = [];
  const mine = state.soldiers.filter(s => s.color === state.currentPlayer && s.node !== null);

  for (const soldier of mine) {
    const from = soldier.node as string;
    for (const neighbor of ADJACENCY[from] || []) {
      if (!occupantAt(state, neighbor)) {
        moves.push({ type: 'move', soldierId: soldier.id, from, to: neighbor });
      }
    }
  }

  for (const soldier of mine) {
    moves.push(...captureMovesFor(state, soldier));
  }

  return moves;
}

export function legalMovesForSoldier(state: GameState, soldierId: number): Move[] {
  return computeLegalMoves(state).filter(m => m.soldierId === soldierId);
}

function hasAnyLegalMove(soldiers: Soldier[], player: PlayerColor): boolean {
  const probe: GameState = {
    soldiers, currentPlayer: player, phase: 'playing', winner: null,
    lastMove: null, reviveEligiblePlayer: null, chainingSoldierId: null, turnSkipped: null,
  };
  return computeLegalMoves(probe).length > 0;
}

/**
 * Starts the given player's turn, but if they have no legal move at all
 * (blocked in, no captures either), passes the turn to the opponent instead
 * of leaving the game stuck. If neither player can move, ends the game as a
 * draw — this can't happen from elimination alone (a player with 0 soldiers
 * already ends the game), so it only guards a genuine mutual lockout.
 */
function startTurn(soldiers: Soldier[], candidate: PlayerColor, lastMove: Move | null): GameState {
  if (hasAnyLegalMove(soldiers, candidate)) {
    return { soldiers, currentPlayer: candidate, phase: 'playing', winner: null, lastMove, reviveEligiblePlayer: null, chainingSoldierId: null, turnSkipped: null };
  }
  const other = opponentOf(candidate);
  if (hasAnyLegalMove(soldiers, other)) {
    return { soldiers, currentPlayer: other, phase: 'playing', winner: null, lastMove, reviveEligiblePlayer: null, chainingSoldierId: null, turnSkipped: candidate };
  }
  return { soldiers, currentPlayer: candidate, phase: 'gameover', winner: null, lastMove, reviveEligiblePlayer: null, chainingSoldierId: null, turnSkipped: null };
}

export function applyMove(state: GameState, move: Move): GameState {
  const soldiers = state.soldiers.map(s => ({ ...s }));
  const soldier = soldiers.find(s => s.id === move.soldierId);
  if (!soldier) return state;
  soldier.node = move.to;

  if (move.type === 'capture' && move.capturedId != null) {
    const captured = soldiers.find(s => s.id === move.capturedId);
    if (captured) captured.node = null;
  }

  const mover = state.currentPlayer;
  const opponent = opponentOf(mover);

  const opponentHasSoldiers = soldiers.some(s => s.color === opponent && s.node !== null);
  if (!opponentHasSoldiers) {
    return { soldiers, currentPlayer: mover, phase: 'gameover', winner: mover, lastMove: move, reviveEligiblePlayer: null, chainingSoldierId: null, turnSkipped: null };
  }

  // Chain-capture: keep going with the same soldier as long as it can capture again.
  if (move.type === 'capture') {
    const furtherCaptures = captureMovesFor({ ...state, soldiers, chainingSoldierId: null }, soldier);
    if (furtherCaptures.length > 0) {
      return { soldiers, currentPlayer: mover, phase: 'playing', winner: null, lastMove: move, reviveEligiblePlayer: null, chainingSoldierId: soldier.id, turnSkipped: null };
    }
  }

  const reachedTargetEdge = TARGET_EDGE[mover].has(move.to);
  const hasDeadSoldiers = soldiers.some(s => s.color === mover && s.node === null);
  if (reachedTargetEdge && hasDeadSoldiers) {
    return { soldiers, currentPlayer: mover, phase: 'reviving', winner: null, lastMove: move, reviveEligiblePlayer: mover, chainingSoldierId: null, turnSkipped: null };
  }

  return startTurn(soldiers, opponent, move);
}

export function computeRevivalTargets(state: GameState): string[] {
  if (state.phase !== 'reviving') return [];
  const occupied = new Set(state.soldiers.filter(s => s.node !== null).map(s => s.node as string));
  return ALL_NODE_IDS.filter(n => !occupied.has(n));
}

export function applyRevival(state: GameState, node: string): GameState {
  if (state.phase !== 'reviving' || !state.reviveEligiblePlayer) return state;
  const soldiers = state.soldiers.map(s => ({ ...s }));
  const deadSoldier = soldiers.find(s => s.color === state.reviveEligiblePlayer && s.node === null);
  if (!deadSoldier) return startTurn(soldiers, opponentOf(state.reviveEligiblePlayer), state.lastMove);
  deadSoldier.node = node;

  return startTurn(soldiers, opponentOf(state.reviveEligiblePlayer), state.lastMove);
}

export function deadCount(state: GameState, color: PlayerColor): number {
  return state.soldiers.filter(s => s.color === color && s.node === null).length;
}

export function onBoardCount(state: GameState, color: PlayerColor): number {
  return state.soldiers.filter(s => s.color === color && s.node !== null).length;
}
