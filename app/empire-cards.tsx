import React, { useEffect, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ScreenHeader from '../src/components/ScreenHeader';
import GameButton from '../src/components/GameButton';
import GameCard from '../src/components/GameCard';
import EmpireCardTile from '../src/components/EmpireCardTile';
import { EmpirePhaseReveal, EmpireScorePulse, useEmpireReducedMotion } from '../src/components/EmpireMotion';
import { Colors } from '../src/theme/colors';
import {
  getEmpireAdvisorIcon, EMPIRE_ADVISOR_RARITY_COLORS,
  isEmpireCardBossAffected,
} from '../src/theme/empireCardsVisuals';
import useGameStore from '../src/store/gameStore';
import {
  EMPIRE_ADVISORS, EMPIRE_BOSSES, EMPIRE_CARDS, EMPIRE_COMBOS, EMPIRE_QUARTERS, EMPIRE_DIFFICULTIES, EmpireDifficulty, EmpireChallengeId,
  EmpireRun, buyEmpireOffer, createEmpireRun, currentBoss, discardEmpireCards,
  isEmpireRun, nextEmpireQuarter, playEmpireHand, previewEmpireHand,
  quarterTarget, rerollEmpireShop, retireEmpireCard, trainEmpireCombo,
 } from '../src/engine/empireCardsEngine';
import {
  EMPIRE_ACHIEVEMENTS, EMPIRE_CHALLENGES, EmpireMedalProfile,
  emptyEmpireMedals, readEmpireMedals, applyEmpireMedalProgress,
  reconcileEmpireMedals, activeEmpireChallenge, empireChallengeProgress,
} from '../src/engine/empireCardsMedals';
import { getEmpireStrategyHint } from '../src/engine/empireCardsHints';

const CARD_MAP = Object.fromEntries(EMPIRE_CARDS.map(c => [c.id, c]));
const ADVISOR_MAP = Object.fromEntries(EMPIRE_ADVISORS.map(a => [a.id, a]));
const COMBO_MAP = Object.fromEntries(EMPIRE_COMBOS.map(c => [c.id, c]));
const DEPARTMENT_ICONS: Record<string, string> = { sales: '📣', operations: '⚙️', finance: '🏦', innovation: '💡' };

export default function EmpireCardsScreen() {
  const router = useRouter();
  const reduceMotion = useEmpireReducedMotion();
  const { width: viewportWidth } = useWindowDimensions();
  const handColumns: 3 | 4 = viewportWidth < 380 ? 3 : 4;
  const activeSlot = useGameStore(s => s.activeSlot ?? 0);
  const storageKey = 'life-empire-cards:v1:slot:' + activeSlot;
  const medalsKey = 'life-empire-cards-medals:v1:slot:' + activeSlot;
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const [run, setRun] = useState<EmpireRun | null>(null);
  const runRef = useRef<EmpireRun | null>(null);
  const [medals, setMedals] = useState<EmpireMedalProfile>(emptyEmpireMedals);
  const medalsRef = useRef<EmpireMedalProfile>(emptyEmpireMedals());
  const [medalsOpen, setMedalsOpen] = useState(false);
  const [medalsTab, setMedalsTab] = useState<'achievements' | 'challenges'>('achievements');
  const [recentMedal, setRecentMedal] = useState<string | null>(null);
  const [selected, setSelected] = useState<number[]>([]);
  const [showStrategyHint, setShowStrategyHint] = useState(false);
  const [mode, setMode] = useState<'play' | 'discard'>('play');
  const [showGuide, setShowGuide] = useState(false);
  const [startDifficulty, setStartDifficulty] = useState<EmpireDifficulty>('standard');
  const [startChallenge, setStartChallenge] = useState<EmpireChallengeId | null>(null);
  const [shopPanel, setShopPanel] = useState<'offers' | 'training' | 'retire'>('offers');
  const [retireDepartment, setRetireDepartment] = useState<'sales' | 'operations' | 'finance' | 'innovation'>('sales');
  const [replacementAdvisor, setReplacementAdvisor] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    setReadyKey(null);
    runRef.current = null;
    setRun(null);
    medalsRef.current = emptyEmpireMedals();
    setMedals(medalsRef.current);
    setSelected([]);
    setShowStrategyHint(false);
    setReplacementAdvisor(null);
    setRecentMedal(null);
    // Wait for both files before permitting writes, especially on save-slot changes.
    Promise.all([AsyncStorage.getItem(storageKey), AsyncStorage.getItem(medalsKey)])
      .then(([rawRun, rawMedals]) => {
        if (!active) return;
        let savedRun: EmpireRun | null = null;
        let savedMedals = emptyEmpireMedals();
        try {
          const parsed: unknown = rawRun ? JSON.parse(rawRun) : null;
          savedRun = isEmpireRun(parsed) ? parsed : null;
        } catch { /* Preserve badges even if a run is corrupt. */ }
        try {
          savedMedals = readEmpireMedals(rawMedals ? JSON.parse(rawMedals) : null);
        } catch { /* Invalid badge JSON cannot block game startup. */ }
        savedMedals = reconcileEmpireMedals(savedMedals, savedRun);
        runRef.current = savedRun;
        medalsRef.current = savedMedals;
        setRun(savedRun);
        setMedals(savedMedals);
        setReadyKey(storageKey);
      })
      .catch(() => { if (active) setReadyKey(storageKey); });
    return () => { active = false; };
  }, [storageKey, medalsKey]);
  useEffect(() => {
    // Never write the previous save slot's run into a newly selected slot.
    if (readyKey !== storageKey) return;
    const pending = run ? AsyncStorage.setItem(storageKey, JSON.stringify(run)) : AsyncStorage.removeItem(storageKey);
    void pending.catch(() => {});
  }, [readyKey, run, storageKey]);
  useEffect(() => {
    if (readyKey !== storageKey) return;
    void AsyncStorage.setItem(medalsKey, JSON.stringify(medals)).catch(() => {});
  }, [readyKey, medals, medalsKey, storageKey]);

  const commitRun = (next: EmpireRun | null) => {
    const previous = runRef.current;
    runRef.current = next;
    setRun(next);
    if (previous && next) {
      const updated = applyEmpireMedalProgress(medalsRef.current, previous, next);
      if (updated !== medalsRef.current) {
        const newAchievement = updated.unlocked.find(id => !medalsRef.current.unlocked.includes(id));
        const newChallenge = updated.completedChallenges.find(id => !medalsRef.current.completedChallenges.includes(id));
        medalsRef.current = updated;
        setMedals(updated);
        const award = EMPIRE_ACHIEVEMENTS.find(m => m.id === newAchievement)
          ?? EMPIRE_CHALLENGES.find(c => c.id === newChallenge);
        setRecentMedal(award ? '🏅 ' + award.name + ' medal unlocked' : null);
      } else {
        setRecentMedal(null);
      }
    } else {
      setRecentMedal(null);
    }
  };
  const update = (transform: (value: EmpireRun) => EmpireRun) => {
    const previous = runRef.current;
    if (previous) {
      const next = transform(previous);
      if (next !== previous) commitRun(next);
    }
    setSelected([]);
    setShowStrategyHint(false);
    setMode('play');
  };
  const beginRun = (difficulty: EmpireDifficulty, challengeId?: EmpireChallengeId) => {
    commitRun(createEmpireRun(Date.now() >>> 0, difficulty, challengeId));
    setSelected([]);
    setShowStrategyHint(false);
    setMode('play');
    setMedalsOpen(false);
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
        { text: 'Start over', style: 'destructive', onPress: () => { beginRun(run?.difficulty ?? startDifficulty, run?.challengeId ?? startChallenge ?? undefined); } },
      ]);
    } else { beginRun(run?.difficulty ?? startDifficulty, run?.challengeId ?? startChallenge ?? undefined); }
  };
  const boss = run ? currentBoss(run) : null;
  const preview = run ? previewEmpireHand(run, selected) : null;
  const target = run ? quarterTarget(run) : 0;
  const quarter = run ? EMPIRE_QUARTERS[run.quarter - 1] : null;
  const activeChallenge = run ? activeEmpireChallenge(run) : null;
  const strategyHint = run && run.phase === 'play' ? getEmpireStrategyHint(run, mode) : null;

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="Empire Cards" subtitle="Business strategy · No timer" onBack={() => router.back()} showBack accentColor={Colors.business} showHud={false} />
      <ScrollView contentContainerStyle={styles.content}>
        {readyKey !== storageKey ? <Text style={styles.muted}>Loading saved run...</Text> : !run ? (
          <>
            <GameCard variant="hero" title="Build a Business Empire" eyebrow="OPTIONAL ACTIVITY" accentColor={Colors.business}>
              <Text style={styles.description}>Draw 7 cards, select up to 4, and combine departments to score. Clear each target before your hands run out; then recruit Advisors and improve your deck between quarters.</Text>
              <View style={styles.factRow}>
                <Text style={styles.fact}>32 starting cards</Text><Text style={styles.fact}>15 Advisors</Text>
                <Text style={styles.fact}>8 combinations</Text><Text style={styles.fact}>8 quarters</Text>
                <Text style={styles.fact}>6 boss effects</Text>
              </View>
              <Text style={styles.note}>An entire run uses separate Run Capital. It does not change your personal cash, gems or weekly progress.</Text>
              <Text style={styles.title}>Choose challenge</Text>
              <View style={styles.difficultyRow}>
                {(Object.keys(EMPIRE_DIFFICULTIES) as EmpireDifficulty[]).map(id => (
                  <Pressable key={id} accessibilityRole="button" accessibilityState={{ selected: startDifficulty === id }}
                    onPress={() => setStartDifficulty(id)} style={[styles.difficultyChoice, startDifficulty === id && styles.difficultyActive]}>
                    <Text style={[styles.difficultyTitle, startDifficulty === id && { color: Colors.primary }]}>{EMPIRE_DIFFICULTIES[id].label}</Text>
                    <Text style={styles.note}>{EMPIRE_DIFFICULTIES[id].description}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={[styles.title, { marginTop: 8 }]}>Optional run challenge</Text>
              <View style={styles.challengeChoices}>
                <Pressable accessibilityRole="button" accessibilityState={{ selected: startChallenge === null }}
                  style={[styles.challengeChip, startChallenge === null && styles.challengeChipActive]}
                  onPress={() => setStartChallenge(null)}>
                  <Text style={styles.challengeChoiceText}>None</Text>
                </Pressable>
                {EMPIRE_CHALLENGES.map(c => (
                  <Pressable key={c.id} accessibilityRole="button" accessibilityState={{ selected: startChallenge === c.id }}
                    style={[styles.challengeChip, startChallenge === c.id && styles.challengeChipActive]}
                    onPress={() => setStartChallenge(c.id)}>
                    <Text style={styles.challengeChoiceText}>{c.icon} {c.name}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={styles.note}>{EMPIRE_CHALLENGES.find(c => c.id === startChallenge)?.description ?? 'No extra objective. You can still earn permanent Empire Cards achievements.'}</Text>
              <GameButton label="Start Empire Cards" icon="play" onPress={() => beginRun(startDifficulty, startChallenge ?? undefined)} />
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
            <Text style={styles.difficultyContext}>{EMPIRE_DIFFICULTIES[run.difficulty ?? 'standard']?.label ?? 'Standard'} difficulty · Targets adjust by difficulty only</Text>
            {activeChallenge && <View style={styles.challengeStatus}>
              <Text style={styles.challengeStatusTitle}>{activeChallenge.icon} {activeChallenge.name} {run.challengeCompleted ? '✓' : ''}</Text>
              <Text style={styles.note}>{run.challengeCompleted ? 'Challenge medal earned for this run' : activeChallenge.description + ' · ' + empireChallengeProgress(run) + '/' + activeChallenge.target}</Text>
            </View>}
            {recentMedal && <Text style={styles.medalToast}>{recentMedal}</Text>}
            <EmpirePhaseReveal phaseKey={run.quarter + ':' + run.phase} reduceMotion={reduceMotion}>
            <GameCard title={quarter?.name ?? 'Empire Cards'} eyebrow={boss ? 'BOSS QUARTER' : 'CURRENT QUARTER'} accentColor={boss ? Colors.warning : Colors.business}>
              {boss && <View style={styles.boss}><Text style={styles.title}>{'⚠️ ' + boss.name}</Text><Text style={styles.description}>{boss.description}</Text></View>}
              <View style={styles.scoreRow}>
                <View><Text style={styles.statLabel}>TOTAL POINTS</Text><EmpireScorePulse value={run.totalHandsPlayed} reduceMotion={reduceMotion}><Text style={styles.bigScore}>{run.score.toLocaleString('en-US')}</Text></EmpireScorePulse></View>
                <View style={styles.alignRight}><Text style={styles.statLabel}>TARGET</Text><Text style={styles.bigScore}>{target.toLocaleString('en-US')}</Text></View>
              </View>
              <View style={styles.track}><View style={[styles.fill, { width: (Math.min(100, Math.round(run.score / Math.max(1, target) * 100)) + '%') as any }]} /></View>
              <Text style={styles.note}>{run.lastMessage}</Text>
              {run.phase === 'play' && <Text style={styles.description}>Hands: {run.handsLeft} remaining   ·   Discards: {run.discardsLeft} remaining</Text>}
            </GameCard>

            {run.phase === 'play' && (
              <GameCard title="Your hand" eyebrow="SELECT UP TO 4" titleAccessory={<Text style={styles.muted}>{run.hand.length} cards</Text>}>
                <EmpirePhaseReveal phaseKey={run.quarter + ':' + run.hand.join(',')} reduceMotion={reduceMotion}>
                <View style={styles.cards}>
                  {run.hand.map((id, index) => {
                    const card = CARD_MAP[id];
                    return card ? (
                      <EmpireCardTile
                        key={index + ':' + id}
                        card={card}
                        selected={selected.includes(index)}
                        bossAffected={isEmpireCardBossAffected(card, boss, run.advisors.includes('crisis'))}
                        columns={handColumns}
                        reduceMotion={reduceMotion}
                        onPress={() => select(index)}
                      />
                    ) : null;
                  })}
                </View>
                </EmpirePhaseReveal>
                <View style={styles.preview}>
                  <View style={styles.scoreRow}>
                    <Text style={styles.description}>{mode === 'discard' ? 'Replace selected cards' : preview?.combo?.name ?? 'Basic Play'}</Text>
                    <Text style={styles.title}>{mode === 'discard' ? selected.length + ' selected' : '+' + (preview?.points ?? 0).toLocaleString('en-US')}</Text>
                  </View>
                  {mode === 'play' && <Text style={styles.note}>Base {preview?.base ?? 0} × {(preview?.multiplier ?? 1).toFixed(2)} · Advisor effects included · {Math.max(0, target - run.score - (preview?.points ?? 0)).toLocaleString('en-US')} points still needed</Text>}
                  {mode === 'play' && selected.length > 0 && (preview?.activeAdvisorIds.length ?? 0) > 0 && (
                    <Text style={[styles.note, { color: Colors.primary }]}>Active Advisors: {preview?.activeAdvisorIds.map(id => ADVISOR_MAP[id]?.name ?? id).join(', ')}</Text>
                  )}
                  {mode === 'play' && preview?.advisorWarning && <Text style={[styles.note, { color: Colors.warning }]}>{preview.advisorWarning}</Text>}
                </View>
                <View style={styles.actionRow}>
                  {mode === 'play' ? (
                    <>
                      <View style={styles.flex}><GameButton label="Play Hand" compact icon="play" disabled={!selected.length} onPress={() => update(r => playEmpireHand(r, selected))} /></View>
                      <View style={styles.flex}><GameButton label="Discard Mode" compact variant="secondary" icon="refresh-outline" disabled={run.discardsLeft === 0} onPress={() => { setSelected([]); setShowStrategyHint(false); setMode('discard'); }} /></View>
                    </>
                  ) : (
                    <>
                      <View style={styles.flex}><GameButton label="Replace Cards" compact disabled={!selected.length} onPress={() => update(r => discardEmpireCards(r, selected))} /></View>
                      <View style={styles.flex}><GameButton label="Cancel" compact variant="secondary" onPress={() => { setSelected([]); setShowStrategyHint(false); setMode('play'); }} /></View>
                    </>
                  )}
                </View>
                <View style={styles.actionRow}>
                  <View style={styles.flex}><GameButton label={showStrategyHint ? 'Hide Hint' : 'Strategy Hint'} icon="bulb-outline" variant="ghost" compact onPress={() => setShowStrategyHint(!showStrategyHint)} /></View>
                  <View style={styles.flex}><GameButton label="Clear Selection" icon="close-outline" variant="ghost" compact disabled={!selected.length} onPress={() => setSelected([])} /></View>
                </View>
                {showStrategyHint && strategyHint && <View style={styles.strategyHint}>
                  <Text style={styles.hintTitle}>{strategyHint.title}</Text>
                  <Text style={styles.description}>{strategyHint.advice}</Text>
                  <Text style={styles.note}>{strategyHint.context}</Text>
                  <Text style={styles.note}>A hint never selects, plays or discards cards for you.</Text>
                </View>}
                <Text style={styles.note}>
                  CORE 20–24 · GROWTH 26–30 · FLAGSHIP 32–34 points. These are visual tiers, not rarity.
                  {boss && !run.advisors.includes('crisis') ? ' ⚠ marks cards weakened by this boss.' : ''}
                </Text>
                <Text style={styles.note}>Play up to {run.quarter >= 5 ? 4 : 3} hands to reach the target. Discard up to 4 cards per discard action. No timer.</Text>
              </GameCard>
            )}

            {run.phase === 'shop' && (
              <GameCard title="Investment Shop" eyebrow="QUARTER CLEARED" accentColor={Colors.primary}>
                <Text style={styles.description}>Spend Run Capital to strengthen this run, or save it for later. Purchased Advisors last until the run ends.</Text>
                {run.advisors.length >= 4 && <View style={styles.shopPanel}>
                  <Text style={styles.description}>All four Advisor slots are full. To recruit another Advisor, first select an existing one to replace. Otherwise, keep your team.</Text>
                  <View style={styles.factRow}>
                    {run.advisors.map(id => <Pressable key={id} accessibilityRole="button" onPress={() => setReplacementAdvisor(replacementAdvisor === id ? null : id)} style={[styles.departmentChip, replacementAdvisor === id && styles.departmentChipActive]}>
                      <Text style={styles.departmentChipText}>{replacementAdvisor === id ? '✓ ' : ''}{ADVISOR_MAP[id]?.name ?? id}</Text>
                    </Pressable>)}
                  </View>
                </View>}
                {run.offers.map((offer, index) => {
                  const title = offer.kind === 'advisor' ? ADVISOR_MAP[offer.id]?.name : offer.kind === 'upgrade' ? (COMBO_MAP[offer.id]?.name + ' Training') : CARD_MAP[offer.id]?.name;
                  const description = offer.kind === 'advisor' ? ADVISOR_MAP[offer.id]?.description : offer.kind === 'upgrade' ? 'Increase this combination multiplier by +0.25.' : 'Add one copy of this card to your deck.';
                  const rarity = offer.kind === 'advisor' ? ADVISOR_MAP[offer.id]?.rarity : null;
                  return <View key={index} style={styles.offer}>
                    {offer.kind === 'advisor' && <View style={[styles.advisorMedallion, { borderColor: EMPIRE_ADVISOR_RARITY_COLORS[rarity ?? 'common'] }]}>
                      <Ionicons name={getEmpireAdvisorIcon(offer.id)} color={EMPIRE_ADVISOR_RARITY_COLORS[rarity ?? 'common']} size={20} />
                    </View>}
                    <View style={styles.flex}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <Text style={styles.title}>{title}</Text>
                        {rarity && <Text style={[styles.rarityLabel, { color: EMPIRE_ADVISOR_RARITY_COLORS[rarity] }]}>{rarity.toUpperCase()}</Text>}
                      </View>
                      <Text style={styles.note}>{description}</Text>
                    </View>
                    <GameButton label={offer.cost + ' Capital'} compact disabled={run.capital < offer.cost || (offer.kind === 'advisor' && run.advisors.length >= 4 && !replacementAdvisor)} onPress={() => { update(r => buyEmpireOffer(r, index, replacementAdvisor ?? undefined)); setReplacementAdvisor(null); }} />
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
                  <View style={styles.flex}><GameButton label="Next Quarter" compact icon="arrow-forward" onPress={() => { update(nextEmpireQuarter); setShopPanel('offers'); setReplacementAdvisor(null); }} /></View>
                </View>
              </GameCard>
            )}

            {(run.phase === 'won' || run.phase === 'lost') && (
              <GameCard title={run.phase === 'won' ? '🏆 Business Empire Completed' : 'Run Finished'} accentColor={run.phase === 'won' ? Colors.primary : Colors.warning}>
                <Text style={styles.description}>Reached quarter {run.quarter} of 8 · Played {run.totalHandsPlayed} hands.</Text>
                <Text style={styles.note}>This is an optional independent activity. No main-game resources were added or deducted.</Text>
                {activeChallenge && <Text style={styles.description}>{activeChallenge.icon} {activeChallenge.name}: {run.challengeCompleted ? 'Medal earned' : 'Not completed'}</Text>}
                <GameButton label="Play Again" icon="refresh" onPress={restart} />
                <GameButton label="Choose New Challenge" variant="secondary" compact onPress={() => {
                  setStartDifficulty(run.difficulty ?? 'standard');
                  setStartChallenge(run.challengeId ?? null);
                  commitRun(null);
                }} />
              </GameCard>
            )}

            </EmpirePhaseReveal>
            {run.advisors.length > 0 && <GameCard title="Active CEO Advisors" compact
              titleAccessory={<Text style={styles.muted}>{run.advisors.length}/4</Text>}>
              {run.advisors.map(id => {
                const advisor = ADVISOR_MAP[id];
                const accent = EMPIRE_ADVISOR_RARITY_COLORS[advisor?.rarity ?? 'common'];
                return <View key={id} style={styles.advisor}>
                  <View style={[styles.advisorMedallion, { borderColor: accent }]}>
                    <Ionicons name={getEmpireAdvisorIcon(id)} color={accent} size={19} />
                  </View>
                  <View style={styles.flex}>
                    <View style={styles.advisorHeading}>
                      <Text style={styles.title}>{advisor?.name ?? id}</Text>
                      <Text style={[styles.rarityLabel, { color: accent }]}>{advisor?.rarity?.toUpperCase() ?? ''}</Text>
                    </View>
                    <Text style={styles.note}>{advisor?.description}</Text>
                  </View>
                </View>;
              })}
            </GameCard>}
            <View style={styles.actionRow}>
              <View style={styles.flex}><GameButton label="Combination Guide" icon="book-outline" compact variant="secondary" onPress={() => setShowGuide(!showGuide)} /></View>
              <View style={styles.flex}><GameButton label="Restart Run" icon="refresh-outline" compact variant="ghost" onPress={restart} /></View>
            </View>
          </>
        )}

        <GameCard title="Medal Cabinet" eyebrow="EMPIRE CARDS ONLY" compact
          titleAccessory={<Text style={styles.muted}>{medals.unlocked.length}/{EMPIRE_ACHIEVEMENTS.length} 🏅</Text>}>
          <Pressable accessibilityRole="button" accessibilityState={{ expanded: medalsOpen }}
            onPress={() => setMedalsOpen(!medalsOpen)} style={styles.medalHeader}>
            <Text style={styles.description}>{medals.completedChallenges.length}/{EMPIRE_CHALLENGES.length} challenges completed · cosmetic medals only</Text>
            <Ionicons name={medalsOpen ? 'chevron-up' : 'chevron-down'} color={Colors.textSecondary} size={18} />
          </Pressable>
          {medalsOpen && <>
            <View style={styles.medalTabs}>
              <Pressable accessibilityRole="button" onPress={() => setMedalsTab('achievements')}
                style={[styles.medalTab, medalsTab === 'achievements' && styles.medalTabActive]}>
                <Text style={styles.medalTabText}>Achievements</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setMedalsTab('challenges')}
                style={[styles.medalTab, medalsTab === 'challenges' && styles.medalTabActive]}>
                <Text style={styles.medalTabText}>Challenges</Text>
              </Pressable>
            </View>
            {(medalsTab === 'achievements' ? EMPIRE_ACHIEVEMENTS : EMPIRE_CHALLENGES).map(item => {
              const complete = medalsTab === 'achievements'
                ? medals.unlocked.includes(item.id)
                : medals.completedChallenges.includes(item.id as EmpireChallengeId);
              return <View key={item.id} style={styles.medalRow}>
                <Text style={[styles.medalIcon, !complete && { opacity: 0.35 }]}>{complete ? item.icon : '🔒'}</Text>
                <View style={styles.flex}>
                  <Text style={styles.title}>{item.name} {complete ? '✓' : ''}</Text>
                  <Text style={styles.note}>{item.description}</Text>
                </View>
              </View>;
            })}
          </>}
        </GameCard>

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
  strategyHint: { borderLeftWidth: 3, borderLeftColor: Colors.info, backgroundColor: Colors.elevated, paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8, marginTop: 6 },
  hintTitle: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800', marginBottom: 4 },
  actionRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  flex: { flex: 1 },
  offer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  rarityLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 0.4 },
  difficultyContext: { color: Colors.textMuted, fontSize: 11, marginBottom: 8 },
  difficultyRow: { flexDirection: 'row', gap: 6, marginVertical: 10 },
  difficultyChoice: { flex: 1, borderRadius: 8, borderWidth: 1, borderColor: Colors.cardBorder, backgroundColor: Colors.elevated, padding: 8 },
  difficultyActive: { borderColor: Colors.primary, borderWidth: 2 },
  difficultyTitle: { color: Colors.textPrimary, fontSize: 12, fontWeight: '800' },
  shopPanel: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: Colors.cardBorder },
  departmentChip: { backgroundColor: Colors.elevated, paddingHorizontal: 8, paddingVertical: 7, borderRadius: 8, borderWidth: 1, borderColor: Colors.cardBorder },
  departmentChipActive: { borderColor: Colors.primary },
  departmentChipText: { color: Colors.textPrimary, fontSize: 11, textTransform: 'capitalize' },
  advisor: { flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder, paddingVertical: 7 },
  advisorMedallion: { height: 36, width: 36, borderWidth: 1, borderRadius: 8, backgroundColor: Colors.elevated, alignItems: 'center', justifyContent: 'center' },
  advisorHeading: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 },
  rule: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder },
  comboMulti: { color: Colors.primary, fontWeight: '800', fontSize: 14 },
  factRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12, marginTop: 8 },
  fact: { backgroundColor: Colors.elevated, color: Colors.textSecondary, paddingVertical: 6, paddingHorizontal: 9, borderRadius: 7, fontSize: 11 },
  challengeChoices: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  challengeChip: { backgroundColor: Colors.elevated, borderWidth: 1, borderColor: Colors.cardBorder, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 8 },
  challengeChipActive: { borderColor: Colors.primary },
  challengeChoiceText: { fontSize: 11, fontWeight: '600', color: Colors.textPrimary },
  challengeStatus: { backgroundColor: Colors.elevated, borderRadius: 8, padding: 9, marginBottom: 10 },
  challengeStatusTitle: { color: Colors.textPrimary, fontSize: 12, fontWeight: '700' },
  medalToast: { color: Colors.primary, fontSize: 12, fontWeight: '700', marginBottom: 10 },
  medalHeader: { flexDirection: 'row', gap: 10, alignItems: 'center', justifyContent: 'space-between' },
  medalTabs: { flexDirection: 'row', gap: 6, marginVertical: 10 },
  medalTab: { flex: 1, borderWidth: 1, borderColor: Colors.cardBorder, borderRadius: 8, alignItems: 'center', padding: 9 },
  medalTabActive: { borderColor: Colors.primary, backgroundColor: Colors.elevated },
  medalTabText: { color: Colors.textPrimary, fontWeight: '700', fontSize: 12 },
  medalRow: { flexDirection: 'row', gap: 9, paddingVertical: 7, borderTopWidth: 1, borderTopColor: Colors.cardBorder, alignItems: 'center' },
  medalIcon: { fontSize: 17 },
});
