import React from 'react';
import { Input } from './ui/input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export default function SearchBar({ value, onChange }: SearchBarProps) {
  return (
    <div className="sticky top-0 bg-background z-10 py-4 px-4 mb-6 shadow-sm">
      <Input
        type="search"
        className="w-full bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        placeholder="Search items..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
