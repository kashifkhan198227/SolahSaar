import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';

interface RulesScreenProps {
  onBack: () => void;
}

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: 'Board Setup',
    body: [
      'Red and Blue soldiers are placed at their starting positions on the board.',
      'Soldiers occupy designated nodes; the board lines are the movement paths.',
      'Both players have an equal number of soldiers (16 each).',
    ],
  },
  {
    title: 'Movement',
    body: [
      'A randomly chosen player takes the first turn, then players alternate.',
      'Each turn, a player either moves one soldier or captures an opponent soldier.',
      'A soldier moves to an adjacent empty node along any line on the board, including the diagonal lines inside each grid quadrant.',
    ],
  },
  {
    title: 'Taking Out Opponents',
    body: [
      "Your soldier must be adjacent to an opponent's soldier.",
      'There must be a vacant node immediately beyond it, in a straight line (diagonals included).',
      'Your soldier leaps over the opponent and lands on that vacant node.',
      'The captured soldier is removed from the board.',
      'If that same soldier can capture again from its new position, you must keep capturing with it until no further capture is available.',
    ],
  },
  {
    title: 'No Stalling',
    body: [
      'A soldier cannot shuttle back and forth between the same two nodes indefinitely.',
      'If one soldier repeats the same back-and-forth move three times in a row, it is removed from the board as a penalty.',
    ],
  },
  {
    title: 'Winning',
    body: [
      "The game continues until one player captures all of the opponent's soldiers.",
      'That player wins.',
    ],
  },
  {
    title: 'Strategy Tips',
    body: [
      'Control the center to maximize movement options.',
      "Block the opponent's advances and force bad captures.",
      'Favor sideways moves early to stay safe and set up future captures.',
      'Avoid over-eager captures early — focus on movement and defense first.',
      'Target isolated or poorly defended soldiers.',
    ],
  },
];

export default function RulesScreen({ onBack }: RulesScreenProps) {
  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.title}>Rules</Text>
        {SECTIONS.map(section => (
          <View key={section.title} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            {section.body.map((line, i) => (
              <Text key={i} style={styles.line}>• {line}</Text>
            ))}
          </View>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: SPACING.lg, paddingBottom: SPACING.xxl },
  title: { color: COLORS.primary, fontSize: 26, fontWeight: 'bold', marginBottom: SPACING.lg },
  section: { marginBottom: SPACING.lg },
  sectionTitle: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '600', marginBottom: SPACING.xs },
  line: { color: COLORS.textSecondary, fontSize: 14, marginBottom: SPACING.xs, lineHeight: 20 },
  backButton: {
    alignSelf: 'center',
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  backText: { color: COLORS.primary, fontSize: 15, fontWeight: '600' },
});
