import useGameStore from '../gameStore';
import { createBusiness } from '../../engine/businessEngine';
import { INITIAL_GAME_STATE, INITIAL_PROFILE } from '../../types/game';

jest.mock('../../utils/storage', () => ({ saveGame: jest.fn(), saveProfile: jest.fn() }));

beforeEach(() => {
  useGameStore.setState({ ...INITIAL_GAME_STATE, profile: INITIAL_PROFILE,
    businesses: [createBusiness('coffee_shop', 'Borrower', 1, 1, 1)!] });
});

test('store rejects oversized startup loans and invented terms', () => {
  const before = useGameStore.getState().businesses[0];
  useGameStore.getState().takeBusinessLoan(before.id, 5_000_000, 0.075, 160);
  useGameStore.getState().takeBusinessLoan(before.id, 50_000, 0, 10000);
  expect(useGameStore.getState().businesses[0]).toEqual(before);
});

test('startup can borrow once but cannot exceed its total allowance', () => {
  const id = useGameStore.getState().businesses[0].id;
  useGameStore.getState().takeBusinessLoan(id, 50_000, 0.10, 52);
  expect(useGameStore.getState().businesses[0].businessLoans).toHaveLength(1);
  const funded = useGameStore.getState().businesses[0];
  useGameStore.getState().takeBusinessLoan(id, 10_000, 0.14, 26);
  expect(useGameStore.getState().businesses[0]).toEqual(funded);
});

test('rescue calls cannot bypass affordability', () => {
  const business = { ...useGameStore.getState().businesses[0], balance: -17_000_000, lastWeekProfit: -100_000 };
  useGameStore.setState({ businesses: [business] });
  useGameStore.getState().takeBusinessLoan(business.id, 17_400_000, 0.10, 52);
  expect(useGameStore.getState().businesses[0]).toEqual(business);
});
