import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';
import { PlayerColor } from '../engine/GameEngine';
import { AILevel } from '../engine/AIPlayer';
import { AIConfig } from '../store/gameStore';

interface GameSetupScreenProps {
  onStart: (startingPlayer: PlayerColor | undefined, aiConfig: AIConfig | null) => void;
  onBack: () => void;
}

type StartChoice = 'random' | PlayerColor;
type Mode = '2players' | 'vsAI';

const AI_LEVELS: AILevel[] = ['easy', 'medium', 'hard'];

export default function GameSetupScreen({ onStart, onBack }: GameSetupScreenProps) {
  const [choice, setChoice] = useState<StartChoice>('random');
  const [mode, setMode] = useState<Mode>('2players');
  const [humanColor, setHumanColor] = useState<PlayerColor>('orange');
  const [aiLevel, setAiLevel] = useState<AILevel>('medium');

  const handleStart = () => {
    const startingPlayer = choice === 'random' ? undefined : choice;
    const aiConfig: AIConfig | null = mode === 'vsAI'
      ? { color: humanColor === 'orange' ? 'black' : 'orange', level: aiLevel }
      : null;
    onStart(startingPlayer, aiConfig);
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>New Game</Text>

        <Text style={styles.label}>Mode</Text>
        <View style={styles.choices}>
          {(['2players', 'vsAI'] as Mode[]).map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.choice, mode === opt && styles.choiceActive]}
              onPress={() => setMode(opt)}
            >
              <Text style={styles.choiceText}>{opt === '2players' ? '2 Players' : 'vs AI'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {mode === 'vsAI' && (
          <>
            <Text style={styles.label}>You play as</Text>
            <View style={styles.choices}>
              {(['orange', 'black'] as PlayerColor[]).map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.choice, humanColor === opt && styles.choiceActive]}
                  onPress={() => setHumanColor(opt)}
                >
                  <Text style={styles.choiceText}>{opt === 'orange' ? 'Orange' : 'Black'}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.choices}>
              {AI_LEVELS.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.choice, aiLevel === opt && styles.choiceActive]}
                  onPress={() => setAiLevel(opt)}
                >
                  <Text style={styles.choiceText}>{opt[0].toUpperCase() + opt.slice(1)}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        <Text style={styles.label}>Who starts?</Text>
        <View style={styles.choices}>
          {(['random', 'orange', 'black'] as StartChoice[]).map(opt => (
            <TouchableOpacity
              key={opt}
              style={[styles.choice, choice === opt && styles.choiceActive]}
              onPress={() => setChoice(opt)}
            >
              <Text style={styles.choiceText}>{opt === 'random' ? 'Random' : opt === 'orange' ? 'Orange' : 'Black'}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.startButton} onPress={handleStart}>
          <Text style={styles.startButtonText}>Start</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  title: { color: COLORS.primary, fontSize: 26, fontWeight: 'bold', marginBottom: SPACING.xl },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: SPACING.md },
  choices: { flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.xl },
  choice: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    marginHorizontal: SPACING.xs,
  },
  choiceActive: { borderColor: COLORS.primary, backgroundColor: COLORS.surfaceElevated },
  choiceText: { color: COLORS.textPrimary, fontSize: 15 },
  startButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xxl,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  startButtonText: { color: COLORS.background, fontSize: 18, fontWeight: 'bold' },
  backButton: { padding: SPACING.sm },
  backText: { color: COLORS.textSecondary, fontSize: 15 },
});
