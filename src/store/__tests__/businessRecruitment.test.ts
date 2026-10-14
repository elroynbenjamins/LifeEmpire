import useGameStore from '../gameStore';
import { createBusiness } from '../../engine/businessEngine';
import { INITIAL_GAME_STATE, INITIAL_PROFILE } from '../../types/game';

jest.mock('../../utils/storage', () => ({ saveGame: jest.fn(), saveProfile: jest.fn() }));

test('first three hires are immediate; saved charges cannot bypass the next-hire wait', () => {
  useGameStore.setState({ ...INITIAL_GAME_STATE, year: 1, week: 1, profile: INITIAL_PROFILE,
    businesses: [{ ...createBusiness('coffee_shop', 'Test', 1, 1, 1)!, balance: 100_000, recruitCharges: 5 }] });
  const id = useGameStore.getState().businesses[0].id;
  for (let i = 0; i < 3; i++) {
    useGameStore.getState().openCandidatePool(id, 'worker');
    const candidate = useGameStore.getState().businesses[0].pendingCandidates![0];
    useGameStore.getState().hireCandidate(id, candidate.id);
  }
  expect(useGameStore.getState().businesses[0].employees).toHaveLength(3);
  expect(useGameStore.getState().businesses[0].nextRecruitmentWeek).toBe(11);
  useGameStore.getState().openCandidatePool(id, 'worker');
  expect(useGameStore.getState().businesses[0].pendingCandidates).toBeNull();
  useGameStore.setState({ week: 11 });
  useGameStore.getState().openCandidatePool(id, 'worker');
  const candidate = useGameStore.getState().businesses[0].pendingCandidates![0];
  useGameStore.getState().hireCandidate(id, candidate.id);
  expect(useGameStore.getState().businesses[0].employees).toHaveLength(4);
  expect(useGameStore.getState().businesses[0].balance).toBe(90_000);
});
