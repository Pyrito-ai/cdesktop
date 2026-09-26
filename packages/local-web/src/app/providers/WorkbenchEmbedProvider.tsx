import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useLocation } from '@tanstack/react-router';
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

  useEffect(() => {
    setSessionsOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle('workbench-embed', isEmbedded);
    return () => document.documentElement.classList.remove('workbench-embed');
  }, [isEmbedded]);

  const value = useMemo(
    () => ({ isEmbedded, isSessionsOpen, setSessionsOpen }),
    [isEmbedded, isSessionsOpen]
  );

  return (
    <WorkbenchEmbedContext.Provider value={value}>
      {children}
    </WorkbenchEmbedContext.Provider>
  );
}
