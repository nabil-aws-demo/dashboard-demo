export type RoomStatus = "Ready" | "In Progress" | "Needs Attention" | "Occupied";

export type ChecklistSection = "Bedroom" | "Bathroom" | "Amenities" | "Final Inspection";

export interface Hotel {
  hotelId: string;
  name: string;
  location: string;
  imageUrl: string;
}

export interface Room {
  roomId: string;
  hotelId: string;
  roomNumber: number;
  status: RoomStatus; // derived, not stored
  occupiedOverride: boolean;
  notes: string;
  lastUpdated: string;
}

export interface RoomWithHotel extends Room {
  hotelName: string;
}

export interface ChecklistItem {
  itemId: string;
  roomId: string;
  category: ChecklistSection;
  itemName: string;
  isChecked: boolean;
  checkedAt: string | null;
}
