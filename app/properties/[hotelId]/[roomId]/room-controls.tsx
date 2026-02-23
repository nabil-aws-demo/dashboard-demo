"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateRoomNotes, setRoomOccupied } from "@/actions/room";

interface RoomControlsProps {
  roomId: string;
  initialNotes: string;
  initialOccupied: boolean;
}

export default function RoomControls({ roomId, initialNotes, initialOccupied }: RoomControlsProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [occupied, setOccupied] = useState(initialOccupied);
  const [notesPending, startNotes] = useTransition();
  const [occupiedPending, startOccupied] = useTransition();
  const [notesSaved, setNotesSaved] = useState(false);
  const router = useRouter();

  function handleSaveNotes() {
    startNotes(async () => {
      await updateRoomNotes(roomId, notes);
      setNotesSaved(true);
      router.refresh();
      setTimeout(() => setNotesSaved(false), 2000);
    });
  }

  function handleToggleOccupied() {
    const next = !occupied;
    setOccupied(next);
    startOccupied(async () => {
      await setRoomOccupied(roomId, next);
      router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      {/* Occupied toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-gray-800">Occupied Override</p>
            <p className="text-xs text-gray-500 mt-0.5">
              Forces status to &quot;Occupied&quot; regardless of checklist state
            </p>
          </div>
          <button
            onClick={handleToggleOccupied}
            disabled={occupiedPending}
            className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 disabled:opacity-50 ${
              occupied ? "bg-orange-500" : "bg-gray-200"
            }`}
            aria-pressed={occupied}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform ${
                occupied ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Notes */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <p className="text-sm font-semibold text-gray-800 mb-3">Housekeeping Notes</p>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Add notes for this room..."
          className="w-full text-sm text-gray-700 border border-gray-200 rounded-lg p-3 resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
        />
        <div className="flex items-center justify-between mt-3">
          {notesSaved && (
            <span className="text-xs text-green-600 font-medium">Saved</span>
          )}
          {!notesSaved && <span />}
          <button
            onClick={handleSaveNotes}
            disabled={notesPending}
            className="px-4 py-2 text-sm font-medium text-white rounded-lg disabled:opacity-50 transition-opacity"
            style={{ backgroundColor: "#f97316" }}
          >
            {notesPending ? "Saving..." : "Save Notes"}
          </button>
        </div>
      </div>
    </div>
  );
}
