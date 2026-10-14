import { INITIAL_GAME_STATE } from '../../types/game';
import { weeklyTick } from '../weeklyTick';
import courses from '../../data/courses.json';

afterEach(() => jest.restoreAllMocks());

test('Retail graduation names the real entry job and explains missing transport', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  const course = courses.find(item => item.baseId === 'retail' && item.level === 1)!;
  const result = weeklyTick({ ...INITIAL_GAME_STATE, currentCourseId: course.id,
    courseWeeksCompleted: course.duration - 1, currentCarId: 'none' });
  expect(result.summary.educationCareerReminder?.jobTitle).toBe('Sales Associate');
  expect(result.summary.educationCareerReminder?.missingRequirements).toEqual([
    'Buy a Used Car or better (delivery takes one week)',
  ]);
});

test('a delivered entry-level car makes the graduation guidance ready', () => {
  jest.spyOn(Math, 'random').mockReturnValue(0.5);
  const course = courses.find(item => item.baseId === 'retail' && item.level === 1)!;
  const result = weeklyTick({ ...INITIAL_GAME_STATE, currentCourseId: course.id,
    courseWeeksCompleted: course.duration - 1, currentCarId: 'used_car' });
  expect(result.summary.educationCareerReminder?.missingRequirements).toEqual([]);
});
