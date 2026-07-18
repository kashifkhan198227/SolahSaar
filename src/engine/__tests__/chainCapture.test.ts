import { GameState, Soldier, computeLegalMoves, applyMove } from '../GameEngine';

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

test('a soldier keeps capturing along a diagonal until no capture remains', () => {
  // tTL -> tML -> g2_0 (top slant), then g2_0 -> g3_1 -> g4_2 (top-right \
  // diagonal) — two of the board's surviving diagonal lines, chained.
  const soldiers: Soldier[] = [
    { id: 0, color: 'orange', node: 'tTL' },
    { id: 1, color: 'black', node: 'tML' },
    { id: 2, color: 'black', node: 'g3_1' },
    { id: 3, color: 'black', node: 'bBL' }, // filler so the opponent isn't wiped out early
  ];
  let state = makeState(soldiers);

  // First jump: tTL over tML -> g2_0
  const firstMoves = computeLegalMoves(state).filter(m => m.type === 'capture');
  const first = firstMoves.find(m => m.soldierId === 0 && m.to === 'g2_0');
  expect(first).toBeDefined();

  state = applyMove(state, first!);
  expect(state.soldiers.find(s => s.id === 1)?.node).toBeNull(); // captured
  expect(state.currentPlayer).toBe('orange'); // turn does not pass yet
  expect(state.chainingSoldierId).toBe(0); // must continue with the same soldier

  // Only the continuation capture should be legal now
  const secondMoves = computeLegalMoves(state);
  expect(secondMoves).toHaveLength(1);
  expect(secondMoves[0]).toMatchObject({ soldierId: 0, from: 'g2_0', to: 'g4_2', capturedId: 2 });

  state = applyMove(state, secondMoves[0]);
  expect(state.soldiers.find(s => s.id === 2)?.node).toBeNull(); // captured
  expect(state.soldiers.find(s => s.id === 0)?.node).toBe('g4_2');
  expect(state.chainingSoldierId).toBeNull(); // chain ends, no more captures available
  expect(state.currentPlayer).toBe('black'); // turn passes now
});

test('capturing stops mid-chain and passes the turn when no further capture is available', () => {
  // g0_2 -> g1_3 -> g2_4 (bottom-left \ diagonal); g2_4 also touches the
  // bottom-right / diagonal and both bottom-triangle slants, but none of
  // those have an enemy soldier to continue capturing, so the chain ends.
  const soldiers: Soldier[] = [
    { id: 0, color: 'orange', node: 'g0_2' },
    { id: 1, color: 'black', node: 'g1_3' },
    { id: 2, color: 'black', node: 'bBL' }, // filler, not part of any chain
  ];
  let state = makeState(soldiers);

  const move = computeLegalMoves(state).find(m => m.type === 'capture' && m.soldierId === 0)!;
  state = applyMove(state, move);

  expect(state.chainingSoldierId).toBeNull();
  expect(state.currentPlayer).toBe('black');
});
