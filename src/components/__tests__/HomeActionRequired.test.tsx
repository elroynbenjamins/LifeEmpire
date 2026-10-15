import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import HomeActionRequired from '../HomeActionRequired';
import type { HomeAction } from '../../engine/homeActionRequired';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
const actions: HomeAction[] = [
  { id: 'a', title: 'Company crisis', detail: 'Due now', route: '/business', urgent: true },
  { id: 'b', title: 'Cash warning', detail: 'Review finances', route: '/loans', urgent: true },
  { id: 'c', title: 'Other decision', detail: '4 weeks left', route: '/business', urgent: false },
];

describe('Home action card', () => {
  it('does not reserve vertical space when there is nothing to do', () => {
    expect(render(<HomeActionRequired actions={[]} onOpen={() => {}}/>).toJSON()).toBeNull();
  });
  it('shows only 2 actions initially, expands on demand and opens real destinations', () => {
    const onOpen=jest.fn(),screen=render(<HomeActionRequired actions={actions} onOpen={onOpen}/>);
    expect(screen.getByText('Company crisis')).toBeTruthy();
    expect(screen.queryByText('Other decision')).toBeNull();
    fireEvent.press(screen.getByText('Cash warning'));
    expect(onOpen).toHaveBeenCalledWith('/loans');
    fireEvent.press(screen.getByText('Show all 3 actions'));
    expect(screen.getByText('Other decision')).toBeTruthy();
    fireEvent.press(screen.getByText('Other decision'));
    expect(onOpen).toHaveBeenCalledWith('/business');
  });
});
