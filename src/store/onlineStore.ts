import { create } from 'zustand';
import { Unsubscribe } from 'firebase/firestore';
import { PlayerColor, Move, computeLegalMoves, legalMovesForSoldier } from '../engine/GameEngine';
import {
  OnlineGameDoc,
  createPrivateRoom,
  joinRoomByCode,
  joinMatchmaking,
  subscribeToGame,
  submitAction,
  leaveGame,
} from '../services/onlineGame';

export type ConnectionStatus =
  | 'idle'
  | 'creating'
  | 'waiting-for-opponent'
  | 'searching'
  | 'joining'
  | 'connected'
  | 'error';

interface OnlineStore {
  gameId: string | null;
  roomCode: string | null;
  myColor: PlayerColor | null;
  gameDoc: OnlineGameDoc | null;
  legalMoves: Move[];
  selectedSoldierId: number | null;
  status: ConnectionStatus;
  errorMessage: string | null;

  _unsubscribeGame: Unsubscribe | null;
  _cancelMatchmaking: (() => void) | null;

  createRoom: () => Promise<void>;
  joinByCode: (code: string) => Promise<void>;
  findMatch: () => void;
  cancelSearch: () => void;
  selectSoldier: (soldierId: number) => void;
  moveTo: (node: string) => void;
  isMyTurn: () => boolean;
  leaveAndReset: () => void;
}

function attachGameListener(set: (partial: Partial<OnlineStore>) => void, get: () => OnlineStore, gameId: string) {
  get()._unsubscribeGame?.();
  const unsubscribe = subscribeToGame(
    gameId,
    doc => {
      if (!doc) return;
      set({
        gameDoc: doc,
        legalMoves: computeLegalMoves(doc.gameState),
        status: doc.status === 'waiting' ? 'waiting-for-opponent' : 'connected',
        selectedSoldierId: null,
      });
    },
    error => {
      set({ status: 'error', errorMessage: error instanceof Error ? error.message : 'Lost connection to the game.' });
    }
  );
  set({ _unsubscribeGame: unsubscribe });
}

export const useOnlineStore = create<OnlineStore>((set, get) => ({
  gameId: null,
  roomCode: null,
  myColor: null,
  gameDoc: null,
  legalMoves: [],
  selectedSoldierId: null,
  status: 'idle',
  errorMessage: null,
  _unsubscribeGame: null,
  _cancelMatchmaking: null,

  createRoom: async () => {
    set({ status: 'creating', errorMessage: null });
    try {
      const { gameId, roomCode, myColor } = await createPrivateRoom();
      set({ gameId, roomCode, myColor, status: 'waiting-for-opponent' });
      attachGameListener(set, get, gameId);
    } catch (e) {
      set({ status: 'error', errorMessage: e instanceof Error ? e.message : 'Could not create room.' });
    }
  },

  joinByCode: async (code: string) => {
    set({ status: 'joining', errorMessage: null });
    try {
      const { gameId, myColor } = await joinRoomByCode(code);
      set({ gameId, roomCode: code.trim().toUpperCase(), myColor, status: 'connected' });
      attachGameListener(set, get, gameId);
    } catch (e) {
      set({ status: 'error', errorMessage: e instanceof Error ? e.message : 'Could not join that room.' });
    }
  },

  findMatch: () => {
    set({ status: 'searching', errorMessage: null });
    const cancel = joinMatchmaking(
      (gameId, myColor) => {
        set({ gameId, roomCode: null, myColor, status: 'connected', _cancelMatchmaking: null });
        attachGameListener(set, get, gameId);
      },
      error => {
        set({ status: 'error', errorMessage: error instanceof Error ? error.message : 'Matchmaking failed.', _cancelMatchmaking: null });
      }
    );
    set({ _cancelMatchmaking: cancel });
  },

  cancelSearch: () => {
    get()._cancelMatchmaking?.();
    set({ status: 'idle', _cancelMatchmaking: null });
  },

  isMyTurn: () => {
    const { gameDoc, myColor } = get();
    if (!gameDoc || !myColor) return false;
    return gameDoc.gameState.currentPlayer === myColor;
  },

  selectSoldier: (soldierId: number) => {
    const { gameDoc } = get();
    if (!gameDoc || gameDoc.gameState.phase !== 'playing' || !get().isMyTurn()) return;
    const moves = legalMovesForSoldier(gameDoc.gameState, soldierId);
    if (moves.length === 0) return;
    set({ selectedSoldierId: soldierId });
  },

  moveTo: (node: string) => {
    const { gameId, gameDoc, selectedSoldierId, legalMoves } = get();
    if (!gameId || !gameDoc || selectedSoldierId === null || !get().isMyTurn()) return;
    const move = legalMoves.find(m => m.soldierId === selectedSoldierId && m.to === node);
    if (!move) return;
    set({ selectedSoldierId: null });
    submitAction(gameId, move).catch(e => {
      set({ status: 'error', errorMessage: e instanceof Error ? e.message : 'Move failed to sync.' });
    });
  },

  leaveAndReset: () => {
    const { gameId, _unsubscribeGame, _cancelMatchmaking } = get();
    _unsubscribeGame?.();
    _cancelMatchmaking?.();
    if (gameId) leaveGame(gameId).catch(() => {});
    set({
      gameId: null,
      roomCode: null,
      myColor: null,
      gameDoc: null,
      legalMoves: [],
      selectedSoldierId: null,
      status: 'idle',
      errorMessage: null,
      _unsubscribeGame: null,
      _cancelMatchmaking: null,
    });
  },
}));
