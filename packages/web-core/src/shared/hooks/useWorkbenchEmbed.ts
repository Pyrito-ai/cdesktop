import { createContext, useContext } from 'react';

export interface WorkbenchEmbedState {
  isEmbedded: boolean;
  isSessionsOpen: boolean;
  setSessionsOpen: (open: boolean) => void;
  setSessionId: (sessionId: string | undefined) => void;
}

export const WorkbenchEmbedContext = createContext<WorkbenchEmbedState>({
  isEmbedded: false,
  isSessionsOpen: false,
  setSessionsOpen: () => {},
  setSessionId: () => {},
});

export function useWorkbenchEmbed() {
  return useContext(WorkbenchEmbedContext);
}
