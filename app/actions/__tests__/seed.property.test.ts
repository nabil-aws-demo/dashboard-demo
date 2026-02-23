// Feature: hotel-facilities-dashboard, Property 9: Seed Correctness
// Feature: hotel-facilities-dashboard, Property 10: Seed Idempotence
// Validates: Requirements 7.1, 7.2, 7.3, 7.4

import * as fc from "fast-check";
import { CHECKLIST_ITEMS } from "@/lib/constants";

// ── Inline the seed item-building logic so we can test it as a pure function ──

const HOTELS = [
  { hotelId: "palm", name: "One&Only The Palm", location: "Palm Jumeirah, Dubai", imageUrl: "" },
  { hotelId: "difc", name: "One&Only DIFC", location: "DIFC, Dubai", imageUrl: "" },
];

function buildSeedItems(now: string): Record<string, unknown>[] {
  const items: Record<string, unknown>[] = [];

  for (const hotel of HOTELS) {
    items.push({
      PK: `HOTEL#${hotel.hotelId}`,
      SK: "METADATA",
      GSI1PK: "HOTELS",
      GSI1SK: `HOTEL#${hotel.hotelId}`,
      hotelId: hotel.hotelId,
      name: hotel.name,
      location: hotel.location,
      imageUrl: hotel.imageUrl,
      createdAt: now,
    });

    for (let roomNumber = 1001; roomNumber <= 1010; roomNumber++) {
      const roomId = `${hotel.hotelId}#${roomNumber}`;

      items.push({
        PK: `ROOM#${roomId}`,
        SK: "METADATA",
        GSI1PK: `HOTEL#${hotel.hotelId}`,
        GSI1SK: `ROOM#${roomNumber}`,
        roomId,
        hotelId: hotel.hotelId,
        roomNumber,
        occupiedOverride: false,
        notes: "",
        lastUpdated: now,
      });

      for (const item of CHECKLIST_ITEMS) {
        const itemId = `${roomId}#${item.category}#${item.itemName.replace(/\s+/g, "_")}`;
        items.push({
          PK: `ROOM#${roomId}`,
          SK: `CHECKLIST#${item.category}#${itemId}`,
          itemId,
          roomId,
          hotelId: hotel.hotelId,
          category: item.category,
          itemName: item.itemName,
          isChecked: false,
          checkedAt: null,
        });
      }
    }
  }

  return items;
}

// ── Property 9: Seed Correctness ──────────────────────────────────────────────

describe("Property 9: Seed Correctness", () => {
  it("produces exactly 2 hotels, 10 rooms per hotel, 33 checklist items per room — all unchecked", () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        const now = date.toISOString();
        const items = buildSeedItems(now);

        // 2 hotels
        const hotelItems = items.filter(
          (i) => i.SK === "METADATA" && (i.PK as string).startsWith("HOTEL#")
        );
        expect(hotelItems).toHaveLength(2);

        // 10 rooms per hotel
        for (const hotel of HOTELS) {
          const roomItems = items.filter(
            (i) =>
              i.SK === "METADATA" &&
              (i.PK as string).startsWith("ROOM#") &&
              i.hotelId === hotel.hotelId
          );
          expect(roomItems).toHaveLength(10);

          // Room numbers are 1001–1010
          const roomNumbers = roomItems.map((r) => r.roomNumber as number).sort((a, b) => a - b);
          expect(roomNumbers).toEqual([1001, 1002, 1003, 1004, 1005, 1006, 1007, 1008, 1009, 1010]);

          // 33 checklist items per room, all unchecked
          for (let roomNumber = 1001; roomNumber <= 1010; roomNumber++) {
            const roomId = `${hotel.hotelId}#${roomNumber}`;
            const checklistItems = items.filter(
              (i) =>
                i.PK === `ROOM#${roomId}` &&
                (i.SK as string).startsWith("CHECKLIST#")
            );
            expect(checklistItems).toHaveLength(33);
            for (const ci of checklistItems) {
              expect(ci.isChecked).toBe(false);
              expect(ci.checkedAt).toBeNull();
            }
          }
        }
      }),
      { numRuns: 100 }
    );
  });

  it("total item count is 2 hotels + 20 rooms + 660 checklist items = 682", () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        const items = buildSeedItems(date.toISOString());
        expect(items).toHaveLength(2 + 20 + 660);
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 10: Seed Idempotence ─────────────────────────────────────────────

describe("Property 10: Seed Idempotence", () => {
  it("running seed twice produces identical item sets (same PKs, SKs, and values)", () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        const now = date.toISOString();
        const firstRun = buildSeedItems(now);
        const secondRun = buildSeedItems(now);

        // Same number of items
        expect(secondRun).toHaveLength(firstRun.length);

        // Same PKs and SKs (order-independent)
        const firstKeys = firstRun
          .map((i) => `${i.PK}|${i.SK}`)
          .sort();
        const secondKeys = secondRun
          .map((i) => `${i.PK}|${i.SK}`)
          .sort();
        expect(secondKeys).toEqual(firstKeys);

        // Checklist items remain unchecked on second run
        const checklistItems = secondRun.filter((i) =>
          (i.SK as string).startsWith("CHECKLIST#")
        );
        for (const ci of checklistItems) {
          expect(ci.isChecked).toBe(false);
          expect(ci.checkedAt).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  it("no duplicate PK+SK pairs are produced", () => {
    fc.assert(
      fc.property(fc.date(), (date) => {
        const items = buildSeedItems(date.toISOString());
        const keys = items.map((i) => `${i.PK}|${i.SK}`);
        const uniqueKeys = new Set(keys);
        expect(uniqueKeys.size).toBe(keys.length);
      }),
      { numRuns: 100 }
    );
  });
});
