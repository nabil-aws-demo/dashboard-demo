import Link from "next/link";
import { Room } from "@/lib/types";
import { getStatusColor } from "@/lib/status";
import { Card, CardContent } from "@/components/ui/card";

interface RoomCardProps {
  room: Room;
  hotelId: string;
}

const STATUS_BG: Record<string, string> = {
  "text-green-600": "bg-green-50 border-green-200",
  "text-red-600": "bg-red-50 border-red-200",
  "text-orange-500": "bg-orange-50 border-orange-200",
  "text-gray-500": "bg-gray-50 border-gray-200",
};

const BADGE_VARIANT: Record<string, string> = {
  "text-green-600": "bg-green-100 text-green-700",
  "text-red-600": "bg-red-100 text-red-700",
  "text-orange-500": "bg-orange-100 text-orange-700",
  "text-gray-500": "bg-gray-100 text-gray-600",
};

export default function RoomCard({ room, hotelId }: RoomCardProps) {
  const colorClass = getStatusColor(room.status);
  const bgClass = STATUS_BG[colorClass] ?? "bg-white border-gray-200";
  const badgeClass = BADGE_VARIANT[colorClass] ?? "bg-gray-100 text-gray-600";

  return (
    <Link href={`/properties/${hotelId}/${room.roomNumber}`}>
      <Card className={`${bgClass} border hover:shadow-md transition-shadow cursor-pointer`}>
        <CardContent className="p-4">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Room</p>
          <p className="text-2xl font-bold text-gray-900 mt-0.5">{room.roomNumber}</p>
          <span
            className={`inline-block mt-3 text-xs font-medium px-2.5 py-1 rounded-full ${badgeClass}`}
          >
            {room.status}
          </span>
        </CardContent>
      </Card>
    </Link>
  );
}
