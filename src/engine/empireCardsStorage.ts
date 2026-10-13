/**
 * Storage identity for Empire Cards. Standalone runs must never read or
 * overwrite a Life Empire save slot's run, medals or tutorial preferences.
 */
export type EmpireCardsScope = 'standalone' | 'save';

export function getEmpireCardsStorageKeys(scope: EmpireCardsScope, slot: number): {
  run: string;
  medals: string;
  tutorial: string;
} {
  const suffix = scope === 'standalone' ? 'standalone' : 'slot:' + slot;
  return {
    run: 'life-empire-cards:v1:' + suffix,
    medals: 'life-empire-cards-medals:v1:' + suffix,
    tutorial: 'life-empire-cards-tutorial:v1:' + suffix,
  };
}
