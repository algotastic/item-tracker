import { useState, useCallback } from 'react';
import { Input } from './ui/input';
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
    <div className="sticky top-0 bg-background z-10 py-4">
      <Input
        type="search"
        className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
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
