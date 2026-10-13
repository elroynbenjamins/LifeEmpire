import React from 'react';
import { Linking, Modal, Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import useGameStore from '../store/gameStore';
import { Colors } from '../theme/colors';

export default function MainMenu() {
  const router = useRouter();
  const visible = useGameStore((state) => state.showMainMenu);
  const activeSlot = useGameStore((state) => state.activeSlot ?? 0);
  const slotMeta = useGameStore((state) => state.slotMeta ?? {});
  const continueGame = useGameStore((state) => state.continueGame);
  const openSlotPicker = useGameStore((state) => state.openSlotPicker);
  const beginNewGame = useGameStore((state) => state.beginNewGame);
  const activeSave = slotMeta[activeSlot];
  const hasSaves = Object.values(slotMeta).some(Boolean);
  const openStandaloneCards = () => {
    // Empire Cards owns its own storage; starting it never creates a Life Empire save.
    useGameStore.setState({ showMainMenu: false });
    router.push('/empire-cards?mode=standalone&from=main-menu');
  };

  return (
    <Modal visible={visible} animationType="fade">
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Text style={styles.title}>Life & Business</Text>
          <Text style={styles.subtitle}>Simulator</Text>

          {activeSave && (
            <View style={styles.saveSummary}>
              <Text style={styles.saveLabel}>CONTINUE SLOT {activeSlot + 1}</Text>
              <Text style={styles.playerName}>{activeSave.playerName}</Text>
              <Text style={styles.saveDetails}>Year {activeSave.year} · Week {activeSave.week} · Age {activeSave.age}</Text>
            </View>
          )}

          <View style={styles.actions}>
            <Pressable disabled={!activeSave} style={[styles.primaryButton, !activeSave && styles.disabledButton]} onPress={continueGame}>
              <Ionicons name="play" size={21} color={Colors.white} />
              <Text style={styles.primaryText}>Continue</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={openStandaloneCards}
              accessibilityRole="button" accessibilityLabel="Play Empire Cards standalone without a save">
              <Ionicons name="layers-outline" size={21} color={Colors.business} />
              <View style={styles.buttonCopy}>
                <Text style={styles.secondaryText}>Empire Cards</Text>
                <Text style={styles.miniNote}>Play standalone · No save required</Text>
              </View>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={openSlotPicker}>
              <Ionicons name="folder-open-outline" size={21} color={Colors.primary} />
              <Text style={styles.secondaryText}>{hasSaves ? 'Load / Manage Saves' : 'View Save Slots'}</Text>
            </Pressable>
            <Pressable style={styles.discordButton} onPress={() => Linking.openURL('https://discord.gg/Qud94umGuq')}>
              <Ionicons name="logo-discord" size={21} color={Colors.white} />
              <Text style={styles.primaryText}>Join Discord</Text>
            </Pressable>
            <Pressable style={styles.secondaryButton} onPress={beginNewGame}>
              <Ionicons name="add-circle-outline" size={21} color={Colors.primary} />
              <Text style={styles.secondaryText}>New Game</Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28 },
  title: { color: Colors.textPrimary, fontSize: 32, lineHeight: 38, fontWeight: '800', textAlign: 'center' },
  subtitle: { color: Colors.primary, fontSize: 20, fontWeight: '700', letterSpacing: 3, textTransform: 'uppercase', marginBottom: 34 },
  saveSummary: { width: '100%', maxWidth: 420, backgroundColor: Colors.card, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 16, padding: 16, marginBottom: 16 },
  saveLabel: { color: Colors.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  playerName: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700', marginTop: 5 },
  saveDetails: { color: Colors.textSecondary, fontSize: 13, marginTop: 3 },
  actions: { width: '100%', maxWidth: 420, gap: 12 },
  primaryButton: { minHeight: 56, borderRadius: 14, backgroundColor: Colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  disabledButton: { opacity: 0.35 },
  primaryText: { color: Colors.white, fontSize: 17, fontWeight: '800' },
  secondaryButton: { minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: Colors.primary, backgroundColor: Colors.card, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  secondaryText: { color: Colors.textPrimary, fontSize: 16, fontWeight: '700' },
  buttonCopy: { alignItems: 'center' },
  miniNote: { color: Colors.textMuted, fontSize: 11, marginTop: 1 },
  discordButton: { minHeight: 54, borderRadius: 14, backgroundColor: '#5865F2', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
});
