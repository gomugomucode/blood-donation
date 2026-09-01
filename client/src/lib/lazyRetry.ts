import { ComponentType, lazy } from 'react';

/**
 * Wraps React.lazy with automatic single-retry reload recovery
 * to gracefully handle stale chunk 404s after new production deployments.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T } | any>,
  namedExport?: string
) {
  return lazy(async () => {
    const pageHasAlreadyBeenForceRefreshed = JSON.parse(
      window.sessionStorage.getItem('chunk_retry_refreshed') || 'false'
    );

    try {
      const module = await componentImport();
      window.sessionStorage.setItem('chunk_retry_refreshed', 'false');
      return namedExport ? { default: module[namedExport] } : module;
    } catch (error) {
      if (!pageHasAlreadyBeenForceRefreshed) {
        // First failure: force browser refresh to pull fresh deployment chunks
        window.sessionStorage.setItem('chunk_retry_refreshed', 'true');
        window.location.reload();
        return new Promise(() => {}); // prevent further error cascade before reload
      }

      // If already refreshed, throw error to trigger ErrorBoundary
      console.error('Dynamic chunk import failure:', error);
      throw error;
    }
  });
}
