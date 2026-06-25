'use client';

import { useState } from 'react';
import Link from 'next/link';

type LastTest = { id: string; completed_at: string | null } | null;

interface Props {
  lastAptitude: LastTest;
  lastPersonality: LastTest;
  lastSjt: LastTest;
}

type TabId = 'aptitude' | 'personality' | 'sjt';

const TABS: { id: TabId; label: string; icon: string }[] = [
  { id: 'aptitude', label: 'Aptitude & Cognitive', icon: 'quiz' },
  { id: 'personality', label: 'Personality', icon: 'psychology' },
  { id: 'sjt', label: 'Situational Judgement', icon: 'cases' },
];

const TAB_CONFIG = {
  aptitude: {
    title: 'Aptitude & Cognitive',
    description: 'Test your quantitative, logical, verbal, and spatial reasoning. Questions adapt to your skill level with AI-driven difficulty adjustment. Each session is 25 questions.',
    duration: '~30 min',
    startHref: '/assessment',
    resultHref: (id: string) => `/student/results/${id}`,
    icon: 'quiz',
    color: 'bg-primary',
    textColor: 'text-primary',
    borderColor: 'border-primary/30',
    bgLight: 'bg-primary/5',
  },
  personality: {
    title: 'Personality Assessment',
    description: 'Discover your Big Five personality traits — Openness, Conscientiousness, Extraversion, Agreeableness, and Neuroticism. No right or wrong answers. 30 questions across mixed formats.',
    duration: '~35 min',
    startHref: '/assessment/personality',
    resultHref: (id: string) => `/student/personality-results/${id}`,
    icon: 'psychology',
    color: 'bg-secondary',
    textColor: 'text-secondary',
    borderColor: 'border-secondary/30',
    bgLight: 'bg-secondary/5',
  },
  sjt: {
    title: 'Situational Judgement Test',
    description: 'Read workplace scenarios and identify the Best and Worst response from four options. Scored against expert consensus. Measures Teamwork, Communication, Leadership, and more.',
    duration: '~45 min',
    startHref: '/assessment/sjt',
    resultHref: (id: string) => `/student/sjt-results/${id}`,
    icon: 'cases',
    color: 'bg-tertiary',
    textColor: 'text-tertiary',
    borderColor: 'border-tertiary/30',
    bgLight: 'bg-tertiary/5',
  },
} as const;

export default function AssessmentsPageClient({ lastAptitude, lastPersonality, lastSjt }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>('aptitude');

  const lastTests: Record<TabId, LastTest> = {
    aptitude: lastAptitude,
    personality: lastPersonality,
    sjt: lastSjt,
  };

  const cfg = TAB_CONFIG[activeTab];
  const last = lastTests[activeTab];

  const lastTakenLabel = last?.completed_at
    ? new Date(last.completed_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <div>
      {/* Tab chips */}
      <div className="flex flex-wrap gap-2 mb-6">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-metric-label text-sm transition-all border ${
              activeTab === t.id
                ? `${TAB_CONFIG[t.id].color} text-white border-transparent shadow-sm`
                : 'bg-surface-container border-outline-variant text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined text-sm">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab panel */}
      <div className={`border ${cfg.borderColor} ${cfg.bgLight} rounded-2xl p-8`}>
        <div className="flex items-start gap-4 mb-6">
          <div className={`w-12 h-12 ${cfg.color} rounded-xl flex items-center justify-center shrink-0`}>
            <span className="material-symbols-outlined text-white text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>
              {cfg.icon}
            </span>
          </div>
          <div>
            <h2 className="font-headline-md text-on-surface text-xl font-bold">{cfg.title}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="material-symbols-outlined text-on-surface-variant text-xs">schedule</span>
              <span className="font-caption text-on-surface-variant text-xs">{cfg.duration}</span>
            </div>
          </div>
        </div>

        <p className="font-body-md text-on-surface-variant leading-relaxed mb-6">{cfg.description}</p>

        {lastTakenLabel && (
          <div className="flex items-center gap-2 mb-5 text-sm text-on-surface-variant font-caption">
            <span className="material-symbols-outlined text-sm">history</span>
            Last taken: {lastTakenLabel}
          </div>
        )}

        <div className="flex flex-wrap gap-3">
          <Link
            href={cfg.startHref}
            className={`inline-flex items-center gap-2 px-6 py-3 ${cfg.color} text-white rounded-xl font-metric-label text-sm hover:opacity-90 transition-opacity`}
          >
            <span className="material-symbols-outlined text-sm">{last ? 'refresh' : 'play_arrow'}</span>
            {last ? 'Retake Assessment' : 'Start Assessment'}
          </Link>

          {last && (
            <Link
              href={cfg.resultHref(last.id)}
              className="inline-flex items-center gap-2 px-6 py-3 border border-outline-variant text-on-surface-variant rounded-xl font-metric-label text-sm hover:bg-surface-container transition-colors"
            >
              <span className="material-symbols-outlined text-sm">bar_chart</span>
              View Last Results
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
