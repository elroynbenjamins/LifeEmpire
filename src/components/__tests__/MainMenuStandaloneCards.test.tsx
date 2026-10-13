import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import MainMenu from '../MainMenu';

const mockPush = jest.fn();
const mockSetState = jest.fn();
const mockState = {
  showMainMenu: true,
  activeSlot: 0,
  slotMeta: {},
  continueGame: jest.fn(),
  openSlotPicker: jest.fn(),
  beginNewGame: jest.fn(),
};
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));
jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../store/gameStore', () => ({
  __esModule: true,
  default: Object.assign((selector: (s: any) => unknown) => selector(mockState), {
    setState: (value: unknown) => mockSetState(value),
  }),
}));

describe('Life Empire title menu standalone activity', () => {
  beforeEach(() => {
    mockPush.mockClear();
    mockSetState.mockClear();
  });

  it('can launch Empire Cards without an initialized life save', () => {
    const view = render(<MainMenu />);
    const entry = view.getByLabelText('Play Empire Cards standalone without a save');
    expect(view.getByText('Play standalone · No save required')).toBeTruthy();
    fireEvent.press(entry);
    expect(mockSetState).toHaveBeenCalledWith({ showMainMenu: false });
    expect(mockPush).toHaveBeenCalledWith('/empire-cards?mode=standalone&from=main-menu');
    expect(mockState.openSlotPicker).not.toHaveBeenCalled();
    expect(mockState.beginNewGame).not.toHaveBeenCalled();
  });
});