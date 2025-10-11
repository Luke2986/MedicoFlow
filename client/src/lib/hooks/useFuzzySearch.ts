import { useMemo, useState } from 'react';
import Fuse, { FuseResultMatch } from 'fuse.js';

interface UseFuzzySearchOptions<T> {
  data: T[];
  keys: string[];
  threshold?: number;
  limit?: number;
}

export interface FuzzySearchResult<T> {
  item: T;
  score?: number;
  matches?: readonly FuseResultMatch[];
}

export function useFuzzySearch<T>({
  data,
  keys,
  threshold = 0.3,
  limit = 10
}: UseFuzzySearchOptions<T>) {
  const [query, setQuery] = useState('');
  
  const fuse = useMemo(() => {
    return new Fuse(data, {
      keys,
      threshold,
      includeScore: true,
      includeMatches: true,
      minMatchCharLength: 2,
      distance: 100,
      ignoreLocation: true
    });
  }, [data, keys, threshold]);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    
    const fuseResults = fuse.search(query, { limit });
    
    return fuseResults.map(result => ({
      item: result.item,
      score: result.score,
      matches: result.matches
    }));
  }, [query, fuse, limit]);

  return {
    query,
    setQuery,
    results,
    hasResults: results.length > 0
  };
}
