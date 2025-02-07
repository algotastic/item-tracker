import React, { useState, useEffect } from 'react';
    import { Button } from './ui/button';
    import { Input } from './ui/input';
    import { Textarea } from './ui/textarea';
    import { getItem, updateItem, initDb } from '../lib/db';
    import LocationSelect from './LocationSelect';
    import TagInput from './TagInput';
    import PhotoUpload from './PhotoUpload';

    interface EditItemFormProps {
      id: string;
    }

    export default function EditItemForm({ id }: EditItemFormProps) {
      const [formData, setFormData] = useState({
        name: '',
        description: '',
        tags: [] as string[],
        room: '',
        spot: '',
        photos: [] as string[]
      });
      const [saving, setSaving] = useState(false);
      const [loading, setLoading] = useState(true);
      const [error, setError] = useState<string | null>(null);

      useEffect(() => {
        const loadItem = async () => {
          try {
            const item = await getItem(id);
            if (item) {
              setFormData({
                name: item.name,
                description: item.description,
                tags: item.tags,
                room: item.room,
                spot: item.spot || '',
                photos: item.photos || []
              });
            }
          } catch (err) {
            setError('Failed to load item');
            console.error(err);
          } finally {
            setLoading(false);
          }
        };

        loadItem();
      }, [id]);

      const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        
        try {
          if (!formData.room) {
            throw new Error('Room is required');
          }

          await updateItem(id, {
            name: formData.name,
            description: formData.description,
            tags: formData.tags,
            room: formData.room,
            spot: formData.spot || undefined,
            photos: formData.photos
          });
          
          // Redirect to item view page
          window.location.href = `/items/${id}`;
        } catch (err) {
          console.error('Error updating item:', err);
          setError(err instanceof Error ? err.message : 'Failed to update item. Please try again.');
        } finally {
          setSaving(false);
        }
      };

      if (loading) {
        return <div className="text-center py-8">Loading...</div>;
      }

      if (error && !formData.name) {
        return <div className="text-red-500 text-center py-8">{error}</div>;
      }

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
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
              className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <LocationSelect
            selectedRoom={formData.room}
            selectedSpot={formData.spot}
            onRoomChange={(roomId) => setFormData({ ...formData, room: roomId })}
            onSpotChange={(spotId) => setFormData({ ...formData, spot: spotId || '' })}
          />

          <TagInput
            selectedTags={formData.tags}
            onChange={(tags) => setFormData({ ...formData, tags })}
          />

          <PhotoUpload
            photos={formData.photos}
            onChange={(photos) => setFormData({ ...formData, photos })}
          />

          <div className="flex gap-4">
            <Button 
              type="submit" 
              disabled={saving}
              className="flex-1"
            >
              {saving ? 'Saving...' : 'Update Item'}
            </Button>
            <Button 
              type="button" 
              variant="secondary"
              onClick={() => window.location.href = `/items/${id}`}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </form>
      );
    }

    // Helper function to fetch rooms for selection
    const getRooms = async () => {
      const db = await initDb();
      return await db.getAll('rooms');
    };
