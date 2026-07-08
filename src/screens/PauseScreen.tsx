import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, BORDER_RADIUS } from '../utils/theme';

interface PauseScreenProps {
  visible: boolean;
  onResume: () => void;
  onRules: () => void;
  onQuit: () => void;
}

export default function PauseScreen({ visible, onResume, onRules, onQuit }: PauseScreenProps) {
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onResume}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Paused</Text>
          <TouchableOpacity style={styles.button} onPress={onResume}>
            <Text style={styles.buttonText}>Resume</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={onRules}>
            <Text style={styles.buttonText}>Rules</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.quitButton]} onPress={onQuit}>
            <Text style={styles.quitText}>Quit to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', alignItems: 'center', justifyContent: 'center' },
  card: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.xl, width: 280, borderWidth: 1, borderColor: COLORS.primary },
  title: { color: COLORS.primary, fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: SPACING.lg },
  button: { paddingVertical: SPACING.sm, alignItems: 'center', marginBottom: SPACING.sm },
  buttonText: { color: COLORS.textPrimary, fontSize: 16 },
  quitButton: { marginTop: SPACING.sm },
  quitText: { color: COLORS.error, fontSize: 16 },
});
