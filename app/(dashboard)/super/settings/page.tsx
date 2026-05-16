import React from 'react';

export default function SuperSettingsPage() {
  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="font-display-sm text-on-surface text-2xl font-bold mb-1">Platform Settings</h1>
        <p className="font-body-md text-on-surface-variant">Global configuration, API keys, and feature flags.</p>
      </div>

      {/* API Keys */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-6">
        <h2 className="font-headline-md text-on-surface mb-4">API Keys</h2>
        <div className="flex flex-col gap-4">
          {[
            { label: 'Gemini API Key', placeholder: 'AIza…', env: 'GEMINI_API_KEY' },
            { label: 'OpenAI API Key (v2)', placeholder: 'sk-…', env: 'OPENAI_API_KEY' },
          ].map(({ label, placeholder, env }) => (
            <div key={env}>
              <label className="block font-metric-label text-on-surface-variant mb-1.5 text-sm">{label}</label>
              <div className="flex gap-2">
                <input
                  type="password"
                  placeholder={placeholder}
                  className="flex-1 bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-mono text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <button className="px-4 py-2.5 border border-outline text-on-surface rounded-lg font-metric-label text-sm hover:bg-surface-container transition-colors">
                  Update
                </button>
              </div>
              <p className="font-caption text-on-surface-variant mt-1">Stored as environment variable <code className="font-mono text-xs bg-surface-container px-1 rounded">{env}</code></p>
            </div>
          ))}
        </div>
      </div>

      {/* Feature Flags */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm mb-6">
        <h2 className="font-headline-md text-on-surface mb-4">Feature Flags</h2>
        <div className="flex flex-col gap-0">
          {[
            { label: 'AI Question Generation', desc: 'Allow mentors to generate questions via AI', on: true },
            { label: 'Face Detection Proctoring', desc: 'Enable webcam-based face detection during tests', on: false },
            { label: 'Audio Anomaly Detection', desc: 'Flag tests with background audio spikes', on: false },
            { label: 'Certificate Issuance', desc: 'Allow mentors to issue certificates to eligible students', on: true },
            { label: 'Student Leaderboard', desc: 'Show class and college leaderboard to students', on: true },
          ].map(({ label, desc, on }) => (
            <div key={label} className="flex items-center justify-between py-4 border-b border-outline-variant last:border-0">
              <div>
                <p className="font-metric-label text-on-surface">{label}</p>
                <p className="font-caption text-on-surface-variant">{desc}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer ml-4 shrink-0">
                <input type="checkbox" defaultChecked={on} className="sr-only peer" />
                <div className="w-10 h-6 bg-surface-container-high peer-checked:bg-primary rounded-full peer peer-checked:after:translate-x-4 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all" />
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Announcement banner */}
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 shadow-sm">
        <h2 className="font-headline-md text-on-surface mb-4">Announcement Banner</h2>
        <div className="flex flex-col gap-3">
          <textarea
            rows={3}
            placeholder="Enter a platform-wide announcement message…"
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary resize-none"
          />
          <div className="flex gap-2">
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label text-sm hover:opacity-90 transition-opacity">
              <span className="material-symbols-outlined text-sm">campaign</span>
              Publish Banner
            </button>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 border border-outline text-on-surface rounded-lg font-metric-label text-sm hover:bg-surface-container transition-colors">
              Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
