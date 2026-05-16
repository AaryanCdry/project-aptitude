'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';

export default function AddCollegeForm() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    startTransition(async () => {
      const supabase = createClient();
      const { error } = await supabase
        .from('colleges')
        .insert({ name: name.trim(), code: code.trim().toUpperCase(), status: 'ACTIVE' });
      if (error) {
        setMessage({ type: 'error', text: error.message });
      } else {
        setMessage({ type: 'success', text: `College "${name}" added successfully.` });
        setName(''); setCode('');
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-metric-label text-on-surface-variant mb-1.5 text-sm">College Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Institute of Technology"
            required
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div>
          <label className="block font-metric-label text-on-surface-variant mb-1.5 text-sm">College Code</label>
          <input
            type="text"
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="IOT-001"
            required
            maxLength={12}
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary font-mono"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">add_business</span>
          {isPending ? 'Adding…' : 'Add College'}
        </button>
        {message && (
          <p className={`font-caption flex items-center gap-1 ${message.type === 'success' ? 'text-secondary' : 'text-error'}`}>
            <span className="material-symbols-outlined text-sm">{message.type === 'success' ? 'check_circle' : 'error'}</span>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
