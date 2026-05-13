"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ActionPanel } from "@/components/ui/action-panel";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/field";

type ShotItem = {
  id: string;
  text: string;
  done: boolean;
};

interface ShotlistChecklistProps {
  projectId: string;
  initialValue: string;
}

function parseChecklist(value: string): ShotItem[] {
  const lines = value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  return lines.map((line, index) => {
    const checklistMatch = line.match(/^-\s*\[(x| )\]\s*(.+)$/i);
    const stableId = `initial-${index}`;

    if (checklistMatch) {
      return {
        id: stableId,
        done: checklistMatch[1].toLowerCase() === "x",
        text: checklistMatch[2].trim(),
      };
    }

    return {
      id: stableId,
      done: false,
      text: line.replace(/^[-*]\s*/, "").trim(),
    };
  });
}

function serializeChecklist(items: ShotItem[]) {
  return items
    .map((item) => `- [${item.done ? "x" : " "}] ${item.text.trim()}`)
    .filter((line) => line.trim() !== "- [ ]")
    .join("\n");
}

export function ShotlistChecklist({ projectId, initialValue }: ShotlistChecklistProps) {
  const [items, setItems] = useState<ShotItem[]>(() => parseChecklist(initialValue));
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [newItemText, setNewItemText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [saved, setSaved] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedValueRef = useRef(serializeChecklist(parseChecklist(initialValue)));

  const serializedValue = useMemo(() => serializeChecklist(items), [items]);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    if (serializedValue === lastSavedValueRef.current) {
      setSaved(true);
      setSaveError(null);
      return;
    }

    setSaved(false);

    timeoutRef.current = setTimeout(async () => {
      setIsSaving(true);
      setSaveError(null);

      try {
        const response = await fetch(`/api/projects/${projectId}/selections`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            field: "nextStep",
            value: serializedValue,
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to save");
        }

        lastSavedValueRef.current = serializedValue;
        setSaved(true);
      } catch {
        setSaveError("Failed to save");
      } finally {
        setIsSaving(false);
      }
    }, 700);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [projectId, serializedValue]);

  const addItem = () => {
    const text = newItemText.trim();
    if (!text) {
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text,
        done: false,
      },
    ]);
    setNewItemText("");
  };

  const toggleItem = (id: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item)));
  };

  const updateItemText = (id: string, text: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, text } : item)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const hasItem = (text: string) => {
    const normalized = text.trim().toLowerCase();
    return items.some((item) => item.text.trim().toLowerCase() === normalized);
  };

  const saveSuggestion = (text: string) => {
    if (!text.trim() || hasItem(text)) {
      setSuggestions((prev) => prev.filter((s) => s !== text));
      return;
    }

    setItems((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        text: text.trim(),
        done: false,
      },
    ]);
    setSuggestions((prev) => prev.filter((s) => s !== text));
  };

  const saveAllSuggestions = () => {
    const toSave = suggestions.filter((s) => s.trim() && !hasItem(s));
    if (toSave.length === 0) {
      setSuggestions([]);
      return;
    }

    setItems((prev) => [
      ...prev,
      ...toSave.map((text, index) => ({
        id: `${Date.now()}-${index}-${Math.random().toString(36).slice(2, 8)}`,
        text: text.trim(),
        done: false,
      })),
    ]);
    setSuggestions([]);
  };

  const generateSituations = async () => {
    setIsGenerating(true);
    setGenerateError(null);

    try {
      const response = await fetch(`/api/projects/${projectId}/ideate/situations`, {
        method: "POST",
      });

      const data = (await response.json().catch(() => ({}))) as {
        situations?: string[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate situations");
      }

      const generated = (data.situations ?? []).filter(Boolean);
      if (generated.length === 0) {
        throw new Error("No situations generated");
      }

      setSuggestions(generated);
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate situations");
    } finally {
      setIsGenerating(false);
    }
  };

  const completedCount = items.filter((item) => item.done).length;
  const totalCount = items.length;

  return (
    <ActionPanel>
      <div className="mb-2 flex items-center justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-foreground">Scene Planner</label>
        <span className="text-[11px] text-muted-foreground/70">
          {isSaving ? "Saving..." : saveError ? saveError : saved ? "Saved" : "Unsaved"}
        </span>
      </div>

      <p className="mb-3 text-xs text-muted-foreground">
        Generate realistic moments to remember when to pull the camera out.
      </p>

      <div className="mb-4 rounded-md border border-border bg-background/60 p-2.5">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Suggested Situations</p>
          <Button
            type="button"
            onClick={generateSituations}
            disabled={isGenerating}
            variant="subtle"
            size="sm"
          >
            {isGenerating ? "Generating..." : suggestions.length > 0 ? "Regenerate" : "Generate"}
          </Button>
        </div>

        {generateError ? <p className="mb-2 text-xs text-destructive">{generateError}</p> : null}

        {suggestions.length === 0 ? (
          <EmptyState compact title="No suggestions yet" description="Generate a fresh batch to start building the scene list." />
        ) : (
          <>
            <div className="space-y-2">
              {suggestions.map((text, index) => (
                <div key={`${text}-${index}`} className="flex items-start gap-2 rounded-md border border-border bg-background px-2 py-1.5">
                  <p className="flex-1 text-sm text-foreground">{text}</p>
                  <Button
                    type="button"
                    onClick={() => saveSuggestion(text)}
                    variant="subtle"
                    size="sm"
                  >
                    Save
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setSuggestions((prev) => prev.filter((s) => s !== text))}
                    variant="ghost"
                    size="sm"
                  >
                    Dismiss
                  </Button>
                </div>
              ))}
            </div>

            <Button
              type="button"
              onClick={saveAllSuggestions}
              variant="outline"
              size="sm"
              className="mt-2 w-full"
            >
              Save All Suggestions
            </Button>
          </>
        )}
      </div>

      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Saved Prompts</p>
        <p className="text-[11px] text-muted-foreground">{completedCount}/{totalCount} done</p>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <EmptyState compact title="No saved prompts yet" description="Save suggestions or add your own moments below." />
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-start gap-2 rounded-md border border-border bg-background px-2 py-1.5">
              <input
                type="checkbox"
                checked={item.done}
                onChange={() => toggleItem(item.id)}
                className="mt-1 h-3.5 w-3.5"
                aria-label="Toggle situation task"
              />
              <input
                value={item.text}
                onChange={(event) => updateItemText(item.id, event.target.value)}
                className={`min-w-0 flex-1 border-none bg-transparent p-0 text-sm outline-none ${
                  item.done ? "text-muted-foreground line-through" : "text-foreground"
                }`}
                placeholder="Describe the situation"
              />
              <Button
                type="button"
                onClick={() => removeItem(item.id)}
                variant="ghost"
                size="sm"
                aria-label="Remove situation task"
              >
                Remove
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="mt-3 flex gap-2">
        <Input
          value={newItemText}
          onChange={(event) => setNewItemText(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addItem();
            }
          }}
          placeholder="Add situation (e.g. right before first tee shot)"
        />
        <Button
          type="button"
          onClick={addItem}
          variant="outline"
          size="md"
        >
          Add
        </Button>
      </div>
    </ActionPanel>
  );
}
