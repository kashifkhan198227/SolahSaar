import React, { useState, useEffect } from 'react';
import { StatusBar, View, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useGameStore, AIConfig } from './src/store/gameStore';
import { useOnlineStore } from './src/store/onlineStore';
import { COLORS } from './src/utils/theme';
import { PlayerColor } from './src/engine/GameEngine';

import HomeScreen from './src/screens/HomeScreen';
import GameSetupScreen from './src/screens/GameSetupScreen';
import BoardScreen from './src/screens/BoardScreen';
import OnlineLobbyScreen from './src/screens/OnlineLobbyScreen';
import OnlineBoardScreen from './src/screens/OnlineBoardScreen';
import PauseScreen from './src/screens/PauseScreen';
import RulesScreen from './src/screens/RulesScreen';
import VictoryScreen from './src/screens/VictoryScreen';

type Screen = 'home' | 'setup' | 'board' | 'onlineLobby' | 'onlineBoard' | 'rules' | 'victory';

export default function App() {
  const [screen, setScreen] = useState<Screen>('home');
  const [pauseVisible, setPauseVisible] = useState(false);
  const [victoryWinner, setVictoryWinner] = useState<PlayerColor | null>(null);
  const [victoryReached, setVictoryReached] = useState(false);
  const [victoryWasOnline, setVictoryWasOnline] = useState(false);
  const [rulesReturnScreen, setRulesReturnScreen] = useState<Screen>('home');
  const [lastAiConfig, setLastAiConfig] = useState<AIConfig | null>(null);

  const { hasSavedGame, startGame, loadGame, resetGame, checkSavedGame } = useGameStore();
  const { leaveAndReset: leaveOnlineGame } = useOnlineStore();

  useEffect(() => {
    checkSavedGame();
  }, []);

  const handleResumeGame = async () => {
    const ok = await loadGame();
    if (ok) setScreen('board');
  };

  const handleStartGame = (startingPlayer: PlayerColor | undefined, aiConfig: AIConfig | null) => {
    setLastAiConfig(aiConfig);
    startGame(startingPlayer, aiConfig);
    setScreen('board');
  };

  const handleVictory = (winner: PlayerColor | null) => {
    setVictoryWinner(winner);
    setVictoryWasOnline(false);
    setVictoryReached(true);
    setScreen('victory');
  };

  const handleOnlineVictory = (winner: PlayerColor | null) => {
    setVictoryWinner(winner);
    setVictoryWasOnline(true);
    setVictoryReached(true);
    setScreen('victory');
  };

  const handlePlayAgain = () => {
    setVictoryReached(false);
    if (victoryWasOnline) {
      leaveOnlineGame();
      setScreen('onlineLobby');
    } else {
      startGame(undefined, lastAiConfig);
      setScreen('board');
    }
  };

  const goHome = () => {
    resetGame();
    leaveOnlineGame();
    setVictoryReached(false);
    setScreen('home');
  };

  const openRules = (from: Screen) => {
    setRulesReturnScreen(from);
    setScreen('rules');
  };

  const renderScreen = () => {
    switch (screen) {
      case 'home':
        return (
          <HomeScreen
            hasSavedGame={hasSavedGame}
            onNewGame={() => setScreen('setup')}
            onResumeGame={handleResumeGame}
            onPlayOnline={() => setScreen('onlineLobby')}
            onRules={() => openRules('home')}
          />
        );

      case 'setup':
        return <GameSetupScreen onStart={handleStartGame} onBack={() => setScreen('home')} />;

      case 'board':
        return (
          <>
            <BoardScreen onPause={() => setPauseVisible(true)} onVictory={handleVictory} />
            <PauseScreen
              visible={pauseVisible}
              onResume={() => setPauseVisible(false)}
              onRules={() => { setPauseVisible(false); openRules('board'); }}
              onQuit={() => { setPauseVisible(false); goHome(); }}
            />
          </>
        );

      case 'onlineLobby':
        return <OnlineLobbyScreen onConnected={() => setScreen('onlineBoard')} onBack={() => setScreen('home')} />;

      case 'onlineBoard':
        return <OnlineBoardScreen onLeave={() => setScreen('home')} onVictory={handleOnlineVictory} />;

      case 'rules':
        return <RulesScreen onBack={() => setScreen(rulesReturnScreen)} />;

      case 'victory':
        if (!victoryReached) return null;
        return <VictoryScreen winner={victoryWinner} onPlayAgain={handlePlayAgain} onHome={goHome} />;

      default:
        return null;
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.background} />
      <View style={styles.root}>{renderScreen()}</View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
});
