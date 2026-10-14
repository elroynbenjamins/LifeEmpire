import useGameStore from '../gameStore';
import { INITIAL_GAME_STATE, INITIAL_PROFILE } from '../../types/game';

jest.mock('../../utils/storage', () => ({ saveGame: jest.fn(), saveProfile: jest.fn() }));

describe('scheduled ads', () => {
  test.each([false, true])('queues an ad at week 80 with relationship mode %s', (relationshipModeEnabled) => {
    useGameStore.setState({
      ...INITIAL_GAME_STATE,
      profile: { ...INITIAL_PROFILE, adsRemoved: false },
      year: 4,
      week: 20,
      relationshipModeEnabled,
      lastSummary: {} as any,
      showSummary: true,
      showScheduledAd: false,
      showEventModal: false,
      showRelationshipEventModal: false,
      educationCareerReminder: null,
    });

    useGameStore.getState().dismissSummary();

    expect(useGameStore.getState().showScheduledAd).toBe(true);
    expect(useGameStore.getState().showSummary).toBe(false);
  });

  test('does not queue an ad before week 80 or after Remove Ads', () => {
    useGameStore.setState({
      ...INITIAL_GAME_STATE,
      profile: { ...INITIAL_PROFILE, adsRemoved: false },
      year: 4,
      week: 19,
      relationshipModeEnabled: false,
      lastSummary: {} as any,
      showSummary: true,
      showScheduledAd: false,
      educationCareerReminder: null,
    });
    useGameStore.getState().dismissSummary();
    expect(useGameStore.getState().showScheduledAd).toBe(false);

    useGameStore.setState({ week: 20, showSummary: true, profile: { ...INITIAL_PROFILE, adsRemoved: true } });
    useGameStore.getState().dismissSummary();
    expect(useGameStore.getState().showScheduledAd).toBe(false);
  });
});
