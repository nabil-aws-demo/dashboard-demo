import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";
import { getHotelById } from "@/actions/hotel";
import { getRoomById } from "@/actions/room";
import { getChecklistItems } from "@/actions/checklist";
import { deriveRoomStatus, getStatusColor } from "@/lib/status";
import { ChecklistSection } from "@/lib/types";
import ChecklistSectionComponent from "@/components/checklist-section";
import RoomControls from "./room-controls";

interface RoomDetailPageProps {
  params: { hotelId: string; roomId: string };
}

const SECTIONS: ChecklistSection[] = ["Bedroom", "Bathroom", "Amenities", "Final Inspection"];

const BADGE_CLASSES: Record<string, string> = {
  "text-green-600": "bg-green-100 text-green-700",
  "text-red-600": "bg-red-100 text-red-700",
  "text-orange-500": "bg-orange-100 text-orange-700",
  "text-gray-500": "bg-gray-100 text-gray-600",
};

export default async function RoomDetailPage({ params }: RoomDetailPageProps) {
  const { hotelId, roomId: roomNumber } = params;
  // roomId in DynamoDB is "<hotelId>#<roomNumber>"
  const roomId = `${hotelId}#${roomNumber}`;

  const [hotel, room, checklistItems] = await Promise.all([
    getHotelById(hotelId),
    getRoomById(roomId),
    getChecklistItems(roomId),
  ]);

  if (!hotel || !room) notFound();

  const status = deriveRoomStatus(checklistItems, room.occupiedOverride);
  const colorClass = getStatusColor(status);
  const badgeClass = BADGE_CLASSES[colorClass] ?? "bg-gray-100 text-gray-600";

  const lastUpdated = room.lastUpdated
    ? new Date(room.lastUpdated).toLocaleString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  // Group checklist items by section
  const itemsBySection = SECTIONS.reduce<Record<ChecklistSection, typeof checklistItems>>(
    (acc, section) => {
      acc[section] = checklistItems.filter((i) => i.category === section);
      return acc;
    },
    {} as Record<ChecklistSection, typeof checklistItems>
  );

  return (
    <div className="p-8 max-w-5xl">
      {/* Back link */}
      <Link
        href={`/properties/${hotelId}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors"
      >
        <ArrowLeft size={14} />
        {hotel.name}
      </Link>

      {/* Room header — Requirement 3.1 */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Room {room.roomNumber}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{hotel.name}</p>
          <div className="flex items-center gap-2 mt-3">
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${badgeClass}`}>
              {status}
            </span>
            <span className="flex items-center gap-1 text-xs text-gray-400">
              <Clock size={12} />
              Last updated {lastUpdated}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Checklist — Requirements 3.2, 3.3 */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Housekeeping Checklist</h2>
          {SECTIONS.map((section) => (
            <ChecklistSectionComponent
              key={section}
              section={section}
              items={itemsBySection[section]}
            />
          ))}
        </div>

        {/* Controls — Requirements 3.7, 3.8 */}
        <div className="lg:col-span-1">
          <h2 className="text-base font-semibold text-gray-800 mb-4">Room Controls</h2>
          <RoomControls
            roomId={roomId}
            initialNotes={room.notes}
            initialOccupied={room.occupiedOverride}
          />
        </div>
      </div>
    </div>
  );
}
