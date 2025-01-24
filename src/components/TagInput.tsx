import { useState, useEffect, useRef } from 'react';
import { searchTags } from '../lib/db';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { X } from 'lucide-react';

interface TagInputProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
}

export default function TagInput({ selectedTags, onChange }: TagInputProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = async (value: string) => {
    setInput(value);
    if (value.trim()) {
      const matches = await searchTags(value);
      setSuggestions(matches.filter(tag => !selectedTags.includes(tag)));
      setIsOpen(true);
    } else {
      setSuggestions([]);
      setIsOpen(false);
    }
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !selectedTags.includes(tag)) {
      onChange([...selectedTags, tag]);
    }
    setInput('');
    setSuggestions([]);
    setIsOpen(false);
  };

  const removeTag = (tagToRemove: string) => {
    onChange(selectedTags.filter(tag => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2" ref={wrapperRef}>
      <Label>Tags</Label>
      <div className="space-y-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {selectedTags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-primary"
              >
                <X className="w-4 h-4" />
              </button>
            </span>
          ))}
        </div>
        <div className="relative">
          <Input
            type="text"
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            placeholder="Type to add or search tags..."
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addTag(input);
              }
            }}
          />
          {isOpen && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg">
              {suggestions.map(suggestion => (
                <button
                  key={suggestion}
                  className="w-full px-4 py-2 text-left hover:bg-secondary/50"
                  onClick={() => addTag(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
