import React, { useState } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import useGameStore from '../store/gameStore';
import { Colors } from '../theme/colors';
import { formatCurrency } from '../utils/format';
import { getPrestigeEffects } from '../engine/prestigeEngine';
import { getEconomicCycleEffects } from '../engine/economyEngine';
import { getBusinessRecoveryNeed, getBusinessRecoveryLoans } from '../engine/businessRecoveryEngine';
import GameButton from './GameButton';
import { useGameDialogVisible } from './GameDialog';

export default function BusinessBalanceWarning() {
  const state = useGameStore();
  const router = useRouter();
  const dialogVisible = useGameDialogVisible();
  const [dismissed, setDismissed] = useState<Record<string, number>>({});
  const [entry, setEntry] = useState({ key: '', amount: '' });
  const [message, setMessage] = useState('');
  const scope = `${state.activeSlot}:${state.playerName}:${state.generation}:${state.year}:${state.week}`;
  const business = [...state.businesses].sort((a, b) => a.balance - b.balance).find(b =>
    b.balance < 0 && (dismissed[`${scope}:${b.id}`] === undefined || b.balance < dismissed[`${scope}:${b.id}`]));
  const blocked = dialogVisible || state.isLoading || state.showMainMenu || state.showTutorial || state.showEducationOnboarding
    || state.showContentUpdateModal || state.showReviewPrompt || state.showNameModal || state.showSlotPicker
    || state.showSummary || state.showEventModal || state.showRelationshipEventModal || state.showPeriodReport
    || state.showScheduledAd || state.showEducationCareerReminder || state.showNegativeCashModal || !!state.lifecycle?.isDead;
  if (!business || blocked) return null;
  const key = `${scope}:${business.id}`;
  const need = getBusinessRecoveryNeed(business);
  const amount = entry.key === key ? entry.amount : String(need.target);
  const cashAmount = Number(amount);
  const canInject = !business.holdingCompanyId && Number.isFinite(cashAmount) && cashAmount > 0 && cashAmount <= state.cash;
  const loans = getBusinessRecoveryLoans(business, getPrestigeEffects(state.profile).loan_rate_reduction ?? 0,
    getEconomicCycleEffects(state.economicCycle?.phase ?? 'expansion').interestRateModifier);
  const dismiss = () => {
    setDismissed(previous => ({ ...Object.fromEntries(Object.entries(previous).filter(([k]) => k.startsWith(scope + ':'))), [key]: business.balance }));
    setMessage('');
  };
  const open = (route: '/portfolio' | '/loans' | '/properties' | '/business/holdings') => { dismiss(); router.push(route); };
  const apply = (action: () => void) => {
    const before = business.balance;
    action();
    const after = useGameStore.getState().businesses.find(b => b.id === business.id)?.balance ?? before;
    setMessage(after === before ? 'No funds were added. Review the requirements or choose another source.'
      : after < 0 ? `Still short ${formatCurrency(-after)}. Add more funding or reduce costs.` : '');
  };
  return <Modal visible transparent animationType="fade" onRequestClose={dismiss}>
    <View style={styles.backdrop}><ScrollView style={styles.card} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{business.name} needs funding</Text>
      <Text style={styles.text}>Company cash: {formatCurrency(business.balance)}. Shortfall: {formatCurrency(need.shortfall)}.</Text>
      <Text style={styles.text}>Funding target: {formatCurrency(need.target)}{need.weeklyBurn > 0 ? `, including four weeks of the current ${formatCurrency(need.weeklyBurn)}/week cash loss` : ''}. Borrowing adds repayments; it does not fix operating losses.</Text>
      <Text style={styles.text}>Personal cash: {formatCurrency(state.cash)}</Text>
      {business.holdingCompanyId ? <GameButton label="Fund through Holding treasury" icon="layers-outline" onPress={() => open('/business/holdings')} /> : <>
        <TextInput accessibilityLabel="Cash to inject" keyboardType="numeric" value={amount}
          onChangeText={value => setEntry({ key, amount: value })} style={styles.input} />
        <GameButton disabled={!canInject} label={`Inject ${formatCurrency(Number.isFinite(cashAmount) ? cashAmount : 0)}`} icon="cash-outline"
          onPress={() => apply(() => state.injectCashIntoBusiness(business.id, cashAmount))} />
        {state.cash > 0 && state.cash < need.target && <GameButton variant="secondary" label="Use available personal cash" icon="wallet-outline"
          onPress={() => setEntry({ key, amount: String(Math.floor(state.cash)) })} />}
      </>}
      {loans.map(loan => <View key={loan.kind} style={styles.loan}>
        <Text style={styles.text}>{loan.label}: {formatCurrency(loan.amount)}. Net funding {formatCurrency(loan.netCash)}.</Text>
        <Text style={styles.text}>{loan.durationWeeks} weeks · {(loan.interestRate * 100).toFixed(2)}% total interest · {formatCurrency(loan.weeklyPayment)}/week</Text>
        {loan.reason && <Text style={styles.warning}>{loan.reason}</Text>}
        <GameButton disabled={!loan.allowed} label={`Take ${formatCurrency(loan.amount)}`} icon="card-outline" onPress={() => apply(() => {
          if (loan.kind === 'operating') state.takeBusinessLoan(business.id, loan.amount, 0.10, 52);
          else if (loan.kind === 'revolver') state.drawCorporateRevolver(business.id, loan.amount);
          else state.issueCorporateBond(business.id, loan.amount);
        })} />
      </View>)}
      {message && <Text accessibilityLiveRegion="polite" style={styles.warning}>{message}</Text>}
      {state.holdings.some(h => h.shares > 0) && <GameButton variant="secondary" label="Sell stocks to raise personal cash" icon="trending-up-outline" onPress={() => open('/portfolio')} />}
      {state.properties.length > 0 && <GameButton variant="secondary" label="Review property sales" icon="home-outline" onPress={() => open('/properties')} />}
      <GameButton variant="secondary" label="Review personal loans and deposits" icon="wallet-outline" onPress={() => open('/loans')} />
      <GameButton variant="secondary" label="Review company finances" icon="business-outline" onPress={() => {
        dismiss(); router.push({ pathname: '/business/[id]', params: { id: business.id, section: 'finance' } });
      }} />
      <GameButton variant="ghost" label="Remind me next week" onPress={dismiss} />
    </ScrollView></View>
  </Modal>;
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', padding: 20 },
  card: { flexGrow: 0, maxHeight: '85%', maxWidth: 480, width: '100%', alignSelf: 'center', backgroundColor: Colors.card, borderRadius: 8 },
  content: { padding: 20, gap: 12 },
  title: { color: Colors.textPrimary, fontSize: 20, fontWeight: '700' },
  text: { color: Colors.textSecondary, fontSize: 14, lineHeight: 21 },
  warning: { color: Colors.warning, fontSize: 13, lineHeight: 19 },
  input: { backgroundColor: Colors.elevated, color: Colors.textPrimary, borderRadius: 8, padding: 12 },
  loan: { gap: 8, borderTopWidth: 1, borderTopColor: Colors.cardBorder, paddingTop: 12 },
});
