import {
  GameState,
  Move,
  PlayerColor,
  computeLegalMoves,
  applyMove,
  opponentOf,
  onBoardCount,
} from './GameEngine';

export type AILevel = 'easy' | 'medium' | 'hard';

const SEARCH_DEPTH: Record<AILevel, number> = { easy: 1, medium: 2, hard: 4 };

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
  if (state.currentPlayer === forColor) {
    captureThreat = computeLegalMoves(state).filter(m => m.type === 'capture').length;
  } else if (state.currentPlayer === opp) {
    captureThreat = -computeLegalMoves(state).filter(m => m.type === 'capture').length;
  }

  return material * 100 + captureThreat * 8;
}

function minimax(state: GameState, depth: number, alpha: number, beta: number, forColor: PlayerColor): number {
  if (state.phase === 'gameover' || depth <= 0) {
    return evaluate(state, forColor);
  }
  const moves = computeLegalMoves(state);
  if (moves.length === 0) {
    return evaluate(state, forColor);
  }

  const maximizing = state.currentPlayer === forColor;
  let best = maximizing ? -Infinity : Infinity;

  for (const move of moves) {
    const next = applyMove(state, move);
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
 * Picks the next move for whichever side is currently acting in `state`.
 * Returns null if there's nothing to do (shouldn't happen in a live game —
 * `startTurn` guarantees a mover has a move, or the game is already over).
 */
export function getAIAction(state: GameState, level: AILevel): Move | null {
  const moves = computeLegalMoves(state);
  if (moves.length === 0) return null;
  const color = state.currentPlayer;

  if (level === 'easy') {
    // Mostly random, but takes a capture more often than not when one's available.
    const captures = moves.filter(m => m.type === 'capture');
    const pool = captures.length > 0 && Math.random() < 0.6 ? captures : moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  const depth = SEARCH_DEPTH[level];
  let bestMoves: Move[] = [];
  let bestScore = -Infinity;

  for (const move of moves) {
    const next = applyMove(state, move);
    const score = minimax(next, depth - 1, -Infinity, Infinity, color);
    if (score > bestScore) {
      bestScore = score;
      bestMoves = [move];
    } else if (score === bestScore) {
      bestMoves.push(move);
    }
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
