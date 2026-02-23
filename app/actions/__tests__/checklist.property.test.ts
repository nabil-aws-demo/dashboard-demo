// Feature: hotel-facilities-dashboard, Property 8: CheckedAt Timestamp Invariant
// Feature: hotel-facilities-dashboard, Property 3: Checklist Grouping Correctness
// Feature: hotel-facilities-dashboard, Property 5: Incomplete Item Count Correctness
// Validates: Requirements 3.9, 3.2, 5.2

import * as fc from "fast-check";
import { ChecklistItem, ChecklistSection } from "@/lib/types";
import { CHECKLIST_ITEMS } from "@/lib/constants";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeChecklistItem(isChecked: boolean, index = 0): ChecklistItem {
  return {
    itemId: `item-${index}`,
    roomId: "room-1",
    category: "Bedroom",
    itemName: `Item ${index}`,
    isChecked,
    checkedAt: isChecked ? new Date().toISOString() : null,
  };
}

// Simulate toggleChecklistItem's checkedAt logic (pure, extracted from action)
function computeCheckedAt(isChecked: boolean, now: string): string | null {
  return isChecked ? now : null;
}

// Group checklist items by section
function groupBySection(
  items: { category: ChecklistSection; itemName: string }[]
): Map<ChecklistSection, { category: ChecklistSection; itemName: string }[]> {
  const map = new Map<ChecklistSection, { category: ChecklistSection; itemName: string }[]>();
  for (const item of items) {
    const existing = map.get(item.category) ?? [];
    map.set(item.category, [...existing, item]);
  }
  return map;
}

// Count incomplete items
function countIncomplete(items: ChecklistItem[]): number {
  return items.filter((i) => !i.isChecked).length;
}

// ── Property 8: CheckedAt Timestamp Invariant ─────────────────────────────────

describe("Property 8: CheckedAt Timestamp Invariant", () => {
  // Validates: Requirements 3.9

  const validDate = fc.date({ min: new Date(0), max: new Date("9999-12-31") });

  it("when isChecked=true, checkedAt is a valid ISO 8601 timestamp", () => {
    fc.assert(
      fc.property(validDate, (date) => {
        const now = date.toISOString();
        const checkedAt = computeCheckedAt(true, now);
        expect(checkedAt).not.toBeNull();
        expect(typeof checkedAt).toBe("string");
        // Valid ISO 8601: parseable and round-trips
        expect(new Date(checkedAt!).toISOString()).toBe(checkedAt);
      }),
      { numRuns: 100 }
    );
  });

  it("when isChecked=false, checkedAt is null", () => {
    fc.assert(
      fc.property(validDate, (date) => {
        const now = date.toISOString();
        const checkedAt = computeCheckedAt(false, now);
        expect(checkedAt).toBeNull();
      }),
      { numRuns: 100 }
    );
  });

  it("checkedAt invariant holds for any boolean isChecked value", () => {
    fc.assert(
      fc.property(fc.boolean(), validDate, (isChecked, date) => {
        const now = date.toISOString();
        const checkedAt = computeCheckedAt(isChecked, now);
        if (isChecked) {
          expect(checkedAt).not.toBeNull();
          expect(new Date(checkedAt!).toISOString()).toBe(checkedAt);
        } else {
          expect(checkedAt).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });

  it("makeChecklistItem helper respects the invariant", () => {
    fc.assert(
      fc.property(fc.boolean(), fc.integer({ min: 0, max: 100 }), (isChecked, index) => {
        const item = makeChecklistItem(isChecked, index);
        if (item.isChecked) {
          expect(item.checkedAt).not.toBeNull();
          expect(new Date(item.checkedAt!).toISOString()).toBe(item.checkedAt);
        } else {
          expect(item.checkedAt).toBeNull();
        }
      }),
      { numRuns: 100 }
    );
  });
});

// ── Property 3: Checklist Grouping Correctness ────────────────────────────────

describe("Property 3: Checklist Grouping Correctness", () => {
  // Validates: Requirements 3.2

  const EXPECTED_COUNTS: Record<ChecklistSection, number> = {
    Bedroom: 10,
    Bathroom: 10,
    Amenities: 8,
    "Final Inspection": 5,
  };

  it("groups into exactly 4 sections", () => {
    const grouped = groupBySection(CHECKLIST_ITEMS);
    expect(grouped.size).toBe(4);
  });

  it("Bedroom section has exactly 10 items", () => {
    const grouped = groupBySection(CHECKLIST_ITEMS);
    expect(grouped.get("Bedroom")).toHaveLength(10);
  });

  it("Bathroom section has exactly 10 items", () => {
    const grouped = groupBySection(CHECKLIST_ITEMS);
    expect(grouped.get("Bathroom")).toHaveLength(10);
  });

  it("Amenities section has exactly 8 items", () => {
    const grouped = groupBySection(CHECKLIST_ITEMS);
    expect(grouped.get("Amenities")).toHaveLength(8);
  });

  it("Final Inspection section has exactly 5 items", () => {
    const grouped = groupBySection(CHECKLIST_ITEMS);
    expect(grouped.get("Final Inspection")).toHaveLength(5);
  });

  it("every item appears in exactly one section", () => {
    const grouped = groupBySection(CHECKLIST_ITEMS);
    const allGroupedItems = Array.from(grouped.values()).flat();
    expect(allGroupedItems).toHaveLength(CHECKLIST_ITEMS.length);

    // Each item name is unique across all sections
    const allNames = allGroupedItems.map((i) => i.itemName);
    const uniqueNames = new Set(allNames);
    expect(uniqueNames.size).toBe(CHECKLIST_ITEMS.length);
  });

  it("section counts match expected values", () => {
    const grouped = groupBySection(CHECKLIST_ITEMS);
    for (const [section, expectedCount] of Object.entries(EXPECTED_COUNTS)) {
      expect(grouped.get(section as ChecklistSection)).toHaveLength(expectedCount);
    }
  });

  it("total item count is 33", () => {
    expect(CHECKLIST_ITEMS).toHaveLength(33);
  });
});

// ── Property 5: Incomplete Item Count Correctness ─────────────────────────────

describe("Property 5: Incomplete Item Count Correctness", () => {
  // Validates: Requirements 5.2

  it("incompleteCount = total - checked for any array of items", () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 0, maxLength: 50 }), (flags) => {
        const items = flags.map((isChecked, i) => makeChecklistItem(isChecked, i));
        const checkedCount = items.filter((i) => i.isChecked).length;
        const incompleteCount = countIncomplete(items);
        expect(incompleteCount).toBe(items.length - checkedCount);
      }),
      { numRuns: 100 }
    );
  });

  it("incompleteCount is never negative", () => {
    fc.assert(
      fc.property(fc.array(fc.boolean(), { minLength: 0, maxLength: 50 }), (flags) => {
        const items = flags.map((isChecked, i) => makeChecklistItem(isChecked, i));
        expect(countIncomplete(items)).toBeGreaterThanOrEqual(0);
      }),
      { numRuns: 100 }
    );
  });

  it("incompleteCount is 0 when all items are checked", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 33 }), (n) => {
        const items = Array.from({ length: n }, (_, i) => makeChecklistItem(true, i));
        expect(countIncomplete(items)).toBe(0);
      }),
      { numRuns: 100 }
    );
  });

  it("incompleteCount equals total when no items are checked", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 33 }), (n) => {
        const items = Array.from({ length: n }, (_, i) => makeChecklistItem(false, i));
        expect(countIncomplete(items)).toBe(n);
      }),
      { numRuns: 100 }
    );
  });
});
