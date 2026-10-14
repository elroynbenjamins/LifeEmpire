import type { OwnedBusiness } from '../types/game';
import businessTypes from '../data/business_types.json';

export function getRecruitmentWaitWeeks(business: OwnedBusiness) {
  const level = business.level ?? 0;
  return level <= 1 ? 10 : level === 2 ? 8 : level === 3 ? 6 : 5;
}

export function getRecruitmentCooldown(business: OwnedBusiness, globalWeek: number) {
  if ((business.freeRecruits ?? 3) > 0) return 0;
  return Math.max(0, (business.nextRecruitmentWeek ?? 0) - globalWeek);
}

/** A payroll efficiency discount, not a permanent change to employee contracts. */
export function getSmallBusinessPayrollDiscount(business: OwnedBusiness) {
  const type = businessTypes.find(type => type.id === business.typeId);
  if (!type || type.maxEmployees > 10 || business.acquisition || (business.operatingScaleMultiplier ?? 1) > 1) return 0;
  const level = business.level ?? 0;
  const scale = level <= 2 ? 1 : level === 3 ? 0.5 : 0;
  return Math.min(0.11, Math.max(0, (business.employees?.length ?? 0) - 3) * 0.05) * scale;
}
