import React from 'react';
import { act, fireEvent, render } from '@testing-library/react-native';
import useGameStore from '../../store/gameStore';
import { INITIAL_GAME_STATE } from '../../types/game';
import { createBusiness } from '../../engine/businessEngine';
import BusinessBalanceWarning from '../BusinessBalanceWarning';

jest.mock('../../store/gameStore', () => ({
  __esModule: true, default: require('zustand').create(() => ({})),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
const mockPush = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ push: mockPush }) }));

beforeEach(() => {
  mockPush.mockClear();
  useGameStore.setState({
    ...INITIAL_GAME_STATE, isLoading: false, initialized: true, showMainMenu: false,
    showTutorial: false, showEducationOnboarding: false, showSlotPicker: false,
    showNameModal: false, showContentUpdateModal: false, cash: 20_000_000,
    profile: { unlockedPrestige: [], gems: 0, prestigePoints: 0 } as any,
    businesses: [{ ...createBusiness('coffee_shop', 'Debt Test', 1, 1, 1)!, balance: -17_000_000, lastWeekProfit: 0 }],
    injectCashIntoBusiness: jest.fn(),
  });
});

test('prefills the entire deficit and a rejected injection does not dismiss the warning', () => {
  const view = render(<BusinessBalanceWarning />);
  expect(view.getByLabelText('Cash to inject').props.value).toBe('17000000');
  fireEvent.press(view.getByText(/^Inject /));
  expect(view.getByText(/No funds were added/)).toBeTruthy();
  expect(view.getByText('Debt Test needs funding')).toBeTruthy();
});

test('partial funding keeps the warning visible; clearing the deficit hides it', () => {
  useGameStore.setState({ injectCashIntoBusiness: (_id, amount) => {
    const state = useGameStore.getState();
    useGameStore.setState({ businesses: [{ ...state.businesses[0], balance: state.businesses[0].balance + amount }] });
  } });
  const view = render(<BusinessBalanceWarning />);
  fireEvent.changeText(view.getByLabelText('Cash to inject'), '25000');
  fireEvent.press(view.getByText(/^Inject /));
  expect(view.getByText(/Still short/)).toBeTruthy();
  act(() => useGameStore.setState({ businesses: [{ ...useGameStore.getState().businesses[0], balance: 0 }] }));
  expect(view.queryByText('Debt Test needs funding')).toBeNull();
});

test('snoozing lasts only until next week or a worsening balance', () => {
  const view = render(<BusinessBalanceWarning />);
  fireEvent.press(view.getByText('Remind me next week'));
  expect(view.queryByText('Debt Test needs funding')).toBeNull();
  act(() => useGameStore.setState({ week: 2 }));
  expect(view.getByText('Debt Test needs funding')).toBeTruthy();
  fireEvent.press(view.getByText('Remind me next week'));
  act(() => useGameStore.setState({ businesses: [{ ...useGameStore.getState().businesses[0], balance: -18_000_000 }] }));
  expect(view.getByText('Debt Test needs funding')).toBeTruthy();
});

test('subsidiaries route funding through the holding instead of a rejected personal injection', () => {
  useGameStore.setState({ businesses: [{ ...useGameStore.getState().businesses[0], holdingCompanyId: 'parent' }] });
  const view = render(<BusinessBalanceWarning />);
  expect(view.queryByLabelText('Cash to inject')).toBeNull();
  fireEvent.press(view.getByText('Fund through Holding treasury'));
  expect(mockPush).toHaveBeenCalledWith('/business/holdings');
});
