import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';

interface HomeScreenProps {
  hasSavedGame: boolean;
  onNewGame: () => void;
  onResumeGame: () => void;
  onPlayOnline: () => void;
  onRules: () => void;
}

export default function HomeScreen({ hasSavedGame, onNewGame, onResumeGame, onPlayOnline, onRules }: HomeScreenProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>SOLAH SAAR</Text>
        <Text style={styles.subtitle}>Sholo Gutti · Sixteen Soldiers</Text>
      </View>

      <View style={styles.menu}>
        {hasSavedGame && (
          <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onResumeGame}>
            <Text style={styles.buttonText}>Resume Game</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onNewGame}>
          <Text style={styles.buttonText}>New Game</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.primaryButton]} onPress={onPlayOnline}>
          <Text style={styles.buttonText}>Play Online</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={onRules}>
          <Text style={styles.buttonTextSecondary}>Rules</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  header: { alignItems: 'center', marginBottom: SPACING.xxl },
  title: { color: COLORS.primary, fontSize: 34, fontWeight: 'bold', letterSpacing: 4 },
  subtitle: { color: COLORS.textSecondary, fontSize: 14, marginTop: SPACING.sm, letterSpacing: 1 },
  menu: { width: '100%', maxWidth: 320, gap: SPACING.md },
  button: {
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    marginBottom: SPACING.md,
  },
  primaryButton: { backgroundColor: COLORS.surfaceElevated },
  buttonText: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '600' },
  buttonTextSecondary: { color: COLORS.textSecondary, fontSize: 16 },
});
