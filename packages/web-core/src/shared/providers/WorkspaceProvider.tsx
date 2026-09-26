import {
  ReactNode,
  useContext,
  useMemo,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { useNavigate, useParams, useSearch } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { useWorkspaces } from '@/shared/hooks/useWorkspaces';
import { workspaceSummaryKeys } from '@/shared/hooks/workspaceSummaryKeys';
import { useWorkspaceRecord } from '@/shared/hooks/useWorkspaceRecord';
import { useWorkspaceRepo } from '@/shared/hooks/useWorkspaceRepo';
import { useWorkspaceSessions } from '@/shared/hooks/useWorkspaceSessions';
import { useGitHubComments } from '@/shared/hooks/useGitHubComments';
import { useDiffStream } from '@/shared/hooks/useDiffStream';
import { workspacesApi } from '@/shared/lib/api';
import { useWorkspaceDiffStore } from '@/shared/stores/useWorkspaceDiffStore';
import { useSessionGridStore } from '@/shared/stores/useSessionGridStore';
import type { DiffStats } from 'shared/types';
import { useAppNavigation } from '@/shared/hooks/useAppNavigation';
import { useCurrentAppDestination } from '@/shared/hooks/useCurrentAppDestination';
import { useWorkbenchEmbed } from '@/shared/hooks/useWorkbenchEmbed';

import { WorkspaceContext } from '@/shared/hooks/useWorkspaceContext';

interface WorkspaceProviderProps {
  children: ReactNode;
  /**
   * Override the URL-derived workspace. When omitted, the provider falls
   * back to the workspaceId in the route params — that's the path used at
   * the route level. When set explicitly, it lets a parent (e.g.
   * `<SessionGrid>`) mount one provider per cell with a different workspace
   * each.
   */
  workspaceId?: string;
}

export function WorkspaceProvider({
  children,
  workspaceId: workspaceIdProp,
}: WorkspaceProviderProps) {
  const { workspaceId: rawWorkspaceIdFromRoute } = useParams({ strict: false });
  // "create" is the create-mode sentinel served by the $workspaceId route —
  // treat it as no workspace so downstream queries / effects see the same
  // shape they would on /workspaces/create.
  const workspaceIdFromRoute =
    rawWorkspaceIdFromRoute === 'create' ? undefined : rawWorkspaceIdFromRoute;
  const workspaceId = workspaceIdProp ?? workspaceIdFromRoute;
  const outer = useContext(WorkspaceContext);

  // If an outer provider is already serving this same workspaceId (e.g.
  // route-level provider + a CellHost that happens to render the URL
  // workspace), pass through instead of mounting a duplicate fetcher.
  if (workspaceIdProp && outer && outer.workspaceId === workspaceIdProp) {
    return <>{children}</>;
  }
  return (
    <WorkspaceProviderInner
      workspaceId={workspaceId}
      workspaceIdProp={workspaceIdProp}
    >
      {children}
    </WorkspaceProviderInner>
  );
}

function WorkspaceProviderInner({
  children,
  workspaceId,
  workspaceIdProp,
}: {
  children: ReactNode;
  workspaceId: string | undefined;
  workspaceIdProp: string | undefined;
}) {
  const appNavigation = useAppNavigation();
  const currentDestination = useCurrentAppDestination();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const search = useSearch({ strict: false });
  const { isEmbedded } = useWorkbenchEmbed();

  // Create mode is a URL-level state; only the route-level provider can be
  // in create mode. Child providers (per-cell) always render a real workspace.
  const isCreateMode =
    !workspaceIdProp && currentDestination?.kind === 'workspaces-create';
  const isUrlSessionEnabled =
    isEmbedded && !!workspaceId && !workspaceIdProp && !isCreateMode;
  const requestedSessionId =
    isUrlSessionEnabled &&
    'sessionId' in search &&
    typeof search.sessionId === 'string'
      ? search.sessionId
      : undefined;

  const {
    workspaces: activeWorkspaces,
    archivedWorkspaces,
    isLoading: isLoadingList,
  } = useWorkspaces();

  const { data: workspace, isLoading: isLoadingWorkspace } = useWorkspaceRecord(
    workspaceId,
    { enabled: !!workspaceId && !isCreateMode }
  );

  const {
    sessions,
    selectedSession,
    selectedSessionId,
    selectSession: selectSessionState,
    selectLatestSession: selectLatestSessionState,
    isLoading: isSessionsLoading,
    isNewSessionMode,
    startNewSession: startNewSessionState,
  } = useWorkspaceSessions(workspaceId, {
    enabled: !isCreateMode,
    requestedSessionId,
  });

  const updateSessionUrl = useCallback(
    (sessionId: string | undefined) => {
      if (!isUrlSessionEnabled) return;
      void navigate({
        to: '.',
        search: (previous: Record<string, unknown>) => ({
          ...previous,
          sessionId,
        }),
        replace: true,
        resetScroll: false,
      });
    },
    [isUrlSessionEnabled, navigate]
  );

  const selectSession = useCallback(
    (sessionId: string) => {
      selectSessionState(sessionId);
      updateSessionUrl(sessionId);
    },
    [selectSessionState, updateSessionUrl]
  );
  const selectLatestSession = useCallback(() => {
    selectLatestSessionState();
    updateSessionUrl(sessions[0]?.id);
  }, [selectLatestSessionState, sessions, updateSessionUrl]);
  const startNewSession = useCallback(() => {
    startNewSessionState();
    updateSessionUrl(undefined);
  }, [startNewSessionState, updateSessionUrl]);
  const hasUnavailableSessionTarget =
    !!requestedSessionId &&
    !isSessionsLoading &&
    !sessions.some((session) => session.id === requestedSessionId);

  const { repos, isLoading: isReposLoading } = useWorkspaceRepo(workspaceId, {
    enabled: !isCreateMode,
  });

  // TODO: Support multiple repos - currently only fetches comments from the primary repo.
  const primaryRepoId = repos[0]?.id;

  const currentWorkspaceSummary = activeWorkspaces.find(
    (w) => w.id === workspaceId
  );
  const hasPrAttached = !!currentWorkspaceSummary?.prStatus;

  const {
    gitHubComments,
    isGitHubCommentsLoading,
    showGitHubComments,
    setShowGitHubComments,
    getGitHubCommentsForFile,
    getGitHubCommentCountForFile,
    getFilesWithGitHubComments,
    getFirstCommentLineForFile,
  } = useGitHubComments({
    workspaceId,
    repoId: primaryRepoId,
    enabled: !isCreateMode && hasPrAttached,
  });

  const { diffs } = useDiffStream(workspaceId ?? null, !isCreateMode);

  const diffPaths = useMemo(
    () =>
      new Set(diffs.map((d) => d.newPath || d.oldPath || '').filter(Boolean)),
    [diffs]
  );

  const diffStats: DiffStats = useMemo(
    () => ({
      files_changed: diffs.length,
      lines_added: diffs.reduce((sum, d) => sum + (d.additions ?? 0), 0),
      lines_removed: diffs.reduce((sum, d) => sum + (d.deletions ?? 0), 0),
    }),
    [diffs]
  );

  const rafRef = useRef<number | null>(null);
  const batchCountRef = useRef(0);

  const latestDiffDataRef = useRef({
    diffs,
    diffPaths,
    diffStats,
    gitHubComments,
    isGitHubCommentsLoading,
    showGitHubComments,
    setShowGitHubComments,
    getGitHubCommentsForFile,
    getGitHubCommentCountForFile,
    getFilesWithGitHubComments,
    getFirstCommentLineForFile,
  });
  latestDiffDataRef.current = {
    diffs,
    diffPaths,
    diffStats,
    gitHubComments,
    isGitHubCommentsLoading,
    showGitHubComments,
    setShowGitHubComments,
    getGitHubCommentsForFile,
    getGitHubCommentCountForFile,
    getFilesWithGitHubComments,
    getFirstCommentLineForFile,
  };

  useEffect(() => {
    if (!workspaceId) return;
    batchCountRef.current++;
    if (rafRef.current === null) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        batchCountRef.current = 0;
        useWorkspaceDiffStore
          .getState()
          .setWorkspaceDiffData(workspaceId, latestDiffDataRef.current);
      });
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [
    workspaceId,
    diffs,
    diffPaths,
    diffStats,
    gitHubComments,
    isGitHubCommentsLoading,
    showGitHubComments,
    setShowGitHubComments,
    getGitHubCommentsForFile,
    getGitHubCommentCountForFile,
    getFilesWithGitHubComments,
    getFirstCommentLineForFile,
  ]);

  useEffect(() => {
    if (!workspaceId) return;
    return () => {
      useWorkspaceDiffStore.getState().clearWorkspaceDiffData(workspaceId);
    };
  }, [workspaceId]);

  const isLoading = isLoadingList || isLoadingWorkspace;

  useEffect(() => {
    if (!workspaceId || isCreateMode) return;

    workspacesApi
      .markSeen(workspaceId)
      .then(() => {
        queryClient.invalidateQueries({ queryKey: workspaceSummaryKeys.all });
      })
      .catch((error) => {
        console.warn('Failed to mark workspace as seen:', error);
      });
  }, [workspaceId, isCreateMode, queryClient]);

  // Reflect URL → session-grid first cell. The grid keeps the rest of the
  // layout (other cells, primary orientation, ratios) untouched; only the
  // top-left cell follows the URL. If the URL workspace is already mounted
  // in another cell, setFirstCellSession just shifts focus there.
  // Per-cell providers (workspaceIdProp set) skip this — only the route-
  // level provider drives the URL→grid sync.
  useEffect(() => {
    if (workspaceIdProp) return;
    if (!workspaceId || isCreateMode) return;
    useSessionGridStore.getState().setFirstCellSession(workspaceId);
  }, [workspaceIdProp, workspaceId, isCreateMode]);

  const selectWorkspace = useCallback(
    (id: string) => {
      appNavigation.goToWorkspace(id);
    },
    [appNavigation]
  );

  const navigateToCreate = useMemo(
    () => () => {
      appNavigation.goToWorkspacesCreate();
    },
    [appNavigation]
  );

  const coreValue = useMemo(
    () => ({
      workspaceId,
      workspace,
      activeWorkspaces,
      archivedWorkspaces,
      isWorkspacesListLoading: isLoadingList,
      isLoading,
      isCreateMode,
      selectWorkspace,
      navigateToCreate,
      sessions,
      selectedSession,
      selectedSessionId,
      selectSession,
      selectLatestSession,
      isSessionsLoading,
      isNewSessionMode,
      startNewSession,
      repos,
      isReposLoading,
    }),
    [
      workspaceId,
      workspace,
      activeWorkspaces,
      archivedWorkspaces,
      isLoadingList,
      isLoading,
      isCreateMode,
      selectWorkspace,
      navigateToCreate,
      sessions,
      selectedSession,
      selectedSessionId,
      selectSession,
      selectLatestSession,
      isSessionsLoading,
      isNewSessionMode,
      startNewSession,
      repos,
      isReposLoading,
    ]
  );

  return (
    <WorkspaceContext.Provider value={coreValue}>
      {hasUnavailableSessionTarget && (
        <div
          role="alert"
          className="new-design fixed top-base left-base right-base z-50 flex items-center justify-between gap-base rounded border bg-panel px-base py-half text-base text-high shadow-sm"
        >
          <span>
            The linked session is unavailable in this workspace.
            {sessions.length > 0 && ' Showing the latest session.'}
          </span>
          <button
            type="button"
            className="shrink-0 underline"
            onClick={() => updateSessionUrl(undefined)}
          >
            Dismiss
          </button>
        </div>
      )}
      {children}
    </WorkspaceContext.Provider>
  );
}
