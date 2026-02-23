import * as fc from "fast-check";
import { deriveRoomStatus, getStatusColor } from "../status";
import { ChecklistItem, RoomStatus } from "../types";

// Helper: build minimal ChecklistItem array from boolean flags
function makeItems(flags: boolean[]): ChecklistItem[] {
  return flags.map((isChecked, i) => ({
    itemId: `item-${i}`,
    roomId: "room-1",
    category: "Bedroom" as const,
    itemName: `Item ${i}`,
    isChecked,
    checkedAt: isChecked ? new Date().toISOString() : null,
  }));
}

// Feature: hotel-facilities-dashboard, Property 1: Status Derivation Correctness
describe("Property 1: Status Derivation Correctness", () => {
  // Validates: Requirements 3.4, 3.5, 3.6, 3.7

  it("occupiedOverride=true always returns Occupied regardless of checklist state", () => {
    fc.assert(
      fc.property(fc.array(fc.boolean()), (flags) => {
        const items = makeItems(flags);
        expect(deriveRoomStatus(items, true)).toBe("Occupied");
      }),
      { numRuns: 100 }
    );
  });

  it("all items checked → Ready", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 40 }), (n) => {
        const items = makeItems(Array(n).fill(true));
        expect(deriveRoomStatus(items, false)).toBe("Ready");
      }),
      { numRuns: 100 }
    );
  });

  it("no items checked → Needs Attention", () => {
    fc.assert(
      fc.property(fc.integer({ min: 1, max: 40 }), (n) => {
        const items = makeItems(Array(n).fill(false));
        expect(deriveRoomStatus(items, false)).toBe("Needs Attention");
      }),
      { numRuns: 100 }
    );
  });

  it("some but not all items checked → In Progress", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 40 }).chain((n) =>
          fc.integer({ min: 1, max: n - 1 }).map((checked) => ({ n, checked }))
        ),
        ({ n, checked }) => {
          const flags = Array(n).fill(false).map((_, i) => i < checked);
          const items = makeItems(flags);
          expect(deriveRoomStatus(items, false)).toBe("In Progress");
        }
      ),
      { numRuns: 100 }
    );
  });

  it("empty checklist with no override → Needs Attention", () => {
    expect(deriveRoomStatus([], false)).toBe("Needs Attention");
  });
});

// Feature: hotel-facilities-dashboard, Property 6: Status Color Mapping Exhaustiveness
describe("Property 6: Status Color Mapping Exhaustiveness", () => {
  // Validates: Requirements 2.2

  const allStatuses: RoomStatus[] = ["Ready", "Needs Attention", "In Progress", "Occupied"];

  it("returns a non-empty string for every RoomStatus", () => {
    fc.assert(
      fc.property(fc.constantFrom(...allStatuses), (status) => {
        const color = getStatusColor(status);
        expect(typeof color).toBe("string");
        expect(color.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it("all four statuses map to distinct colors (injective)", () => {
    const colors = allStatuses.map(getStatusColor);
    const unique = new Set(colors);
    expect(unique.size).toBe(allStatuses.length);
  });
});
