import type { WeekSummary } from '../types/game';

/**
 * Cash movement from the weekly report's tracked sources.
 * Property income is already net of ALL property maintenance; splitting a
 * negative result into expenses avoids pretending a vacant home earns rent.
 *
 * These figures are an operating subtotal, not complete cash reconciliation:
 * stock trades, new loans, business distributions, bank deposit maturities,
 * property sales and other one-off transactions change cash separately.
 */
export function getWeeklyCashFlowSummary(summary: WeekSummary): {
  income: number; expenses: number; tax: number; net: number;
} {
  const propertyNet = summary.propertyIncome ?? 0;
  const income =
    (summary.salaryEarned ?? 0) + (summary.partTimeIncome ?? 0)
    + (summary.dividendIncome ?? 0) + (summary.partnerContribution ?? 0)
    + (summary.partnerInheritance ?? 0) + Math.max(0, propertyNet);
  const expenses =
    (summary.rentPaid ?? 0) + (summary.utilityCost ?? 0)
    + (summary.foodCost ?? 0) + (summary.carCost ?? 0)
    + (summary.courseCost ?? 0) + (summary.loanPayments ?? 0)
    + (summary.relationshipHouseholdCost ?? 0) + (summary.familyCost ?? 0)
    + (summary.relationshipObligationCost ?? 0)
    + Math.max(0, -propertyNet);
  const tax = summary.taxAmount ?? 0;
  return { income, expenses, tax, net: income - expenses - tax };
}
