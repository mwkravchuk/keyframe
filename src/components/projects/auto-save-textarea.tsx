"use client";

import { useEffect, useRef, useState } from "react";

interface AutoSaveTextareaProps {
  projectId: string;
  field: "concept" | "nextStep";
  label: string;
  initialValue: string;
  placeholder: string;
  rows: number;
  variant?: "light" | "dark";
}

export function AutoSaveTextarea({
  projectId,
  field,
  label,
  initialValue,
  placeholder,
  rows,
  variant = "light",
}: AutoSaveTextareaProps) {
  const [value, setValue] = useState(initialValue);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValueRef = useRef(initialValue);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (value === lastSavedValueRef.current) {
      setSaved(true);
      setError(null);
      return;
    }

    setSaved(false);

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setError(null);

      try {
        const response = await fetch(`/api/projects/${projectId}/selections`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field,
            value,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save");
        }

        lastSavedValueRef.current = value;
        setSaved(true);
      } catch {
        setError("Failed to save");
      } finally {
        setIsSaving(false);
      }
    }, 700);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [field, projectId, value]);

  return (
    <div>
      <div className="flex items-center justify-between">
        <label
          htmlFor={field}
          className={`text-xs font-semibold uppercase tracking-wide ${
            variant === "dark" ? "text-zinc-300" : "text-foreground"
          }`}
        >
          {label}
        </label>
        <span className={`text-[11px] ${variant === "dark" ? "text-zinc-500" : "text-muted-foreground/70"}`}>
          {isSaving ? "Saving..." : error ? error : saved ? "Saved" : "Unsaved"}
        </span>
      </div>
      <textarea
        id={field}
        name={field}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`mt-2 w-full rounded-sm px-3 py-2 text-sm ${
          variant === "dark"
            ? "border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
            : "border border-zinc-300 bg-white/80 placeholder:text-zinc-500"
        }`}
      />
    </div>
  );
}
