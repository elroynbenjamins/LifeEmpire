import React, { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenHeader from '../src/components/ScreenHeader';
import GameButton from '../src/components/GameButton';
import GameCard from '../src/components/GameCard';
import { Colors } from '../src/theme/colors';
import useGameStore from '../src/store/gameStore';
import {
  EMPIRE_ADVISORS, EMPIRE_BOSSES, EMPIRE_CARDS, EMPIRE_COMBOS, EMPIRE_QUARTERS,
  EmpireRun, buyEmpireOffer, createEmpireRun, currentBoss, discardEmpireCards,
  isEmpireRun, nextEmpireQuarter, playEmpireHand, previewEmpireHand,
  quarterTarget, rerollEmpireShop, retireEmpireCard, suggestEmpireHand, trainEmpireCombo,
} from '../src/engine/empireCardsEngine';

const CARD_MAP = Object.fromEntries(EMPIRE_CARDS.map(c => [c.id, c]));
const ADVISOR_MAP = Object.fromEntries(EMPIRE_ADVISORS.map(a => [a.id, a]));
const COMBO_MAP = Object.fromEntries(EMPIRE_COMBOS.map(c => [c.id, c]));
const DEPARTMENT_ICONS: Record<string, string> = { sales: '📣', operations: '⚙️', finance: '🏦', innovation: '💡' };
const DEPARTMENT_COLORS: Record<string, string> = {
  sales: Colors.info, operations: Colors.primary, finance: Colors.warning, innovation: Colors.premium,
};

export default function EmpireCardsScreen() {
  const router = useRouter();
  const activeSlot = useGameStore(s => s.activeSlot ?? 0);
  const storageKey = 'life-empire-cards:v1:slot:' + activeSlot;
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const [run, setRun] = useState<EmpireRun | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [mode, setMode] = useState<'play' | 'discard'>('play');
  const [showGuide, setShowGuide] = useState(false);
  const [shopPanel, setShopPanel] = useState<'offers' | 'training' | 'retire'>('offers');
  const [retireDepartment, setRetireDepartment] = useState<'sales' | 'operations' | 'finance' | 'innovation'>('sales');
  useEffect(() => {
    let active = true;
    setReadyKey(null);
    setRun(null);
    setSelected([]);
    AsyncStorage.getItem(storageKey).then(value => {
      if (!active) return;
      try {
        const parsed: unknown = value ? JSON.parse(value) : null;
        setRun(isEmpireRun(parsed) ? parsed : null);
      } catch {
        setRun(null);
      }
      setReadyKey(storageKey);
    }).catch(() => { if (active) setReadyKey(storageKey); });
    return () => { active = false; };
  }, [storageKey]);
  useEffect(() => {
    // Never write the previous save slot's run into a newly selected slot.
    if (readyKey !== storageKey) return;
    const pending = run ? AsyncStorage.setItem(storageKey, JSON.stringify(run)) : AsyncStorage.removeItem(storageKey);
    void pending.catch(() => {});
  }, [readyKey, run, storageKey]);

  const update = (transform: (value: EmpireRun) => EmpireRun) => {
    setRun(previous => previous ? transform(previous) : previous);
    setSelected([]);
    setMode('play');
  };
  const select = (index: number) => {
    setSelected(current => current.includes(index)
      ? current.filter(i => i !== index)
      : current.length < 4 ? [...current, index] : current);
  };
  const restart = () => {
    if (run && run.phase !== 'won' && run.phase !== 'lost') {
      Alert.alert('Abandon current run?', 'Run-only progress and Advisors will be lost.', [
        { text: 'Keep playing', style: 'cancel' },
        { text: 'Start over', style: 'destructive', onPress: () => { setRun(createEmpireRun()); setSelected([]); setMode('play'); } },
      ]);
    } else { setRun(createEmpireRun()); setSelected([]); setMode('play'); }
  };
  const boss = run ? currentBoss(run) : null;
  const preview = run ? previewEmpireHand(run, selected) : null;
  const target = run ? quarterTarget(run) : 0;
  const quarter = run ? EMPIRE_QUARTERS[run.quarter - 1] : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="Empire Cards" subtitle="Business strategy · No timer" onBack={() => router.back()} showBack accentColor={Colors.business} showHud={false} />
      <ScrollView contentContainerStyle={styles.content}>
        {readyKey !== storageKey ? <Text style={styles.muted}>Loading saved run...</Text> : !run ? (
          <>
            <GameCard variant="hero" title="Build a Business Empire" eyebrow="OPTIONAL ACTIVITY" accentColor={Colors.business}>
              <Text style={styles.description}>Play powerful combinations of Sales, Operations, Finance and Innovation cards. Add Advisors, upgrade your strategy and defeat economic crises.</Text>
              <View style={styles.factRow}>
                <Text style={styles.fact}>32 starting cards</Text><Text style={styles.fact}>15 Advisors</Text>
                <Text style={styles.fact}>8 combinations</Text><Text style={styles.fact}>8 quarters</Text>
                <Text style={styles.fact}>6 boss effects</Text>
              </View>
              <Text style={styles.note}>An entire run uses separate Run Capital. It does not change your personal cash, gems or weekly progress.</Text>
              <GameButton label="Start Empire Cards" icon="play" onPress={() => setRun(createEmpireRun())} />
            </GameCard>
            <GameButton label="How combinations work" icon="help-circle-outline" variant="secondary" onPress={() => setShowGuide(!showGuide)} />
          </>
        ) : (
          <>
            <View style={styles.statsRow}>
              <View style={styles.stat}><Text style={styles.statLabel}>QUARTER</Text><Text style={styles.statValue}>{run.quarter}/8</Text></View>
              <View style={styles.stat}><Text style={styles.statLabel}>CAPITAL</Text><Text style={styles.statValue}>{run.capital}</Text></View>
              <View style={styles.stat}><Text style={styles.statLabel}>ADVISORS</Text><Text style={styles.statValue}>{run.advisors.length}/4</Text></View>
            </View>
            <GameCard title={quarter?.name ?? 'Empire Cards'} eyebrow={boss ? 'BOSS QUARTER' : 'CURRENT QUARTER'} accentColor={boss ? Colors.warning : Colors.business}>
              {boss && <View style={styles.boss}><Text style={styles.title}>{'⚠️ ' + boss.name}</Text><Text style={styles.description}>{boss.description}</Text></View>}
              <View style={styles.scoreRow}>
                <View><Text style={styles.statLabel}>TOTAL POINTS</Text><Text style={styles.bigScore}>{run.score.toLocaleString('en-US')}</Text></View>
                <View style={styles.alignRight}><Text style={styles.statLabel}>TARGET</Text><Text style={styles.bigScore}>{target.toLocaleString('en-US')}</Text></View>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: (Math.min(100, Math.round(run.score / Math.max(1, target) * 100)) + '%') as any }]} /></View>
              <Text style={styles.note}>{run.lastMessage}</Text>
              {run.phase === 'play' && <Text style={styles.description}>Hands: {run.handsLeft} remaining   ·   Discards: {run.discardsLeft} remaining</Text>}
            </GameCard>

            {run.phase === 'play' && (
              <GameCard title="Your hand" eyebrow="SELECT UP TO 4" titleAccessory={<Text style={styles.muted}>{run.hand.length} cards</Text>}>
                <View style={styles.cards}>
                  {run.hand.map((id, index) => {
                    const c = CARD_MAP[id];
                    if (!c) return null;
                    const active = selected.includes(index);
                    return (
                      <Pressable key={index} accessibilityRole="button" accessibilityLabel={c.name + ', ' + c.department + ', ' + c.points + ' points'} accessibilityState={{ selected: active }}
                        style={[styles.card, { borderColor: active ? DEPARTMENT_COLORS[c.department] : Colors.cardBorder, borderWidth: active ? 2 : 1 }]} onPress={() => select(index)}>
                        <Text style={styles.cardIcon}>{DEPARTMENT_ICONS[c.department]}</Text>
                        <Text style={styles.cardTitle} numberOfLines={2}>{c.name}</Text>
                        <Text style={styles.cardDept}>{c.department.toUpperCase()}</Text>
                        <Text style={styles.cardPoints}>{c.points} pts</Text>
                        {active && <Ionicons name="checkmark-circle" color={Colors.primary} size={15} />}
                      </Pressable>
                    );
                  })}
                </View>
                <View style={styles.preview}>
                  <View style={styles.scoreRow}>
                    <Text style={styles.description}>{mode === 'discard' ? 'Replace selected cards' : preview?.combo?.name ?? 'Basic Play'}</Text>
                    <Text style={styles.title}>{mode === 'discard' ? selected.length + ' selected' : '+' + (preview?.points ?? 0).toLocaleString('en-US')}</Text>
                  </View>
                  {mode === 'play' && <Text style={styles.note}>Base {preview?.base ?? 0} × {(preview?.multiplier ?? 1).toFixed(2)} · Advisor effects included</Text>}
                </View>
                <View style={styles.actionRow}>
                  {mode === 'play' ? (
                    <>
                      <View style={styles.flex}><GameButton label="Play Hand" compact icon="play" disabled={!selected.length} onPress={() => update(r => playEmpireHand(r, selected))} /></View>
                      <View style={styles.flex}><GameButton label="Discard Mode" compact variant="secondary" icon="refresh-outline" disabled={run.discardsLeft === 0} onPress={() => { setSelected([]); setMode('discard'); }} /></View>
                    </>
                  ) : (
                    <>
                      <View style={styles.flex}><GameButton label="Replace Cards" compact disabled={!selected.length} onPress={() => update(r => discardEmpireCards(r, selected))} /></View>
                      <View style={styles.flex}><GameButton label="Cancel" compact variant="secondary" onPress={() => { setSelected([]); setMode('play'); }} /></View>
                    </>
                  )}
                </View>
                <View style={styles.actionRow}>
                  <View style={styles.flex}><GameButton label="Suggest Best Hand" icon="bulb-outline" variant="ghost" compact onPress={() => { setMode('play'); setSelected(suggestEmpireHand(run)); }} /></View>
                  <View style={styles.flex}><GameButton label="Clear Selection" icon="close-outline" variant="ghost" compact disabled={!selected.length} onPress={() => setSelected([])} /></View>
                </View>
                <Text style={styles.note}>Play up to {run.quarter >= 5 ? 4 : 3} hands to reach the target. Discard up to 4 cards per discard action. No timer.</Text>
              </GameCard>
            )}

            {run.phase === 'shop' && (
              <GameCard title="Investment Shop" eyebrow="QUARTER CLEARED" accentColor={Colors.primary}>
                <Text style={styles.description}>Spend Run Capital to strengthen this run, or save it for later.</Text>
                {run.offers.map((offer, index) => {
                  const title = offer.kind === 'advisor' ? ADVISOR_MAP[offer.id]?.name : offer.kind === 'upgrade' ? (COMBO_MAP[offer.id]?.name + ' Training') : CARD_MAP[offer.id]?.name;
                  const description = offer.kind === 'advisor' ? ADVISOR_MAP[offer.id]?.description : offer.kind === 'upgrade' ? 'Increase this combination multiplier by +0.25.' : 'Add one copy of this card to your deck.';
                  return <View key={index} style={styles.offer}>
                    <View style={styles.flex}><Text style={styles.title}>{title}</Text><Text style={styles.note}>{description}</Text></View>
                    <GameButton label={offer.cost + ' Capital'} compact disabled={run.capital < offer.cost || (offer.kind === 'advisor' && run.advisors.length >= 4)} onPress={() => update(r => buyEmpireOffer(r, index))} />
                  </View>;
                })}
                <View style={styles.actionRow}>
                  <View style={styles.flex}><GameButton label="Train Combos" icon="school-outline" compact variant={shopPanel === 'training' ? 'primary' : 'secondary'} onPress={() => setShopPanel(shopPanel === 'training' ? 'offers' : 'training')} /></View>
                  <View style={styles.flex}><GameButton label="Trim Deck" icon="cut-outline" compact variant={shopPanel === 'retire' ? 'primary' : 'secondary'} onPress={() => setShopPanel(shopPanel === 'retire' ? 'offers' : 'retire')} /></View>
                </View>
                {shopPanel === 'training' && <View style={styles.shopPanel}>
                  <Text style={styles.description}>Target your strongest strategy. Each training adds ×0.25 to its scoring multiplier (maximum level 4).</Text>
                  {EMPIRE_COMBOS.map(combo => {
                    const level = run.upgrades[combo.id] ?? 0;
                    const cost = 7 + level * 2;
                    return <View key={combo.id} style={styles.offer}>
                      <View style={styles.flex}><Text style={styles.title}>{combo.name} · Lv {level}/4</Text><Text style={styles.note}>×{(combo.multiplier + level * 0.25).toFixed(2)} now · +0.25 next</Text></View>
                      <GameButton label={level === 4 ? 'Max' : cost + ' Capital'} compact disabled={level >= 4 || run.capital < cost} onPress={() => update(r => trainEmpireCombo(r, combo.id))} />
                    </View>;
                  })}
                </View>}
                {shopPanel === 'retire' && <View style={styles.shopPanel}>
                  <Text style={styles.description}>Remove weaker cards so your preferred departments appear more often. Maximum four removals per run.</Text>
                  <View style={styles.factRow}>
                    {(['sales', 'operations', 'finance', 'innovation'] as const).map(d => <Pressable key={d} accessibilityRole="button" onPress={() => setRetireDepartment(d)} style={[styles.departmentChip, retireDepartment === d && styles.departmentChipActive]}><Text style={styles.departmentChipText}>{DEPARTMENT_ICONS[d]} {d}</Text></Pressable>)}
                  </View>
                  {EMPIRE_CARDS.filter(c => c.department === retireDepartment && [...run.deck, ...run.hand, ...run.discarded].includes(c.id)).map(c => {
                    const cost = 4 + (run.retiredCards ?? 0) * 2;
                    const totalCards = run.deck.length + run.hand.length + run.discarded.length;
                    return <View key={c.id} style={styles.offer}>
                      <View style={styles.flex}><Text style={styles.title}>{c.name}</Text><Text style={styles.note}>{c.points} base points</Text></View>
                      <GameButton label={cost + ' Capital'} compact variant="secondary" disabled={run.capital < cost || (run.retiredCards ?? 0) >= 4 || totalCards <= 20} onPress={() => update(r => retireEmpireCard(r, c.id))} />
                    </View>;
                  })}
                </View>}
                <View style={styles.actionRow}>
                  <View style={styles.flex}><GameButton label="Reroll Offers · 2" compact icon="refresh" variant="secondary" disabled={run.capital < 2} onPress={() => update(r => rerollEmpireShop(r))} /></View>
                  <View style={styles.flex}><GameButton label="Next Quarter" compact icon="arrow-forward" onPress={() => { update(nextEmpireQuarter); setShopPanel('offers'); }} /></View>
                </View>
              </GameCard>
            )}

            {(run.phase === 'won' || run.phase === 'lost') && (
              <GameCard title={run.phase === 'won' ? '🏆 Business Empire Completed' : 'Run Finished'} accentColor={run.phase === 'won' ? Colors.primary : Colors.warning}>
                <Text style={styles.description}>Reached quarter {run.quarter} of 8 · Played {run.totalHandsPlayed} hands.</Text>
                <Text style={styles.note}>This is an optional independent activity. No main-game resources were added or deducted.</Text>
                <GameButton label="Start New Run" icon="refresh" onPress={restart} />
              </GameCard>
            )}

            {run.advisors.length > 0 && <GameCard title="Active CEO Advisors" compact>
              {run.advisors.map(id => <View key={id} style={styles.advisor}><Text style={styles.title}>{ADVISOR_MAP[id]?.name ?? id}</Text><Text style={styles.note}>{ADVISOR_MAP[id]?.description}</Text></View>)}
            </GameCard>}
            <View style={styles.actionRow}>
              <View style={styles.flex}><GameButton label="Combination Guide" icon="book-outline" compact variant="secondary" onPress={() => setShowGuide(!showGuide)} /></View>
              <View style={styles.flex}><GameButton label="Restart Run" icon="refresh-outline" compact variant="ghost" onPress={restart} /></View>
            </View>
          </>
        )}

        {showGuide && <GameCard title="All 8 Business Combinations" eyebrow="RULEBOOK" compact>
          {EMPIRE_COMBOS.map(combo => <View key={combo.id} style={styles.rule}><View style={styles.flex}><Text style={styles.title}>{combo.name}</Text><Text style={styles.note}>{combo.description}</Text></View><Text style={styles.comboMulti}>×{combo.multiplier.toFixed(2)}</Text></View>)}
          <Text style={styles.note}>Only the best eligible combination activates. Each Training upgrade adds +0.25 to that combination before Advisors apply.</Text>
          <Text style={[styles.title, { marginTop: 10 }]}>Six possible boss conditions</Text>
          {EMPIRE_BOSSES.map(b => <Text key={b.id} style={styles.note}>{b.name}: {b.description}</Text>)}
        </GameCard>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 14, paddingBottom: 50 },
  description: { color: Colors.textSecondary, fontSize: 13, lineHeight: 19, marginBottom: 8 },
  note: { color: Colors.textMuted, fontSize: 11, lineHeight: 16, marginTop: 5 },
  muted: { color: Colors.textMuted, fontSize: 11 },
  title: { color: Colors.textPrimary, fontSize: 13, fontWeight: '700' },
  statsRow: { flexDirection: 'row', gap: 7, marginBottom: 10 },
  stat: { flex: 1, borderRadius: 10, borderColor: Colors.cardBorder, borderWidth: 1, backgroundColor: Colors.card, padding: 10, alignItems: 'center' },
  statLabel: { color: Colors.textMuted, fontSize: 10, fontWeight: '700' },
  statValue: { color: Colors.textPrimary, fontSize: 18, fontWeight: '800', marginTop: 2 },
  bigScore: { color: Colors.textPrimary, fontSize: 22, fontWeight: '800', marginTop: 3 },
  alignRight: { alignItems: 'flex-end' },
  scoreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 9 },
  track: { height: 7, borderRadius: 6, backgroundColor: Colors.elevated, overflow: 'hidden', marginTop: 12, marginBottom: 6 },
  fill: { backgroundColor: Colors.primary, height: '100%', borderRadius: 6 },
  boss: { backgroundColor: Colors.elevated, borderRadius: 8, padding: 10, marginBottom: 12 },
  cards: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 5 },
  card: { backgroundColor: Colors.elevated, width: '23.5%', minHeight: 112, paddingVertical: 7, paddingHorizontal: 3, borderRadius: 9, alignItems: 'center', justifyContent: 'center', gap: 3 },
  cardIcon: { fontSize: 20 },
  cardTitle: { color: Colors.textPrimary, fontSize: 11, fontWeight: '700', textAlign: 'center', minHeight: 30 },
  cardDept: { color: Colors.textMuted, fontSize: 8, fontWeight: '700' },
  cardPoints: { color: Colors.textPrimary, fontSize: 11, fontWeight: '800' },
  preview: { backgroundColor: Colors.elevated, padding: 10, borderRadius: 8, marginTop: 11, marginBottom: 9 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  flex: { flex: 1 },
  offer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  shopPanel: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  departmentChip: { backgroundColor: Colors.elevated, paddingHorizontal: 8, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  departmentChipActive: { borderColor: Colors.primary },
  departmentChipText: { color: Colors.textPrimary, fontSize: 11, textTransform: 'capitalize' },
  advisor: { borderBottomWidth: 1, borderBottomColor: Colors.cardBorder, paddingVertical: 7 },
  rule: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  comboMulti: { color: Colors.primary, fontWeight: '800', fontSize: 14 },
  factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12, marginTop: 8 },
  fact: { backgroundColor: Colors.elevated, color: Colors.textSecondary, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 7, fontSize: 11 },
});
