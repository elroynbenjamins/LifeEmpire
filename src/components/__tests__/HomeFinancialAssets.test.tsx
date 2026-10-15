import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import HomeFinancialAssets, { pairFinancialAssets } from '../HomeFinancialAssets';

const createProps = () => ({
  viewportWidth: 390, holdingCount: 4, portfolioValue: 25000,
  loanCount: 2, totalLoanDebt: 5000,
  onPortfolioPress: jest.fn(), onLoansPress: jest.fn(),
});

describe('Home paired investments and loans', () => {
  it('pairs only when both are present and phone can fit them', () => {
    expect(pairFinancialAssets(true,true,390)).toBe(true);
    expect(pairFinancialAssets(true,true,320)).toBe(false);
    expect(pairFinancialAssets(false,true,390)).toBe(false);
  });
  it('shows compact comparable cards and opens independent destinations', () => {
    const props=createProps(),screen=render(<HomeFinancialAssets {...props}/>);
    expect(screen.getByTestId('home-financial-pair')).toBeTruthy();
    expect(screen.getByText('€25,000')).toBeTruthy();
    expect(screen.getByText('€5,000')).toBeTruthy();
    fireEvent.press(screen.getByText('Portfolio'));
    fireEvent.press(screen.getByText('Active Loans'));
    expect(props.onPortfolioPress).toHaveBeenCalledTimes(1);
    expect(props.onLoansPress).toHaveBeenCalledTimes(1);
  });
  it('renders single existing card full width and no empty placeholders', () => {
    const props=createProps();
    const screen=render(<HomeFinancialAssets {...props} holdingCount={0}/>);
    expect(screen.queryByTestId('home-financial-pair')).toBeNull();
    expect(screen.getByText('Active Loans')).toBeTruthy();
    expect(screen.queryByText('Portfolio')).toBeNull();
    screen.rerender(<HomeFinancialAssets {...props} holdingCount={0} totalLoanDebt={0}/>);
    expect(screen.queryByText('Active Loans')).toBeNull();
  });
});
