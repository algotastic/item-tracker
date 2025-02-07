import React, { useState, useEffect } from 'react';
import { searchItems } from '../lib/db';
import ItemCard from './ItemCard';
import SearchBar from './SearchBar';
import FilterBar from './FilterBar';

export default function ItemList() {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    try {
      const results = await searchItems('');
      setItems(results);
    } catch (err) {
      setError('Failed to load items');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadItems();
    window.addEventListener('focus', loadItems);
    return () => window.removeEventListener('focus', loadItems);
  }, []);

  // Get unique tags and locations from all items
  const allTags = [...new Set(items.flatMap(item => item.tags || []))];
  const allLocations = [...new Set(items.map(item => item.currentLocation).filter(Boolean))];

  // Filter items based on search query and selected filters
  const filteredItems = items.filter(item => {
    // Text search
    const searchText = `
      ${item.name.toLowerCase()}
      ${item.description.toLowerCase()}
      ${item.tags?.join(' ').toLowerCase() || ''}
      ${item.currentLocation?.toLowerCase() || ''}
    `;
    const matchesSearch = query === '' || 
      query.toLowerCase().split(' ').every(term => searchText.includes(term));

    // Tag filter
    const matchesTags = selectedTags.length === 0 || 
      selectedTags.every(tag => item.tags?.includes(tag));

    // Location filter
    const matchesLocation = !selectedLocation || 
      item.currentLocation === selectedLocation;

    return matchesSearch && matchesTags && matchesLocation;
  });

  const handleTagClick = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleLocationClick = (location: string) => {
    setSelectedLocation(location);
  };

  const handleRemoveTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const handleRemoveLocation = () => {
    setSelectedLocation(null);
  };

  if (error) {
    return (
      <div className="text-red-500 text-center py-8">
        {error}
      </div>
    );
  }

  return (
    <div>
      <SearchBar value={query} onChange={setQuery} />
      <FilterBar
        selectedTags={selectedTags}
        selectedLocation={selectedLocation}
        onRemoveTag={handleRemoveTag}
        onRemoveLocation={handleRemoveLocation}
        availableTags={allTags.filter(tag => !selectedTags.includes(tag))}
        availableLocations={allLocations}
        onAddTag={handleTagClick}
        onAddLocation={handleLocationClick}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8">Loading...</div>
        ) : filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <ItemCard 
              key={item.id} 
              item={item}
              onTagClick={handleTagClick}
              onLocationClick={handleLocationClick}
            />
          ))
        ) : (
          <div className="col-span-full text-center py-8">
            No items found. {items.length > 0 ? 'Try different search terms or filters.' : 'Add some items to get started!'}
          </div>
        )}
      </div>
    </div>
  );
}
