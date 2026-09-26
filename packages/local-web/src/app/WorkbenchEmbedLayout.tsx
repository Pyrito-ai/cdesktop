import { Outlet } from '@tanstack/react-router';
import { useTranslation } from 'react-i18next';
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

/** Tencent owns the outer navigation and coordinator; keep the worker surface compact. */
export function WorkbenchEmbedLayout() {
  const { t } = useTranslation('common');
  const { isSessionsOpen, setSessionsOpen } = useWorkbenchEmbed();
  const { workspace, isCreateMode } = useWorkspaceContext();
  const appNavigation = useAppNavigation();
  const isMobile = useIsMobile();
  const [mobileTab, setMobileTab] = useMobileActiveTab();
  const mobileTabs: { id: MobileTab; label: string }[] = [
    { id: 'workspaces', label: t('workbench.sessions') },
    { id: 'chat', label: t('navbar.mobileTabs.chat') },
    { id: 'changes', label: t('panels.changes') },
    { id: 'logs', label: t('panels.terminal') },
    { id: 'preview', label: t('panels.preview') },
    { id: 'git', label: t('panels.git') },
  ];

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
            aria-label={t('workbench.toggleSessions')}
            aria-expanded={sessionsVisible}
            onClick={() =>
              isMobile
                ? setMobileTab(sessionsVisible ? 'chat' : 'workspaces')
                : setSessionsOpen(!isSessionsOpen)
            }
          >
            <SidebarSimpleIcon className="size-icon-base" />
            <span className="hidden sm:inline">{t('workbench.sessions')}</span>
          </button>
          <span className="text-base font-medium text-high">
            {t('workbench.title')}
          </span>
          <span className="hidden text-sm text-low sm:inline">
            {t('workbench.product')}
          </span>
          <span className="min-w-0 flex-1 truncate text-base text-low">
            {!isCreateMode ? workspace?.name : ''}
          </span>
          <IconButton
            icon={MagnifyingGlassIcon}
            aria-label={t('workbench.searchCommands')}
            title={`${t('workbench.searchCommands')} (⌘K / Ctrl+K)`}
            onClick={() => void CommandBarDialog.show()}
          />
          <IconButton
            icon={GearIcon}
            aria-label={t('workbench.workerSettings')}
            title={t('workbench.workerSettings')}
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
            {t('sidebar.newSession')}
          </button>
        </header>
        {isMobile && (
          <nav
            aria-label={t('workbench.workspaceTools')}
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
