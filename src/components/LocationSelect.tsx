import React, { useState, useEffect } from 'react';
import { getRooms } from '../lib/db';
import { Label } from './ui/label';
import { Select } from './ui/select';

interface Room {
  id: string;
  name: string;
}

interface LocationSelectProps {
  selectedRoom: string;
  selectedSpot?: string;
  onRoomChange: (roomId: string) => void;
  onSpotChange: (spotId?: string) => void;
}

export default function LocationSelect({
  selectedRoom,
  selectedSpot,
  onRoomChange,
  onSpotChange
}: LocationSelectProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [spots, setSpots] = useState<Array<{ id: string; name: string }>>([]);
  const [error, setError] = useState<string | null>(null);

  const loadRooms = async () => {
    try {
      const roomsList = await getRooms();
      setRooms(roomsList);
      
      // If no room is selected and we have rooms, select the first one
      if (!selectedRoom && roomsList.length > 0) {
        onRoomChange(roomsList[0].id);
      }
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError('Failed to load rooms');
    }
  };

  // Load rooms on mount
  useEffect(() => {
    loadRooms();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <Label>Room (Required)</Label>
        <Select
          value={selectedRoom}
          onChange={(e) => {
            onRoomChange(e.target.value);
            onSpotChange(undefined);
          }}
          required
          className="w-full mt-2"
        >
          <option value="">Select a room</option>
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.name}
            </option>
          ))}
        </Select>
        {error && (
          <p className="text-sm text-red-500 mt-1">{error}</p>
        )}
      </div>

      {selectedRoom && spots.length > 0 && (
        <div>
          <Label>Spot (Optional)</Label>
          <Select
            value={selectedSpot || ''}
            onChange={(e) => onSpotChange(e.target.value || undefined)}
            className="w-full mt-2"
          >
            <option value="">Select a spot</option>
            {spots.map((spot) => (
              <option key={spot.id} value={spot.id}>
                {spot.name}
              </option>
            ))}
          </Select>
        </div>
      )}
    </div>
  );
}
