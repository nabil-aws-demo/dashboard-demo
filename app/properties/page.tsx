import Link from "next/link";
import { MapPin, ChevronRight } from "lucide-react";
import { getHotels } from "@/actions/hotel";
import { getRoomsByHotel } from "@/actions/room";
import { getChecklistItems } from "@/actions/checklist";
import { deriveRoomStatus } from "@/lib/status";
import { RoomStatus } from "@/lib/types";

const STATUS_COLORS: Record<RoomStatus, string> = {
  Ready: "bg-green-100 text-green-700",
  "In Progress": "bg-orange-100 text-orange-700",
  "Needs Attention": "bg-red-100 text-red-700",
  Occupied: "bg-gray-100 text-gray-600",
};

export default async function PropertiesPage() {
  const hotels = await getHotels();

  const hotelData = await Promise.all(
    hotels.map(async (hotel) => {
      const rooms = await getRoomsByHotel(hotel.hotelId);
      const roomsWithStatus = await Promise.all(
        rooms.map(async (room) => {
          const items = await getChecklistItems(room.roomId);
          return { ...room, status: deriveRoomStatus(items, room.occupiedOverride) };
        })
      );

      const statusCounts: Record<RoomStatus, number> = {
        Ready: 0,
        "In Progress": 0,
        "Needs Attention": 0,
        Occupied: 0,
      };
      for (const room of roomsWithStatus) {
        statusCounts[room.status]++;
      }

      return { hotel, statusCounts, totalRooms: rooms.length };
    })
  );

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Properties</h1>
        <p className="text-gray-500 text-sm mt-1">
          {hotels.length} {hotels.length === 1 ? "property" : "properties"} managed
        </p>
      </div>

      <div className="space-y-4">
        {hotelData.map(({ hotel, statusCounts, totalRooms }) => (
          <Link
            key={hotel.hotelId}
            href={`/properties/${hotel.hotelId}`}
            className="flex items-center justify-between bg-white rounded-lg border shadow-sm p-5 hover:shadow-md transition-shadow group"
          >
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900 group-hover:text-orange-500 transition-colors">
                {hotel.name}
              </h2>
              <div className="flex items-center gap-1 mt-1 text-gray-500 text-sm">
                <MapPin size={13} />
                <span>{hotel.location}</span>
              </div>

              {/* Status summary badges */}
              <div className="flex flex-wrap gap-2 mt-3">
                {(Object.entries(statusCounts) as [RoomStatus, number][])
                  .filter(([, count]) => count > 0)
                  .map(([status, count]) => (
                    <span
                      key={status}
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_COLORS[status]}`}
                    >
                      {count} {status}
                    </span>
                  ))}
                <span className="inline-flex items-center text-xs text-gray-400 px-2.5 py-1">
                  {totalRooms} total rooms
                </span>
              </div>
            </div>

            <ChevronRight size={18} className="text-gray-400 group-hover:text-orange-500 transition-colors ml-4 shrink-0" />
          </Link>
        ))}

        {hotels.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">No properties found.</p>
          </div>
        )}
      </div>
    </div>
  );
}
