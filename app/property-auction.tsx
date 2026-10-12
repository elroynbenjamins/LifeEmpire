import React, { useState } from 'react';
import { ScrollView, Text, View, Image, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors } from '../src/theme/colors';
import ScreenHeader from '../src/components/ScreenHeader';
import GameCard from '../src/components/GameCard';
import GameButton from '../src/components/GameButton';
import StatusPill from '../src/components/StatusPill';
import useGameStore from '../src/store/gameStore';
import { formatCurrency } from '../src/utils/format';
import { getInspectionCost, LIVE_AUCTION_ROUNDS } from '../src/engine/auctionEngine';
import type { LiveAuctionOutcome } from '../src/engine/auctionEngine';
import { propertyItemImages } from '../src/assets/itemImages';
import { showGameDialog } from '../src/components/GameDialog';

export default function LivePropertyAuctionScreen() {
  const router = useRouter();
  const { auctionId } = useLocalSearchParams<{ auctionId: string }>();
  const auctions = useGameStore((state) => state.activeAuctions ?? []);
  const cash = useGameStore((state) => state.cash ?? 0);
  const start = useGameStore((state) => state.startPropertyAuctionSession);
  const bid = useGameStore((state) => state.playPropertyAuctionRound);
  const inspect = useGameStore((state) => state.inspectPropertyAuction);
  const leave = useGameStore((state) => state.leavePropertyAuction);
  const [receipt, setReceipt] = useState<LiveAuctionOutcome | null>(null);

  const auction = auctions.find((item) => item.id === auctionId);
  const activeRivals = auction?.aiBidders.filter((bidder) => bidder.active) ?? [];
  const sessionActive = auction?.liveRound !== undefined;
  const otherSessionActive = auctions.some((item) => item.id !== auctionId && item.liveRound !== undefined);
  const minBid = auction ? auction.currentBid + auction.minimumBidIncrease : 0;
  const strongBid = auction ? minBid + auction.minimumBidIncrease * 2 : 0;
  const aggressiveBid = auction ? minBid + auction.minimumBidIncrease * 5 : 0;
  const inspectionCost = auction ? getInspectionCost(auction) : 0;
  const rounds = auction?.liveMaxRounds ?? LIVE_AUCTION_ROUNDS;

  const doBid = (amount: number | null) => {
    if (!auction) return;
    const result = bid(auction.id, amount);
    if (result && result.status !== 'ongoing') setReceipt(result);
  };
  const doInspect = () => {
    if (!auction) return;
    showGameDialog({
      title: 'Inspect this property?',
      message: `Pay ${formatCurrency(inspectionCost)} to reveal its condition, tenant situation and more accurate repair estimates?`,
      confirmText: 'Inspect',
      onConfirm: () => inspect(auction.id),
    });
  };
  const doLeave = () => {
    if (!auction) return;
    showGameDialog({
      title: 'Walk away from auction?',
      message: 'This lot will be removed. New opportunities arrive when you advance an in-game week. Your inspection fee is not refunded.',
      confirmText: 'Walk Away',
      destructive: true,
      onConfirm: () => { leave(auction.id); router.back(); },
    });
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top']}>
      <ScreenHeader title="Auction Room" subtitle="Quick property bidding" showBack onBack={() => router.back()} accentColor={Colors.business} />
      <ScrollView contentContainerStyle={styles.content}>
        {receipt ? (
          <GameCard variant="hero" eyebrow="AUCTION CLOSED" title={receipt.status === 'won' ? 'You won the property!' : receipt.status === 'insufficient_cash' ? 'Purchase could not settle' : 'The rivals won this lot'} accentColor={receipt.status === 'won' ? Colors.business : Colors.warning}>
            <Text style={styles.propertyTitle}>{receipt.propertyName}</Text>
            <Text style={styles.largeValue}>{formatCurrency(receipt.price)}</Text>
            <Text style={styles.note}>
              {receipt.status === 'won'
                ? 'Paid from personal cash. Your property is now in Owned; you can renovate or rent it out.'
                : receipt.status === 'insufficient_cash'
                  ? 'Your remaining cash was below the winning bid, so the sale was cancelled.'
                  : 'You kept your cash. Another auction lot will appear after the next in-game week.'}
            </Text>
            <GameButton compact icon="arrow-back-outline" label="Back to Properties" onPress={() => router.back()} />
          </GameCard>
        ) : !auction ? (
          <GameCard compact>
            <Text style={styles.note}>This auction is no longer available.</Text>
            <GameButton compact label="Back to Properties" onPress={() => router.back()} />
          </GameCard>
        ) : (
          <>
            <GameCard variant="hero" eyebrow={auction.auctionType.toUpperCase()} title={auction.propertyName} accentColor={Colors.business}>
              <View style={styles.imageWrap}>
                <Image source={propertyItemImages[auction.propertyTypeId]} resizeMode="contain" style={styles.propertyImage} accessibilityLabel={`${auction.propertyName} property art`} />
                <View style={styles.propertyInfo}>
                  <Text style={styles.note}>{auction.location}</Text>
                  <StatusPill compact icon="people-outline" label={`${activeRivals.length} active rivals`} color={Colors.info} />
                  {auction.rareOpportunity && <StatusPill compact icon="star-outline" label="Rare lot" color={Colors.warning} />}
                </View>
              </View>
              <View style={styles.statsRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Current price</Text>
                  <Text style={styles.largeValue}>{formatCurrency(auction.currentBid)}</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Estimated value</Text>
                  <Text style={styles.mediumValue}>{formatCurrency(auction.estimatedValueMin)} – {formatCurrency(auction.estimatedValueMax)}</Text>
                </View>
              </View>
              <Text style={styles.note}>Cash available: {formatCurrency(cash)}. Winning auctions settle immediately; repair costs are separate.</Text>
            </GameCard>

            <GameCard compact>
              <Text style={styles.sectionTitle}>Due diligence</Text>
              <View style={styles.statsRow}>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Rental potential</Text>
                  <Text style={styles.mediumValue}>{formatCurrency(auction.expectedWeeklyRent * 4)}/month</Text>
                </View>
                <View style={styles.statCell}>
                  <Text style={styles.statLabel}>Condition / tenant</Text>
                  <Text style={styles.mediumValue}>{auction.conditionKnown ? `${auction.conditionScore}/100` : 'Unknown'} · {auction.tenantStatusKnown ? auction.tenantStatus : 'Unknown'}</Text>
                </View>
              </View>
              {auction.inspectionPurchased ? (
                <>
                  <Text style={styles.note}>Estimated renovation: {formatCurrency(auction.estimatedRenovationCostMin)} – {formatCurrency(auction.estimatedRenovationCostMax)}. Including current price: {formatCurrency(auction.currentBid + auction.estimatedRenovationCostMin)} – {formatCurrency(auction.currentBid + auction.estimatedRenovationCostMax)}.</Text>
                  {auction.hiddenIssueKnown && auction.hiddenIssue && <Text style={styles.warning}>Warning: {auction.hiddenIssue}</Text>}
                </>
              ) : (
                <GameButton compact variant="secondary" icon="search-outline"
                  label={cash >= inspectionCost ? `Inspect • ${formatCurrency(inspectionCost)}` : 'Not enough cash to inspect'}
                  disabled={cash < inspectionCost} onPress={doInspect} />
              )}
            </GameCard>

            <GameCard compact>
              <View style={styles.heading}>
                <Text style={styles.sectionTitle}>{sessionActive ? `Bidding round ${Math.min((auction.liveRound ?? 0) + 1, rounds)} / ${rounds}` : 'Ready to bid?'}</Text>
                {sessionActive && <StatusPill compact icon="hammer-outline" label={auction.playerIsHighestBidder ? 'Your bid leads' : 'Rivals leading'} color={auction.playerIsHighestBidder ? Colors.business : Colors.warning} />}
              </View>
              <View style={styles.progress}>
                {Array.from({ length: rounds }, (_, index) =>
                  <View key={index} style={[styles.progressCell, index < (auction.liveRound ?? 0) && styles.progressDone]} />
                )}
              </View>
              <Text style={styles.note}>{auction.lastRoundMessage ?? 'You have four rounds to compete. Every raise gives competitors a chance to respond.'}</Text>
              <Text style={styles.note}>
                {activeRivals.length > 0
                  ? `Active competitors: ${activeRivals.slice(0, 3).map((rival) => `${rival.name} (${rival.personality})`).join(', ')}${activeRivals.length > 3 ? '…' : ''}`
                  : 'No competitors can afford another minimum raise.'}
              </Text>
              {!sessionActive ? (
                <GameButton compact icon="play-outline" label={otherSessionActive ? 'Finish your other auction first' : 'Start Live Bidding'} disabled={otherSessionActive}
                  onPress={() => {
                    if (!start(auction.id)) showGameDialog({ title: 'Finish the other auction', message: 'Only one bidding session can be active at a time.', confirmText: 'OK' });
                  }} />
              ) : auction.playerIsHighestBidder ? (
                <GameButton compact icon="checkmark-circle-outline" label="Hold Bid · Next Round" onPress={() => doBid(null)} />
              ) : (
                <>
                  <GameButton compact icon="hammer-outline" label={`Minimum Bid · ${formatCurrency(minBid)}`} onPress={() => doBid(minBid)} disabled={cash < minBid} />
                  <View style={styles.bidChoices}>
                    <View style={styles.flexButton}>
                      <GameButton compact variant="secondary" label={`Strong · ${formatCurrency(strongBid)}`} onPress={() => doBid(strongBid)} disabled={cash < strongBid} />
                    </View>
                    <View style={styles.flexButton}>
                      <GameButton compact variant="secondary" label={`Bold · ${formatCurrency(aggressiveBid)}`} onPress={() => doBid(aggressiveBid)} disabled={cash < aggressiveBid} />
                    </View>
                  </View>
                  <GameButton compact variant="ghost" label="Pass this round" onPress={() => doBid(null)} />
                </>
              )}
              {sessionActive && <Text style={styles.note}>Passing does not buy a property. If the room closes with a rival leading, you lose the auction.</Text>}
              <GameButton compact variant="ghost" icon="exit-outline" label={sessionActive ? 'Walk Away' : 'Skip This Lot'} onPress={doLeave} />
            </GameCard>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: 14, paddingBottom: 40, gap: 10 },
  imageWrap: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  propertyImage: { width: 82, height: 76 },
  propertyInfo: { flex: 1, alignItems: 'flex-start', gap: 6 },
  propertyTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '800' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  statCell: { flex: 1, minWidth: 0, padding: 9, backgroundColor: Colors.elevated, borderRadius: 8 },
  statLabel: { fontSize: 10, color: Colors.textMuted },
  largeValue: { fontSize: 18, fontWeight: '900', color: Colors.business, marginTop: 3 },
  mediumValue: { fontSize: 12, fontWeight: '800', color: Colors.textPrimary, marginTop: 4 },
  note: { fontSize: 11, lineHeight: 17, color: Colors.textSecondary, marginTop: 7 },
  warning: { fontSize: 11, lineHeight: 17, color: Colors.negative, fontWeight: '700' },
  sectionTitle: { color: Colors.textPrimary, fontSize: 15, fontWeight: '900' },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 4 },
  progress: { flexDirection: 'row', gap: 4, marginTop: 9 },
  progressCell: { flex: 1, height: 6, backgroundColor: Colors.cardBorder, borderRadius: 5 },
  progressDone: { backgroundColor: Colors.business },
  bidChoices: { flexDirection: 'row', gap: 6 },
  flexButton: { flex: 1, minWidth: 0 },
});
