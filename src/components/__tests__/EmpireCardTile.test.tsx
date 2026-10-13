import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import EmpireCardTile from '../EmpireCardTile';
import { EMPIRE_CARDS } from '../../engine/empireCardsEngine';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

const salesCard = EMPIRE_CARDS.find(c => c.id === 'sales-1')!;
const premiumCard = EMPIRE_CARDS.find(c => c.id === 'innovation-8')!;

describe('Empire Cards mobile card identity', () => {
  it('shows a card name, point badge, department and accessible interaction', () => {
    const onPress = jest.fn();
    const screen = render(
      <EmpireCardTile card={salesCard} selected={false} reduceMotion columns={4} onPress={onPress} />
    );
    expect(screen.getByText('Local Advertising')).toBeTruthy();
    expect(screen.getByText('20')).toBeTruthy();
    expect(screen.getByText('SALES')).toBeTruthy();
    expect(screen.getByText('CORE')).toBeTruthy();
    const button = screen.getByTestId('empire-card-sales-1');
    expect(button.props.accessibilityState.selected).toBe(false);
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('shows recommendations, boss damage and premium frame cues without changing points', () => {
    const screen = render(
      <EmpireCardTile card={premiumCard} selected suggested bossAffected reduceMotion columns={3} onPress={() => {}} />
    );
    expect(screen.getByText('New Technology')).toBeTruthy();
    expect(screen.getByText('34')).toBeTruthy();
    expect(screen.getByTestId('empire-card-innovation-8').props.accessibilityLabel)
      .toContain('recommended scoring card');
    expect(screen.getByTestId('empire-card-innovation-8').props.accessibilityLabel)
      .toContain('reduced by current boss effect');
    expect(premiumCard.points).toBe(34);
  });

  it('distinguishes discard suggestions and retains accessibility when motion is disabled', () => {
    const screen = render(
      <EmpireCardTile card={salesCard} selected discardSuggested reduceMotion onPress={() => {}} />
    );
    const label = screen.getByTestId('empire-card-sales-1').props.accessibilityLabel as string;
    expect(label).toContain('suggested for replacement');
    expect(label).toContain('selected');
    expect(screen.getByText('Local Advertising')).toBeTruthy();
  });
});
