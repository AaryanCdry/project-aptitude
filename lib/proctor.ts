// Client-side proctoring utilities for the test environment

export type ProctorEvent =
  | { type: 'TAB_SWITCH' }
  | { type: 'VISIBILITY_HIDDEN' }
  | { type: 'FOCUS_LOST' }
  | { type: 'AUDIO_SPIKE'; level: number };

export type ProctorSession = {
  testId: string;
  tabSwitches: number;
  focusLostCount: number;
  audioSpikes: number;
  startedAt: number;
};

export function createProctorSession(testId: string): ProctorSession {
  return {
    testId,
    tabSwitches: 0,
    focusLostCount: 0,
    audioSpikes: 0,
    startedAt: Date.now(),
  };
}

export function applyEvent(session: ProctorSession, event: ProctorEvent): ProctorSession {
  switch (event.type) {
    case 'TAB_SWITCH':
      return { ...session, tabSwitches: session.tabSwitches + 1 };
    case 'VISIBILITY_HIDDEN':
      return { ...session, tabSwitches: session.tabSwitches + 1 };
    case 'FOCUS_LOST':
      return { ...session, focusLostCount: session.focusLostCount + 1 };
    case 'AUDIO_SPIKE':
      return { ...session, audioSpikes: session.audioSpikes + 1 };
    default:
      return session;
  }
}

// Returns true if the session is suspicious and should be flagged
export function isFlagged(session: ProctorSession): boolean {
  return session.tabSwitches >= 3 || session.audioSpikes >= 5;
}

// Build proctoring log payload to send to the API
export function buildLogPayload(session: ProctorSession, avgTimeMs: number) {
  return {
    test_id: session.testId,
    tab_switches: session.tabSwitches,
    face_detected: true, // default; override when face detection is implemented
    audio_flag: session.audioSpikes > 0,
    avg_time_ms: avgTimeMs,
    flagged: isFlagged(session),
  };
}

// Log proctoring session to DB (call on test finish)
export async function submitProctoringLog(payload: ReturnType<typeof buildLogPayload>) {
  await fetch('/api/proctor/log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}
