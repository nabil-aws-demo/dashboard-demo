import { ChecklistSection } from "./types";

export const CHECKLIST_ITEMS: { category: ChecklistSection; itemName: string }[] = [
  // Bedroom (10)
  { category: "Bedroom", itemName: "Bed made with fresh linen" },
  { category: "Bedroom", itemName: "Pillows arranged correctly" },
  { category: "Bedroom", itemName: "Duvet/bedspread straightened" },
  { category: "Bedroom", itemName: "Nightstand cleared and wiped" },
  { category: "Bedroom", itemName: "All lights tested and working" },
  { category: "Bedroom", itemName: "TV and remote functional" },
  { category: "Bedroom", itemName: "AC/heating set to default temperature" },
  { category: "Bedroom", itemName: "Curtains/blinds clean and operational" },
  { category: "Bedroom", itemName: "Floors vacuumed" },
  { category: "Bedroom", itemName: "Surfaces dusted" },
  // Bathroom (10)
  { category: "Bathroom", itemName: "Toilet cleaned inside and out" },
  { category: "Bathroom", itemName: "Sink and countertop wiped clean" },
  { category: "Bathroom", itemName: "Mirror polished" },
  { category: "Bathroom", itemName: "Shower/tub scrubbed" },
  { category: "Bathroom", itemName: "Floor mopped and dry" },
  { category: "Bathroom", itemName: "Fresh towels placed (bath, hand, face)" },
  { category: "Bathroom", itemName: "Bathrobe and slippers placed" },
  { category: "Bathroom", itemName: "Toiletries restocked (shampoo, conditioner, body wash, soap)" },
  { category: "Bathroom", itemName: "Toilet paper replaced" },
  { category: "Bathroom", itemName: "Bin emptied and relined" },
  // Amenities (8)
  { category: "Amenities", itemName: "Minibar restocked and checked" },
  { category: "Amenities", itemName: "Coffee/tea station restocked" },
  { category: "Amenities", itemName: "Water bottles placed" },
  { category: "Amenities", itemName: "Welcome amenities in place" },
  { category: "Amenities", itemName: "In-room dining menu present" },
  { category: "Amenities", itemName: "Safe operational" },
  { category: "Amenities", itemName: "Iron and ironing board present" },
  { category: "Amenities", itemName: "Luggage rack in place" },
  // Final Inspection (5)
  { category: "Final Inspection", itemName: "Room fragrance applied" },
  { category: "Final Inspection", itemName: "All windows/doors checked" },
  { category: "Final Inspection", itemName: "No maintenance issues noted" },
  { category: "Final Inspection", itemName: "Room sign/DND card in place" },
  { category: "Final Inspection", itemName: "Overall presentation check" },
];
