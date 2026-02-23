import Link from "next/link";
import { CheckSquare, ChevronRight } from "lucide-react";
import { getAllRoomsNeedingAttention } from "@/actions/room";
import { getChecklistItems } from "@/actions/checklist";
import { RoomStatus } from "@/lib/types";

export const dynamic = 'force-dynamic';

const STATUS_COLORS: Record<RoomStatus, string> = {
  Ready: "bg-green-100 text-green-700",
  "In Progress": "bg-orange-100 text-orange-700",
  "Needs Attention": "bg-red-100 text-red-700",
  Occupied: "bg-gray-100 text-gray-600",
};

export default async function TasksPage() {
  const rooms = await getAllRoomsNeedingAttention();

  // Fetch incomplete item counts for each room — Requirement 5.2
  const roomsWithCounts = await Promise.all(
    rooms.map(async (room) => {
      const items = await getChecklistItems(room.roomId);
      const incompleteCount = items.filter((i) => !i.isChecked).length;
      return { ...room, incompleteCount };
    })
  );

  // Sort: Needs Attention first, then In Progress; within each group sort by hotel + room number
  roomsWithCounts.sort((a, b) => {
    if (a.status === "Needs Attention" && b.status !== "Needs Attention") return -1;
    if (a.status !== "Needs Attention" && b.status === "Needs Attention") return 1;
    if (a.hotelName !== b.hotelName) return a.hotelName.localeCompare(b.hotelName);
    return a.roomNumber - b.roomNumber;
  });

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-500 text-sm mt-1">
          Rooms requiring housekeeping attention
        </p>
      </div>

      {roomsWithCounts.length === 0 ? (
        // Requirement 5.4 — empty state message
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <CheckSquare size={40} className="text-green-400 mb-4" />
          <p className="text-gray-700 font-medium">All rooms are ready or occupied</p>
          <p className="text-gray-400 text-sm mt-1">No housekeeping tasks pending.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {roomsWithCounts.map((room) => (
            // Requirement 5.3 — each row links to room detail page
            <Link
              key={room.roomId}
              href={`/properties/${room.hotelId}/${room.roomNumber}`}
              className="flex items-center justify-between bg-white rounded-lg border shadow-sm p-4 hover:shadow-md transition-shadow group"
            >
              <div className="flex items-center gap-4">
                {/* Room number */}
                <div className="w-14 h-14 rounded-lg bg-gray-50 border flex items-center justify-center shrink-0">
                  <span className="text-sm font-bold text-gray-700">{room.roomNumber}</span>
                </div>

                <div>
                  {/* Requirement 5.2 — hotel name and room number */}
                  <p className="text-sm font-semibold text-gray-900 group-hover:text-orange-500 transition-colors">
                    {room.hotelName}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">Room {room.roomNumber}</p>

                  <div className="flex items-center gap-2 mt-2">
                    {/* Status badge — Requirement 5.2 */}
                    <span
                      className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[room.status]}`}
                    >
                      {room.status}
                    </span>

                    {/* Incomplete item count — Requirement 5.2 */}
                    <span className="text-xs text-gray-400">
                      {room.incompleteCount} item{room.incompleteCount !== 1 ? "s" : ""} remaining
                    </span>
                  </div>
                </div>
              </div>

              <ChevronRight
                size={18}
                className="text-gray-400 group-hover:text-orange-500 transition-colors shrink-0"
              />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
