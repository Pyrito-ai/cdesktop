import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from '@tanstack/react-router';
import { WorkbenchEmbedContext } from '@/shared/hooks/useWorkbenchEmbed';

export function WorkbenchEmbedProvider({
  children,
  isEmbedded,
}: {
  children: ReactNode;
  isEmbedded: boolean;
}) {
  // Embedding never changes the standalone app's saved sidebar preference.
  const [isSessionsOpen, setSessionsOpen] = useState(false);
  const pathname = useLocation({ select: (location) => location.pathname });
  const navigate = useNavigate();
  const setSessionId = useCallback(
    (sessionId: string | undefined) => {
      if (!isEmbedded) return;
      void navigate({
        to: '.',
        search: (previous) => ({ ...previous, sessionId }),
        replace: true,
        resetScroll: false,
      });
    },
    [isEmbedded, navigate]
  );

  useEffect(() => {
    setSessionsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle('workbench-embed', isEmbedded);
    return () => document.documentElement.classList.remove('workbench-embed');
  }, [isEmbedded]);

  const value = useMemo(
    () => ({ isEmbedded, isSessionsOpen, setSessionsOpen, setSessionId }),
    [isEmbedded, isSessionsOpen, setSessionId]
  );

  return (
    <WorkbenchEmbedContext.Provider value={value}>
      {children}
    </WorkbenchEmbedContext.Provider>
  );
}
