import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import HomeCustomizePanel from '../HomeCustomizePanel';
import { HOME_UI_DEFAULTS } from '../../engine/homeUiPreferences';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

describe('Home dashboard customization', () => {
  it('allows each panel to be toggled and the layout to be reset', () => {
    const onToggle = jest.fn();
    const onReset = jest.fn();
    const view = render(<HomeCustomizePanel
      preferences={{ ...HOME_UI_DEFAULTS, news: false }}
      onToggle={onToggle} onReset={onReset}
    />);
    const marketNews = view.getByText('Market news');
    fireEvent.press(marketNews);
    expect(onToggle).toHaveBeenCalledWith('news');
    fireEvent.press(view.getByLabelText('Restore default dashboard'));
    expect(onReset).toHaveBeenCalledTimes(1);
    expect(view.getByText(/weekly cash flow and important actions always remain visible/)).toBeTruthy();
  });
});
