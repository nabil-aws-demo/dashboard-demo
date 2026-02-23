"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChecklistItem, ChecklistSection } from "@/lib/types";
import { Checkbox } from "@/components/ui/checkbox";
import { toggleChecklistItem } from "@/actions/checklist";

interface ChecklistSectionProps {
  section: ChecklistSection;
  items: ChecklistItem[];
}

export default function ChecklistSectionComponent({ section, items }: ChecklistSectionProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggle(item: ChecklistItem, checked: boolean) {
    startTransition(async () => {
      await toggleChecklistItem(item.itemId, item.roomId, checked);
      router.refresh();
    });
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
        {section}
      </h3>
      <div className="space-y-2">
        {items.map((item) => (
          <label
            key={item.itemId}
            className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-100 hover:border-gray-200 cursor-pointer transition-colors"
          >
            <Checkbox
              checked={item.isChecked}
              disabled={isPending}
              onCheckedChange={(checked) => handleToggle(item, checked === true)}
            />
            <span
              className={`text-sm ${
                item.isChecked ? "line-through text-gray-400" : "text-gray-700"
              }`}
            >
              {item.itemName}
            </span>
          </label>
        ))}
      </div>
    </div>
  );
}
