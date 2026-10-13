import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { EmpireCard } from '../engine/empireCardsEngine';

const DEPARTMENT_ICONS: Record<EmpireCard['department'], string> = {
  sales: '📣', operations: '⚙️', finance: '🏦', innovation: '💡',
};
const DEPARTMENT_COLORS: Record<EmpireCard['department'], string> = {
  sales: Colors.info, operations: Colors.primary, finance: Colors.warning, innovation: Colors.premium,
};

/** Seven ordinary static cards. Only selection changes transform, not the layout. */
export default function EmpireCardTile({ card, selected, reduceMotion, onPress }: {
  card: EmpireCard;
  selected: boolean;
  reduceMotion: boolean;
  onPress: () => void;
}) {
  const lift = useRef(new Animated.Value(selected && !reduceMotion ? 1 : 0)).current;
  useEffect(() => {
    lift.stopAnimation();
    if (reduceMotion) {
      // Keep a static selection border, without any motion or displacement.
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
  return (
    <Animated.View style={[
      styles.tile,
      { transform: [
        { translateY: lift.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) },
        { scale: lift.interpolate({ inputRange: [0, 1], outputRange: [1, 1.025] }) },
      ] },
    ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={card.name + ', ' + card.department + ', ' + card.points + ' points'}
        accessibilityState={{ selected }}
        onPress={onPress}
        style={({ pressed }) => [
          styles.card, { borderColor: selected ? DEPARTMENT_COLORS[card.department] : Colors.cardBorder, borderWidth: selected ? 2 : 1 },
          pressed && styles.pressed,
        ]}
      >
        <Text style={styles.cardIcon}>{DEPARTMENT_ICONS[card.department]}</Text>
        <Text style={styles.cardTitle} numberOfLines={2}>{card.name}</Text>
        <Text style={styles.cardDept}>{card.department.toUpperCase()}</Text>
        <Text style={styles.cardPoints}>{card.points} pts</Text>
        <Ionicons
          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
          color={selected ? Colors.primary : Colors.textMuted}
          size={15}
          style={!selected ? styles.unselectedIcon : undefined}
        />
      </Pressable>
    </Animated.View>
  );
}
const styles = StyleSheet.create({
  tile: { width: '23.5%' },
  card: {
    backgroundColor: Colors.elevated, minHeight: 118, paddingVertical: 6, paddingHorizontal: 3,
    borderRadius: 9, alignItems: 'center', justifyContent: 'center', gap: 3,
  },
  cardIcon: { fontSize: 20 },
  cardTitle: { color: Colors.textPrimary, fontSize: 11, fontWeight: '700', textAlign: 'center', minHeight: 30 },
  cardDept: { color: Colors.textMuted, fontSize: 8, fontWeight: '700' },
  cardPoints: { color: Colors.textPrimary, fontSize: 11, fontWeight: '800' },
  pressed: { opacity: 0.82 },
  unselectedIcon: { opacity: 0 },
});
