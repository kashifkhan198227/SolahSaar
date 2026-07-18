import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  runTransaction,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db, ensureSignedIn } from './firebase';
import { GameState, Move, PlayerColor, createInitialGameState, applyMove, opponentOf } from '../engine/GameEngine';

export type RoomVisibility = 'private' | 'public';
export type GameDocStatus = 'waiting' | 'active' | 'finished';

export interface OnlineGameDoc {
  hostUid: string;
  hostColor: PlayerColor;
  guestUid: string | null;
  guestColor: PlayerColor | null;
  roomCode: string | null;
  visibility: RoomVisibility;
  status: GameDocStatus;
  gameState: GameState;
}

const ROOM_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I — easy to read aloud

function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 6; i++) code += ROOM_CODE_CHARS[Math.floor(Math.random() * ROOM_CODE_CHARS.length)];
  return code;
}

export async function createPrivateRoom(): Promise<{ gameId: string; roomCode: string; myColor: PlayerColor }> {
  const user = await ensureSignedIn();
  const hostColor: PlayerColor = Math.random() < 0.5 ? 'orange' : 'black';
  const roomCode = generateRoomCode();
  const gameRef = doc(collection(db, 'games'));

  await setDoc(gameRef, {
    hostUid: user.uid,
    hostColor,
    guestUid: null,
    guestColor: null,
    roomCode,
    visibility: 'private',
    status: 'waiting',
    gameState: createInitialGameState(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return { gameId: gameRef.id, roomCode, myColor: hostColor };
}

export async function joinRoomByCode(code: string): Promise<{ gameId: string; myColor: PlayerColor }> {
  const user = await ensureSignedIn();
  const q = query(
    collection(db, 'games'),
    where('roomCode', '==', code.trim().toUpperCase()),
    where('status', '==', 'waiting'),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Room not found, or the game already started.');

  const gameDoc = snap.docs[0];
  const hostColor = (gameDoc.data() as OnlineGameDoc).hostColor;
  const guestColor = opponentOf(hostColor);

  await runTransaction(db, async tx => {
    const fresh = await tx.get(gameDoc.ref);
    const data = fresh.data() as OnlineGameDoc | undefined;
    if (!fresh.exists() || data?.status !== 'waiting') {
      throw new Error('Room no longer available.');
    }
    tx.update(gameDoc.ref, {
      guestUid: user.uid,
      guestColor,
      status: 'active',
      updatedAt: serverTimestamp(),
    });
  });

  return { gameId: gameDoc.id, myColor: guestColor };
}

/**
 * Client-only matchmaking (no Cloud Functions): first look for someone else
 * already waiting and atomically claim them via a transaction; if none is
 * found (or we lose the race to claim one), post our own waiting ticket and
 * listen for someone else to claim us. Returns a cancel function.
 */
export function joinMatchmaking(
  onMatched: (gameId: string, myColor: PlayerColor) => void,
  onError: (error: unknown) => void
): () => void {
  let cancelled = false;
  let unsubscribeQueue: Unsubscribe | null = null;
  let myUid: string | null = null;

  (async () => {
    try {
      const user = await ensureSignedIn();
      if (cancelled) return;
      myUid = user.uid;

      const candidatesQuery = query(
        collection(db, 'matchmakingQueue'),
        where('status', '==', 'waiting'),
        orderBy('joinedAt', 'asc'),
        limit(5)
      );
      const candidatesSnap = await getDocs(candidatesQuery);
      const candidate = candidatesSnap.docs.find(d => d.id !== myUid);

      if (candidate && !cancelled) {
        try {
          const result = await runTransaction(db, async tx => {
            const candidateRef = doc(db, 'matchmakingQueue', candidate.id);
            const candidateSnap = await tx.get(candidateRef);
            if (!candidateSnap.exists() || candidateSnap.data()?.status !== 'waiting') {
              throw new Error('CLAIMED');
            }
            const newGameRef = doc(collection(db, 'games'));
            const hostColor: PlayerColor = Math.random() < 0.5 ? 'orange' : 'black';
            const guestColor = opponentOf(hostColor);
            tx.set(newGameRef, {
              hostUid: candidate.id,
              hostColor,
              guestUid: myUid,
              guestColor,
              roomCode: null,
              visibility: 'public',
              status: 'active',
              gameState: createInitialGameState(),
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
            tx.update(candidateRef, { status: 'matched', gameId: newGameRef.id });
            return { gameId: newGameRef.id, myColor: guestColor };
          });
          if (!cancelled) onMatched(result.gameId, result.myColor);
          return;
        } catch {
          // Someone else claimed that candidate first — fall through to waiting.
        }
      }

      if (cancelled) return;
      const myQueueRef = doc(db, 'matchmakingQueue', myUid);
      await setDoc(myQueueRef, { uid: myUid, status: 'waiting', gameId: null, joinedAt: serverTimestamp() });

      unsubscribeQueue = onSnapshot(
        myQueueRef,
        snap => {
          const data = snap.data();
          if (data?.gameId && !cancelled) {
            unsubscribeQueue?.();
            getDoc(doc(db, 'games', data.gameId)).then(gameSnap => {
              const gdata = gameSnap.data() as OnlineGameDoc | undefined;
              if (gdata) onMatched(data.gameId, gdata.hostColor); // we were the waiting ticket => host
              deleteDoc(myQueueRef).catch(() => {});
            });
          }
        },
        onError
      );
    } catch (e) {
      if (!cancelled) onError(e);
    }
  })();

  return () => {
    cancelled = true;
    unsubscribeQueue?.();
    if (myUid) deleteDoc(doc(db, 'matchmakingQueue', myUid)).catch(() => {});
  };
}

export function subscribeToGame(
  gameId: string,
  callback: (game: OnlineGameDoc | null) => void,
  onError?: (error: unknown) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'games', gameId),
    snap => {
      callback(snap.exists() ? (snap.data() as OnlineGameDoc) : null);
    },
    error => {
      console.error('[onlineGame] subscribeToGame error:', error);
      onError?.(error);
    }
  );
}

export async function submitAction(gameId: string, move: Move): Promise<void> {
  const gameRef = doc(db, 'games', gameId);
  await runTransaction(db, async tx => {
    const snap = await tx.get(gameRef);
    if (!snap.exists()) throw new Error('Game not found.');
    const data = snap.data() as OnlineGameDoc;
    const newState = applyMove(data.gameState, move);
    tx.update(gameRef, {
      gameState: newState,
      status: newState.phase === 'gameover' ? 'finished' : 'active',
      updatedAt: serverTimestamp(),
    });
  });
}

export async function leaveGame(gameId: string): Promise<void> {
  await updateDoc(doc(db, 'games', gameId), { status: 'finished', updatedAt: serverTimestamp() }).catch(() => {});
}
