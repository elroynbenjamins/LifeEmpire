import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import type { EmpireTutorialStep, EmpireContextTip } from '../engine/empireCardsTutorial';

const TIP_TEXT: Record<EmpireContextTip, { title: string; body: string }> = {
  shop: {
    title: 'Quarter cleared! This is your shop',
    body: 'Spend Run Capital on Advisors, combo training, or deck improvements. You can save it for later too.',
  },
  boss: {
    title: 'A boss condition is active',
    body: 'This quarter has a special rule. Check the warning before choosing a hand.',
  },
};

/** A pinned, non-modal coach that leaves cards and buttons usable. */
export function EmpireCardsCoach({
  step, index, total, onBack, onNext, onSkip, onDisable,
}: {
  step: EmpireTutorialStep;
  index: number;
  total: number;
  onBack: () => void;
  onNext: () => void;
  onSkip: () => void;
  onDisable: () => void;
}) {
  return <View style={styles.card} accessibilityLabel={'Empire Cards tutorial step ' + (index + 1) + ' of ' + total}>
    <View style={styles.heading}>
      <Ionicons name="school-outline" color={Colors.business} size={18} />
      <Text style={styles.eyebrow}>QUICK GUIDE · {index + 1}/{total}</Text>
      <View style={styles.flex} />
      <Pressable accessibilityRole="button" accessibilityLabel="Skip tutorial"
        onPress={onSkip} hitSlop={8} style={styles.minorButton}>
        <Text style={styles.minorText}>Skip</Text>
      </Pressable>
    </View>
    <Text style={styles.title}>{step.title}</Text>
    <Text style={styles.copy}>{step.text}</Text>
    <Text style={styles.focus}>Look at: {step.focus}</Text>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" accessibilityLabel="Do not show tutorial again"
        onPress={onDisable} style={styles.minorButton}>
        <Text style={styles.minorText}>Don't show again</Text>
      </Pressable>
      <View style={styles.flex} />
      {index > 0 && <Pressable accessibilityRole="button" onPress={onBack} style={styles.navButton}>
        <Text style={styles.navText}>Back</Text>
      </Pressable>}
      <Pressable accessibilityRole="button" onPress={onNext} style={[styles.navButton, styles.nextButton]}>
        <Text style={styles.nextText}>{index === total - 1 ? 'Finish' : 'Next'}</Text>
        <Ionicons name={index === total - 1 ? 'checkmark' : 'chevron-forward'} size={14} color={Colors.white} />
      </Pressable>
    </View>
  </View>;
}

/** Appears only once at the first shop and boss unless tutorial prompts are disabled. */
export function EmpireCardsContextCoach({
  tip, onDismiss, onDisable,
}: {
  tip: EmpireContextTip;
  onDismiss: () => void;
  onDisable: () => void;
}) {
  const content = TIP_TEXT[tip];
  return <View style={styles.card}>
    <View style={styles.heading}>
      <Ionicons name={tip === 'shop' ? 'storefront-outline' : 'warning-outline'} color={Colors.business} size={18} />
      <Text style={styles.eyebrow}>QUICK GUIDE · {tip === 'shop' ? 'SHOP' : 'BOSS'}</Text>
    </View>
    <Text style={styles.title}>{content.title}</Text>
    <Text style={styles.copy}>{content.body}</Text>
    <View style={styles.actions}>
      <Pressable accessibilityRole="button" onPress={onDisable} style={styles.minorButton}>
        <Text style={styles.minorText}>Don't show again</Text>
      </Pressable>
      <View style={styles.flex} />
      <Pressable accessibilityRole="button" onPress={onDismiss} style={[styles.navButton, styles.nextButton]}>
        <Text style={styles.nextText}>Got it</Text>
        <Ionicons name="checkmark" color={Colors.white} size={14} />
      </Pressable>
    </View>
  </View>;
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 12, marginVertical: 6, borderWidth: 1, borderColor: Colors.business,
    backgroundColor: Colors.card, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9,
  },
  heading: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  eyebrow: { color: Colors.business, fontWeight: '800', fontSize: 10, letterSpacing: 0.6 },
  title: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 4 },
  copy: { color: Colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 3 },
  focus: { color: Colors.textMuted, fontSize: 10, marginTop: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 7 },
  flex: { flex: 1 },
  minorButton: { paddingVertical: 8, paddingHorizontal: 3, minHeight: 34, justifyContent: 'center' },
  minorText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '600' },
  navButton: { minHeight: 34, paddingHorizontal: 9, borderRadius: 8, justifyContent: 'center', alignItems: 'center', flexDirection: 'row', gap: 4 },
  navText: { color: Colors.textSecondary, fontSize: 12, fontWeight: '700' },
  nextButton: { backgroundColor: Colors.primary },
  nextText: { color: Colors.white, fontSize: 12, fontWeight: '800' },
});
