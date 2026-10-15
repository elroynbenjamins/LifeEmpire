import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import type { HomeUiPreferences, HomeUiSection } from '../engine/homeUiPreferences';

const SECTIONS: { id: HomeUiSection; label: string }[] = [
  { id: 'annualReport', label: 'Yearly report' },
  { id: 'pinnedGoals', label: 'Pinned goals' },
  { id: 'personalLife', label: 'Personal life' },
  { id: 'investments', label: 'Portfolio & loans' },
  { id: 'ownedAssets', label: 'Owned assets' },
  { id: 'news', label: 'Market news' },
];

export default function HomeCustomizePanel({ preferences, onToggle }: {
  preferences: HomeUiPreferences;
  onToggle: (section: HomeUiSection) => void;
}) {
  return <View style={styles.panel}>
    <Text style={styles.title}>Show on dashboard</Text>
    <Text style={styles.note}>Your weekly cash flow and important actions always remain visible.</Text>
    <View style={styles.options}>
      {SECTIONS.map(item => <Pressable key={item.id} accessibilityRole="checkbox"
        accessibilityState={{ checked: preferences[item.id] }} onPress={() => onToggle(item.id)}
        style={styles.item}>
        <Ionicons name={preferences[item.id] ? 'checkbox' : 'square-outline'} size={17}
          color={preferences[item.id] ? Colors.primary : Colors.textMuted}/>
        <Text style={styles.label}>{item.label}</Text>
      </Pressable>)}
    </View>
  </View>;
}
const styles = StyleSheet.create({
  panel: { backgroundColor: Colors.elevated, borderRadius: 10, borderWidth: 1, borderColor: Colors.cardBorder, padding: 10, marginBottom: 10 },
  title: { fontSize: 12, fontWeight: '800', color: Colors.textPrimary },
  note: { color: Colors.textMuted, fontSize: 10, marginTop: 3, marginBottom: 6 },
  options: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  item: { width: '49%', minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 4 },
  label: { color: Colors.textSecondary, fontSize: 11, flex: 1 },
});
