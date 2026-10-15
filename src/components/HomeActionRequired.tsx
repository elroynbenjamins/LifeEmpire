import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { HomeAction } from '../engine/homeActionRequired';
import { Colors } from '../theme/colors';

export default function HomeActionRequired({
  actions, onOpen,
}: { actions: HomeAction[]; onOpen: (route: HomeAction['route']) => void }) {
  const [expanded, setExpanded] = useState(false);
  if (!actions.length) return null;
  const shown = expanded ? actions : actions.slice(0, 2);
  return <View style={styles.container}>
    <View style={styles.header}>
      <Ionicons name="alert-circle-outline" size={16} color={Colors.warning} />
      <Text style={styles.heading}>ACTION REQUIRED</Text>
      <Text style={styles.count}>{actions.length}</Text>
    </View>
    {shown.map(item => (
      <Pressable key={item.id} accessibilityRole="button" onPress={() => onOpen(item.route)}
        style={styles.action}>
        <View style={styles.copy}>
          <Text numberOfLines={2} style={[styles.title, item.urgent && { color: Colors.warning }]}>{item.title}</Text>
          <Text numberOfLines={1} style={styles.detail}>{item.detail}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.textMuted}/>
      </Pressable>
    ))}
    {actions.length > 2 && <Pressable accessibilityRole="button" onPress={() => setExpanded(v => !v)}
      style={styles.more}>
      <Text style={styles.moreText}>{expanded ? 'Show fewer' : 'Show all ' + actions.length + ' actions'}</Text>
      <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={Colors.textSecondary} />
    </Pressable>}
  </View>;
}

const styles = StyleSheet.create({
  container: { borderWidth: 1, borderColor: `${Colors.warning}65`, borderRadius: 10, paddingHorizontal: 11, paddingVertical: 8, backgroundColor: Colors.card, marginBottom: 10 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  heading: { color: Colors.warning, fontSize: 10, fontWeight: '900', letterSpacing: 0.6 },
  count: { color: Colors.warning, fontWeight: '800', fontSize: 10 },
  action: { minHeight: 45, flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 5, borderTopWidth: 1, borderColor: Colors.cardBorder },
  copy: { flex: 1, minWidth: 0 },
  title: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700' },
  detail: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
  more: { minHeight: 32, alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 4 },
  moreText: { color: Colors.textSecondary, fontSize: 11, fontWeight: '700' },
});
