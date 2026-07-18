import { GameState, Soldier, computeLegalMoves } from '../GameEngine';
import { getAIAction } from '../AIPlayer';

function makeState(soldiers: Soldier[], overrides: Partial<GameState> = {}): GameState {
  return {
    soldiers,
    currentPlayer: 'orange',
    phase: 'playing',
    winner: null,
    lastMove: null,
    chainingSoldierId: null,
    turnSkipped: null,
    positionHistory: {},
    forfeitedSoldierId: null,
    ...overrides,
  };
}

test('getAIAction only ever returns a currently-legal move', () => {
  const soldiers: Soldier[] = [
    { id: 0, color: 'orange', node: 'g2_2' },
    { id: 1, color: 'black', node: 'g1_2' },
    { id: 2, color: 'black', node: 'bBL' },
  ];
  const state = makeState(soldiers);
  const legal = computeLegalMoves(state);

  for (const level of ['easy', 'medium', 'hard'] as const) {
    const move = getAIAction(state, level);
    expect(move).not.toBeNull();
    expect(legal).toContainEqual(move);
  }
});

test('a mid/hard-level AI takes a free capture over a plain move when one is available', () => {
  // Orange at g0_2 can either shuffle sideways or capture the lone black
  // soldier at g1_3 for free (landing g2_4 is empty) — a decent AI should
  // prefer the capture.
  const soldiers: Soldier[] = [
    { id: 0, color: 'orange', node: 'g0_2' },
    { id: 1, color: 'black', node: 'g1_3' },
    { id: 2, color: 'black', node: 'bBR' }, // keeps black from being eliminated by the capture
  ];
  const state = makeState(soldiers);

  for (const level of ['medium', 'hard'] as const) {
    const move = getAIAction(state, level);
    expect(move).toEqual(expect.objectContaining({ type: 'capture', soldierId: 0, to: 'g2_4', capturedId: 1 }));
  }
});
