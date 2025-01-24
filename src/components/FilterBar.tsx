import { X } from 'lucide-react';
import { Button } from './ui/button';

interface FilterBarProps {
  selectedTags: string[];
  selectedLocation: string | null;
  onRemoveTag: (tag: string) => void;
  onRemoveLocation: () => void;
  availableTags: string[];
  availableLocations: string[];
  onAddTag: (tag: string) => void;
  onAddLocation: (location: string) => void;
}

export default function FilterBar({
  selectedTags,
  selectedLocation,
  onRemoveTag,
  onRemoveLocation,
  availableTags,
  availableLocations,
  onAddTag,
  onAddLocation
}: FilterBarProps) {
  const hasFilters = selectedTags.length > 0 || selectedLocation;

  if (!hasFilters && availableTags.length === 0 && availableLocations.length === 0) {
    return null;
  }

  return (
    <div className="bg-background border-b mb-6">
      <div className="container mx-auto px-4 py-4">
        <div className="grid md:grid-cols-[200px_1fr] gap-6">
          {/* Filter Options */}
          <div className="space-y-4">
            {availableLocations.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Locations</h3>
                <div className="space-y-1">
                  {availableLocations.map(location => (
                    <button
                      key={location}
                      onClick={() => onAddLocation(location)}
                      disabled={selectedLocation === location}
                      className={`block w-full text-left px-2 py-1 rounded hover:bg-secondary/50 text-sm ${
                        selectedLocation === location ? 'bg-secondary' : ''
                      }`}
                    >
                      {location}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {availableTags.length > 0 && (
              <div>
                <h3 className="font-medium mb-2">Tags</h3>
                <div className="space-y-1">
                  {availableTags.map(tag => (
                    <button
                      key={tag}
                      onClick={() => onAddTag(tag)}
                      disabled={selectedTags.includes(tag)}
                      className={`block w-full text-left px-2 py-1 rounded hover:bg-secondary/50 text-sm ${
                        selectedTags.includes(tag) ? 'bg-secondary' : ''
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Active Filters */}
          <div>
            {hasFilters && (
              <div>
                <h3 className="font-medium mb-2">Active Filters</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedLocation && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm">
                      Location: {selectedLocation}
                      <button
                        onClick={onRemoveLocation}
                        className="hover:text-primary"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  )}
                  {selectedTags.map(tag => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-secondary rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => onRemoveTag(tag)}
                        className="hover:text-primary"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                  {(selectedTags.length > 0 || selectedLocation) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        selectedLocation && onRemoveLocation();
                        selectedTags.forEach(tag => onRemoveTag(tag));
                      }}
                    >
                      Clear All
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
