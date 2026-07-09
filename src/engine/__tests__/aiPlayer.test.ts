import { GameState, Soldier, computeLegalMoves, computeRevivalTargets } from '../GameEngine';
import { getAIAction } from '../AIPlayer';

function makeState(soldiers: Soldier[], overrides: Partial<GameState> = {}): GameState {
  return {
    soldiers,
    currentPlayer: 'orange',
    phase: 'playing',
    winner: null,
    lastMove: null,
    reviveEligiblePlayer: null,
    chainingSoldierId: null,
    turnSkipped: null,
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
    const action = getAIAction(state, level);
    expect(action).not.toBeNull();
    expect(action!.kind).toBe('move');
    if (action!.kind === 'move') {
      expect(legal).toContainEqual(action!.move);
    }
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
    const action = getAIAction(state, level);
    expect(action).toEqual({
      kind: 'move',
      move: expect.objectContaining({ type: 'capture', soldierId: 0, to: 'g2_4', capturedId: 1 }),
    });
  }
});

test('getAIAction handles the reviving phase by picking a valid empty node', () => {
  const soldiers: Soldier[] = [
    { id: 0, color: 'orange', node: 'g2_4' }, // just reached the edge
    { id: 1, color: 'orange', node: null }, // dead, eligible to revive
    { id: 2, color: 'black', node: 'g0_0' },
  ];
  const state = makeState(soldiers, {
    phase: 'reviving',
    currentPlayer: 'orange',
    reviveEligiblePlayer: 'orange',
  });
  const targets = new Set(computeRevivalTargets(state));

  const action = getAIAction(state, 'medium');
  expect(action).not.toBeNull();
  expect(action!.kind).toBe('revive');
  if (action!.kind === 'revive') {
    expect(targets.has(action!.node)).toBe(true);
  }
});
