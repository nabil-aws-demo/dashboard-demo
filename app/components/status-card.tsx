import { RoomStatus } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";

interface StatusCardProps {
  status: RoomStatus;
  count: number;
  color: string;
}

const statusConfig: Record<RoomStatus, { bg: string; dot: string; label: string }> = {
  Ready: {
    bg: "bg-green-50",
    dot: "bg-green-500",
    label: "Ready",
  },
  "In Progress": {
    bg: "bg-orange-50",
    dot: "bg-orange-500",
    label: "In Progress",
  },
  "Needs Attention": {
    bg: "bg-red-50",
    dot: "bg-red-500",
    label: "Needs Attention",
  },
  Occupied: {
    bg: "bg-gray-50",
    dot: "bg-gray-400",
    label: "Occupied",
  },
};

export default function StatusCard({ status, count, color }: StatusCardProps) {
  const config = statusConfig[status];

  return (
    <Card className={`${config.bg} border-0 shadow-sm`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">{config.label}</p>
            <p className="text-3xl font-bold mt-1" style={{ color }}>
              {count}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-full ${config.dot} opacity-20`} />
        </div>
        <div className="flex items-center gap-2 mt-3">
          <span className={`w-2.5 h-2.5 rounded-full ${config.dot}`} />
          <span className="text-xs text-gray-500">rooms</span>
        </div>
      </CardContent>
    </Card>
  );
}
