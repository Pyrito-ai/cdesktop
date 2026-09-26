import { Outlet } from '@tanstack/react-router';
import {
  GearIcon,
  MagnifyingGlassIcon,
  PlusIcon,
  SidebarSimpleIcon,
} from '@phosphor-icons/react';
import { useWorkbenchEmbed } from '@/shared/hooks/useWorkbenchEmbed';
import { useAppNavigation } from '@/shared/hooks/useAppNavigation';
import { useIsMobile } from '@/shared/hooks/useIsMobile';
import { useWorkspaceContext } from '@/shared/hooks/useWorkspaceContext';
import {
  useMobileActiveTab,
  type MobileTab,
} from '@/shared/stores/useUiPreferencesStore';
import { SyncErrorProvider } from '@/shared/providers/SyncErrorProvider';
import { CommandBarDialog } from '@/shared/dialogs/command-bar/CommandBarDialog';
import { SettingsDialog } from '@/shared/dialogs/settings/SettingsDialog';
import { useCommandBarShortcut } from '@/shared/hooks/useCommandBarShortcut';
import { IconButton } from '@vibe/ui/components/IconButton';
import { cn } from '@/shared/lib/utils';

const mobileTabs: { id: MobileTab; label: string }[] = [
  { id: 'workspaces', label: 'Sessions' },
  { id: 'chat', label: 'Chat' },
  { id: 'changes', label: 'Changes' },
  { id: 'logs', label: 'Terminal' },
  { id: 'preview', label: 'Preview' },
  { id: 'git', label: 'Git' },
];

/** Tencent owns the outer navigation and coordinator; keep the worker surface compact. */
export function WorkbenchEmbedLayout() {
  const { isSessionsOpen, setSessionsOpen } = useWorkbenchEmbed();
  const { workspace, isCreateMode } = useWorkspaceContext();
  const appNavigation = useAppNavigation();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useMobileActiveTab();

  useCommandBarShortcut(() => CommandBarDialog.show());

  const sessionsVisible = isMobile
    ? mobileTab === 'workspaces'
    : isSessionsOpen;

  return (
    <SyncErrorProvider>
      <div className="workbench-embed-surface flex h-dvh min-h-0 flex-col overflow-hidden bg-primary">
        <header className="flex h-11 shrink-0 items-center gap-2 border-b border-border px-3">
          <button
            type="button"
            className={cn(
              'flex items-center gap-1.5 rounded-md px-2 py-1.5 text-base text-low hover:bg-secondary hover:text-high',
              sessionsVisible && 'bg-secondary text-high'
            )}
            aria-label="Toggle sessions"
            aria-expanded={sessionsVisible}
            onClick={() =>
              isMobile
                ? setMobileTab(sessionsVisible ? 'chat' : 'workspaces')
                : setSessionsOpen(!isSessionsOpen)
            }
          >
            <SidebarSimpleIcon className="size-icon-base" />
            <span className="hidden sm:inline">Sessions</span>
          </button>
          <span className="text-base font-medium text-high">Workbench</span>
          <span className="hidden text-sm text-low sm:inline">cdesktop</span>
          <span className="min-w-0 flex-1 truncate text-base text-low">
            {!isCreateMode ? workspace?.name : ''}
          </span>
          <IconButton
            icon={MagnifyingGlassIcon}
            aria-label="Search commands"
            title="Search commands (⌘K / Ctrl+K)"
            onClick={() => void CommandBarDialog.show()}
          />
          <IconButton
            icon={GearIcon}
            aria-label="Worker settings"
            title="Worker settings"
            onClick={() => void SettingsDialog.show()}
          />
          <button
            type="button"
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-secondary px-2.5 py-1.5 text-base font-medium text-high hover:bg-panel"
            onClick={() => {
              appNavigation.goToWorkspacesCreate();
              setSessionsOpen(false);
              if (isMobile) setMobileTab('chat');
            }}
          >
            <PlusIcon className="size-icon-sm" />
            New session
          </button>
        </header>
        {isMobile && (
          <nav
            aria-label="Workspace tools"
            className="flex shrink-0 gap-1 overflow-x-auto border-b border-border px-2 py-1"
          >
            {mobileTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                aria-current={mobileTab === tab.id ? 'page' : undefined}
                className={cn(
                  'rounded-md px-2 py-1.5 text-base text-low',
                  mobileTab === tab.id && 'bg-secondary text-high'
                )}
                onClick={() => setMobileTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        )}
        <main className="relative min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </main>
      </div>
    </SyncErrorProvider>
  );
}
