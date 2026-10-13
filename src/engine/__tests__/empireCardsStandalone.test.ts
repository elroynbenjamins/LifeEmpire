import { getEmpireCardsStorageKeys } from '../empireCardsStorage';
import { createEmpireRun, playEmpireHand, type EmpireRun } from '../empireCardsEngine';
import { emptyEmpireMedals, applyEmpireMedalProgress } from '../empireCardsMedals';
import { emptyEmpireTutorialProgress, markEmpireTutorialSeen } from '../empireCardsTutorial';

describe('Empire Cards standalone mode storage', () => {
  it('uses one global standalone keyset independent of all three life save slots', () => {
    const standalone = getEmpireCardsStorageKeys('standalone', 0);
    expect(standalone).toEqual(getEmpireCardsStorageKeys('standalone', 1));
    expect(standalone).toEqual(getEmpireCardsStorageKeys('standalone', 2));
    expect(standalone).toEqual({
      run: 'life-empire-cards:v1:standalone',
      medals: 'life-empire-cards-medals:v1:standalone',
      tutorial: 'life-empire-cards-tutorial:v1:standalone',
    });
    const save0 = getEmpireCardsStorageKeys('save', 0);
    const save1 = getEmpireCardsStorageKeys('save', 1);
    const save2 = getEmpireCardsStorageKeys('save', 2);
    expect(new Set([standalone.run, save0.run, save1.run, save2.run]).size).toBe(4);
    expect(new Set([standalone.medals, save0.medals, save1.medals, save2.medals]).size).toBe(4);
    expect(new Set([standalone.tutorial, save0.tutorial, save1.tutorial, save2.tutorial]).size).toBe(4);
  });

  it('preserves the exact existing key names for older life-save Empire Cards data', () => {
    expect(getEmpireCardsStorageKeys('save', 0)).toEqual({
      run: 'life-empire-cards:v1:slot:0',
      medals: 'life-empire-cards-medals:v1:slot:0',
      tutorial: 'life-empire-cards-tutorial:v1:slot:0',
    });
    expect(getEmpireCardsStorageKeys('save', 1).run).toBe('life-empire-cards:v1:slot:1');
    expect(getEmpireCardsStorageKeys('save', 2).run).toBe('life-empire-cards:v1:slot:2');
  });

  it('keeps standalone run, cosmetic medals and tutorial independent of an in-save run', () => {
    const standalone = createEmpireRun(702, 'advanced');
    const saved = createEmpireRun(703, 'standard');
    const standaloneState: EmpireRun = {
      ...standalone, hand: ['sales-1', 'operations-1', 'finance-1', 'innovation-1'],
    };
    const initialSave = JSON.stringify(saved);
    const advanced = playEmpireHand(standaloneState, [0, 1, 2, 3]);
    const standaloneMedals = applyEmpireMedalProgress(emptyEmpireMedals(), standaloneState, advanced);
    const tutorial = markEmpireTutorialSeen(emptyEmpireTutorialProgress(), 'intro');
    expect(standaloneMedals.unlocked).toEqual(expect.arrayContaining(['first_hand', 'diversified']));
    expect(tutorial.introSeen).toBe(true);
    expect(JSON.stringify(saved)).toBe(initialSave);
    expect(saved.totalHandsPlayed).toBe(0);
    expect(saved.difficulty).toBe('standard');
  });
});
