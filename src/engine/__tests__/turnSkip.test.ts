import { GameState, Soldier, applyMove } from '../GameEngine';

function makeState(soldiers: Soldier[], currentPlayer: 'orange' | 'black' = 'orange'): GameState {
  return {
    soldiers,
    currentPlayer,
    phase: 'playing',
    winner: null,
    lastMove: null,
    chainingSoldierId: null,
    turnSkipped: null,
    positionHistory: {},
    forfeitedSoldierId: null,
  };
}

test('a player with zero legal moves is skipped instead of freezing the game', () => {
  // Orange's only soldier sits at g2_2, which has 8 lines radiating out of it
  // (2 grid neighbors each on row2/col2, plus 4 diagonals). To fully lock it
  // in we need every immediate neighbor occupied (blocks simple moves) AND
  // every landing square one step beyond each neighbor occupied (blocks jumps).
  const soldiers: Soldier[] = [
    { id: 0, color: 'orange', node: 'g2_2' },
    // immediate neighbors (also the capture "mid" squares)
    { id: 1, color: 'black', node: 'g1_2' },
    { id: 2, color: 'black', node: 'g3_2' },
    { id: 3, color: 'black', node: 'g2_1' },
    { id: 4, color: 'black', node: 'g2_3' },
    { id: 5, color: 'black', node: 'g1_1' },
    { id: 6, color: 'black', node: 'g3_1' },
    { id: 7, color: 'black', node: 'g1_3' },
    { id: 8, color: 'black', node: 'g3_3' },
    // landing squares one step beyond each neighbor, so no jump is possible either
    { id: 9, color: 'black', node: 'g0_2' },
    { id: 10, color: 'black', node: 'g4_2' },
    { id: 11, color: 'black', node: 'g2_0' },
    { id: 12, color: 'black', node: 'g2_4' },
    { id: 13, color: 'black', node: 'g0_0' },
    { id: 14, color: 'black', node: 'g4_0' },
    { id: 15, color: 'black', node: 'g0_4' },
    { id: 16, color: 'black', node: 'g4_4' },
    // A black soldier elsewhere with a free move, so Black's own move doesn't
    // itself get skipped and we isolate the "next player is stuck" case.
    { id: 17, color: 'black', node: 'bBL' },
  ];
  const state = makeState(soldiers, 'black');

  const move = { type: 'move' as const, soldierId: 17, from: 'bBL', to: 'bML' };
  const next = applyMove(state, move);

  // Orange has a soldier on the board (not eliminated) but cannot move or
  // capture from g2_2 (every neighbor and every jump landing square is
  // occupied), so the engine must skip straight back to Black rather than
  // getting stuck waiting for a move that can never come.
  expect(next.phase).toBe('playing');
  expect(next.currentPlayer).toBe('black');
  expect(next.turnSkipped).toBe('orange');
});
