import { useState, useEffect } from 'react';
import { getRooms, addRoom } from '../lib/db';
import { Label } from './ui/label';
import { Select } from './ui/select';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Plus, X, Check } from 'lucide-react';

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
  const [showNewRoomForm, setShowNewRoomForm] = useState(false);
  const [newRoomName, setNewRoomName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadRooms = async () => {
    try {
      const roomsList = await getRooms();
      console.log('Loaded rooms:', roomsList);
      setRooms(roomsList);
    } catch (err) {
      console.error('Error loading rooms:', err);
      setError('Failed to load rooms');
    }
  };

  // Load rooms on mount
  useEffect(() => {
    loadRooms();
  }, []);

  const handleAddRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    const roomName = newRoomName.trim();
    if (!roomName) {
      setError('Room name is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const roomId = await addRoom(roomName);
      console.log('Added room with ID:', roomId);
      
      // Reload rooms immediately after adding
      await loadRooms();
      
      // Select the new room
      onRoomChange(roomId);
      
      // Show success message and reset form
      setSuccess(`Room "${roomName}" added successfully`);
      setNewRoomName('');
      
      // Hide the form after a delay
      setTimeout(() => {
        setShowNewRoomForm(false);
        setSuccess(null);
      }, 2000);
    } catch (err) {
      console.error('Error adding room:', err);
      setError(err instanceof Error ? err.message : 'Failed to create room');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <div className="flex justify-between items-center mb-2">
          <Label>Room (Required)</Label>
          {!showNewRoomForm && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowNewRoomForm(true);
                setError(null);
                setSuccess(null);
              }}
              className="text-sm"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add New Room
            </Button>
          )}
        </div>

        {showNewRoomForm ? (
          <div className="space-y-2 bg-gray-50 dark:bg-gray-800 p-4 rounded-lg border">
            <form onSubmit={handleAddRoom} className="flex gap-2">
              <Input
                type="text"
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                placeholder="Enter room name"
                className="flex-1"
                autoFocus
                disabled={isSubmitting}
              />
              <Button 
                type="submit" 
                size="sm"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Adding...' : 'Add'}
              </Button>
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => {
                  setShowNewRoomForm(false);
                  setNewRoomName('');
                  setError(null);
                }}
                disabled={isSubmitting}
              >
                <X className="w-4 h-4" />
              </Button>
            </form>
            {error && (
              <p className="text-sm text-red-500 flex items-center gap-1 mt-2">
                <X className="w-4 h-4" />
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-green-500 flex items-center gap-1 mt-2">
                <Check className="w-4 h-4" />
                {success}
              </p>
            )}
          </div>
        ) : (
          <>
            <Select
              value={selectedRoom}
              onChange={(e) => {
                onRoomChange(e.target.value);
                onSpotChange(undefined);
              }}
              required
            >
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name}
                </option>
              ))}
            </Select>
            {success && (
              <p className="text-sm text-green-500 flex items-center gap-1 mt-2">
                <Check className="w-4 h-4" />
                {success}
              </p>
            )}
          </>
        )}
      </div>

      {selectedRoom && spots.length > 0 && (
        <div>
          <Label>Spot (Optional)</Label>
          <Select
            value={selectedSpot || ''}
            onChange={(e) => onSpotChange(e.target.value || undefined)}
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
