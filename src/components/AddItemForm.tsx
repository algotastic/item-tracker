import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { addItem, getRooms, initDb } from '../lib/db';
import LocationSelect from './LocationSelect';
import TagInput from './TagInput';
import PhotoUpload from './PhotoUpload';

export default function AddItemForm() {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: [] as string[],
    room: '',
    spot: '',
    photos: [] as string[]
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDb = async () => {
      try {
        await initDb();
        const rooms = await getRooms();
        if (rooms.length > 0) {
          setFormData(prev => ({ ...prev, room: rooms[0].id }));
        }
      } catch (err) {
        console.error('Error initializing:', err);
        setError('Failed to initialize database');
      }
    };

    initializeDb();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      if (!formData.room) {
        throw new Error('Room is required');
      }

      await addItem({
        name: formData.name,
        description: formData.description,
        tags: formData.tags,
        room: formData.room,
        spot: formData.spot || undefined,
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
        selectedRoom={formData.room}
        selectedSpot={formData.spot}
        onRoomChange={(roomId) => setFormData(prev => ({ ...prev, room: roomId }))}
        onSpotChange={(spotId) => setFormData(prev => ({ ...prev, spot: spotId || '' }))}
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
