"use client";

import { useEffect, useRef, useState } from "react";

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
          className="w-full border-none bg-transparent p-0 text-3xl font-semibold tracking-tight outline-none"
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="w-full text-left text-3xl font-semibold tracking-tight transition hover:opacity-80"
        >
          {title || "Untitled Project"}
        </button>
      )}

      <div className="mt-1 h-4 text-[11px] text-muted-foreground">
        {isSaving ? "Saving title..." : error ?? "Click title to edit"}
      </div>
    </div>
  );
}
