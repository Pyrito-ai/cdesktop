import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolveWorkspaceSessionSelection } from './workspaceSessionSelection.ts';

const sessions = [{ id: 'latest' }, { id: 'linked' }];
const resolve = (
  overrides: Partial<
    Parameters<typeof resolveWorkspaceSessionSelection>[0]
  > = {}
) =>
  resolveWorkspaceSessionSelection({
    previous: undefined,
    sessions,
    workspaceChanged: false,
    isInitialized: true,
    ...overrides,
  });

test('a deep link selects the requested member on the first loaded snapshot', () => {
  assert.deepEqual(resolve({ requestedSessionId: 'linked' }), {
    mode: 'existing',
    sessionId: 'linked',
  });
});

test('a previous endpoint snapshot cannot satisfy a pending deep link', () => {
  assert.equal(
    resolve({ requestedSessionId: 'linked', isInitialized: false }),
    undefined
  );
});

test('an unavailable session falls back only to a member of this workspace', () => {
  assert.deepEqual(resolve({ requestedSessionId: 'foreign-session' }), {
    mode: 'existing',
    sessionId: 'latest',
  });
});

test('removing the URL target preserves the new-session draft', () => {
  assert.deepEqual(resolve({ previous: { mode: 'new' } }), { mode: 'new' });
});

test('standalone selection stays sticky through live updates', () => {
  assert.deepEqual(
    resolve({ previous: { mode: 'existing', sessionId: 'linked' } }),
    { mode: 'existing', sessionId: 'linked' }
  );
});

test('workspace changes and deleted selections select the current latest', () => {
  for (const overrides of [
    { previous: { mode: 'new' as const }, workspaceChanged: true },
    { previous: { mode: 'existing' as const, sessionId: 'deleted' } },
  ]) {
    assert.deepEqual(resolve(overrides), {
      mode: 'existing',
      sessionId: 'latest',
    });
  }
});
