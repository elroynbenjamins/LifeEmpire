import { OwnedProperty, RealEstateAuction, AuctionBidder, AuctionType } from '../types/game';
import propertiesData from '../data/properties.json';

const LOCATIONS = ['Amsterdam', 'Rotterdam', 'Utrecht', 'The Hague', 'Eindhoven', 'Groningen', 'Brussels', 'Berlin', 'Paris', 'Madrid', 'Lisbon', 'London'];
const ISSUES = ['Damaged roof', 'Electrical problems', 'Plumbing damage', 'Mold', 'Poor insulation', 'Foundation issue', 'Problem tenants', 'Property vandalism', 'Asbestos removal', 'Unpaid service charges', 'Fire-safety violations', 'Soil contamination'];
const TYPES: AuctionType[] = ['Foreclosure', 'Estate Sale', 'Bank Repossession', 'Government Auction'];
const BIDDER_NAMES = ['Northstar Capital', 'Van Dijk Properties', 'Atlas Holdings', 'UrbanStone', 'Crown Estates', 'Horizon Investments'];

const AUCTION_CONFIG: Record<AuctionType, { startMin: number; startMax: number; conditionMin: number; conditionMax: number; competition: number }> = {
  Foreclosure: { startMin: 0.55, startMax: 0.78, conditionMin: 25, conditionMax: 72, competition: 0 },
  'Estate Sale': { startMin: 0.68, startMax: 0.88, conditionMin: 48, conditionMax: 90, competition: -1 },
  'Bank Repossession': { startMin: 0.58, startMax: 0.82, conditionMin: 30, conditionMax: 78, competition: 0 },
  'Government Auction': { startMin: 0.62, startMax: 0.86, conditionMin: 40, conditionMax: 86, competition: -1 },
  'Luxury Auction': { startMin: 0.72, startMax: 0.92, conditionMin: 55, conditionMax: 96, competition: 2 },
  'Commercial Auction': { startMin: 0.60, startMax: 0.86, conditionMin: 38, conditionMax: 85, competition: 1 },
  'Development Land Auction': { startMin: 0.52, startMax: 0.80, conditionMin: 55, conditionMax: 95, competition: 0 },
};

const randomBetween = (min: number, max: number) => min + Math.random() * (max - min);
const round500 = (value: number) => Math.max(500, Math.round(value / 500) * 500);

function createBidders(marketValue: number, auctionType: AuctionType): AuctionBidder[] {
  const luxury = auctionType === 'Luxury Auction';
  const count = Math.max(2, Math.min(5, 2 + AUCTION_CONFIG[auctionType].competition + Math.floor(Math.random() * 4)));
  return Array.from({ length: count }, (_, index) => {
    const roll = Math.random();
    const personality: AuctionBidder['personality'] = luxury && roll > 0.7 ? 'Wealthy Collector' : roll < 0.3 ? 'Conservative' : roll < 0.75 ? 'Professional' : 'Aggressive';
    const range = personality === 'Conservative' ? [0.75, 0.9] : personality === 'Professional' ? [0.85, 1] : personality === 'Aggressive' ? [0.95, 1.1] : [1, 1.25];
    return { id: `bidder_${index}_${Math.random().toString(36).slice(2, 5)}`, name: BIDDER_NAMES[index % BIDDER_NAMES.length], personality, maxBid: round500(marketValue * randomBetween(range[0], range[1])), active: true };
  });
}

export function generateAuction(globalWeek: number, inflationMultiplier: number, netWorth: number): RealEstateAuction {
  const progressionEligible = (propertiesData as any[]).filter((property) => {
    if (property.type === 'luxury' && netWorth < 1_000_000) return false;
    if (property.type === 'land' && netWorth < 500_000) return false;
    if (['industrial', 'hospitality'].includes(property.type) && netWorth < 250_000) return false;
    return netWorth >= property.purchasePrice * 0.25;
  });
  const unlocked = progressionEligible.sort((a, b) => a.purchasePrice - b.purchasePrice);
  const property = (unlocked.length ? unlocked : (propertiesData as any[]).slice(0, 2))[Math.floor(Math.random() * (unlocked.length || 2))];
  const auctionType: AuctionType = property.type === 'land' ? 'Development Land Auction'
    : property.type === 'luxury' ? 'Luxury Auction'
      : netWorth >= 250_000 && ['commercial', 'industrial', 'hospitality'].includes(property.type) ? 'Commercial Auction'
        : TYPES[Math.floor(Math.random() * TYPES.length)];
  const config = AUCTION_CONFIG[auctionType];
  const rareOpportunity = Math.random() < 0.08;
  const marketValue = round500(property.purchasePrice * inflationMultiplier * randomBetween(0.9, 1.12));
  const conditionScore = Math.round(randomBetween(config.conditionMin, config.conditionMax));
  const renovation = round500((100 - conditionScore) / 100 * marketValue * randomBetween(0.08, 0.22));
  const uncertainty = 0.18;
  const startingBid = round500(marketValue * (rareOpportunity ? randomBetween(0.38, 0.56) : randomBetween(config.startMin, config.startMax)));
  const hiddenIssue = conditionScore < 65 || Math.random() < 0.3 ? ISSUES[Math.floor(Math.random() * ISSUES.length)] : null;
  return {
    id: `auction_${globalWeek}_${Math.random().toString(36).slice(2, 8)}`,
    propertyName: `${auctionType === 'Foreclosure' ? 'Foreclosed ' : rareOpportunity ? 'Rare ' : ''}${property.name}`,
    propertyTypeId: property.id,
    location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
    auctionType, marketValue, estimatedValueMin: round500(marketValue * (1 - uncertainty)), estimatedValueMax: round500(marketValue * (1 + uncertainty)),
    startingBid, currentBid: startingBid, minimumBidIncrease: round500(Math.max(1000, marketValue * 0.025)), expectedWeeklyRent: Math.round(property.weeklyRentalIncome * inflationMultiplier * conditionScore / 100),
    conditionScore, conditionKnown: false, estimatedRenovationCostMin: round500(renovation * 0.7), estimatedRenovationCostMax: round500(renovation * 1.35), actualRenovationCost: renovation,
    inspectionPurchased: false, inspectionCostPaid: 0, tenantStatus: property.type === 'land' ? 'Not applicable' : Math.random() < 0.12 ? 'Tenant refusing to leave' : Math.random() < 0.28 ? 'Problem tenant' : Math.random() < 0.62 ? 'Occupied' : 'Vacant', tenantStatusKnown: property.type === 'land',
    auctionEndWeek: 0, // legacy persisted field; live auctions have no weekly deadline
    aiBidders: createBidders(marketValue, auctionType), playerHighestBid: 0, playerIsHighestBidder: false, hiddenIssue, hiddenIssueKnown: false, rareOpportunity,
  };
}

export function ensureAuctions(active: RealEstateAuction[], globalWeek: number, inflation: number, netWorth: number, allowRefill = true): RealEstateAuction[] {
  const target = netWorth >= 2_000_000 ? 6 : netWorth >= 500_000 ? 5 : 3;
  // Migrate old weekly auctions without collecting legacy leading bids.
  // Live sessions keep their current round when restoring a save.
  const result = [...active].map((auction) => auction.liveRound === undefined
    ? {
        ...auction,
        currentBid: auction.startingBid,
        playerHighestBid: 0,
        playerIsHighestBidder: false,
        aiBidders: auction.aiBidders.map((bidder) => ({ ...bidder, active: true })),
      }
    : auction);
  while (allowRefill && result.length < target) result.push(generateAuction(globalWeek, inflation, netWorth));
  return result;
}

/** Money already committed to leading auction bids cannot back another bid. */
export function getReservedAuctionBidTotal(auctions: RealEstateAuction[], excludedAuctionId?: string): number {
  return (auctions ?? []).reduce((total, auction) =>
    total + (auction.id !== excludedAuctionId && auction.playerIsHighestBidder ? auction.currentBid : 0), 0);
}

export function placeAuctionBid(auction: RealEstateAuction, amount: number): RealEstateAuction {
  if (auction.playerIsHighestBidder || !Number.isFinite(amount) || amount < auction.currentBid + auction.minimumBidIncrease) return auction;
  let currentBid = amount;
  let highest = true;
  const bidders = auction.aiBidders.map((bidder) => ({ ...bidder }));
  const eligible = bidders.filter((bidder) => bidder.active && bidder.maxBid >= amount + auction.minimumBidIncrease);

  if (eligible.length > 0) {
    const bidder = eligible[Math.floor(Math.random() * eligible.length)];
    const chance = bidder.personality === 'Conservative' ? 0.65
      : bidder.personality === 'Professional' ? 0.78
        : bidder.personality === 'Wealthy Collector' ? 0.95 : 0.9;
    if (Math.random() < chance) {
      currentBid = Math.min(bidder.maxBid, amount + auction.minimumBidIncrease * (1 + Math.floor(Math.random() * 2)));
      highest = false;
    }
  }

  // Persist dropouts: competitors who cannot afford another minimum raise stay out.
  const updatedBidders = bidders.map((bidder) => ({
    ...bidder,
    active: bidder.active && bidder.maxBid >= currentBid + auction.minimumBidIncrease,
  }));
  return {
    ...auction,
    currentBid,
    aiBidders: updatedBidders,
    playerHighestBid: Math.max(auction.playerHighestBid, amount),
    playerIsHighestBidder: highest,
  };
}

export function leaveAuction(auction: RealEstateAuction): RealEstateAuction {
  if (!auction.playerIsHighestBidder && auction.playerHighestBid === 0) return auction;
  if (!auction.playerIsHighestBidder) return { ...auction, playerHighestBid: 0 };

  // Withdraw the leading offer. A remaining bidder may match the withdrawn
  // price; otherwise the auction falls back to its opening bid.
  const successor = auction.aiBidders.find((bidder) => bidder.active && bidder.maxBid >= auction.currentBid);
  const currentBid = successor ? auction.currentBid : auction.startingBid;
  return {
    ...auction,
    playerHighestBid: 0,
    playerIsHighestBidder: false,
    currentBid,
    aiBidders: auction.aiBidders.map((bidder) => ({
      ...bidder,
      active: bidder.active && bidder.maxBid >= currentBid + auction.minimumBidIncrease,
    })),
  };
}


/** Four deliberate player turns replace the former multi-week deadline. */
export const LIVE_AUCTION_ROUNDS = 4;

export interface LiveAuctionTurn {
  auction: RealEstateAuction;
  finished: boolean;
  won: boolean;
  message: string;
}

export interface LiveAuctionOutcome {
  status: 'ongoing' | 'won' | 'lost' | 'insufficient_cash';
  propertyName: string;
  price: number;
  message: string;
}

export function startLiveAuction(auction: RealEstateAuction): RealEstateAuction {
  if (auction.liveRound !== undefined) return auction;
  return {
    ...auction,
    liveRound: 0,
    liveMaxRounds: LIVE_AUCTION_ROUNDS,
    currentBid: auction.startingBid,
    playerHighestBid: 0,
    playerIsHighestBidder: false,
    lastRoundMessage: 'The auctioneer has opened the bidding. Choose your first offer or pass.',
  };
}

/** One deliberate turn: raise the price or hold, then let one AI rival respond. */
export function playLiveAuctionTurn(auction: RealEstateAuction, offer: number | null): LiveAuctionTurn | null {
  if (auction.liveRound === undefined || auction.liveRound >= (auction.liveMaxRounds ?? LIVE_AUCTION_ROUNDS)) return null;
  if (offer !== null && (
    auction.playerIsHighestBidder || !Number.isFinite(offer) || offer < auction.currentBid + auction.minimumBidIncrease
  )) return null;

  let price = offer ?? auction.currentBid;
  let playerLeading = offer !== null ? true : auction.playerIsHighestBidder;
  let highestPlayerOffer = offer !== null ? Math.max(auction.playerHighestBid, offer) : auction.playerHighestBid;
  const nextBid = price + auction.minimumBidIncrease;
  let bidders = auction.aiBidders.map((bidder) => ({
    ...bidder,
    active: bidder.active && bidder.maxBid >= nextBid,
  }));
  const eligible = bidders.filter((bidder) => bidder.active);
  let message = offer !== null
    ? 'You raised your offer. The auction room is watching.'
    : playerLeading ? 'You held your leading bid.' : 'You passed this round.';

  if (eligible.length > 0) {
    const rival = eligible[Math.floor(Math.random() * eligible.length)];
    const chance = rival.personality === 'Conservative' ? 0.65
      : rival.personality === 'Professional' ? 0.8
        : rival.personality === 'Wealthy Collector' ? 0.95 : 0.9;
    if (Math.random() < chance) {
      price = Math.min(rival.maxBid, nextBid + (Math.random() < 0.35 ? auction.minimumBidIncrease : 0));
      playerLeading = false;
      message = `${rival.name} (${rival.personality}) countered at ${Math.round(price).toLocaleString('en-US')}. ${eligible.length} rival(s) were in contention.`;
    } else {
      message = playerLeading ? 'Rivals hesitated. Your bid still leads.' : 'No rival raised this round.';
    }
  } else {
    message = playerLeading ? 'The other bidders dropped out. Your offer stands!' : 'No rival is willing to raise.';
  }

  bidders = bidders.map((bidder) => ({
    ...bidder,
    active: bidder.active && bidder.maxBid >= price + auction.minimumBidIncrease,
  }));
  const liveRound = auction.liveRound + 1;
  const finished = liveRound >= (auction.liveMaxRounds ?? LIVE_AUCTION_ROUNDS)
    || (playerLeading && bidders.every((bidder) => !bidder.active));
  const updated: RealEstateAuction = {
    ...auction,
    currentBid: price,
    playerHighestBid: highestPlayerOffer,
    playerIsHighestBidder: playerLeading,
    aiBidders: bidders,
    liveRound,
    lastRoundMessage: message,
  };
  return { auction: updated, finished, won: finished && playerLeading && highestPlayerOffer > 0, message };
}

export function getInspectionCost(auction: RealEstateAuction): number {
  return Math.round(Math.max(500, auction.marketValue * 0.003));
}

export function inspectAuction(auction: RealEstateAuction): RealEstateAuction {
  return { ...auction, inspectionPurchased: true, conditionKnown: true, tenantStatusKnown: true, hiddenIssueKnown: !!auction.hiddenIssue && Math.random() < 0.75, estimatedValueMin: round500(auction.marketValue * 0.96), estimatedValueMax: round500(auction.marketValue * 1.04), estimatedRenovationCostMin: round500(auction.actualRenovationCost * 0.9), estimatedRenovationCostMax: round500(auction.actualRenovationCost * 1.1) };
}

export function auctionToProperty(auction: RealEstateAuction, week: number, year: number): OwnedProperty {
  const data = (propertiesData as any[]).find((item) => item.id === auction.propertyTypeId);
  const issueCost = auction.hiddenIssue ? Math.round(auction.actualRenovationCost * 0.25) : 0;
  return { id: `prop_auction_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, typeId: auction.propertyTypeId, name: auction.propertyName, purchasePrice: auction.currentBid, currentValue: Math.round(auction.marketValue * (0.75 + auction.conditionScore / 400)), isRentedOut: false, isRenovated: false, purchaseWeek: week, purchaseYear: year, weeklyIncome: auction.expectedWeeklyRent, weeklyMaintenance: Math.round((data?.weeklyMaintenance ?? 50) * (1 + (100 - auction.conditionScore) / 100)), acquisitionType: 'auction', conditionScore: auction.conditionScore, hiddenIssue: auction.hiddenIssue, auctionCosts: auction.actualRenovationCost + issueCost, inspectionCostPaid: auction.inspectionCostPaid ?? 0 };
}
