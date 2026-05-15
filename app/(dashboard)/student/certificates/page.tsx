import React from 'react';
import Link from 'next/link';
import { getStudentGrowthAndCertificates } from '@/app/actions/progress';

const DOMAIN_COLORS: Record<string, { stroke: string; dash?: string }> = {
  LOGICAL:      { stroke: '#3525cd' },
  QUANTITATIVE: { stroke: '#00687a', dash: '4' },
  VERBAL:       { stroke: '#885500' },
  REASONING:    { stroke: '#3525cd', dash: '2 2' },
};

const DOMAIN_DOT_COLORS: Record<string, string> = {
  LOGICAL:      'bg-primary',
  QUANTITATIVE: 'bg-secondary',
  VERBAL:       'bg-tertiary-container',
  REASONING:    'bg-primary/60',
};

const DOMAIN_ICONS: Record<string, string> = {
  QUANTITATIVE: 'functions',
  LOGICAL:      'psychology',
  VERBAL:       'translate',
  REASONING:    'memory',
};

function GrowthChart({ domainTimeline }: { domainTimeline: Record<string, { month: string; score: number }[]> }) {
  const domains = Object.keys(domainTimeline);

  if (domains.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-on-surface-variant font-body-md">
        Complete tests to see your growth chart.
      </div>
    );
  }

  // Collect all unique months in chronological order
  const monthSet = new Set<string>();
  domains.forEach(d => domainTimeline[d].forEach(p => monthSet.add(p.month)));
  const months = Array.from(monthSet);

  // For SVG: build polyline points per domain (100x100 viewBox)
  const getPoints = (data: { month: string; score: number }[]) => {
    const monthMap = Object.fromEntries(data.map(p => [p.month, p.score]));
    return months
      .map((m, i) => {
        const x = months.length === 1 ? 50 : (i / (months.length - 1)) * 100;
        const score = monthMap[m];
        if (score === undefined) return null;
        const y = 100 - score;
        return `${x},${y}`;
      })
      .filter(Boolean)
      .join(' ');
  };

  return (
    <div className="space-y-4">
      <div className="relative h-64 w-full border-l border-b border-outline-variant mt-8 ml-8">
        {/* Y axis labels */}
        <div className="absolute -left-8 top-0 h-full flex flex-col justify-between text-on-surface-variant font-caption text-[10px] items-end pr-2">
          {[100, 75, 50, 25, 0].map(v => <span key={v}>{v}</span>)}
        </div>
        {/* X axis labels */}
        <div className="absolute -bottom-6 left-0 w-full flex justify-between text-on-surface-variant font-caption text-[10px] px-2">
          {months.slice(0, 6).map(m => <span key={m}>{m}</span>)}
        </div>
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
          {[0, 1, 2, 3].map(i => (
            <div key={i} className="w-full border-t border-outline-variant opacity-30" />
          ))}
          <div className="w-full" />
        </div>
        {/* SVG */}
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
          {domains.map(domain => {
            const config = DOMAIN_COLORS[domain] ?? { stroke: '#3525cd' };
            const pts = getPoints(domainTimeline[domain]);
            if (!pts) return null;
            return (
              <polyline
                key={domain}
                fill="none"
                points={pts}
                stroke={config.stroke}
                strokeDasharray={config.dash}
                strokeWidth="2"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
        </svg>
      </div>
      {/* Legend */}
      <div className="flex flex-wrap justify-center gap-6 mt-10">
        {domains.map(domain => (
          <div key={domain} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${DOMAIN_DOT_COLORS[domain] ?? 'bg-primary'}`} />
            <span className="font-metric-label text-on-surface-variant text-xs">{domain}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CertificatesPage() {
  const {
    studentName,
    domainTimeline,
    certifiedSkills,
    topDomain,
    topScore,
    topPercentile,
    hasCertificate,
  } = await getStudentGrowthAndCertificates();

  const topDomainLabel = topDomain
    ? topDomain.charAt(0) + topDomain.slice(1).toLowerCase() + ' Reasoning'
    : 'Cognitive Assessment';

  const inTop5 = topPercentile >= 95;

  return (
    <div className="p-margin-mobile md:p-margin-desktop overflow-y-auto">
      <div className="max-w-container-max-width mx-auto space-y-12">

        {/* Header */}
        <div>
          <h1 className="font-display-sm text-on-surface mb-2">Growth &amp; Certification</h1>
          <p className="font-body-lg text-on-surface-variant">Track your cognitive development and access your verified credentials.</p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column */}
          <div className="lg:col-span-7 flex flex-col gap-8">

            {/* Growth Chart */}
            <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-headline-md text-on-surface">Cognitive Growth Over Time</h2>
                <Link href="/student/progress" className="text-primary hover:underline font-caption text-xs flex items-center gap-1">
                  Full Progress <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </Link>
              </div>
              <GrowthChart domainTimeline={domainTimeline} />
            </div>

            {/* Certified Skills Grid */}
            <div>
              <h3 className="font-headline-md text-on-surface mb-4">Certified Skills</h3>
              {certifiedSkills.length === 0 ? (
                <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-10 text-center">
                  <span className="material-symbols-outlined text-4xl text-outline block mb-3">workspace_premium</span>
                  <p className="font-body-md text-on-surface-variant">No certified skills yet.</p>
                  <p className="font-caption text-outline mt-1">Reach Level 3 in a domain to earn your first skill badge.</p>
                  <Link href="/assessment" className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label">
                    Take a Test
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {certifiedSkills.map(skill => (
                    <div
                      key={skill.domain}
                      className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex items-start gap-4 hover:shadow-[0px_10px_15px_-3px_rgba(79,70,229,0.05)] transition-shadow"
                    >
                      <div className={`p-3 rounded-lg flex-shrink-0 ${skill.level >= 4 ? 'bg-primary-container text-on-primary-container' : 'bg-surface-container-high text-on-surface'}`}>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: '"FILL" 1' }}>
                          {DOMAIN_ICONS[skill.domain] ?? 'verified'}
                        </span>
                      </div>
                      <div>
                        <h4 className="font-headline-md text-base text-on-surface mb-1">{skill.label}</h4>
                        <p className="font-caption text-on-surface-variant">Achieved {skill.achievedAt}</p>
                        <div className="flex gap-1 mt-2">
                          {[1, 2, 3, 4, 5].map(l => (
                            <div key={l} className={`h-1 w-5 rounded-full ${l <= skill.level ? 'bg-primary' : 'bg-surface-container-high'}`} />
                          ))}
                          <span className="font-caption text-on-surface-variant ml-1 text-[10px]">L{skill.level}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Certificate */}
          <div className="lg:col-span-5">
            <div className="sticky top-8 space-y-6">

              {/* Certificate Card */}
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm relative">
                <div className="h-2 bg-primary w-full" />
                <div className="p-8 text-center relative bg-white">
                  {/* Watermark */}
                  <span
                    className="material-symbols-outlined absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-[180px] text-surface-variant opacity-10 pointer-events-none select-none"
                    style={{ fontVariationSettings: '"FILL" 1' }}
                  >
                    workspace_premium
                  </span>

                  <div className="mb-6 flex justify-center relative z-10">
                    <div className={`w-16 h-16 rounded-full flex items-center justify-center border border-outline-variant ${hasCertificate ? 'bg-primary-container' : 'bg-surface-container'}`}>
                      <span
                        className={`material-symbols-outlined text-3xl ${hasCertificate ? 'text-on-primary-container' : 'text-outline'}`}
                        style={{ fontVariationSettings: '"FILL" 1' }}
                      >
                        workspace_premium
                      </span>
                    </div>
                  </div>

                  <p className="font-metric-label text-on-surface-variant tracking-widest uppercase mb-2 text-xs relative z-10">
                    Certificate of Excellence
                  </p>
                  <h3 className="font-display-sm text-2xl text-on-surface mb-8 relative z-10">
                    {hasCertificate ? topDomainLabel : 'Complete an Assessment'}
                  </h3>

                  {hasCertificate ? (
                    <>
                      <p className="font-body-md text-on-surface-variant mb-2 relative z-10">This is to certify that</p>
                      <p className="font-display-lg text-4xl text-primary font-bold mb-8 relative z-10" style={{ fontFamily: 'Georgia, serif' }}>
                        {studentName}
                      </p>
                      <p className="font-body-md text-on-surface-variant max-w-xs mx-auto mb-10 relative z-10">
                        Has successfully completed the assessment with a score placing them in the top{' '}
                        {inTop5 ? '5%' : topPercentile >= 85 ? '15%' : '30%'} of candidates.
                      </p>
                      <div className="flex justify-between items-end border-t border-outline-variant pt-6 mt-6 relative z-10">
                        <div className="text-left">
                          <div className="w-16 h-16 bg-surface-container border border-outline-variant p-1 rounded">
                            <div className="w-full h-full bg-surface-container-high opacity-50" />
                          </div>
                          <p className="font-caption text-[10px] text-on-surface-variant mt-1 text-center">Verify</p>
                        </div>
                        <div className="text-right">
                          <p className="font-headline-md text-xl text-on-surface" style={{ fontFamily: "'Brush Script MT', cursive", transform: 'rotate(-2deg)' }}>
                            AptitudePro
                          </p>
                          <div className="w-28 h-px bg-outline-variant mb-1 mt-2" />
                          <p className="font-caption text-[10px] text-on-surface-variant uppercase tracking-wider">Chief Assessor</p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-4 relative z-10">
                      <p className="font-body-md text-on-surface-variant mb-6">
                        Score 85%+ on an assessment or reach Level 3 in a domain to unlock your certificate.
                      </p>
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3 p-3 bg-surface-container-low rounded-lg border border-outline-variant text-left">
                          <span className="material-symbols-outlined text-primary">quiz</span>
                          <div>
                            <p className="font-metric-label text-on-surface text-sm">Score 85%+ on any test</p>
                            <p className="font-caption text-on-surface-variant">or reach Level 3 in a domain</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <button
                  disabled={!hasCertificate}
                  className={`w-full py-3 px-4 rounded-lg font-headline-md text-base font-bold flex justify-center items-center gap-2 transition-colors ${
                    hasCertificate
                      ? 'bg-primary text-on-primary hover:bg-on-primary-fixed-variant'
                      : 'bg-surface-container text-on-surface-variant cursor-not-allowed'
                  }`}
                >
                  <span className="material-symbols-outlined text-sm">download</span>
                  Download PDF
                </button>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    disabled={!hasCertificate}
                    className={`py-3 px-4 border rounded-lg font-headline-md text-sm flex justify-center items-center gap-2 transition-colors ${
                      hasCertificate
                        ? 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container'
                        : 'border-outline-variant text-on-surface-variant cursor-not-allowed opacity-40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">share</span>
                    Share
                  </button>
                  <button
                    disabled={!hasCertificate}
                    className={`py-3 px-4 border rounded-lg font-headline-md text-sm flex justify-center items-center gap-2 transition-colors ${
                      hasCertificate
                        ? 'bg-surface-container-lowest border-outline-variant text-on-surface hover:bg-surface-container'
                        : 'border-outline-variant text-on-surface-variant cursor-not-allowed opacity-40'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">link</span>
                    Copy Link
                  </button>
                </div>
                {!hasCertificate && (
                  <Link
                    href="/assessment"
                    className="w-full py-3 px-4 border border-primary text-primary rounded-lg font-metric-label text-sm flex justify-center items-center gap-2 hover:bg-primary/5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-sm">play_arrow</span>
                    Start an Assessment
                  </Link>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
