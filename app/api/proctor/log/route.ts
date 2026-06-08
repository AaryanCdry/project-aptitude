import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { test_id, tab_switches, face_detected, audio_flag, avg_time_ms, flagged } = body;
  if (!test_id) return NextResponse.json({ error: 'test_id required' }, { status: 400 });

  const { error } = await supabase.from('proctoring_logs').insert({
    test_id,
    tab_switches: tab_switches ?? 0,
    face_detected: face_detected ?? true,
    audio_flag: audio_flag ?? false,
    avg_time_ms: avg_time_ms ?? null,
    flagged: flagged ?? false,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
