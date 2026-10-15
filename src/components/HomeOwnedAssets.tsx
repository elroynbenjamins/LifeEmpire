import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import GameCard from './GameCard';
import { Colors } from '../theme/colors';
import { formatCurrency } from '../utils/format';

/** Keep a readable two-column Home overview when both asset types are owned. */
export function shouldPairOwnedAssetCards(businessCount: number, propertyCount: number, viewportWidth: number): boolean {
  return businessCount > 0 && propertyCount > 0 && viewportWidth >= 355;
}

type Props = {
  viewportWidth: number;
  businessCount: number;
  weeklyBusinessProfit: number;
  businessAttentionCount: number;
  businessCrisisCount: number;
  propertyCount: number;
  rentalIncome: number;
  onBusinessesPress: () => void;
  onPropertiesPress: () => void;
};

export default function HomeOwnedAssets({
  viewportWidth, businessCount, weeklyBusinessProfit, businessAttentionCount,
  businessCrisisCount, propertyCount, rentalIncome, onBusinessesPress, onPropertiesPress,
}: Props) {
  const paired = shouldPairOwnedAssetCards(businessCount, propertyCount, viewportWidth);
  if (!businessCount && !propertyCount) return null;

  const businessCard = businessCount > 0 ? (
    <GameCard title="My Businesses" compact={paired} onPress={onBusinessesPress}
      style={paired ? styles.compactCard : undefined}>
      <Text style={[styles.count, paired && styles.compactCount]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {businessCount} business{businessCount !== 1 ? 'es' : ''}
      </Text>
      {paired ? (
        <>
          <Text style={styles.compactCaption}>Weekly P&L</Text>
          <Text style={[styles.compactValue, { color: weeklyBusinessProfit < 0 ? Colors.negative : Colors.textPrimary }]}
            numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {weeklyBusinessProfit >= 0 ? '+' : ''}{formatCurrency(weeklyBusinessProfit)}
          </Text>
        </>
      ) : (
        <Text style={styles.caption}>
          Weekly P&L: {weeklyBusinessProfit >= 0 ? '+' : ''}{formatCurrency(weeklyBusinessProfit)}
        </Text>
      )}
      {businessAttentionCount > 0 && (
        <Text style={[paired ? styles.compactNotice : styles.caption,
          { color: businessCrisisCount > 0 ? Colors.negative : Colors.warning, fontWeight: '700' }]}
          numberOfLines={paired ? 2 : undefined}>
          {paired
            ? `${businessAttentionCount} need attention${businessCrisisCount > 0 ? ` · ${businessCrisisCount} crisis` : ''}`
            : `${businessAttentionCount} compan${businessAttentionCount === 1 ? 'y needs' : 'ies need'} attention${businessCrisisCount > 0 ? ` • ${businessCrisisCount} crisis${businessCrisisCount === 1 ? '' : 'es'}` : ''}`}
        </Text>
      )}
    </GameCard>
  ) : null;

  const propertyCard = propertyCount > 0 ? (
    <GameCard title="Real Estate" compact={paired} onPress={onPropertiesPress}
      style={paired ? styles.compactCard : undefined}>
      <Text style={[styles.count, paired && styles.compactCount]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
        {propertyCount} propert{propertyCount !== 1 ? 'ies' : 'y'}
      </Text>
      {paired ? (
        <>
          <Text style={styles.compactCaption}>Rental income / wk</Text>
          <Text style={styles.compactValue} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
            {formatCurrency(rentalIncome)}
          </Text>
        </>
      ) : (
        <Text style={styles.caption}>Rental Income: {formatCurrency(rentalIncome)}/wk</Text>
      )}
    </GameCard>
  ) : null;

  if (!paired) return <>{businessCard}{propertyCard}</>;

  return (
    <View style={styles.row} testID="home-owned-assets-pair">
      <View style={styles.column}>{businessCard}</View>
      <View style={styles.column}>{propertyCard}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 8, alignItems: 'stretch' },
  column: { flex: 1, minWidth: 0 },
  compactCard: { minHeight: 142, paddingHorizontal: 10, paddingVertical: 11 },
  count: { color: Colors.primary, fontSize: 20, fontWeight: '700' },
  compactCount: { fontSize: 17, lineHeight: 22 },
  caption: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  compactCaption: { color: Colors.textMuted, fontSize: 10, marginTop: 7 },
  compactValue: { color: Colors.textPrimary, fontSize: 14, fontWeight: '800', marginTop: 2 },
  compactNotice: { fontSize: 10, lineHeight: 13, marginTop: 5 },
});
