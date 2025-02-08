import React, { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { getItem, updateItem } from '../lib/db';
import LocationSelect from './LocationSelect';
import TagInput from './TagInput';
import PhotoUpload from './PhotoUpload';
import type { Item, ItemLocation } from '../types/Item';
import type { Photo } from '../types/Photo';
import { Switch } from './ui/switch';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';

interface EditItemFormProps {
  id: string;
}

interface FormData {
  name: string;
  description: string;
  tags: string[];
  location: ItemLocation;
  photos: Photo[];
  isContainer: boolean;
  containerType?: 'permanent' | 'temporary';
  insuredValue?: number;
  purchaseDate?: string;
  serialNumber?: string;
  version: number;
}

export default function EditItemForm({ id }: EditItemFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    tags: [],
    location: {
      type: 'container',
      containerId: '',
      path: [],
    },
    photos: [],
    isContainer: false,
    version: 1,
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
            location: item.location,
            photos: item.photos || [],
            isContainer: item.isContainer,
            containerType: item.containerType,
            insuredValue: item.insuredValue,
            purchaseDate: item.purchaseDate ? item.purchaseDate.toISOString().split('T')[0] : undefined,
            serialNumber: item.serialNumber,
            version: item.version || 1,
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
      if (!formData.location.containerId) {
        throw new Error('Container is required');
      }

      const itemUpdate: Partial<Omit<Item, 'id' | 'createdAt' | 'lastSynced'>> = {
        name: formData.name,
        description: formData.description,
        tags: formData.tags,
        location: formData.location,
        photos: formData.photos,
        isContainer: formData.isContainer,
        containerType: formData.containerType,
        insuredValue: formData.insuredValue,
        purchaseDate: formData.purchaseDate ? new Date(formData.purchaseDate) : undefined,
        serialNumber: formData.serialNumber,
        version: formData.version,
      };

      await updateItem(id, itemUpdate);
      
      // Redirect to item view page
      window.location.href = `/items/${id}`;
    } catch (err) {
      console.error('Error updating item:', err);
      setError(err instanceof Error ? err.message : 'Failed to update item. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationChange = (containerId?: string) => {
    if (!containerId) {
      setFormData(prev => ({
        ...prev,
        location: {
          type: 'container',
          containerId: '',
          path: [],
        }
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      location: {
        ...prev.location,
        containerId,
        // Path will be updated by the backend
      }
    }));
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
        selectedContainer={formData.location.containerId}
        onContainerChange={handleLocationChange}
      />

      <div className="flex items-center space-x-2">
        <Switch
          checked={formData.isContainer}
          onCheckedChange={(checked) => setFormData({ ...formData, isContainer: checked })}
        />
        <label className="text-sm font-medium">Is Container</label>
      </div>

      {formData.isContainer && (
        <div>
          <label className="block text-sm font-medium mb-2">Container Type</label>
          <Select value={formData.containerType || ''} onValueChange={(value) => 
            setFormData({ ...formData, containerType: value as 'permanent' | 'temporary' | undefined })
          }>
            <SelectTrigger>
              <SelectValue placeholder="Select type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">None</SelectItem>
              <SelectItem value="permanent">Permanent</SelectItem>
              <SelectItem value="temporary">Temporary</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium mb-2">Insured Value</label>
        <Input
          type="number"
          value={formData.insuredValue || ''}
          onChange={(e) => setFormData({ ...formData, insuredValue: e.target.value ? Number(e.target.value) : undefined })}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Purchase Date</label>
        <Input
          type="date"
          value={formData.purchaseDate || ''}
          onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value || undefined })}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Serial Number</label>
        <Input
          type="text"
          value={formData.serialNumber || ''}
          onChange={(e) => setFormData({ ...formData, serialNumber: e.target.value || undefined })}
          className="bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
        />
      </div>

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
