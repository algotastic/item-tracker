import React, { useState } from 'react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { X } from 'lucide-react';
import { initDb } from '../lib/db';

interface PhotoUploadProps {
  photos: string[];
  onChange: (photos: string[]) => void;
}

export default function PhotoUpload({ photos, onChange }: PhotoUploadProps) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    
    const newPhotos = await Promise.all(
      Array.from(files).map(async (file) => {
        const s3Key = `photos/${crypto.randomUUID()}_${file.name}`;
        const previewUrl = URL.createObjectURL(file);
        
        // Store locally until sync
        const photo = {
          s3Key,
          thumbnailUrl: previewUrl,
          fullResUrl: '',
          uploaded: false
        };
        
        // Store original file in separate store
        const db = await initDb();
        const tx = db.transaction('photos', 'readwrite');
        await tx.objectStore('photos').put(file, s3Key);
        
        return photo;
      })
    );

    onChange([...photos, ...newPhotos]);
    setUploading(false);
  };

  const removePhoto = (index: number) => {
    onChange(photos.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium mb-2">Photos</label>
      
      <Input
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        disabled={uploading}
        className="mb-4"
      />
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {photos.map((photo, index) => (
          <div key={index} className="relative group">
            <img
              src={photo}
              alt={`Photo ${index + 1}`}
              className="w-full h-32 object-cover rounded-lg"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => removePhoto(index)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>

      {uploading && (
        <div className="text-center text-sm text-gray-500">
          Uploading photos...
        </div>
      )}
    </div>
  );
}
