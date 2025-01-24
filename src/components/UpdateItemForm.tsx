import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

interface UpdateItemFormProps {
  id: string;
}

export default function UpdateItemForm({ id }: UpdateItemFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    location: ''
  });

  useEffect(() => {
    // TODO: Fetch item data
    setFormData({
      name: 'Sample Item',
      description: 'Sample description',
      tags: 'tag1, tag2',
      location: 'Sample location'
    });
  }, [id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement update
    console.log('Update submitted:', formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Name</label>
        <Input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Description</label>
        <Textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tags</label>
        <Input
          type="text"
          value={formData.tags}
          onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Location</label>
        <Input
          type="text"
          value={formData.location}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
        />
      </div>

      <Button type="submit" className="w-full">Update Item</Button>
    </form>
  );
}
