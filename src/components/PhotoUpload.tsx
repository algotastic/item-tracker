import React from 'react';
import { Button } from './ui/button';
import { Photo } from '../types/Photo';

interface PhotoUploadProps {
  photos: Photo[];
  onChange: (photos: Photo[]) => void;
}

export default function PhotoUpload({ photos, onChange }: PhotoUploadProps) {
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newPhotos: Photo[] = await Promise.all(
      files.map(async (file) => {
        const s3Key = `${crypto.randomUUID()}-${file.name}`;
        return {
          s3Key,
          thumbnailUrl: URL.createObjectURL(file),
          fullResUrl: URL.createObjectURL(file),
          uploaded: false,
        };
      })
    );

    onChange([...photos, ...newPhotos]);
  };

  const handleRemove = (index: number) => {
    const newPhotos = [...photos];
    newPhotos.splice(index, 1);
    onChange(newPhotos);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => document.getElementById('photo-upload')?.click()}
        >
          Add Photos
        </Button>
        <input
          id="photo-upload"
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {photos.map((photo, index) => (
            <div key={photo.s3Key} className="relative group">
              <img
                src={photo.thumbnailUrl}
                alt=""
                className="w-full h-32 object-cover rounded-lg"
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              >
                ×
              </button>
              {!photo.uploaded && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center text-white text-sm">
                  Uploading...
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
