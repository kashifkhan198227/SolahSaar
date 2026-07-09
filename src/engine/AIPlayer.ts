import {
  GameState,
  Move,
  PlayerColor,
  computeLegalMoves,
  computeRevivalTargets,
  applyMove,
  applyRevival,
  opponentOf,
  onBoardCount,
} from './GameEngine';

export type AILevel = 'easy' | 'medium' | 'hard';

export type AIAction = { kind: 'move'; move: Move } | { kind: 'revive'; node: string };

const SEARCH_DEPTH: Record<AILevel, number> = { easy: 1, medium: 2, hard: 4 };

function enumerateActions(state: GameState): AIAction[] {
  if (state.phase === 'playing') {
    return computeLegalMoves(state).map(move => ({ kind: 'move', move }));
  }
  if (state.phase === 'reviving') {
    return computeRevivalTargets(state).map(node => ({ kind: 'revive', node }));
  }
  return [];
}

function applyAction(state: GameState, action: AIAction): GameState {
  return action.kind === 'move' ? applyMove(state, action.move) : applyRevival(state, action.node);
}

/** Whoever's action this state is waiting on, whether that's a move or a revival placement. */
function actingColor(state: GameState): PlayerColor | null {
  if (state.phase === 'playing') return state.currentPlayer;
  if (state.phase === 'reviving') return state.reviveEligiblePlayer;
  return null;
}

function evaluate(state: GameState, forColor: PlayerColor): number {
  if (state.phase === 'gameover') {
    if (state.winner === forColor) return 100000;
    if (state.winner === opponentOf(forColor)) return -100000;
    return 0; // draw
  }
  const opp = opponentOf(forColor);
  const material = onBoardCount(state, forColor) - onBoardCount(state, opp);

  // Threats: pieces the mover-to-act is about to capture count against the
  // side being threatened, so the search prefers avoiding/exploiting them
  // even before they're actually taken.
  let captureThreat = 0;
  const who = actingColor(state);
  if (who === forColor) {
    captureThreat = computeLegalMoves(state).filter(m => m.type === 'capture').length;
  } else if (who === opp) {
    captureThreat = -computeLegalMoves(state).filter(m => m.type === 'capture').length;
  }

  return material * 100 + captureThreat * 8;
}

function minimax(state: GameState, depth: number, alpha: number, beta: number, forColor: PlayerColor): number {
  if (state.phase === 'gameover' || depth <= 0) {
    return evaluate(state, forColor);
  }
  const actions = enumerateActions(state);
  if (actions.length === 0) {
    return evaluate(state, forColor);
  }

  const maximizing = actingColor(state) === forColor;
  let best = maximizing ? -Infinity : Infinity;

  for (const action of actions) {
    const next = applyAction(state, action);
    const score = minimax(next, depth - 1, alpha, beta, forColor);
    if (maximizing) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, best);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, best);
    }
    if (beta <= alpha) break;
  }
  return best;
}

/**
 * Picks the next action (a move/capture, or a revival placement) for whichever
 * side is currently acting in `state`. Returns null if there's nothing to do
 * (shouldn't happen in a live game — `startTurn` guarantees a mover has an
 * action, or the game is already over).
 */
export function getAIAction(state: GameState, level: AILevel): AIAction | null {
  const color = actingColor(state);
  if (!color) return null;
  const actions = enumerateActions(state);
  if (actions.length === 0) return null;

  if (level === 'easy') {
    // Mostly random, but takes a capture more often than not when one's available.
    const captures = actions.filter(a => a.kind === 'move' && a.move.type === 'capture');
    const pool = captures.length > 0 && Math.random() < 0.6 ? captures : actions;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const depth = SEARCH_DEPTH[level];
  let bestActions: AIAction[] = [];
  let bestScore = -Infinity;

  for (const action of actions) {
    const next = applyAction(state, action);
    const score = minimax(next, depth - 1, -Infinity, Infinity, color);
    if (score > bestScore) {
      bestScore = score;
      bestActions = [action];
    } else if (score === bestScore) {
      bestActions.push(action);
    }
  }

  return bestActions[Math.floor(Math.random() * bestActions.length)];
}
