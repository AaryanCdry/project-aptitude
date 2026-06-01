import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';

const STATUS_CHIP: Record<string, string> = {
  SCHEDULED:   'bg-surface-container-high text-on-surface border border-outline-variant',
  IN_PROGRESS: 'bg-primary-fixed-dim text-on-primary-fixed',
  COMPLETED:   'bg-secondary-fixed text-on-secondary-fixed-variant',
};

const STATUS_LABEL: Record<string, string> = {
  SCHEDULED:   'Scheduled',
  IN_PROGRESS: 'In Progress',
  COMPLETED:   'Completed',
};

const TIER_CHIP: Record<string, string> = {
  ADVANCED:     'bg-error-container text-on-error-container',
  INTERMEDIATE: 'bg-primary-fixed-dim text-on-primary-fixed',
  BASIC:        'bg-secondary-fixed text-on-secondary-fixed-variant',
};

export default async function StudentFinalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const adminClient = createAdminClient();

  // Fetch all finals for this student
  const { data: finals } = await adminClient
    .from('tests')
    .select('id, status, scheduled_at, completed_at')
    .eq('student_id', user.id)
    .eq('type', 'FINAL')
    .order('scheduled_at', { ascending: false });

  const rows = finals ?? [];

  // For completed finals, fetch scores + certificates + badges
  const completedIds = rows.filter(t => t.status === 'COMPLETED').map(t => t.id);

  const scoreMap: Record<string, number> = {};
  const certMap: Record<string, string> = {};
  const badgeMap: Record<string, string> = {};

  if (completedIds.length > 0) {
    const [{ data: scoreRows }, { data: certRows }, { data: badgeRows }] = await Promise.all([
      adminClient.from('scores').select('test_id, score').in('test_id', completedIds).eq('domain', 'OVERALL'),
      adminClient.from('certificates').select('tier, qr_code').eq('student_id', user.id).eq('revoked', false),
      adminClient.from('badges').select('test_id, tier').in('test_id', completedIds),
    ]);
    for (const s of scoreRows ?? []) scoreMap[(s as any).test_id] = (s as any).score;
    for (const c of certRows ?? []) {
      const testId = (c as any).qr_code?.substring(5, 41)?.toLowerCase();
      if (testId) certMap[testId] = (c as any).tier;
    }
    for (const b of badgeRows ?? []) badgeMap[(b as any).test_id] = (b as any).tier;
  }

  const pending = rows.filter(t => t.status !== 'COMPLETED');
  const completed = rows.filter(t => t.status === 'COMPLETED');

  return (
    <div className="p-margin-desktop max-w-container-max-width mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface mb-2">My Final Exams</h1>
        <p className="font-body-md text-on-surface-variant">
          View all your scheduled and completed final exams. Passing with ≥70% earns a certificate and badge.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-16 text-center shadow-sm">
          <span className="material-symbols-outlined text-5xl text-outline block mb-4">workspace_premium</span>
          <h3 className="font-headline-md text-on-surface mb-2">No final exams yet</h3>
          <p className="font-body-md text-on-surface-variant max-w-md mx-auto">
            Your institution will schedule a final exam for your class. Check back here when it's available.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {/* ── Pending finals ─────────────────────────────────────────── */}
          {pending.length > 0 && (
            <section>
              <h2 className="font-headline-md text-on-surface mb-4">Upcoming ({pending.length})</h2>
              <div className="flex flex-col gap-3">
                {pending.map(t => (
                  <div
                    key={t.id}
                    className="bg-surface-container-lowest border border-outline-variant rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${t.status === 'IN_PROGRESS' ? 'bg-primary/10' : 'bg-tertiary/10'}`}>
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>
                          {t.status === 'IN_PROGRESS' ? 'play_circle' : 'workspace_premium'}
                        </span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-metric-label px-2.5 py-0.5 rounded-full ${STATUS_CHIP[t.status]}`}>
                            {STATUS_LABEL[t.status] ?? t.status}
                          </span>
                        </div>
                        <p className="font-body-md text-on-surface-variant text-sm">
                          {t.scheduled_at
                            ? `Scheduled for ${new Date(t.scheduled_at).toLocaleString()}`
                            : 'No scheduled time set'}
                        </p>
                        <p className="font-caption text-on-surface-variant text-xs mt-0.5">
                          Passing ≥70% earns a certificate &amp; badge
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/assessment?test=${t.id}`}
                      className="bg-primary text-on-primary font-metric-label px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-primary/90 transition-colors shrink-0 text-sm"
                    >
                      <span className="material-symbols-outlined text-sm">play_arrow</span>
                      {t.status === 'IN_PROGRESS' ? 'Resume' : 'Start Exam'}
                    </Link>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Completed finals ───────────────────────────────────────── */}
          {completed.length > 0 && (
            <section>
              <h2 className="font-headline-md text-on-surface mb-4">Completed ({completed.length})</h2>
              <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
                <table className="w-full">
                  <thead className="bg-surface-container-high">
                    <tr className="text-left text-[11px] uppercase tracking-wider text-on-surface-variant">
                      <th className="px-5 py-3">Date Completed</th>
                      <th className="px-5 py-3">Score</th>
                      <th className="px-5 py-3">Certificate</th>
                      <th className="px-5 py-3">Badge</th>
                      <th className="px-5 py-3">Results</th>
                    </tr>
                  </thead>
                  <tbody>
                    {completed.map(t => {
                      const score = scoreMap[t.id] ?? null;
                      const certTier = certMap[t.id] ?? null;
                      const badgeTier = badgeMap[t.id] ?? null;
                      return (
                        <tr key={t.id} className="border-t border-outline-variant">
                          <td className="px-5 py-3 font-body-md text-on-surface-variant">
                            {t.completed_at ? new Date(t.completed_at).toLocaleString() : '—'}
                          </td>
                          <td className="px-5 py-3 font-body-md text-on-surface tabular-nums">
                            {score != null ? `${score}%` : '—'}
                          </td>
                          <td className="px-5 py-3">
                            {certTier
                              ? <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-metric-label ${TIER_CHIP[certTier]}`}>{certTier}</span>
                              : <span className="text-on-surface-variant text-sm">Below 70%</span>
                            }
                          </td>
                          <td className="px-5 py-3">
                            {badgeTier
                              ? (
                                <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-metric-label ${TIER_CHIP[badgeTier]}`}>
                                  <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: '"FILL" 1' }}>military_tech</span>
                                  {badgeTier}
                                </span>
                              )
                              : <span className="text-on-surface-variant text-sm">—</span>
                            }
                          </td>
                          <td className="px-5 py-3">
                            <Link
                              href={`/student/results/${t.id}`}
                              className="inline-flex items-center gap-1 text-xs px-3 py-1.5 border border-outline-variant rounded-lg text-primary font-metric-label hover:bg-surface-container transition-colors"
                            >
                              <span className="material-symbols-outlined text-xs">bar_chart</span>
                              View Results
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
