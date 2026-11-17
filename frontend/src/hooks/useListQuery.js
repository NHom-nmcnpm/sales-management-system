import { useSearchParams } from 'react-router-dom';

export function useListQuery(defaultSort = 'createdAt') {
  const [params, setParams] = useSearchParams();
  const query = new URLSearchParams(params);
  if (!query.has('sortBy')) query.set('sortBy', defaultSort);
  if (!query.has('sortOrder')) query.set('sortOrder', 'desc');
  function update(name, value) {
    const next = new URLSearchParams(params);
    if (value === '' || value === undefined) next.delete(name);
    else next.set(name, String(value));
    if (name !== 'page') next.delete('page');
    setParams(next, { replace: true });
  }
  function sort(name) {
    const next = new URLSearchParams(params);
    const direction = query.get('sortBy') === name && query.get('sortOrder') === 'asc' ? 'desc' : 'asc';
    next.set('sortBy', name); next.set('sortOrder', direction); next.delete('page');
    setParams(next, { replace: true });
  }
  return { queryString: query.toString(), get: name => params.get(name) ?? '', update, sort, sortBy: query.get('sortBy'), sortOrder: query.get('sortOrder') };
}
