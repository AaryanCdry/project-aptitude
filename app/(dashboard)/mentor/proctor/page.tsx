import React from 'react';
import { getProctoringFlags } from '@/app/actions/mentor';

function FlagBadge({ active, label, icon }: { active: boolean; label: string; icon: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-bold border ${active ? 'bg-error-container text-error border-error/20' : 'bg-secondary-fixed text-on-secondary-fixed-variant border-transparent'}`}>
      <span className="material-symbols-outlined text-[12px]" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
      {label}
    </span>
  );
}

export default async function ProctoringPage() {
  const flags = await getProctoringFlags();

  const totalFlagged = flags.filter((f: any) => f.flagged).length;
  const tabViolations = flags.filter((f: any) => f.tabSwitches > 3).length;
  const faceViolations = flags.filter((f: any) => !f.faceDetected).length;
  const audioViolations = flags.filter((f: any) => f.audioFlag).length;

  return (
    <div className="p-6 max-w-container-max-width mx-auto pb-24">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display-sm text-on-background mb-1">Proctoring Log</h1>
        <p className="font-body-md text-on-surface-variant">Review flagged test sessions for integrity violations.</p>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Flagged', value: totalFlagged, icon: 'flag', color: totalFlagged > 0 ? 'text-error' : 'text-secondary' },
          { label: 'Tab Switches', value: tabViolations, icon: 'tab', color: 'text-primary' },
          { label: 'Face Absent', value: faceViolations, icon: 'face_retouching_off', color: 'text-error' },
          { label: 'Audio Flags', value: audioViolations, icon: 'mic_off', color: 'text-primary' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className={`border rounded-xl p-5 shadow-sm ${value > 0 && label === 'Total Flagged' ? 'bg-error-container/20 border-error/20' : 'bg-surface-container-lowest border-outline-variant'}`}>
            <div className={`flex items-center gap-2 mb-2 ${color}`}>
              <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: '"FILL" 1' }}>{icon}</span>
              <p className="font-caption text-on-surface-variant">{label}</p>
            </div>
            <p className={`font-display-sm text-[28px] font-bold ${value > 0 && color === 'text-error' ? 'text-error' : 'text-on-surface'}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Flags table */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-outline-variant bg-surface-bright flex justify-between items-center">
          <h2 className="font-headline-md text-on-surface font-semibold">Session Logs</h2>
          <span className="font-caption text-on-surface-variant">{flags.length} sessions</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-outline-variant">
                {['Student', 'Test Type', 'Tab Switches', 'Face', 'Audio', 'Avg Time/Q', 'Flags', 'Date'].map(h => (
                  <th key={h} className="py-3 px-4 font-metric-label text-on-surface-variant whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {flags.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <span className="material-symbols-outlined text-4xl text-outline block mb-2">verified_user</span>
                    <p className="font-body-md text-on-surface-variant">No proctoring logs yet.</p>
                    <p className="font-caption text-outline mt-1">Logs appear automatically when students take tests.</p>
                  </td>
                </tr>
              ) : flags.map((f: any) => (
                <tr key={f.id} className={`transition-colors ${f.flagged ? 'bg-error-container/10 hover:bg-error-container/20' : 'hover:bg-surface-container'}`}>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-body-md font-semibold text-on-surface">{f.student?.name ?? '—'}</p>
                      <p className="font-caption text-on-surface-variant">{f.student?.email}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${f.testType === 'CENTER' ? 'bg-primary-fixed-dim text-on-primary-fixed' : 'bg-surface-container text-on-surface'}`}>
                      {f.testType ?? '—'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`font-body-md font-bold ${f.tabSwitches > 3 ? 'text-error' : 'text-on-surface'}`}>{f.tabSwitches}</span>
                    {f.tabSwitches > 3 && <span className="material-symbols-outlined text-error text-sm ml-1">warning</span>}
                  </td>
                  <td className="py-3 px-4">
                    <FlagBadge active={!f.faceDetected} label={f.faceDetected ? 'OK' : 'Absent'} icon={f.faceDetected ? 'face' : 'face_retouching_off'} />
                  </td>
                  <td className="py-3 px-4">
                    <FlagBadge active={f.audioFlag} label={f.audioFlag ? 'Flagged' : 'Clear'} icon={f.audioFlag ? 'mic' : 'mic_off'} />
                  </td>
                  <td className="py-3 px-4 font-body-md text-on-surface-variant">
                    {f.avgTimeMs ? `${(f.avgTimeMs / 1000).toFixed(1)}s` : '—'}
                    {f.avgTimeMs && f.avgTimeMs < 8000 && (
                      <span className="ml-1 text-[10px] text-error font-bold">FAST</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {f.flagged
                      ? <span className="inline-flex items-center gap-1 text-xs bg-error text-on-error px-2 py-0.5 rounded-full font-bold"><span className="material-symbols-outlined text-[11px]">flag</span>FLAGGED</span>
                      : <span className="inline-flex items-center gap-1 text-xs bg-secondary-fixed text-on-secondary-fixed-variant px-2 py-0.5 rounded-full font-bold"><span className="material-symbols-outlined text-[11px]">check_circle</span>CLEAN</span>
                    }
                  </td>
                  <td className="py-3 px-4 font-caption text-on-surface-variant whitespace-nowrap">
                    {new Date(f.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
