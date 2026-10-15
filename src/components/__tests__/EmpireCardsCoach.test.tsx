import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { EmpireCardsCoach, EmpireCardsContextCoach } from '../EmpireCardsCoach';
import { EMPIRE_TUTORIAL_STEPS } from '../../engine/empireCardsTutorial';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

describe('Empire Cards compact guide UI', () => {
  it('keeps the intro step short and allows skip, next and disable', () => {
    const onNext = jest.fn(), onSkip = jest.fn(), onDisable = jest.fn(), onBack = jest.fn();
    const screen = render(
      <EmpireCardsCoach step={EMPIRE_TUTORIAL_STEPS[0]} index={0} total={5}
        onNext={onNext} onSkip={onSkip} onDisable={onDisable} onBack={onBack} />
    );
    expect(screen.getByText('QUICK GUIDE · 1/5')).toBeTruthy();
    expect(screen.getByText(EMPIRE_TUTORIAL_STEPS[0].title)).toBeTruthy();
    expect(screen.getByText(/Look at: Score and quarter target/)).toBeTruthy();
    fireEvent.press(screen.getByText('Next'));
    fireEvent.press(screen.getByText('Skip'));
    fireEvent.press(screen.getByText("Don't show again"));
    expect(onNext).toHaveBeenCalledTimes(1);
    expect(onSkip).toHaveBeenCalledTimes(1);
    expect(onDisable).toHaveBeenCalledTimes(1);
    expect(onBack).not.toHaveBeenCalled();
  });

  it('supports manual replay of all seven steps with a final Finish action', () => {
    const onNext = jest.fn(), onBack = jest.fn();
    const screen = render(
      <EmpireCardsCoach step={EMPIRE_TUTORIAL_STEPS[6]} index={6} total={7}
        onNext={onNext} onSkip={() => {}} onDisable={() => {}} onBack={onBack} />
    );
    expect(screen.getByText('QUICK GUIDE · 7/7')).toBeTruthy();
    expect(screen.getByText('Prepare for boss quarters')).toBeTruthy();
    fireEvent.press(screen.getByText('Back'));
    fireEvent.press(screen.getByText('Finish'));
    expect(onBack).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('keeps the shop and boss introductions non-modal and dismissible', () => {
    const onDismiss = jest.fn(), onDisable = jest.fn();
    const screen = render(<EmpireCardsContextCoach tip="shop"
      onDismiss={onDismiss} onDisable={onDisable} />);
    expect(screen.getByText('Quarter cleared! This is your shop')).toBeTruthy();
    fireEvent.press(screen.getByText('Got it'));
    fireEvent.press(screen.getByText("Don't show again"));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(onDisable).toHaveBeenCalledTimes(1);
    screen.rerender(<EmpireCardsContextCoach tip="boss" onDismiss={onDismiss} onDisable={onDisable} />);
    expect(screen.getByText('A boss condition is active')).toBeTruthy();
  });
});