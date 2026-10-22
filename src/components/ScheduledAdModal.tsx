import React, { useEffect, useRef, useState } from 'react';
import { Modal, View, Text, Pressable, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import useGameStore from '../store/gameStore';
import { loadInterstitialAd, showInterstitialAd } from '../services/adManager';
import { shouldSimulateNativeFeatures } from '../services/runtimeEnvironment';

export default function ScheduledAdModal() {
  const visible = useGameStore((state) => state.showScheduledAd);
  const blocked = useGameStore((state) => state.showSummary || state.showEventModal
    || state.showRelationshipEventModal || state.showPeriodReport || state.showMainMenu
    || state.showSlotPicker || state.showNameModal || state.showTutorial || state.showNegativeCashModal);
  const dismiss = useGameStore((state) => state.dismissScheduledAd);
  const adsRemoved = useGameStore((state) => state.profile?.adsRemoved ?? false);
  const [ready, setReady] = useState(false);
  const nativeRequestInFlight = useRef(false);
  const simulated = shouldSimulateNativeFeatures();

  useEffect(() => {
    if (adsRemoved && visible) { dismiss(); return; }
    if (!visible || blocked) { setReady(false); return; }
    if (simulated) {
      const timer = setTimeout(() => setReady(true), 2500);
      return () => clearTimeout(timer);
    }
    // A failed interstitial should never require an extra full-screen tap or
    // hide pending relationship/business decisions from the player.
    // Keep one native session alive across transient changes to other modals.
    if (nativeRequestInFlight.current) return;
    nativeRequestInFlight.current = true;
    let cancelledWhileLoading = false;
    let nativeShowStarted = false;
    const finish = () => {
      if (!nativeRequestInFlight.current) return;
      nativeRequestInFlight.current = false;
      dismiss();
    };
    void (async () => {
      try {
        const loaded = await loadInterstitialAd();
        if (cancelledWhileLoading) {
          nativeRequestInFlight.current = false;
          return;
        }
        if (!loaded) { finish(); return; }
        nativeShowStarted = true;
        const shown = await showInterstitialAd(finish, finish);
        if (!shown) finish();
      } catch {
        finish();
      }
    })();
    return () => {
      cancelledWhileLoading = true;
      if (!nativeShowStarted) nativeRequestInFlight.current = false;
    };
  }, [visible, blocked, simulated, dismiss, adsRemoved]);

  if (!visible || blocked || adsRemoved || !simulated || !ready) return null;
  return (
    <Modal visible transparent={false} animationType="fade">
      <View style={styles.screen}>
        <Text style={styles.sponsor}>SPONSORED</Text>
        <Text style={styles.title}>Advertisement</Text>
        <Text style={styles.copy}>This simulated ad is shown only in Expo Go and on web.</Text>
        <Pressable disabled={!ready} onPress={dismiss} style={[styles.button, !ready && styles.disabled]}>
          <Text style={styles.buttonText}>{ready ? 'Continue' : 'Ad playing...'}</Text>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 28 },
  sponsor: { color: Colors.textMuted, fontSize: 11, letterSpacing: 2 },
  title: { color: Colors.textPrimary, fontSize: 30, fontWeight: '800', marginTop: 12 },
  copy: { color: Colors.textSecondary, textAlign: 'center', lineHeight: 21, marginTop: 14, maxWidth: 380 },
  button: { marginTop: 32, backgroundColor: Colors.primary, borderRadius: 10, paddingHorizontal: 28, paddingVertical: 12 },
  disabled: { opacity: 0.45 },
  buttonText: { color: Colors.white, fontWeight: '700' },
});
