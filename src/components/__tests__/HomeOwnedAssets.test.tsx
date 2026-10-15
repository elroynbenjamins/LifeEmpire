import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import HomeOwnedAssets, { shouldPairOwnedAssetCards } from '../HomeOwnedAssets';

const buildProps = () => ({
  viewportWidth: 390,
  businessCount: 3,
  weeklyBusinessProfit: 4500,
  businessAttentionCount: 1,
  businessCrisisCount: 0,
  propertyCount: 2,
  rentalIncome: 1200,
  onBusinessesPress: jest.fn(),
  onPropertiesPress: jest.fn(),
});

describe('Home owned asset overview', () => {
  it('pairs cards only when both businesses and properties exist and width permits', () => {
    expect(shouldPairOwnedAssetCards(1, 1, 390)).toBe(true);
    expect(shouldPairOwnedAssetCards(5, 2, 355)).toBe(true);
    expect(shouldPairOwnedAssetCards(0, 1, 390)).toBe(false);
    expect(shouldPairOwnedAssetCards(2, 0, 390)).toBe(false);
    expect(shouldPairOwnedAssetCards(2, 3, 320)).toBe(false);
  });

  it('shows both summaries in a compact row while preserving independent navigation', () => {
    const props = buildProps();
    const screen = render(<HomeOwnedAssets {...props} />);
    expect(screen.getByTestId('home-owned-assets-pair')).toBeTruthy();
    expect(screen.getByText('My Businesses')).toBeTruthy();
    expect(screen.getByText('Real Estate')).toBeTruthy();
    expect(screen.getByText('Weekly P&L')).toBeTruthy();
    expect(screen.getByText('Rental income / wk')).toBeTruthy();
    expect(screen.getByText('1 need attention')).toBeTruthy();
    fireEvent.press(screen.getByText('My Businesses'));
    expect(props.onBusinessesPress).toHaveBeenCalledTimes(1);
    expect(props.onPropertiesPress).not.toHaveBeenCalled();
    fireEvent.press(screen.getByText('Real Estate'));
    expect(props.onPropertiesPress).toHaveBeenCalledTimes(1);
  });

  it('keeps the full-width single business card and its attention details', () => {
    const props = { ...buildProps(), propertyCount: 0, businessCrisisCount: 1 };
    const screen = render(<HomeOwnedAssets {...props} />);
    expect(screen.queryByTestId('home-owned-assets-pair')).toBeNull();
    expect(screen.getByText('Weekly P&L: +€4,500')).toBeTruthy();
    expect(screen.getByText('1 company needs attention • 1 crisis')).toBeTruthy();
    expect(screen.queryByText('Real Estate')).toBeNull();
  });

  it('keeps readable full-width cards on particularly narrow devices', () => {
    const screen = render(<HomeOwnedAssets {...buildProps()} viewportWidth={320} />);
    expect(screen.queryByTestId('home-owned-assets-pair')).toBeNull();
    expect(screen.getByText('My Businesses')).toBeTruthy();
    expect(screen.getByText('Real Estate')).toBeTruthy();
  });

  it('does not display empty asset overviews', () => {
    const screen = render(<HomeOwnedAssets {...buildProps()} businessCount={0} propertyCount={0} />);
    expect(screen.queryByText('My Businesses')).toBeNull();
    expect(screen.queryByText('Real Estate')).toBeNull();
  });
});
