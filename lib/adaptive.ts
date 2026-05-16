export const MIN_LEVEL = 1;
export const MAX_LEVEL = 5;

// Levels above this threshold get a per-question timer
const TIMER_THRESHOLD = 3;

// Seconds per question at timed levels
const LEVEL_TIMERS: Record<number, number> = {
  4: 45,
  5: 30,
};

export type Grade = 'Below Average' | 'Average' | 'Above Average' | 'Excellent';

// Advance or drop level based on consecutive correct/wrong streak
export function nextLevel(
  currentLevel: number,
  consecutiveCorrect: number,
  consecutiveWrong: number,
): number {
  if (consecutiveCorrect >= 2) return Math.min(MAX_LEVEL, currentLevel + 1);
  if (consecutiveWrong >= 2) return Math.max(MIN_LEVEL, currentLevel - 1);
  return currentLevel;
}

// Checkpoint rule: a domain cannot exceed the minimum of all other domains + 1
export function checkpointCap(levels: Record<string, number>, domain: string): number {
  const others = Object.entries(levels)
    .filter(([d]) => d !== domain)
    .map(([, l]) => l);
  if (others.length === 0) return MAX_LEVEL;
  return Math.min(MAX_LEVEL, Math.min(...others) + 1);
}

// Whether all domains are within 1 level of each other
export function isBalanced(levels: Record<string, number>): boolean {
  const vals = Object.values(levels);
  if (vals.length < 2) return true;
  return Math.max(...vals) - Math.min(...vals) <= 1;
}

// Returns null at levels ≤ TIMER_THRESHOLD (no timer), seconds otherwise
export function questionTimer(level: number): number | null {
  if (level <= TIMER_THRESHOLD) return null;
  return LEVEL_TIMERS[level] ?? 30;
}

// Weighted combined score: self-assessment 40%, center test 60%
export function combinedScore(selfAvg: number, centerAvg: number): number {
  return Math.round(selfAvg * 0.4 + centerAvg * 0.6);
}

export function getGrade(score: number): Grade {
  if (score >= 85) return 'Excellent';
  if (score >= 70) return 'Above Average';
  if (score >= 50) return 'Average';
  return 'Below Average';
}

export const GRADE_COLORS: Record<Grade, string> = {
  'Excellent':      'bg-secondary-fixed text-on-secondary-fixed-variant',
  'Above Average':  'bg-primary-fixed-dim text-on-primary-fixed',
  'Average':        'bg-surface-container-high text-on-surface',
  'Below Average':  'bg-error-container text-on-error-container',
};
