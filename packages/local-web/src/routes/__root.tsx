import { useEffect } from 'react';
import {
  Outlet,
  createRootRoute,
  retainSearchParams,
} from '@tanstack/react-router';
import { I18nextProvider } from 'react-i18next';
import { usePostHog } from 'posthog-js/react';
import { ThemeMode } from 'shared/types';
import i18n from '@/i18n';
import { useUserSystem } from '@/shared/hooks/useUserSystem';
import { ThemeProvider } from '@web/app/providers/ThemeProvider';
import { WorkbenchEmbedProvider } from '@web/app/providers/WorkbenchEmbedProvider';
import { useUiPreferencesScratch } from '@/shared/hooks/useUiPreferencesScratch';
import { UserProvider } from '@/shared/providers/remote/UserProvider';
import '@/app/styles/new/index.css';
import '@web/app/styles/workbench-embed.css';

function RootRouteComponent() {
  const { embed } = Route.useSearch();
  const isEmbedded = embed === 1;
  const { config, machineId } = useUserSystem();
  const posthog = usePostHog();

  useUiPreferencesScratch();

  useEffect(() => {
    if (!posthog || !machineId) return;

    if (config?.analytics_enabled) {
      posthog.opt_in_capturing();
      posthog.identify(machineId);
      console.log('[Analytics] Analytics enabled and user identified');
    } else {
      posthog.opt_out_capturing();
      console.log('[Analytics] Analytics disabled by user preference');
    }
  }, [config?.analytics_enabled, machineId, posthog]);

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider
        initialTheme={config?.theme || ThemeMode.DARK}
        forcedTheme={isEmbedded ? ThemeMode.LIGHT : undefined}
      >
        <WorkbenchEmbedProvider isEmbedded={isEmbedded}>
          <UserProvider>
            <Outlet />
          </UserProvider>
        </WorkbenchEmbedProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export const Route = createRootRoute({
  validateSearch: (
    search: Record<string, unknown>
  ): { embed?: 1; sessionId?: string } => ({
    ...(search.embed === 1 || search.embed === '1' ? { embed: 1 } : {}),
    ...(typeof search.sessionId === 'string' && search.sessionId
      ? { sessionId: search.sessionId }
      : {}),
  }),
  search: { middlewares: [retainSearchParams(['embed'])] },
  component: RootRouteComponent,
});
