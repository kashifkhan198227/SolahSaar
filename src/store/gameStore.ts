import { create } from 'zustand';
import {
  GameState,
  Move,
  PlayerColor,
  createInitialGameState,
  computeLegalMoves,
  legalMovesForSoldier,
  applyMove,
} from '../engine/GameEngine';
import { getAIAction, AILevel } from '../engine/AIPlayer';
import { saveGame, loadSavedGame, clearSavedGame, loadStats, saveStats } from '../utils/storage';

export interface AIConfig {
  color: PlayerColor;
  level: AILevel;
}

interface GameStore {
  gameState: GameState | null;
  selectedSoldierId: number | null;
  legalMoves: Move[];
  hasSavedGame: boolean;
  aiConfig: AIConfig | null;
  isAIThinking: boolean;

  startGame: (startingPlayer?: PlayerColor, aiConfig?: AIConfig | null) => void;
  selectSoldier: (soldierId: number) => void;
  moveTo: (node: string) => void;
  clearSelection: () => void;
  saveCurrentGame: () => Promise<void>;
  loadGame: () => Promise<boolean>;
  resetGame: () => void;
  checkSavedGame: () => Promise<void>;
  recordResult: (winner: PlayerColor) => Promise<void>;
  isAITurn: () => boolean;
  runAIMove: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: null,
  selectedSoldierId: null,
  legalMoves: [],
  hasSavedGame: false,
  aiConfig: null,
  isAIThinking: false,

  startGame: (startingPlayer, aiConfig = null) => {
    const state = createInitialGameState(startingPlayer);
    set({ gameState: state, selectedSoldierId: null, legalMoves: computeLegalMoves(state), aiConfig, isAIThinking: false });
    clearSavedGame();
  },

  isAITurn: () => {
    const { gameState, aiConfig } = get();
    if (!gameState || !aiConfig) return false;
    return gameState.currentPlayer === aiConfig.color;
  },

  selectSoldier: (soldierId: number) => {
    const { gameState } = get();
    if (!gameState || gameState.phase !== 'playing' || get().isAITurn()) return;
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

  runAIMove: () => {
    const { gameState, aiConfig, isAIThinking } = get();
    if (!gameState || !aiConfig || isAIThinking) return;
    if (!get().isAITurn()) return;

    set({ isAIThinking: true });
    const move = getAIAction(gameState, aiConfig.level);
    if (!move) {
      set({ isAIThinking: false });
      return;
    }

    const newState = applyMove(gameState, move);
    set({
      gameState: newState,
      selectedSoldierId: newState.chainingSoldierId,
      legalMoves: newState.phase === 'playing' ? computeLegalMoves(newState) : [],
      isAIThinking: false,
    });
    if (newState.phase === 'gameover' && newState.winner) {
      get().recordResult(newState.winner);
    }
  },

  clearSelection: () => set({ selectedSoldierId: null }),

  saveCurrentGame: async () => {
    const { gameState, aiConfig } = get();
    if (!gameState) return;
    await saveGame({ gameState, aiConfig });
    set({ hasSavedGame: true });
  },

  loadGame: async () => {
    const saved = await loadSavedGame();
    if (!saved) return false;
    const { gameState, aiConfig } = saved as { gameState: GameState; aiConfig: AIConfig | null };
    set({ gameState, aiConfig: aiConfig ?? null, selectedSoldierId: null, legalMoves: computeLegalMoves(gameState) });
    return true;
  },

  resetGame: () => {
    set({ gameState: null, selectedSoldierId: null, legalMoves: [], aiConfig: null, isAIThinking: false });
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
