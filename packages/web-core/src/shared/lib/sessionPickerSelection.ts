import type { ExecutorConfig } from 'shared/types';

/** Restore what the session ran, including explicit models absent from discovery. */
export function resolveSessionPickerSelection(
  executorConfig: ExecutorConfig | null,
  presetOptions: ExecutorConfig | null | undefined
) {
  // The caller queries the receipt's exact variant. The preset API returns
  // variant:null even for named presets, so compare only the executor here.
  const preset =
    executorConfig?.executor === presetOptions?.executor
      ? presetOptions
      : undefined;
  const reasoning =
    executorConfig?.reasoning_id ?? preset?.reasoning_id ?? null;

  return {
    // Omission on follow-up inherits the session's provider on the server.
    // Restoring a model must never change subscription/API routing.
    selectedProviderId: null,
    selectedModelId: executorConfig
      ? (executorConfig.model_id ?? preset?.model_id ?? '')
      : null,
    selectedReasoningId: reasoning,
    preferredEffortId: reasoning,
  };
}
