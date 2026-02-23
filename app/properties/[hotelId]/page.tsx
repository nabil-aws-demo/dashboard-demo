import { notFound } from "next/navigation";
import { MapPin } from "lucide-react";
import { getHotelById } from "@/actions/hotel";
import { getRoomsByHotel } from "@/actions/room";
import { getChecklistItems } from "@/actions/checklist";
import { deriveRoomStatus } from "@/lib/status";
import RoomCard from "@/components/room-card";

interface PropertyDetailPageProps {
  params: { hotelId: string };
}

export default async function PropertyDetailPage({ params }: PropertyDetailPageProps) {
  const { hotelId } = params;

  const [hotel, rooms] = await Promise.all([
    getHotelById(hotelId),
    getRoomsByHotel(hotelId),
  ]);

  if (!hotel) notFound();

  // Derive status for each room from its checklist items
  const roomsWithStatus = await Promise.all(
    rooms.map(async (room) => {
      const items = await getChecklistItems(room.roomId);
      return { ...room, status: deriveRoomStatus(items, room.occupiedOverride) };
    })
  );

  // Sort rooms by room number for consistent display
  roomsWithStatus.sort((a, b) => a.roomNumber - b.roomNumber);

  return (
    <div className="p-8">
      {/* Page header — Requirement 2.4 */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">{hotel.name}</h1>
        <div className="flex items-center gap-1 mt-1 text-gray-500 text-sm">
          <MapPin size={14} />
          <span>{hotel.location}</span>
        </div>
      </div>

      {/* 10-room grid — Requirements 2.1, 2.2, 2.3 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {roomsWithStatus.map((room) => (
          <RoomCard key={room.roomId} room={room} hotelId={hotelId} />
        ))}
      </div>

      {roomsWithStatus.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-sm">No rooms found for this property.</p>
        </div>
      )}
    </div>
  );
}
