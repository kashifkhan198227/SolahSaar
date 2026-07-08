import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  SAVED_GAME: '@solahsaar_saved_game',
  STATS: '@solahsaar_stats',
};

export interface GameStats {
  totalGames: number;
  orangeWins: number;
  blackWins: number;
  lastPlayed: string | null;
}

export const DEFAULT_STATS: GameStats = {
  totalGames: 0,
  orangeWins: 0,
  blackWins: 0,
  lastPlayed: null,
};

export async function saveGame(gameState: unknown): Promise<void> {
  await AsyncStorage.setItem(KEYS.SAVED_GAME, JSON.stringify(gameState));
}

export async function loadSavedGame(): Promise<unknown | null> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SAVED_GAME);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
}

export async function clearSavedGame(): Promise<void> {
  await AsyncStorage.removeItem(KEYS.SAVED_GAME);
}

export async function loadStats(): Promise<GameStats> {
  try {
    const data = await AsyncStorage.getItem(KEYS.STATS);
    if (!data) return DEFAULT_STATS;
    return { ...DEFAULT_STATS, ...JSON.parse(data) };
  } catch {
    return DEFAULT_STATS;
  }
}

export async function saveStats(stats: GameStats): Promise<void> {
  await AsyncStorage.setItem(KEYS.STATS, JSON.stringify(stats));
}
