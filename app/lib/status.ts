import { ChecklistItem, RoomStatus } from "./types";

/**
 * Derives the room status from checklist items and the occupied override flag.
 * Status is never stored — always derived at read time.
 */
export function deriveRoomStatus(
  items: ChecklistItem[],
  occupiedOverride: boolean
): RoomStatus {
  if (occupiedOverride) return "Occupied";
  const checkedCount = items.filter((i) => i.isChecked).length;
  if (checkedCount === 0) return "Needs Attention";
  if (checkedCount === items.length) return "Ready";
  return "In Progress";
}

/**
 * Returns a Tailwind CSS color class for the given room status.
 * Mapping: Ready = green, Needs Attention = red, In Progress = orange, Occupied = grey
 */
export function getStatusColor(status: RoomStatus): string {
  switch (status) {
    case "Ready":
      return "text-green-600";
    case "Needs Attention":
      return "text-red-600";
    case "In Progress":
      return "text-orange-500";
    case "Occupied":
      return "text-gray-500";
  }
}
