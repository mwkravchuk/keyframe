"use client";

import { useEffect, useRef, useState } from "react";
import { ActionPanel } from "@/components/ui/action-panel";
import { Textarea } from "@/components/ui/field";

interface AutoSaveTextareaProps {
  projectId: string;
  field: "concept" | "nextStep";
  label: string;
  initialValue: string;
  placeholder: string;
  rows: number;
  variant?: "light" | "dark";
  hideLabel?: boolean;
}

export function AutoSaveTextarea({
  projectId,
  field,
  label,
  initialValue,
  placeholder,
  rows,
  variant = "light",
  hideLabel = false,
}: AutoSaveTextareaProps) {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValueRef = useRef(initialValue);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (value === lastSavedValueRef.current) {
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
            field,
            value,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save");
        }

        lastSavedValueRef.current = value;
      } catch {
        setError("Failed to save");
      }
    }, 700);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [field, projectId, value]);

  return (
    <ActionPanel>
      <div className="flex items-center justify-between">
        <label
          htmlFor={field}
          className={`${hideLabel ? "sr-only" : "text-xs font-semibold uppercase tracking-wide"} ${
            variant === "dark" ? "text-zinc-300" : "text-foreground"
          }`}
        >
          {label}
        </label>
      </div>
      {error ? <div className="mt-1 text-[11px] text-red-500">{error}</div> : null}
      <Textarea
        id={field}
        name={field}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        rows={rows}
        placeholder={placeholder}
        className={`mt-2 w-full rounded-sm px-3 py-2 text-sm ${
          variant === "dark"
            ? "border border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
            : "bg-background/75"
        }`}
      />
    </ActionPanel>
  );
}
