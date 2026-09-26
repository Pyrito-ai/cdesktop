import { createContext, useContext } from 'react';

export interface WorkbenchEmbedState {
  isEmbedded: boolean;
  isSessionsOpen: boolean;
  setSessionsOpen: (open: boolean) => void;
}

export const WorkbenchEmbedContext = createContext<WorkbenchEmbedState>({
  isEmbedded: false,
  isSessionsOpen: false,
  setSessionsOpen: () => {},
});

export function useWorkbenchEmbed() {
  return useContext(WorkbenchEmbedContext);
}
