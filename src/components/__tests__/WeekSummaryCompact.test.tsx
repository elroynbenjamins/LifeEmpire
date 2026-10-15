import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import WeekSummarySheet from '../WeekSummarySheet';

const mockGameState = {
  showSummary: true,
  lastSummary: {
    newWeek: 5, salaryEarned: 2500, rentPaid: 700, utilityCost: 100,
    taxAmount: 0, newAchievements: [], familyMilestones: [],
  },
  dismissSummary: jest.fn(),
  activeSlot: 0,
};
jest.mock('../../store/gameStore', () => ({
  __esModule: true,
  default: (select: (s: typeof mockGameState) => unknown) => select(mockGameState),
}));
jest.mock('../../store/tutorialStore', () => ({
  useTutorialStore: Object.assign(
    (select: (s: { sessions: unknown[]; activeScope: string }) => unknown) =>
      select({ sessions: [], activeScope: 'none' }),
    { getState: () => ({ reconcile: jest.fn(), settle: jest.fn() }) },
  ),
}));
jest.mock('../../engine/tutorialEngine', () => ({ getTutorialStep: () => null }));
jest.mock('../TutorialDock', () => ({ tutorialSnapshot: () => ({ scope: 'none' }) }));
jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
}));
jest.mock('../../hooks/useSlotUiPreferences', () => ({
  useSlotUiPreferences: () => {
    const [value, setValue] = require('react').useState({ compact: true });
    return [value, setValue, true];
  },
}));
jest.mock('../StatusPill', () => () => null);
jest.mock('../GameButton', () => {
  const { Pressable, Text } = require('react-native');
  return ({ label, onPress }: { label: string; onPress: () => void }) => (
    <Pressable onPress={onPress}><Text>{label}</Text></Pressable>
  );
});

describe('Compact weekly report on phone screens', () => {
  beforeEach(() => mockGameState.dismissSummary.mockClear());

  it('scrolls highlights while keeping Continue outside the scroll view', () => {
    const screen = render(<WeekSummarySheet />);
    expect(screen.getByTestId('compact-weekly-scroll')).toBeTruthy();
    expect(screen.getByText('Show full weekly report')).toBeTruthy();
    expect(screen.getByText('Continue')).toBeTruthy();
    fireEvent.press(screen.getByText('Continue'));
    expect(mockGameState.dismissSummary).toHaveBeenCalledTimes(1);
  });

  it('opens full details, goes back, and respects immediate preference switching', () => {
    const screen = render(<WeekSummarySheet />);
    fireEvent.press(screen.getByText('Show full weekly report'));
    expect(screen.queryByTestId('compact-weekly-scroll')).toBeNull();
    expect(screen.getByText('Less detail ↑')).toBeTruthy();

    fireEvent.press(screen.getByText('Less detail ↑'));
    expect(screen.getByTestId('compact-weekly-scroll')).toBeTruthy();

    fireEvent.press(screen.getByRole('switch'));
    expect(screen.queryByTestId('compact-weekly-scroll')).toBeNull();

    fireEvent.press(screen.getByRole('switch'));
    expect(screen.getByTestId('compact-weekly-scroll')).toBeTruthy();
  });
});
