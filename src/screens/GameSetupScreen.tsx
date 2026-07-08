import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';
import { PlayerColor } from '../engine/GameEngine';

interface GameSetupScreenProps {
  onStart: (startingPlayer?: PlayerColor) => void;
  onBack: () => void;
}

type StartChoice = 'random' | PlayerColor;

export default function GameSetupScreen({ onStart, onBack }: GameSetupScreenProps) {
  const [choice, setChoice] = useState<StartChoice>('random');

  const handleStart = () => {
    onStart(choice === 'random' ? undefined : choice);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>New Game</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
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
