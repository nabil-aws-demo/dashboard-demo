import { getHotels } from "@/actions/hotel";
import { getRoomsByHotel } from "@/actions/room";
import { getChecklistItems } from "@/actions/checklist";
import { deriveRoomStatus, getStatusColor } from "@/lib/status";
import { RoomStatus, Room } from "@/lib/types";
import StatusCard from "@/components/status-card";
import PropertyCard from "@/components/property-card";
import DonutChart from "@/components/donut-chart";

const STATUS_ORDER: RoomStatus[] = ["Ready", "In Progress", "Needs Attention", "Occupied"];

const STATUS_HEX: Record<RoomStatus, string> = {
  Ready: "#22c55e",
  "In Progress": "#f97316",
  "Needs Attention": "#ef4444",
  Occupied: "#9ca3af",
};

export default async function DashboardPage() {
  const hotels = await getHotels();

  // Fetch all rooms with derived statuses for every hotel
  const hotelRoomData = await Promise.all(
    hotels.map(async (hotel) => {
      const rooms = await getRoomsByHotel(hotel.hotelId);
      const roomsWithStatus: Room[] = await Promise.all(
        rooms.map(async (room) => {
          const items = await getChecklistItems(room.roomId);
          return { ...room, status: deriveRoomStatus(items, room.occupiedOverride) };
        })
      );
      return { hotel, rooms: roomsWithStatus };
    })
  );

  // Global aggregates
  const allRooms = hotelRoomData.flatMap((d) => d.rooms);
  const totalRooms = allRooms.length;

  const statusCounts = STATUS_ORDER.reduce(
    (acc, s) => ({ ...acc, [s]: allRooms.filter((r) => r.status === s).length }),
    {} as Record<RoomStatus, number>
  );

  const occupancyRate =
    totalRooms > 0 ? Math.round((statusCounts["Occupied"] / totalRooms) * 100) : 0;

  const donutData = STATUS_ORDER.map((status) => ({ status, count: statusCounts[status] }));

  // Per-hotel stats for PropertyCards
  const hotelStats = hotelRoomData.map(({ hotel, rooms }) => {
    const ready = rooms.filter((r) => r.status === "Ready").length;
    const inProgress = rooms.filter((r) => r.status === "In Progress").length;
    const needsAttention = rooms.filter((r) => r.status === "Needs Attention").length;
    const occupied = rooms.filter((r) => r.status === "Occupied").length;
    const completionPercentage =
      rooms.length > 0 ? Math.round((ready / rooms.length) * 100) : 0;
    return {
      hotel,
      stats: {
        readyCount: ready,
        pendingCount: needsAttention,
        inProgressCount: inProgress,
        occupiedCount: occupied,
        completionPercentage,
      },
    };
  });

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Housekeeping overview across all properties
        </p>
      </div>

      {/* Summary stats */}
      <div className="flex gap-6 mb-8 text-sm text-gray-600">
        <div>
          <span className="font-semibold text-gray-900 text-lg">{totalRooms}</span>
          <span className="ml-1">total rooms</span>
        </div>
        <div className="w-px bg-gray-200" />
        <div>
          <span className="font-semibold text-gray-900 text-lg">{occupancyRate}%</span>
          <span className="ml-1">occupancy rate</span>
        </div>
      </div>

      {/* Status cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {STATUS_ORDER.map((status) => (
          <StatusCard
            key={status}
            status={status}
            count={statusCounts[status]}
            color={STATUS_HEX[status]}
          />
        ))}
      </div>

      {/* Properties + Donut chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Property cards */}
        <div className="lg:col-span-2">
          <h2 className="text-base font-semibold text-gray-900 mb-4">Properties</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {hotelStats.map(({ hotel, stats }) => (
              <PropertyCard key={hotel.hotelId} hotel={hotel} stats={stats} />
            ))}
          </div>
        </div>

        {/* Donut chart */}
        <div className="bg-white rounded-lg border shadow-sm p-5">
          <h2 className="text-base font-semibold text-gray-900 mb-2">Status Breakdown</h2>
          <p className="text-xs text-gray-500 mb-4">All rooms across all properties</p>
          <DonutChart data={donutData} />
        </div>
      </div>
    </div>
  );
}
