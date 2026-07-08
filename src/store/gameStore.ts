import { create } from 'zustand';
import {
  GameState,
  Move,
  PlayerColor,
  createInitialGameState,
  computeLegalMoves,
  legalMovesForSoldier,
  applyMove,
  applyRevival,
  computeRevivalTargets,
} from '../engine/GameEngine';
import { saveGame, loadSavedGame, clearSavedGame, loadStats, saveStats } from '../utils/storage';

interface GameStore {
  gameState: GameState | null;
  selectedSoldierId: number | null;
  legalMoves: Move[];
  hasSavedGame: boolean;

  startGame: (startingPlayer?: PlayerColor) => void;
  selectSoldier: (soldierId: number) => void;
  moveTo: (node: string) => void;
  reviveAt: (node: string) => void;
  clearSelection: () => void;
  saveCurrentGame: () => Promise<void>;
  loadGame: () => Promise<boolean>;
  resetGame: () => void;
  checkSavedGame: () => Promise<void>;
  recordResult: (winner: PlayerColor) => Promise<void>;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  selectedSoldierId: null,
  legalMoves: [],
  hasSavedGame: false,

  startGame: (startingPlayer) => {
    const state = createInitialGameState(startingPlayer);
    set({ gameState: state, selectedSoldierId: null, legalMoves: computeLegalMoves(state) });
    clearSavedGame();
  },

  selectSoldier: (soldierId: number) => {
    const { gameState } = get();
    if (!gameState || gameState.phase !== 'playing') return;
    const moves = legalMovesForSoldier(gameState, soldierId);
    if (moves.length === 0) return;
    set({ selectedSoldierId: soldierId });
  },

  moveTo: (node: string) => {
    const { gameState, selectedSoldierId, legalMoves } = get();
    if (!gameState || selectedSoldierId === null) return;
    const move = legalMoves.find(m => m.soldierId === selectedSoldierId && m.to === node);
    if (!move) return;

    const newState = applyMove(gameState, move);
    set({
      gameState: newState,
      selectedSoldierId: newState.chainingSoldierId,
      legalMoves: newState.phase === 'playing' ? computeLegalMoves(newState) : [],
    });

    if (newState.phase === 'gameover' && newState.winner) {
      get().recordResult(newState.winner);
    }
  },

  reviveAt: (node: string) => {
    const { gameState } = get();
    if (!gameState || gameState.phase !== 'reviving') return;
    const targets = computeRevivalTargets(gameState);
    if (!targets.includes(node)) return;
    const newState = applyRevival(gameState, node);
    set({ gameState: newState, selectedSoldierId: null, legalMoves: computeLegalMoves(newState) });
  },

  clearSelection: () => set({ selectedSoldierId: null }),

  saveCurrentGame: async () => {
    const { gameState } = get();
    if (!gameState) return;
    await saveGame(gameState);
    set({ hasSavedGame: true });
  },

  loadGame: async () => {
    const saved = await loadSavedGame();
    if (!saved) return false;
    const state = saved as GameState;
    set({ gameState: state, selectedSoldierId: null, legalMoves: computeLegalMoves(state) });
    return true;
  },

  resetGame: () => {
    set({ gameState: null, selectedSoldierId: null, legalMoves: [] });
    clearSavedGame();
    set({ hasSavedGame: false });
  },

  checkSavedGame: async () => {
    const saved = await loadSavedGame();
    set({ hasSavedGame: !!saved });
  },

  recordResult: async (winner: PlayerColor) => {
    const stats = await loadStats();
    stats.totalGames += 1;
    if (winner === 'orange') stats.orangeWins += 1;
    else stats.blackWins += 1;
    stats.lastPlayed = new Date().toISOString();
    await saveStats(stats);
    clearSavedGame();
  },
}));
