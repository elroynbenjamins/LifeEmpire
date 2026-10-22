import React from 'react';
import { act, render, waitFor } from '@testing-library/react-native';
import useGameStore from '../../store/gameStore';
import { INITIAL_GAME_STATE } from '../../types/game';
import ScheduledAdModal from '../ScheduledAdModal';
import { loadInterstitialAd, showInterstitialAd } from '../../services/adManager';

jest.mock('../../store/gameStore', () => ({
  __esModule: true, default: require('zustand').create(() => ({})),
}));
jest.mock('../../services/runtimeEnvironment', () => ({ shouldSimulateNativeFeatures: () => false }));
jest.mock('../../services/adManager', () => ({
  loadInterstitialAd: jest.fn(async () => true),
  showInterstitialAd: jest.fn(async () => true),
}));
beforeEach(() => {
  jest.useRealTimers();
  jest.clearAllMocks();
  useGameStore.setState({ ...INITIAL_GAME_STATE, showMainMenu: false, showTutorial: false,
    showSlotPicker: false, showNameModal: false, showScheduledAd: true, showSummary: true,
    dismissScheduledAd: jest.fn(), profile: { adsRemoved: false } as any,
  });
});
afterAll(() => { jest.useRealTimers(); });
test('queued WeekAd loads before the pending event is opened', async () => {
  render(<ScheduledAdModal />);
  expect(loadInterstitialAd).not.toHaveBeenCalled();
  await act(async () => { useGameStore.setState({ showSummary: false, showEventModal: false }); });
  expect(loadInterstitialAd).toHaveBeenCalledTimes(1);
  expect(showInterstitialAd).toHaveBeenCalledTimes(1);
});
test('Remove Ads never requests a scheduled ad', async () => {
  useGameStore.setState({ profile: { adsRemoved: true } as any, showSummary: false });
  render(<ScheduledAdModal />);
  expect(loadInterstitialAd).not.toHaveBeenCalled();
  expect(useGameStore.getState().dismissScheduledAd).toHaveBeenCalled();
});

test('native show failure is skipped instead of blocking the game with a fallback page', async () => {
  (showInterstitialAd as jest.Mock).mockImplementationOnce(async (_onClosed, onFailed) => {
    onFailed();
    return false;
  });
  useGameStore.setState({ relationshipModeEnabled: false, showSummary: false });
  const view = render(<ScheduledAdModal />);
  await waitFor(() => expect(useGameStore.getState().dismissScheduledAd).toHaveBeenCalledTimes(1));
  expect(view.queryByText('Advertisement')).toBeNull();
});

test('unavailable interstitial load automatically resumes gameplay', async () => {
  (loadInterstitialAd as jest.Mock).mockResolvedValueOnce(false);
  useGameStore.setState({ showSummary: false });
  render(<ScheduledAdModal />);
  await waitFor(() => expect(useGameStore.getState().dismissScheduledAd).toHaveBeenCalledTimes(1));
  expect(showInterstitialAd).not.toHaveBeenCalled();
});

test('successful native close dismisses the scheduled ad once', async () => {
  (showInterstitialAd as jest.Mock).mockImplementationOnce(async (onClosed) => {
    onClosed();
    return true;
  });
  useGameStore.setState({ showSummary: false });
  render(<ScheduledAdModal />);
  await waitFor(() => expect(useGameStore.getState().dismissScheduledAd).toHaveBeenCalledTimes(1));
});
