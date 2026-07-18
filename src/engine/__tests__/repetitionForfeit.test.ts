import { GameState, Soldier, applyMove, Move } from '../GameEngine';

function makeState(soldiers: Soldier[]): GameState {
  const positionHistory: Record<number, string[]> = {};
  for (const s of soldiers) if (s.node) positionHistory[s.id] = [s.node];
  return {
    soldiers,
    currentPlayer: 'orange',
    phase: 'playing',
    winner: null,
    lastMove: null,
    chainingSoldierId: null,
    turnSkipped: null,
    positionHistory,
    forfeitedSoldierId: null,
  };
}

test('a soldier shuttling the same two nodes three times in a row is forfeited', () => {
  const soldiers: Soldier[] = [
    { id: 0, color: 'orange', node: 'g2_2' },
    { id: 1, color: 'orange', node: 'tTR' }, // filler so orange isn't wiped out
    { id: 2, color: 'black', node: 'bBR' },
  ];
  let state = makeState(soldiers);

  const orangeMoves: Move[] = [
    { type: 'move', soldierId: 0, from: 'g2_2', to: 'g1_2' },
    { type: 'move', soldierId: 0, from: 'g1_2', to: 'g2_2' },
    { type: 'move', soldierId: 0, from: 'g2_2', to: 'g1_2' },
    { type: 'move', soldierId: 0, from: 'g1_2', to: 'g2_2' },
  ];
  const blackMoves: Move[] = [
    { type: 'move', soldierId: 2, from: 'bBR', to: 'bMR' },
    { type: 'move', soldierId: 2, from: 'bMR', to: 'bBR' },
    { type: 'move', soldierId: 2, from: 'bBR', to: 'bMR' },
  ];

  state = applyMove(state, orangeMoves[0]);
  expect(state.forfeitedSoldierId).toBeNull();
  state = applyMove(state, blackMoves[0]);
  state = applyMove(state, orangeMoves[1]);
  expect(state.forfeitedSoldierId).toBeNull();
  state = applyMove(state, blackMoves[1]);
  state = applyMove(state, orangeMoves[2]);
  expect(state.forfeitedSoldierId).toBeNull();
  state = applyMove(state, blackMoves[2]);
  state = applyMove(state, orangeMoves[3]);

  // Fourth shuttle move (g1_2 -> g2_2, the third arrival at g2_2) completes
  // the A,B,A,B,A pattern and forfeits the soldier.
  expect(state.forfeitedSoldierId).toBe(0);
  expect(state.soldiers.find(s => s.id === 0)?.node).toBeNull();
});

test('a soldier that breaks the shuttle by moving elsewhere does not get forfeited', () => {
  const soldiers: Soldier[] = [
    { id: 0, color: 'orange', node: 'g2_2' },
    { id: 1, color: 'orange', node: 'tTR' },
    { id: 2, color: 'black', node: 'bBR' },
  ];
  let state = makeState(soldiers);

  state = applyMove(state, { type: 'move', soldierId: 0, from: 'g2_2', to: 'g1_2' });
  state = applyMove(state, { type: 'move', soldierId: 2, from: 'bBR', to: 'bMR' });
  state = applyMove(state, { type: 'move', soldierId: 0, from: 'g1_2', to: 'g2_2' });
  state = applyMove(state, { type: 'move', soldierId: 2, from: 'bMR', to: 'bBR' });
  // Break the pattern by moving to a third node instead of back to g1_2.
  state = applyMove(state, { type: 'move', soldierId: 0, from: 'g2_2', to: 'g3_2' });

  expect(state.forfeitedSoldierId).toBeNull();
  expect(state.soldiers.find(s => s.id === 0)?.node).toBe('g3_2');
});
