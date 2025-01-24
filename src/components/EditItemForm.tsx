import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { getItem, updateItem } from '../lib/db';

interface EditItemFormProps {
  id: string;
}

export default function EditItemForm({ id }: EditItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    location: '',
    photos: [] as string[]
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadItem = async () => {
      try {
        const item = await getItem(id);
        if (item) {
          setFormData({
            name: item.name,
            description: item.description,
            tags: item.tags.join(', '),
            location: item.currentLocation || '',
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

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({
          ...prev,
          photos: [...prev.photos, reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFormData(prev => ({
      ...prev,
      photos: prev.photos.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      await updateItem(id, {
        name: formData.name,
        description: formData.description,
        tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
        location: formData.location || undefined,
        photos: formData.photos
      });
      
      // Redirect to item view page
      window.location.href = `/items/${id}`;
    } catch (err) {
      console.error('Error updating item:', err);
      setError('Failed to update item. Please try again.');
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

      <div>
        <label className="block text-sm font-medium mb-2">Tags (comma-separated)</label>
        <Input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
          placeholder="tag1, tag2, tag3"
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Location</label>
        <Input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          placeholder="Optional location"
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Photos</label>
        <Input
          type="file"
          accept="image/*"
          multiple
          onChange={handlePhotoUpload}
          className="mb-4"
        />
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
          {formData.photos.map((photo, index) => (
            <div key={index} className="relative">
              <img
                src={photo}
                alt={`Photo ${index + 1}`}
                className="w-full h-32 object-cover rounded"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => removePhoto(index)}
              >
                Remove
              </Button>
            </div>
          ))}
        </div>
      </div>

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
