/** Discriminated union for session selection state. */
export type SessionSelection =
  | { mode: 'existing'; sessionId: string }
  | { mode: 'new' };

export function resolveWorkspaceSessionSelection({
  previous,
  sessions,
  workspaceChanged,
  isInitialized,
  requestedSessionId,
}: {
  previous: SessionSelection | undefined;
  sessions: readonly { id: string }[];
  workspaceChanged: boolean;
  isInitialized: boolean;
  requestedSessionId?: string;
}): SessionSelection | undefined {
  // A previous endpoint's snapshot must never satisfy a new URL request.
  if (requestedSessionId && !isInitialized) return undefined;
  if (sessions.length === 0) return isInitialized ? undefined : previous;

  if (requestedSessionId) {
    const requested = sessions.find(
      (session) => session.id === requestedSessionId
    );
    return { mode: 'existing', sessionId: (requested ?? sessions[0]).id };
  }

  if (previous?.mode === 'new' && !workspaceChanged) return previous;
  if (
    previous?.mode === 'existing' &&
    !workspaceChanged &&
    sessions.some((session) => session.id === previous.sessionId)
  ) {
    return previous;
  }

  return { mode: 'existing', sessionId: sessions[0].id };
}
