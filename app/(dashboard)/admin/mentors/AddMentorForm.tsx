'use client';

import { useState, useTransition } from 'react';
import { addMentor } from '@/app/actions/reports';

export default function AddMentorForm() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !name) return;
    startTransition(async () => {
      try {
        await addMentor(email, name);
        setMessage({ type: 'success', text: `Invite sent to ${email}` });
        setEmail('');
        setName('');
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message ?? 'Failed to invite mentor' });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block font-metric-label text-on-surface-variant mb-1.5 text-sm">Full Name</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Prof. Jane Smith"
            required
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
        </div>
        <div>
          <label className="block font-metric-label text-on-surface-variant mb-1.5 text-sm">Email Address</label>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="mentor@college.edu"
            required
            className="w-full bg-surface-container-low border border-outline-variant rounded-lg px-4 py-2.5 text-on-surface font-body-md focus:outline-none focus:ring-2 focus:ring-primary transition-shadow"
          />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-metric-label disabled:opacity-50 hover:opacity-90 transition-opacity"
        >
          <span className="material-symbols-outlined text-sm">school</span>
          {isPending ? 'Promoting…' : 'Promote to Mentor'}
        </button>
        {message && (
          <p className={`font-caption flex items-center gap-1 ${message.type === 'success' ? 'text-secondary' : 'text-error'}`}>
            <span className="material-symbols-outlined text-sm">
              {message.type === 'success' ? 'check_circle' : 'error'}
            </span>
            {message.text}
          </p>
        )}
      </div>
    </form>
  );
}
