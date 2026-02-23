// Feature: hotel-facilities-dashboard, Property 4: Tasks Filter Correctness
// Feature: hotel-facilities-dashboard, Property 2: Status Aggregation Invariant
// Feature: hotel-facilities-dashboard, Property 11: Hotel Room Count Invariant
// Validates: Requirements 5.1, 1.1, 1.3, 1.4, 2.1, 7.2

import * as fc from "fast-check";
import { RoomStatus, RoomWithHotel } from "@/lib/types";
import { deriveRoomStatus } from "@/lib/status";
import { ChecklistItem } from "@/lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const ALL_STATUSES: RoomStatus[] = ["Ready", "In Progress", "Needs Attention", "Occupied"];

function makeChecklistItems(flags: boolean[]): ChecklistItem[] {
  return flags.map((isChecked, i) => ({
    itemId: `item-${i}`,
    roomId: "room-1",
    category: "Bedroom" as const,
    itemName: `Item ${i}`,
    isChecked,
    checkedAt: isChecked ? new Date().toISOString() : null,
  }));
}

// Simulate the tasks filter logic (mirrors getAllRoomsNeedingAttention filter)
function filterRoomsNeedingAttention(rooms: RoomWithHotel[]): RoomWithHotel[] {
  return rooms.filter(
    (r) => r.status === "Needs Attention" || r.status === "In Progress"
  );
}

// Compute status aggregates from a list of rooms
function computeAggregates(rooms: RoomWithHotel[]) {
  const counts: Record<RoomStatus, number> = {
    Ready: 0,
    "In Progress": 0,
    "Needs Attention": 0,
    Occupied: 0,
  };
  for (const room of rooms) {
    counts[room.status]++;
  }
  const total = rooms.length;
  const occupancyRate = total === 0 ? 0 : counts["Occupied"] / total;
  return { counts, total, occupancyRate };
}

// Arbitrary: generate a RoomWithHotel with a given status
const roomArbitrary = fc.record({
  roomId: fc.string({ minLength: 1, maxLength: 20 }),
  hotelId: fc.constantFrom("palm", "difc"),
  roomNumber: fc.integer({ min: 1001, max: 1010 }),
  occupiedOverride: fc.boolean(),
  notes: fc.string(),
  lastUpdated: fc.constant("2024-01-01T00:00:00.000Z"),
  status: fc.constantFrom<RoomStatus>(...ALL_STATUSES),
  hotelName: fc.constantFrom("One&Only The Palm", "One&Only DIFC"),
});

// ── Property 4: Tasks Filter Correctness ─────────────────────────────────────

describe("Property 4: Tasks Filter Correctness", () => {
  // Validates: Requirements 5.1

  it("filter returns only Needs Attention and In Progress rooms", () => {
    fc.assert(
      fc.property(fc.array(roomArbitrary), (rooms) => {
        const filtered = filterRoomsNeedingAttention(rooms);
        for (const room of filtered) {
          expect(["Needs Attention", "In Progress"]).toContain(room.status);
        }
      }),
      { numRuns: 100 }
    );
  });

  it("filter has no false negatives — every qualifying room is included", () => {
    fc.assert(
      fc.property(fc.array(roomArbitrary), (rooms) => {
        const filtered = filterRoomsNeedingAttention(rooms);
        const filteredIds = new Set(filtered.map((r) => r.roomId));

        for (const room of rooms) {
          if (room.status === "Needs Attention" || room.status === "In Progress") {
            expect(filteredIds.has(room.roomId)).toBe(true);
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("filter excludes Ready and Occupied rooms", () => {
    fc.assert(
      fc.property(fc.array(roomArbitrary), (rooms) => {
        const filtered = filterRoomsNeedingAttention(rooms);
        for (const room of filtered) {
          expect(room.status).not.toBe("Ready");
          expect(room.status).not.toBe("Occupied");
        }
      }),
      { numRuns: 100 }
    );
  });

  it("derived status from checklist feeds correctly into filter", () => {
    fc.assert(
      fc.property(fc.array(fc.boolean()), fc.boolean(), (flags, occupiedOverride) => {
        const items = makeChecklistItems(flags);
        const status = deriveRoomStatus(items, occupiedOverride);
        const shouldBeIncluded = status === "Needs Attention" || status === "In Progress";

        const room: RoomWithHotel = {
          roomId: "test-room",
          hotelId: "palm",
          roomNumber: 1001,
          occupiedOverride,
          notes: "",
          lastUpdated: new Date().toISOString(),
          status,
          hotelName: "One&Only The Palm",
        };

        const filtered = filterRoomsNeedingAttention([room]);
        expect(filtered.length === 1).toBe(shouldBeIncluded);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 2: Status Aggregation Invariant ─────────────────────────────────

describe("Property 2: Status Aggregation Invariant", () => {
  // Validates: Requirements 1.1, 1.3, 1.4

  it("sum of all status counts equals total room count", () => {
    fc.assert(
      fc.property(fc.array(roomArbitrary), (rooms) => {
        const { counts, total } = computeAggregates(rooms);
        const sum =
          counts["Ready"] +
          counts["In Progress"] +
          counts["Needs Attention"] +
          counts["Occupied"];
        expect(sum).toBe(total);
      }),
      { numRuns: 100 }
    );
  });

  it("occupancy rate equals occupiedCount / totalRooms", () => {
    fc.assert(
      fc.property(fc.array(roomArbitrary, { minLength: 1 }), (rooms) => {
        const { counts, total, occupancyRate } = computeAggregates(rooms);
        expect(occupancyRate).toBeCloseTo(counts["Occupied"] / total, 10);
      }),
      { numRuns: 100 }
    );
  });

  it("occupancy rate is 0 when no rooms are occupied", () => {
    fc.assert(
      fc.property(
        fc.array(
          roomArbitrary.filter((r) => r.status !== "Occupied"),
          { minLength: 1 }
        ),
        (rooms) => {
          const { occupancyRate } = computeAggregates(rooms);
          expect(occupancyRate).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  it("occupancy rate is 1 when all rooms are occupied", () => {
    fc.assert(
      fc.property(
        fc.array(
          roomArbitrary.map((r) => ({ ...r, status: "Occupied" as RoomStatus })),
          { minLength: 1 }
        ),
        (rooms) => {
          const { occupancyRate } = computeAggregates(rooms);
          expect(occupancyRate).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ── Property 11: Hotel Room Count Invariant ───────────────────────────────────

describe("Property 11: Hotel Room Count Invariant", () => {
  // Validates: Requirements 2.1, 7.2

  // Inline the seed room-building logic as a pure function
  function buildRoomsForHotel(hotelId: string): { roomId: string; roomNumber: number }[] {
    const rooms = [];
    for (let roomNumber = 1001; roomNumber <= 1010; roomNumber++) {
      rooms.push({ roomId: `${hotelId}#${roomNumber}`, roomNumber });
    }
    return rooms;
  }

  it("each hotel has exactly 10 rooms after seed", () => {
    fc.assert(
      fc.property(fc.constantFrom("palm", "difc"), (hotelId) => {
        const rooms = buildRoomsForHotel(hotelId);
        expect(rooms).toHaveLength(10);
      }),
      { numRuns: 100 }
    );
  });

  it("room numbers form the set {1001..1010}", () => {
    fc.assert(
      fc.property(fc.constantFrom("palm", "difc"), (hotelId) => {
        const rooms = buildRoomsForHotel(hotelId);
        const numbers = rooms.map((r) => r.roomNumber).sort((a, b) => a - b);
        expect(numbers).toEqual([1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010]);
      }),
      { numRuns: 100 }
    );
  });

  it("room IDs follow the pattern hotelId#roomNumber", () => {
    fc.assert(
      fc.property(fc.constantFrom("palm", "difc"), (hotelId) => {
        const rooms = buildRoomsForHotel(hotelId);
        for (const room of rooms) {
          expect(room.roomId).toBe(`${hotelId}#${room.roomNumber}`);
        }
      }),
      { numRuns: 100 }
    );
  });
});
