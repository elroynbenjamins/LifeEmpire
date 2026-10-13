import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import type { EmpireCard } from '../engine/empireCardsEngine';
import {
  EMPIRE_VALUE_TIER_NAMES, getEmpireCardIcon, getEmpireCardTier,
  getEmpireDepartmentTheme, type EmpirePattern,
} from '../theme/empireCardsVisuals';

/** Very light geometric pattern behind the icon; no images, SVGs or runtime texture assets. */
function DepartmentPattern({ pattern, color }: { pattern: EmpirePattern; color: string }) {
  if (pattern === 'rays') return <View pointerEvents="none" style={styles.pattern}>
    {[-25, 0, 25].map((angle, i) => <View key={i} style={[styles.ray, { backgroundColor: color, transform: [{ rotate: angle + 'deg' }], left: 8 + i * 15 }]} />)}
  </View>;
  if (pattern === 'grid') return <View pointerEvents="none" style={[styles.pattern, styles.gridPattern]}>
    {Array.from({ length: 9 }, (_, i) => <View key={i} style={[styles.gridBox, { borderColor: color }]} />)}
  </View>;
  if (pattern === 'ledger') return <View pointerEvents="none" style={[styles.pattern, styles.ledgerPattern]}>
    {[16, 27, 21].map((width, i) => <View key={i} style={[styles.ledgerLine, { width, backgroundColor: color }]} />)}
  </View>;
  return <View pointerEvents="none" style={styles.pattern}>
    <View style={[styles.nodeLine, { backgroundColor: color }]} />
    {[[7, 7], [34, 5], [20, 22]].map(([left, top], i) =>
      <View key={i} style={[styles.node, { left, top, borderColor: color }]} />)}
  </View>;
}

type Props = {
  card: EmpireCard;
  selected: boolean;
  reduceMotion: boolean;
  onPress: () => void;
  suggested?: boolean;
  discardSuggested?: boolean;
  bossAffected?: boolean;
  columns?: 3 | 4;
};

/**
 * Four familiar layouts, 32 distinct icons. Designed for 3/4-column phone hands.
 * Only opacity and transform animate. Card size and scoring never change.
 */
export default function EmpireCardTile({
  card, selected, reduceMotion, onPress,
  suggested = false, discardSuggested = false, bossAffected = false, columns = 4,
}: Props) {
  const theme = getEmpireDepartmentTheme(card.department);
  const tier = getEmpireCardTier(card.points);
  const lift = useRef(new Animated.Value(selected && !reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    lift.stopAnimation();
    if (reduceMotion) {
      lift.setValue(0);
      return;
    }
    Animated.timing(lift, {
      toValue: selected ? 1 : 0,
      duration: selected ? 145 : 120,
      useNativeDriver: true,
    }).start();
    return () => lift.stopAnimation();
  }, [selected, reduceMotion, lift]);

  const context = [
    theme.title, card.points + ' points', EMPIRE_VALUE_TIER_NAMES[tier].toLowerCase() + ' value',
    selected ? 'selected' : 'not selected',
    suggested ? 'recommended scoring card' : null,
    discardSuggested ? 'suggested for replacement' : null,
    bossAffected ? 'reduced by current boss effect' : null,
  ].filter(Boolean).join(', ');

  return (
    <Animated.View
      style={[
        styles.tile, { width: columns === 3 ? '31.8%' : '23.6%' },
        { transform: [
          { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
          { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) },
        ] },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={card.name + ', ' + context}
        accessibilityState={{ selected }}
        testID={'empire-card-' + card.id}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          { borderColor: selected ? theme.color : tier === 'flagship' ? theme.color + 'AA' : Colors.cardBorder },
          tier === 'flagship' && styles.flagshipFrame,
          selected && styles.selectedFrame,
          discardSuggested && styles.discardFrame,
          pressed && styles.pressed,
        ]}
      >
        <View style={[styles.headerStrip, { backgroundColor: theme.color }]} />
        <View style={styles.headline}>
          <Text style={styles.deptHeading} numberOfLines={1}>{theme.shortName}</Text>
          <View style={[styles.pointsBadge, { backgroundColor: theme.surface, borderColor: theme.color + '80' }]}>
            <Text style={[styles.pointsText, { color: theme.color }]}>{card.points}</Text>
          </View>
        </View>
        <View style={[styles.artArea, { backgroundColor: theme.surface }]}>
          <DepartmentPattern pattern={theme.pattern} color={theme.color} />
          <Ionicons name={getEmpireCardIcon(card)} color={theme.color} size={tier === 'flagship' ? 27 : 25} />
          {bossAffected && <View style={styles.bossIcon}>
            <Ionicons name="warning" color={Colors.warning} size={12} />
          </View>}
        </View>
        <Text style={styles.cardTitle} numberOfLines={2} adjustsFontSizeToFit minimumFontScale={0.82}>{card.name}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.departmentFoot} numberOfLines={1}>{theme.title}</Text>
          {selected ? <Ionicons name={discardSuggested ? 'refresh-circle' : suggested ? 'star' : 'checkmark-circle'}
            color={discardSuggested ? Colors.warning : theme.color} size={15} />
            : <Text style={[styles.tierLabel, { color: tier === 'flagship' ? theme.color : Colors.textMuted }]}>{EMPIRE_VALUE_TIER_NAMES[tier]}</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  tile: { minWidth: 0, marginBottom: 4 },
  card: {
    backgroundColor: Colors.card, borderRadius: 10, borderWidth: 1,
    minHeight: 133, overflow: 'hidden', paddingHorizontal: 4,
    paddingBottom: 5,
  },
  selectedFrame: {
    borderWidth: 2,
    shadowColor: Colors.white,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12, shadowRadius: 3, elevation: 2,
  },
  flagshipFrame: { borderWidth: 1.5 },
  discardFrame: { borderStyle: 'dashed' },
  pressed: { opacity: 0.8 },
  headerStrip: { height: 4, marginHorizontal: -4, marginBottom: 3 },
  headline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 2, minHeight: 21 },
  deptHeading: { color: Colors.textSecondary, fontSize: 8, fontWeight: '800', letterSpacing: 0.1, flexShrink: 1 },
  pointsBadge: {
    borderWidth: 1, borderRadius: 5, paddingHorizontal: 4, minWidth: 23,
    minHeight: 19, alignItems: 'center', justifyContent: 'center',
  },
  pointsText: { fontSize: 12, fontWeight: '900' },
  artArea: {
    height: 44, marginTop: 3, borderRadius: 6,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  pattern: {
    position: 'absolute', width: 55, height: 36, opacity: 0.22,
    alignSelf: 'center', overflow: 'hidden',
  },
  ray: { position: 'absolute', top: -8, height: 54, width: 2 },
  gridPattern: { flexDirection: 'row', flexWrap: 'wrap', width: 33, height: 33, gap: 1 },
  gridBox: { width: 10, height: 10, borderWidth: 1 },
  ledgerPattern: { justifyContent: 'center', alignItems: 'center', gap: 5 },
  ledgerLine: { height: 3, borderRadius: 2 },
  nodeLine: { position: 'absolute', height: 2, width: 35, left: 10, top: 17, transform: [{ rotate: '-22deg' }] },
  node: { position: 'absolute', width: 9, height: 9, borderWidth: 2, borderRadius: 5 },
  bossIcon: {
    position: 'absolute', top: 2, right: 2,
    borderRadius: 5, padding: 1, backgroundColor: Colors.card,
  },
  cardTitle: {
    color: Colors.textPrimary, fontWeight: '800', fontSize: 10.5,
    lineHeight: 13, textAlign: 'center', height: 31,
    textAlignVertical: 'center', marginTop: 3,
  },
  bottomRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    gap: 2, marginTop: 2, minHeight: 17,
  },
  departmentFoot: { color: Colors.textSecondary, fontSize: 8, fontWeight: '600', flexShrink: 1 },
  tierLabel: { color: Colors.textMuted, fontSize: 7.2, fontWeight: '800', letterSpacing: 0.1 },
});
