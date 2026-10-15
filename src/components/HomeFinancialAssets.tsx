import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GameCard from './GameCard';
import { Colors } from '../theme/colors';
import { formatCurrency } from '../utils/format';

export function pairFinancialAssets(hasPortfolio: boolean, hasLoans: boolean, width: number): boolean {
  return hasPortfolio && hasLoans && width >= 355;
}

interface Props {
  viewportWidth: number;
  holdingCount: number;
  portfolioValue: number;
  loanCount: number;
  totalLoanDebt: number;
  onPortfolioPress: () => void;
  onLoansPress: () => void;
}

export default function HomeFinancialAssets({
  viewportWidth, holdingCount, portfolioValue, loanCount, totalLoanDebt, onPortfolioPress, onLoansPress,
}: Props) {
  const hasPortfolio = holdingCount > 0;
  const hasLoans = totalLoanDebt > 0;
  if (!hasPortfolio && !hasLoans) return null;
  const paired = pairFinancialAssets(hasPortfolio, hasLoans, viewportWidth);
  const portfolioCard = hasPortfolio ? (
    <GameCard title="Portfolio" compact={paired} style={paired ? styles.card : undefined} onPress={onPortfolioPress}>
      <Text style={[paired ? styles.compactValue : styles.value, { color: Colors.primary }]}
        numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{formatCurrency(portfolioValue)}</Text>
      <Text style={paired ? styles.smallCaption : styles.caption}>{holdingCount} stock{holdingCount === 1 ? '' : 's'} owned</Text>
    </GameCard>
  ) : null;
  const loansCard = hasLoans ? (
    <GameCard title="Active Loans" compact={paired} style={paired ? styles.card : undefined} onPress={onLoansPress}>
      <Text style={[paired ? styles.compactValue : styles.value, { color: Colors.negative }]}
        numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{formatCurrency(totalLoanDebt)}</Text>
      <Text style={paired ? styles.smallCaption : styles.caption}>{loanCount} active loan{loanCount === 1 ? '' : 's'}</Text>
    </GameCard>
  ) : null;
  if (!paired) return <>{portfolioCard}{loansCard}</>;
  return <View style={styles.row} testID="home-financial-pair">
    <View style={styles.column}>{portfolioCard}</View>
    <View style={styles.column}>{loansCard}</View>
  </View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8 },
  column: { flex: 1, minWidth: 0 },
  card: { minHeight: 98, paddingHorizontal: 9, paddingVertical: 8 },
  value: { fontSize: 20, fontWeight: '700' },
  compactValue: { fontSize: 17, fontWeight: '800' },
  caption: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  smallCaption: { color: Colors.textMuted, fontSize: 10, marginTop: 4 },
});
