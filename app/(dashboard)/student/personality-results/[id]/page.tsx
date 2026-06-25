import Link from 'next/link';
import { getPersonalityResultDetails } from '@/app/actions/personality';

const TRAIT_DESCRIPTORS: Record<string, { high: string; low: string; color: string }> = {
  OPENNESS: {
    high: 'Creative, curious, open to new experiences and ideas.',
    low: 'Practical, conventional, prefers familiar routines.',
    color: 'bg-primary',
  },
  CONSCIENTIOUSNESS: {
    high: 'Organised, dependable, self-disciplined and goal-directed.',
    low: 'Flexible, spontaneous, may prefer less structure.',
    color: 'bg-secondary',
  },
  EXTRAVERSION: {
    high: 'Outgoing, energetic, seeks social engagement.',
    low: 'Reflective, reserved, recharges through solitude.',
    color: 'bg-tertiary',
  },
  AGREEABLENESS: {
    high: 'Cooperative, empathetic, values harmony with others.',
    low: 'Direct, competitive, prioritises personal objectives.',
    color: 'bg-primary-fixed-dim',
  },
  NEUROTICISM: {
    high: 'Sensitive to stress, may experience emotional ups and downs.',
    low: 'Emotionally stable, calm under pressure.',
    color: 'bg-error',
  },
};

export default async function PersonalityResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { test, traitProfile } = await getPersonalityResultDetails(id);

  const testDate = new Date(test.completed_at ?? test.created_at).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <Link
        href="/student/assessments"
        className="inline-flex items-center gap-1.5 text-on-surface-variant text-sm font-metric-label hover:text-primary transition-colors mb-6"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        All Assessments
      </Link>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="material-symbols-outlined text-primary text-3xl" style={{ fontVariationSettings: '"FILL" 1' }}>psychology</span>
          <h1 className="font-headline-lg text-on-surface text-2xl font-bold">Big Five Personality Profile</h1>
        </div>
        <p className="font-caption text-on-surface-variant">Completed {testDate}</p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-2xl p-6 shadow-sm mb-6">
        <h2 className="font-headline-md text-on-surface font-semibold mb-5">Your Trait Profile</h2>
        <div className="flex flex-col gap-5">
          {traitProfile.map(({ trait, rawScore, maxScore, percentile }) => {
            const pct = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;
            const descriptor = TRAIT_DESCRIPTORS[trait];
            const isHigh = pct >= 50;
            return (
              <div key={trait}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-metric-label text-on-surface text-sm font-semibold">
                    {trait.charAt(0) + trait.slice(1).toLowerCase()}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-caption text-on-surface-variant text-xs">{pct}%</span>
                    <span className="text-xs font-metric-label px-2 py-0.5 rounded-full bg-surface-container text-on-surface-variant border border-outline-variant">
                      P{percentile}
                    </span>
                  </div>
                </div>
                <div className="h-2 bg-surface-container rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full transition-all duration-700 ${descriptor?.color ?? 'bg-primary'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {descriptor && (
                  <p className="font-caption text-on-surface-variant text-xs mt-1.5 leading-relaxed">
                    {isHigh ? descriptor.high : descriptor.low}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-secondary/5 border border-secondary/20 rounded-xl px-5 py-4 text-sm text-on-surface-variant font-body-md">
        <span className="font-semibold text-secondary">P</span> = percentile rank vs. all students. No trait is inherently good or bad — each reflects a different way of engaging with the world.
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/assessment/personality"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-xl font-metric-label text-sm hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">refresh</span>
          Retake Assessment
        </Link>
        <Link
          href="/student/assessments"
          className="inline-flex items-center gap-2 px-5 py-2.5 border border-outline-variant text-on-surface-variant rounded-xl font-metric-label text-sm hover:bg-surface-container transition-colors"
        >
          All Assessments
        </Link>
      </div>
    </div>
  );
}
