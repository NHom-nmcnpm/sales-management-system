import { useCallback, useEffect, useState } from 'react';
import { api } from '../services/api.js';

export function useResource(url) {
  const [version, setVersion] = useState(0);
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const reload = useCallback(() => setVersion(value => value + 1), []);
  useEffect(() => {
    if (!url) return;
    const controller = new AbortController();
    async function load() {
      setState(previous => ({ ...previous, error: null, loading: true }));
      try {
        const { data } = await api.get(url, { signal: controller.signal });
        if (!controller.signal.aborted) setState({ data, error: null, loading: false });
      } catch (error) {
        if (!controller.signal.aborted) setState({ data: null, error: error.message, loading: false });
      }
    }
    load();
    return () => controller.abort();
  }, [url, version]);
  return { ...state, reload };
}
