import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { COLORS, PLAYER_LABEL, SPACING, BORDER_RADIUS } from '../utils/theme';
import { useOnlineStore } from '../store/onlineStore';
import { FIREBASE_CONFIGURED } from '../services/firebaseConfig';

interface OnlineLobbyScreenProps {
  onConnected: () => void;
  onBack: () => void;
}

type Tab = 'menu' | 'join';

export default function OnlineLobbyScreen({ onConnected, onBack }: OnlineLobbyScreenProps) {
  const { status, roomCode, myColor, errorMessage, createRoom, joinByCode, findMatch, cancelSearch, leaveAndReset } = useOnlineStore();
  const [tab, setTab] = useState<Tab>('menu');
  const [codeInput, setCodeInput] = useState('');

  useEffect(() => {
    if (status === 'connected') onConnected();
  }, [status]);

  useEffect(() => () => { if (status !== 'connected') leaveAndReset(); }, []);

  if (!FIREBASE_CONFIGURED) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Play Online</Text>
        <Text style={styles.notConfigured}>
          Online play isn't set up yet — this build needs a Firebase project config
          (see src/services/firebaseConfig.ts) before it can connect.
        </Text>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'waiting-for-opponent') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Waiting for opponent…</Text>
        <Text style={styles.label}>Share this code:</Text>
        <Text style={styles.roomCode}>{roomCode}</Text>
        <Text style={styles.hint}>You'll play as {myColor ? PLAYER_LABEL[myColor] : '…'}</Text>
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
        <TouchableOpacity onPress={() => { leaveAndReset(); }} style={styles.backButton}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'searching') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Finding an opponent…</Text>
        <ActivityIndicator color={COLORS.primary} style={{ marginVertical: SPACING.lg }} />
        <TouchableOpacity onPress={cancelSearch} style={styles.backButton}>
          <Text style={styles.backText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (status === 'creating' || status === 'joining') {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Play Online</Text>

      {errorMessage && <Text style={styles.error}>{errorMessage}</Text>}

      {tab === 'menu' ? (
        <>
          <TouchableOpacity style={styles.button} onPress={createRoom}>
            <Text style={styles.buttonText}>Create Room</Text>
            <Text style={styles.buttonSubtext}>Get a code to share with a friend</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={() => setTab('join')}>
            <Text style={styles.buttonText}>Join Room</Text>
            <Text style={styles.buttonSubtext}>Enter a friend's room code</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.button} onPress={findMatch}>
            <Text style={styles.buttonText}>Find Match</Text>
            <Text style={styles.buttonSubtext}>Play a random opponent</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>Enter room code</Text>
          <TextInput
            style={styles.input}
            value={codeInput}
            onChangeText={t => setCodeInput(t.toUpperCase())}
            autoCapitalize="characters"
            maxLength={6}
            placeholder="ABC123"
            placeholderTextColor={COLORS.textMuted}
          />
          <TouchableOpacity
            style={[styles.button, codeInput.length < 4 && styles.buttonDisabled]}
            disabled={codeInput.length < 4}
            onPress={() => joinByCode(codeInput)}
          >
            <Text style={styles.buttonText}>Join</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setTab('menu')} style={styles.backButton}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        </>
      )}

      {tab === 'menu' && (
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>Back</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', padding: SPACING.lg },
  title: { color: COLORS.primary, fontSize: 26, fontWeight: 'bold', marginBottom: SPACING.xl },
  label: { color: COLORS.textSecondary, fontSize: 16, marginBottom: SPACING.md },
  hint: { color: COLORS.textMuted, fontSize: 13, marginBottom: SPACING.sm },
  notConfigured: { color: COLORS.textSecondary, fontSize: 14, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 20 },
  roomCode: { color: COLORS.textPrimary, fontSize: 40, fontWeight: 'bold', letterSpacing: 6, marginBottom: SPACING.md },
  error: { color: COLORS.error, fontSize: 13, marginBottom: SPACING.md, textAlign: 'center' },
  button: {
    width: 260,
    backgroundColor: COLORS.surfaceElevated,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '600' },
  buttonSubtext: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  input: {
    width: 260,
    borderWidth: 1,
    borderColor: COLORS.textMuted,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    color: COLORS.textPrimary,
    fontSize: 20,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: SPACING.lg,
  },
  backButton: { padding: SPACING.sm, marginTop: SPACING.sm },
  backText: { color: COLORS.textSecondary, fontSize: 15 },
});
