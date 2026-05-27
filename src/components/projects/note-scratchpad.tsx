"use client";

import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/field";

interface NoteScratchpadProps {
  projectId: string;
  initialNotes: string;
  variant?: "light" | "dark";
  rows?: number;
}

export function NoteScratchpad({ projectId, initialNotes, variant = "light", rows = 10 }: NoteScratchpadProps) {
  const [notes, setNotes] = useState(initialNotes);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (notes === initialNotes) {
      setError(null);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setError(null);
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
      } catch {
        setError("Failed to save notes");
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
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor="notes" className={`text-xs font-semibold uppercase tracking-wide ${
          variant === "dark" ? "text-zinc-200" : "text-foreground"
        }`}>
          Notes & Scratch Ideas
        </label>
      </div>
      {error ? <div className="mb-1 text-[11px] text-red-500">{error}</div> : null}
      <Textarea
        id="notes"
        name="notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Quick thoughts, reference links, segment ideas, anything that helps you remember the vision."
        rows={rows}
        className={`mt-2 h-full w-full ${
          variant === "dark"
            ? "border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
            : "bg-background/70"
        }`}
      />
    </div>
  );
}
