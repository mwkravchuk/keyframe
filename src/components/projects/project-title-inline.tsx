"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil } from "lucide-react";

interface ProjectTitleInlineProps {
  projectId: string;
  initialTitle: string;
}

export function ProjectTitleInline({ projectId, initialTitle }: ProjectTitleInlineProps) {
  const [title, setTitle] = useState(initialTitle);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedTitleRef = useRef(initialTitle);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    const trimmed = title.trim();
    if (!trimmed || trimmed === lastSavedTitleRef.current) {
      setError(null);
      return;
    }

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/projects/${projectId}/selections`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ field: "title", value: trimmed }),
        });

        if (!response.ok) {
          throw new Error("Failed to save title");
        }

        lastSavedTitleRef.current = trimmed;
      } catch {
        setError("Failed to save");
      } finally {
        setIsSaving(false);
      }
    }, 500);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [projectId, title]);

  return (
    <div>
      {isEditing ? (
        <input
          autoFocus
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              setIsEditing(false);
            }
          }}
          className="w-full border-none bg-transparent p-0 text-2xl font-semibold tracking-tight outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="group -mx-1 flex w-full cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-left text-2xl font-semibold tracking-tight transition hover:bg-muted/55"
          aria-label="Edit project title"
        >
          <span className="truncate">{title || "Untitled Project"}</span>
          <Pencil size={15} className="shrink-0 text-muted-foreground opacity-55 transition group-hover:opacity-100" />
        </button>
      )}

      {error ? <div className="mt-1 text-[11px] text-red-500">{error}</div> : null}
    </div>
  );
}
