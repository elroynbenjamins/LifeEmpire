/**
 * Empire Cards visual identity. Presentation only: the gameplay engine stays authoritative.
 * High-contrast labels and unique icons keep the 4 departments distinguishable without color.
 */
import type React from 'react';
import type { Ionicons } from '@expo/vector-icons';
import type { Department, EmpireCard, Boss } from '../engine/empireCardsEngine';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
export type EmpireCardTier = 'core' | 'growth' | 'flagship';
export type EmpirePattern = 'rays' | 'grid' | 'ledger' | 'nodes';

export interface EmpireDepartmentTheme {
  title: string;
  shortName: string;
  color: string;
  soft: string;
  surface: string;
  pattern: EmpirePattern;
  fallbackIcon: IconName;
}

export const EMPIRE_DEPARTMENT_THEMES: Record<Department, EmpireDepartmentTheme> = {
  sales: {
    title: 'Sales', shortName: 'SALES', color: '#F07869', soft: '#FFD5CF',
    surface: '#F0786920', pattern: 'rays', fallbackIcon: 'megaphone-outline',
  },
  operations: {
    title: 'Operations', shortName: 'OPS', color: '#72A5EC', soft: '#D4E5FF',
    surface: '#72A5EC20', pattern: 'grid', fallbackIcon: 'construct-outline',
  },
  finance: {
    title: 'Finance', shortName: 'FINANCE', color: '#E6BD62', soft: '#FFEDC4',
    surface: '#E6BD6220', pattern: 'ledger', fallbackIcon: 'wallet-outline',
  },
  innovation: {
    title: 'Innovation', shortName: 'INNOV.', color: '#B49AF2', soft: '#E8DDFF',
    surface: '#B49AF220', pattern: 'nodes', fallbackIcon: 'bulb-outline',
  },
};

/** Every one of the 32 starter cards has a distinct built-in vector symbol. */
export const EMPIRE_CARD_ICONS: Record<string, IconName> = {
  'sales-1': 'megaphone-outline',
  'sales-2': 'people-outline',
  'sales-3': 'cart-outline',
  'sales-4': 'rocket-outline',
  'sales-5': 'storefront-outline',
  'sales-6': 'ribbon-outline',
  'sales-7': 'heart-outline',
  'sales-8': 'business-outline',
  'operations-1': 'cube-outline',
  'operations-2': 'car-outline',
  'operations-3': 'people-circle-outline',
  'operations-4': 'git-merge-outline',
  'operations-5': 'shield-checkmark-outline',
  'operations-6': 'business-outline',
  'operations-7': 'cog-outline',
  'operations-8': 'analytics-outline',
  'finance-1': 'wallet-outline',
  'finance-2': 'cash-outline',
  'finance-3': 'calculator-outline',
  'finance-4': 'calendar-outline',
  'finance-5': 'trending-up-outline',
  'finance-6': 'pie-chart-outline',
  'finance-7': 'swap-horizontal-outline',
  'finance-8': 'podium-outline',
  'innovation-1': 'search-outline',
  'innovation-2': 'bulb-outline',
  'innovation-3': 'code-slash-outline',
  'innovation-4': 'bar-chart-outline',
  'innovation-5': 'flask-outline',
  'innovation-6': 'document-text-outline',
  'innovation-7': 'hardware-chip-outline',
  'innovation-8': 'sparkles-outline',
};

export const EMPIRE_ADVISOR_ICONS: Record<string, IconName> = {
  brand: 'megaphone-outline', operator: 'construct-outline', cfo: 'calculator-outline',
  rnd: 'flask-outline', franchise: 'storefront-outline', lean: 'settings-outline',
  venture: 'trending-up-outline', lab: 'beaker-outline', family: 'people-outline',
  tax: 'receipt-outline', logistics: 'cube-outline', digital: 'hardware-chip-outline',
  mergers: 'git-merge-outline', trainer: 'school-outline', crisis: 'shield-checkmark-outline',
};

export const EMPIRE_ADVISOR_RARITY_COLORS: Record<'common' | 'uncommon' | 'rare', string> = {
  common: '#94A3B8',
  uncommon: '#41B9CB',
  rare: '#BE9AF7',
};

export function getEmpireAdvisorIcon(advisorId: string): IconName {
  return EMPIRE_ADVISOR_ICONS[advisorId] ?? 'person-circle-outline';
}

export function getEmpireCardTier(points: number): EmpireCardTier {
  return points >= 32 ? 'flagship' : points >= 26 ? 'growth' : 'core';
}

export function getEmpireDepartmentTheme(department: Department): EmpireDepartmentTheme {
  return EMPIRE_DEPARTMENT_THEMES[department];
}

export function getEmpireCardIcon(card: EmpireCard): IconName {
  return EMPIRE_CARD_ICONS[card.id] ?? EMPIRE_DEPARTMENT_THEMES[card.department].fallbackIcon;
}

/** Only bosses that actually reduce individual department card values get warning markers. */
export function isEmpireCardBossAffected(card: EmpireCard, boss: Boss | null, protectedByAdvisor = false): boolean {
  if (!boss || protectedByAdvisor) return false;
  return (boss.id === 'recession' && card.department === 'sales')
    || (boss.id === 'supply_crisis' && card.department === 'operations')
    || (boss.id === 'regulation' && card.department === 'finance')
    || (boss.id === 'tech_shift' && card.department === 'innovation');
}

export const EMPIRE_VALUE_TIER_NAMES: Record<EmpireCardTier, string> = {
  core: 'CORE',
  growth: 'GROWTH',
  flagship: 'FLAGSHIP',
};
