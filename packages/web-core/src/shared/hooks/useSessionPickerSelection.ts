import { useState } from 'react';
import type { ExecutorConfig } from 'shared/types';
import { resolveSessionPickerSelection } from '@/shared/lib/sessionPickerSelection';
import type {
  PickerSelection,
  useWorkspacePickerSelection,
} from './useWorkspacePickerSelection';

/**
 * Embedded follow-ups start from their receipt, never another workspace's saved
 * choice. User changes remain authoritative until a new receipt or session.
 */
export function useSessionPickerSelection({
  sessionId,
  latestConfig,
  presetOptions,
  fallback,
}: {
  sessionId: string | undefined;
  latestConfig: ExecutorConfig | null;
  presetOptions: ExecutorConfig | null | undefined;
  fallback: ReturnType<typeof useWorkspacePickerSelection>;
}) {
  const restored = resolveSessionPickerSelection(latestConfig, presetOptions);
  const sourceKey = JSON.stringify([
    sessionId,
    latestConfig?.executor,
    latestConfig?.variant,
    restored.selectedModelId,
    restored.selectedReasoningId,
  ]);
  const [override, setOverride] = useState<{
    sourceKey: string;
    selection: PickerSelection;
  } | null>(null);
  const selection =
    override?.sourceKey === sourceKey ? override.selection : restored;

  if (!sessionId) return fallback;

  return {
    ...selection,
    setSelection: (
      providerId: string | null,
      modelId: string | null,
      reasoningId: string | null
    ) => {
      setOverride((previous) => ({
        sourceKey,
        selection: {
          ...(previous?.sourceKey === sourceKey
            ? previous.selection
            : restored),
          selectedProviderId: providerId,
          selectedModelId: modelId,
          selectedReasoningId: reasoningId,
        },
      }));
    },
    setPreferredEffort: (preferredEffortId: string | null) => {
      setOverride((previous) => ({
        sourceKey,
        selection: {
          ...(previous?.sourceKey === sourceKey
            ? previous.selection
            : restored),
          preferredEffortId,
        },
      }));
    },
  };
}
