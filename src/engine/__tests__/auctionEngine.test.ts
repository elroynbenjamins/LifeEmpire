import { auctionToProperty, ensureAuctions, getInspectionCost, getReservedAuctionBidTotal, inspectAuction, leaveAuction, placeAuctionBid, LIVE_AUCTION_ROUNDS, playLiveAuctionTurn, startLiveAuction } from '../auctionEngine';

describe('real-estate auctions', () => {
  test('generates a playable early-game auction set', () => {
    const auctions = ensureAuctions([], 1, 1, 10_000);
    expect(auctions).toHaveLength(3);
    for (const auction of auctions) {
      expect(auction.currentBid).toBe(auction.startingBid);
      expect(auction.currentBid).toBeLessThan(auction.marketValue);
      expect(auction.aiBidders.length).toBeGreaterThanOrEqual(2);
      expect(auction.aiBidders.length).toBeLessThanOrEqual(5);
      expect(auction.auctionEndWeek).toBe(0); // No weekly deadline.
    }
  });

  test('inspection narrows estimates and reveals property information', () => {
    const auction = ensureAuctions([], 10, 1, 100_000)[0];
    const inspected = inspectAuction(auction);
    expect(getInspectionCost(auction)).toBe(Math.round(Math.max(500, auction.marketValue * 0.003)));
    expect(inspected.inspectionPurchased).toBe(true);
    expect(inspected.conditionKnown).toBe(true);
    expect(inspected.tenantStatusKnown).toBe(true);
    expect(inspected.estimatedValueMax - inspected.estimatedValueMin).toBeLessThan(auction.estimatedValueMax - auction.estimatedValueMin);
  });

  test('records a valid player bid and transfers a win into the shared property model', () => {
    const auction = ensureAuctions([], 5, 1, 1_000_000)[0];
    const amount = auction.currentBid + auction.minimumBidIncrease;
    const bidAuction = placeAuctionBid({ ...auction, aiBidders: [] }, amount);
    expect(bidAuction.playerIsHighestBidder).toBe(true);
    expect(bidAuction.playerHighestBid).toBe(amount);

    const property = auctionToProperty(bidAuction, 6, 1);
    expect(property.acquisitionType).toBe('auction');
    expect(property.purchasePrice).toBe(amount);
    expect(property.auctionCosts).toBeGreaterThanOrEqual(bidAuction.actualRenovationCost);
    expect(property.isRentedOut).toBe(false);
  });

  test('expands the late-game auction pool to six auctions and advanced asset types', () => {
    let seed = 717;
    const random = jest.spyOn(Math, 'random').mockImplementation(() => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296));
    const auctions = ensureAuctions([], 500, 1.5, 10_000_000);
    const generatedTypes = new Set(Array.from({ length: 120 }, () => ensureAuctions([], 500, 1.5, 10_000_000)[0].auctionType));
    random.mockRestore();
    expect(auctions).toHaveLength(6);
    expect(generatedTypes.has('Luxury Auction')).toBe(true);
    expect(generatedTypes.has('Commercial Auction')).toBe(true);
    expect(generatedTypes.has('Development Land Auction')).toBe(true);
  });

  test('AI counterbids persist eliminated rivals and respect the minimum increase', () => {
    const base = ensureAuctions([], 6, 1, 500_000)[0];
    const amount = base.currentBid + base.minimumBidIncrease;
    const auction = {
      ...base,
      aiBidders: [
        { id: 'a', name: 'Conservative Investor', personality: 'Conservative' as const, maxBid: amount, active: true },
        { id: 'b', name: 'Professional Investor', personality: 'Professional' as const, maxBid: amount + base.minimumBidIncrease * 3, active: true },
      ],
    };
    const random = jest.spyOn(Math, 'random').mockReturnValue(0);
    let updated: typeof base;
    try {
      updated = placeAuctionBid(auction, amount);
    } finally {
      random.mockRestore();
    }
    expect(updated.playerIsHighestBidder).toBe(false);
    expect(updated.currentBid).toBe(amount + auction.minimumBidIncrease);
    expect(updated.aiBidders[0].active).toBe(false);
    expect(updated.aiBidders[1].active).toBe(true);
    expect(auction.aiBidders[0].active).toBe(true); // Pure update, no mutation.
  });

  test('a leading player cannot bid against themselves and can withdraw', () => {
    const base = ensureAuctions([], 8, 1, 500_000)[0];
    const amount = base.currentBid + base.minimumBidIncrease;
    const winning = placeAuctionBid({ ...base, aiBidders: [] }, amount);
    expect(winning.playerIsHighestBidder).toBe(true);
    expect(placeAuctionBid(winning, amount + winning.minimumBidIncrease)).toBe(winning);
    const withdrawn = leaveAuction(winning);
    expect(withdrawn.playerIsHighestBidder).toBe(false);
    expect(withdrawn.playerHighestBid).toBe(0);
    expect(withdrawn.currentBid).toBe(base.startingBid);
  });

  test('leading commitments are excluded from cash available to other auctions', () => {
    const [a, b, c] = ensureAuctions([], 8, 1, 500_000);
    const active = [
      { ...a, currentBid: 12000, playerIsHighestBidder: true },
      { ...b, currentBid: 18000, playerIsHighestBidder: true },
      { ...c, currentBid: 10000, playerIsHighestBidder: false },
    ];
    expect(getReservedAuctionBidTotal(active)).toBe(30000);
    expect(getReservedAuctionBidTotal(active, a.id)).toBe(18000);
    expect(getReservedAuctionBidTotal(active, b.id)).toBe(12000);
  });

  test('saved legacy bids convert into uncommitted auction rooms', () => {
    const oldAuction = ensureAuctions([], 2, 1, 100_000)[0];
    const legacy = {
      ...oldAuction,
      currentBid: oldAuction.startingBid + oldAuction.minimumBidIncrease,
      playerHighestBid: oldAuction.startingBid,
      playerIsHighestBidder: true,
      auctionEndWeek: 3,
    };
    const [migrated] = ensureAuctions([legacy], 5, 1, 100_000, false);
    expect(migrated.currentBid).toBe(legacy.startingBid);
    expect(migrated.playerHighestBid).toBe(0);
    expect(migrated.playerIsHighestBidder).toBe(false);
    expect(migrated.liveRound).toBeUndefined();
  });

  test('active live sessions retain their current bids across load and week advancement', () => {
    const auction = startLiveAuction(ensureAuctions([], 2, 1, 100_000)[0]);
    const first = playLiveAuctionTurn({ ...auction, aiBidders: [] }, auction.currentBid + auction.minimumBidIncrease);
    expect(first?.finished).toBe(true);
    expect(first?.won).toBe(true);
    const held = ensureAuctions([first!.auction], 20, 1.1, 100_000, false);
    expect(held[0].liveRound).toBe(1);
    expect(held[0].currentBid).toBe(first!.auction.currentBid);
    expect(held).toHaveLength(1);
  });

  test('live bidding closes in four player rounds, with an immediate winner and no timer', () => {
    const auction = startLiveAuction(ensureAuctions([], 5, 1, 100_000)[0]);
    expect(auction.liveRound).toBe(0);
    const random = jest.spyOn(Math, 'random').mockReturnValue(0);
    let current: typeof auction = { ...auction, aiBidders: [{
      id: 'wealthy', name: 'Wealthy', personality: 'Professional' as const,
      maxBid: 10_000_000, active: true,
    }] };
    let last;
    try {
      for (let round = 0; round < LIVE_AUCTION_ROUNDS; round++) {
        last = playLiveAuctionTurn(current, null);
        expect(last).not.toBeNull();
        current = last!.auction;
        expect(current.liveRound).toBe(round + 1);
        expect(last!.finished).toBe(round === LIVE_AUCTION_ROUNDS - 1);
      }
    } finally {
      random.mockRestore();
    }
    expect(last!.won).toBe(false);
    expect(playLiveAuctionTurn(current, null)).toBeNull();
  });

  test('live bidding enforces one new bid per round and avoids bidding against yourself', () => {
    const started = startLiveAuction(ensureAuctions([], 5, 1, 100_000)[0]);
    const offer = started.currentBid + started.minimumBidIncrease;
    expect(playLiveAuctionTurn(started, offer - 1)).toBeNull();
    const first = playLiveAuctionTurn({ ...started, aiBidders: [{
      id: 'strong', name: 'Big Bidder', personality: 'Aggressive' as const,
      maxBid: 10_000_000, active: true,
    }] }, offer);
    expect(first).not.toBeNull();
    // A leading bid can only be held, never raised against the player.
    const leading = { ...first!.auction, playerIsHighestBidder: true };
    expect(playLiveAuctionTurn(leading, leading.currentBid + leading.minimumBidIncrease)).toBeNull();
    expect(playLiveAuctionTurn(leading, null)).not.toBeNull();
  });

  test('closed auction slots only refill on the next normal in-game week', () => {
    const [a] = ensureAuctions([], 2, 1, 100_000);
    expect(ensureAuctions([a], 2, 1, 100_000, false)).toHaveLength(1);
    expect(ensureAuctions([a], 3, 1, 100_000)).toHaveLength(3);
  });
});
