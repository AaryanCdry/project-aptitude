export const MIN_LEVEL = 1;
export const MAX_LEVEL = 10;

// Seconds per question by difficulty (1–10)
const LEVEL_TIMERS: Record<number, number> = {
  1: 90,
  2: 80,
  3: 70,
  4: 60,
  5: 50,
  6: 45,
  7: 40,
  8: 35,
  9: 30,
  10: 25,
};

export type Grade = 'Below Average' | 'Average' | 'Above Average' | 'Excellent';

// Single-step adaptive move: a correct answer raises the level by 1,
// a wrong answer drops it by 1. Clamped to [MIN_LEVEL, MAX_LEVEL].
export function stepLevel(currentLevel: number, wasCorrect: boolean): number {
  return wasCorrect
    ? Math.min(MAX_LEVEL, currentLevel + 1)
    : Math.max(MIN_LEVEL, currentLevel - 1);
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

// Returns seconds for the given difficulty (1–10); clamps out-of-range values
export function questionTimer(level: number): number {
  return LEVEL_TIMERS[level] ?? (level < 1 ? 90 : 25);
}

// Difficulty band for student-facing labels
export type DifficultyBand = 'Easy' | 'Medium' | 'Hard';
export function gradeDifficulty(level: number): DifficultyBand {
  if (level <= 3) return 'Easy';
  if (level <= 7) return 'Medium';
  return 'Hard';
}

export const DIFFICULTY_BAND_STYLES: Record<DifficultyBand, string> = {
  Easy:   'bg-secondary-fixed/60 text-on-secondary-fixed-variant',
  Medium: 'bg-primary-fixed-dim text-on-primary-fixed',
  Hard:   'bg-error-container text-on-error-container',
};

// Difficulty-weighted score with up to +10% time bonus, capped at 100.
// attempts: [{ difficulty, isCorrect, timeTakenMs }]
export function computeWeightedScore(
  attempts: Array<{ difficulty: number; isCorrect: boolean; timeTakenMs: number }>,
): number {
  if (attempts.length === 0) return 0;

  let weightedCorrect = 0;
  let weightedTotal = 0;
  let bonusFractionSum = 0;

  for (const a of attempts) {
    const w = Math.max(1, a.difficulty);
    weightedTotal += w;
    if (a.isCorrect) {
      weightedCorrect += w;
      const budgetMs = questionTimer(a.difficulty) * 1000;
      const ratio = Math.min(1, Math.max(0, a.timeTakenMs / budgetMs));
      const bonus = Math.max(0, 1 - 2 * ratio); // full bonus ≤50% budget, 0 at full budget
      bonusFractionSum += bonus;
    }
  }

  const base = weightedTotal > 0 ? (weightedCorrect / weightedTotal) * 100 : 0;
  const correctCount = attempts.filter(a => a.isCorrect).length;
  const avgBonus = correctCount > 0 ? bonusFractionSum / correctCount : 0;
  return Math.min(100, Math.round(base + avgBonus * 10));
}

// Points earned for a single question.
//   - Wrong / skipped → 0 points.
//   - Correct → base = difficulty × 10 (10 for L1 … 100 for L10),
//     plus a speed bonus of up to +50% of base (full bonus when answered
//     in ≤50% of the time budget, tapering to 0 at the full budget).
// A fast, correct L10 answer is worth 150 points; a slow L1 answer, 10.
export function questionPoints(
  difficulty: number,
  isCorrect: boolean,
  timeTakenMs: number,
): number {
  if (!isCorrect) return 0;
  const base = Math.max(1, difficulty) * 10;
  const budgetMs = questionTimer(difficulty) * 1000;
  const ratio = Math.min(1, Math.max(0, timeTakenMs / budgetMs));
  const bonus = Math.max(0, 1 - 2 * ratio);
  return base + Math.round(base * 0.5 * bonus);
}

// Total points for a test from its attempt rows.
export function testTotalPoints(
  attempts: Array<{ difficulty: number; isCorrect: boolean; timeTakenMs: number }>,
): number {
  return attempts.reduce(
    (sum, a) => sum + questionPoints(a.difficulty, a.isCorrect, a.timeTakenMs),
    0,
  );
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
