import React from 'react';
import Link from 'next/link';

interface Stage {
  id: number;
  name: string;
  description: string;
  icon: string;
  minScore: number;
  domains: string[];
  bgClass: string;
  textClass: string;
}

const STAGES: Stage[] = [
  {
    id: 1,
    name: 'Foundation',
    description: 'Core concepts across all aptitude domains. Always available.',
    icon: 'school',
    minScore: 0,
    domains: ['Quant Basics', 'Logical Basics', 'Verbal Basics', 'Reasoning Basics'],
    bgClass: 'bg-secondary-fixed',
    textClass: 'text-on-secondary-fixed',
  },
  {
    id: 2,
    name: 'Intermediate',
    description: 'Problem solving patterns, data interpretation, and critical thinking.',
    icon: 'trending_up',
    minScore: 50,
    domains: ['Data Interpretation', 'Pattern Recognition', 'Reading Comprehension', 'Analytical Reasoning'],
    bgClass: 'bg-primary-fixed',
    textClass: 'text-on-primary-fixed',
  },
  {
    id: 3,
    name: 'Advanced',
    description: 'Complex multi-step problems and advanced reasoning strategies.',
    icon: 'psychology',
    minScore: 65,
    domains: ['Advanced Quant', 'Abstract Reasoning', 'Critical Reasoning', 'Inference'],
    bgClass: 'bg-tertiary-fixed',
    textClass: 'text-on-tertiary-fixed',
  },
  {
    id: 4,
    name: 'Expert',
    description: 'Elite-level challenges designed to simulate real placement tests.',
    icon: 'emoji_events',
    minScore: 80,
    domains: ['High-Speed Quant', 'Logical Deduction', 'Advanced Verbal', 'Expert Reasoning'],
    bgClass: 'bg-surface-container-high',
    textClass: 'text-on-surface',
  },
];

export default function PublicLearningPath({ averageScore }: { averageScore: number }) {
  const highestUnlocked = STAGES.reduce(
    (best, s) => (averageScore >= s.minScore ? s : best),
    STAGES[0]
  );

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h4 className="font-headline-md text-on-surface">Your Learning Path</h4>
          <p className="font-caption text-on-surface-variant mt-0.5">
            Progress through stages by improving your average score.
          </p>
        </div>
        <span className="font-caption text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
          Stage {highestUnlocked.id} of 4
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {STAGES.map((stage) => {
          const isUnlocked = averageScore >= stage.minScore;
          const isCurrent = stage.id === highestUnlocked.id;
          const isCompleted = stage.id < highestUnlocked.id;

          return (
            <div
              key={stage.id}
              className={`relative bg-surface-container-lowest border rounded-xl p-5 flex flex-col shadow-sm transition-all ${
                isCurrent
                  ? 'border-primary shadow-[0_0_0_2px_rgba(79,70,229,0.12)]'
                  : isUnlocked
                  ? 'border-outline-variant hover:border-primary'
                  : 'border-outline-variant opacity-50'
              }`}
            >
              {isCurrent && (
                <span className="absolute -top-2.5 left-4 bg-primary text-on-primary font-caption px-2 py-0.5 rounded-full text-[10px]">
                  Current
                </span>
              )}
              {isCompleted && (
                <span className="absolute -top-2.5 left-4 bg-secondary text-on-secondary font-caption px-2 py-0.5 rounded-full text-[10px]">
                  Completed
                </span>
              )}

              <div className="flex items-start justify-between mb-4">
                <div className={`${stage.bgClass} ${stage.textClass} p-2 rounded-lg`}>
                  <span className="material-symbols-outlined text-xl">{stage.icon}</span>
                </div>
                <div className="text-right">
                  <span className="font-caption text-on-surface-variant text-[10px]">Unlock at</span>
                  <p className="font-metric-label text-on-surface text-xs">
                    {stage.minScore === 0 ? 'Always open' : `${stage.minScore}% avg`}
                  </p>
                </div>
              </div>

              <h5 className="font-metric-label text-on-surface mb-1">
                Stage {stage.id}: {stage.name}
              </h5>
              <p className="font-caption text-on-surface-variant mb-4 text-xs leading-relaxed">
                {stage.description}
              </p>

              <div className="flex flex-wrap gap-1 mb-4">
                {stage.domains.map((d) => (
                  <span
                    key={d}
                    className="bg-surface-container text-on-surface-variant font-caption text-[10px] px-1.5 py-0.5 rounded"
                  >
                    {d}
                  </span>
                ))}
              </div>

              <div className="mt-auto">
                {isUnlocked ? (
                  <Link
                    href="/assessment"
                    className="w-full py-2 flex items-center justify-center gap-1 bg-primary text-on-primary font-metric-label text-sm rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    Practice Now
                  </Link>
                ) : (
                  <div className="w-full py-2 flex items-center justify-center gap-1 bg-surface border border-outline text-on-surface-variant font-metric-label text-sm rounded-lg cursor-default">
                    <span className="material-symbols-outlined text-sm">lock</span>
                    Needs {stage.minScore}% avg
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
