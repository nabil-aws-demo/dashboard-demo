import Link from "next/link";
import Image from "next/image";
import { Hotel } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { MapPin } from "lucide-react";

interface PropertyCardProps {
  hotel: Hotel;
  stats: {
    readyCount: number;
    pendingCount: number;
    inProgressCount: number;
    occupiedCount: number;
    completionPercentage: number;
  };
}

export default function PropertyCard({ hotel, stats }: PropertyCardProps) {
  const { readyCount, pendingCount, inProgressCount, occupiedCount, completionPercentage } = stats;

  return (
    <Card className="overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      {/* Hero image */}
      <div className="relative h-40 w-full bg-gray-200">
        {hotel.imageUrl ? (
          <Image
            src={hotel.imageUrl}
            alt={hotel.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-700 to-slate-900">
            <span className="text-white/40 text-4xl font-bold tracking-tighter">oo</span>
          </div>
        )}
      </div>

      <CardContent className="p-5">
        {/* Hotel name + location */}
        <h3 className="font-semibold text-gray-900 text-base">{hotel.name}</h3>
        <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
          <MapPin size={12} />
          <span>{hotel.location}</span>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1.5">
            <span>Housekeeping progress</span>
            <span className="font-medium text-gray-700">{completionPercentage}%</span>
          </div>
          <Progress
            value={completionPercentage}
            className="h-2 bg-gray-100"
          />
        </div>

        {/* Ready / Pending / Occupied counts */}
        <div className="flex gap-4 mt-4 text-sm flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">{readyCount}</span> ready
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">{pendingCount + inProgressCount}</span> pending
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-gray-400" />
            <span className="text-gray-600">
              <span className="font-semibold text-gray-900">{occupiedCount}</span> occupied
            </span>
          </div>
        </div>

        {/* View Details link */}
        <Link
          href={`/properties/${hotel.hotelId}`}
          className="mt-4 inline-flex items-center text-sm font-medium text-orange-500 hover:text-orange-600 transition-colors"
        >
          View Details →
        </Link>
      </CardContent>
    </Card>
  );
}
