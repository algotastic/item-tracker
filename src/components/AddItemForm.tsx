import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { addItem, getRooms } from '../lib/db';
import LocationSelect from './LocationSelect';
import TagInput from './TagInput';
import PhotoUpload from './PhotoUpload';
import type { Photo } from '../types/Photo';

export default function AddItemForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    location: {
      type: 'room' as const,
      containerId: '',
      roomId: '',
      path: [] as string[]
    },
    photos: [] as Photo[]
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const rooms = await getRooms();
        if (rooms.length > 0) {
          setFormData(prev => ({ 
            ...prev, 
            location: {
              ...prev.location,
              roomId: rooms[0].id,
              path: []
            }
          }));
        }
      } catch (err) {
        console.error('Error loading rooms:', err);
        setError('Failed to load rooms');
      }
    };

    loadInitialData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      if (!formData.location.containerId) {
        throw new Error('Container is required');
      }

      await addItem({
        name: formData.name,
        description: formData.description,
        tags: formData.tags,
        location: formData.location,
        photos: formData.photos
      });
      
      window.location.href = '/';
    } catch (err) {
      console.error('Error saving item:', err);
      setError(err instanceof Error ? err.message : 'Failed to save item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-red-100 dark:bg-red-900 border border-red-400 text-red-700 dark:text-red-200 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          required
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          required
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      <LocationSelect
        selectedContainer={formData.location.containerId}
        onContainerChange={(containerId) => 
          setFormData(prev => ({ 
            ...prev, 
            location: {
              ...prev.location,
              containerId: containerId || ''
            }
          }))
        }
      />

      <TagInput
        selectedTags={formData.tags}
        onChange={(tags) => setFormData(prev => ({ ...prev, tags }))}
      />

      <PhotoUpload
        photos={formData.photos}
        onChange={(photos) => setFormData(prev => ({ ...prev, photos }))}
      />

      <div className="flex gap-4">
        <Button 
          type="submit" 
          disabled={saving}
          className="flex-1"
        >
          {saving ? 'Saving...' : 'Add Item'}
        </Button>
        <Button 
          type="button" 
          variant="secondary"
          onClick={() => window.location.href = '/'}
          className="flex-1"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
