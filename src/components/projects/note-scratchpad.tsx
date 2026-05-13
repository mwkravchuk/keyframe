"use client";

import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/field";

interface NoteScratchpadProps {
  projectId: string;
  initialNotes: string;
  variant?: "light" | "dark";
}

export function NoteScratchpad({ projectId, initialNotes, variant = "light" }: NoteScratchpadProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // If notes haven't changed from initial, no need to save
    if (notes === initialNotes) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSaved(true);
      return;
    }

    setSaved(false);

    // Debounce: wait 1s after user stops typing before saving
    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      try {
        const response = await fetch(`/api/projects/${projectId}/selections`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field: "notes",
            value: notes,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save notes");
        }

        setSaved(true);
      } catch (error) {
        console.error("Notes save error:", error);
        // In case of error, still allow user to continue typing
      } finally {
        setIsSaving(false);
      }
    }, 1000);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [notes, initialNotes, projectId]);

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label htmlFor="notes" className={`text-xs font-semibold uppercase tracking-wide ${
          variant === "dark" ? "text-zinc-200" : "text-foreground"
        }`}>
          Notes & Scratch Ideas
        </label>
        <span className={`text-xs transition ${
          isSaving 
            ? variant === "dark" ? "text-zinc-400" : "text-muted-foreground"
            : saved 
              ? variant === "dark" ? "text-zinc-500" : "text-muted-foreground/50"
              : variant === "dark" ? "text-amber-400" : "text-amber-600"
        }`}>
          {isSaving ? "Saving..." : saved ? "Saved" : "Unsaved"}
        </span>
      </div>
      <Textarea
        id="notes"
        name="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Quick thoughts, reference links, segment ideas, anything that helps you remember the vision."
        rows={10}
        className={`mt-2 h-full w-full ${
          variant === "dark"
            ? "border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
            : "bg-background/70"
        }`}
      />
    </div>
  );
}
