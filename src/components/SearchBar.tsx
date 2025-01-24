import { useState, useCallback } from 'react';
import { debounce } from '../lib/utils';

export default function SearchBar() {
  const [query, setQuery] = useState('');

  const debouncedSearch = useCallback(
    debounce((value: string) => {
      // TODO: Implement search
      console.log('Searching:', value);
    }, 300),
    []
  );

  return (
    <div className="sticky top-0 bg-white z-10 py-4">
      <input
        type="search"
        className="w-full p-2 border rounded-lg"
        placeholder="Search items..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          debouncedSearch(e.target.value);
        }}
      />
    </div>
  );
}
