import { useEffect } from 'react';
import { useWorkbenchEmbed } from '@/shared/hooks/useWorkbenchEmbed';

const BASE_TITLE = 'cdesktop';

/**
 * Sets the document title based on the given parts.
 * Multiple callers can coexist — the most specific (deepest) component wins
 * because React runs child effects after parent effects.
 *
 * No cleanup is performed on unmount so that a parent-level caller
 * (e.g. the legacy ProjectProvider) provides a stable fallback without
 * competing with page-level callers.
 */
export function usePageTitle(...parts: (string | null | undefined)[]) {
  const { isEmbedded } = useWorkbenchEmbed();
  const baseTitle = isEmbedded ? 'Workbench' : BASE_TITLE;
  const filtered = parts.filter(Boolean) as string[];
  const title =
    filtered.length > 0 ? `${filtered.join(' - ')} | ${baseTitle}` : baseTitle;

  useEffect(() => {
    document.title = title;
  }, [title]);
}
