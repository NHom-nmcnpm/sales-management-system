import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';

export function useResource(url, { allPages = false } = {}) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const reload = useCallback(() => setVersion((value) => value + 1), []);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    async function load() {
      setState((previous) => ({ ...previous, error: null, loading: true }));
      try {
        const response = await api.get(url, { signal: controller.signal });
        const data = response.data;
        if (allPages && data.pagination) {
          const rows = [...data.data];
          for (let page = 2; page <= data.pagination.totalPages; page += 1) {
            const next = await api.get(url, { params: { page }, signal: controller.signal });
            rows.push(...next.data.data);
          }
          data.data = rows;
        }
        if (!controller.signal.aborted) setState({ data, error: null, loading: false });
      } catch (error) {
        if (!controller.signal.aborted)
          setState({ data: null, error: error.message, loading: false });
      }
    }
    load();
    return () => controller.abort();
  }, [url, version, allPages]);
  return { ...state, reload };
}
