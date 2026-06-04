"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { AutoSaveTextarea } from "@/components/projects/auto-save-textarea";
import { TitleIdeation } from "@/components/projects/title-ideation";
import { HookGenerator } from "@/components/projects/hook-generator";
import { ScenePlannerGenerator } from "@/components/projects/scene-planner-generator";
import { ConsolidatorPhase } from "@/components/projects/consolidator-phase";
import { SubmagicMagicClipsPanel } from "@/components/projects/submagic-magic-clips-panel";

type GeneratorKey = "title" | "hook" | "scene";
type SectionKey = "ideate" | "generate" | "consolidate" | "distribute";

interface SectionFrameProps {
  title: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}

function SectionFrame({ title, description, isOpen, onToggle, children }: SectionFrameProps) {
  return (
    <section className="space-y-4">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 text-left"
      >
        <div className="space-y-1">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ChevronDown
          className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${
            isOpen ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      {isOpen ? <div>{children}</div> : null}
    </section>
  );
}

interface ProjectGeneratorStackProps {
  projectId: string;
  concept: string;
  projectTitle: string | null;
  proposedTitles: string[] | null;
  shortlistedTitles: string[];
  shortlistedHooks: string[];
  savedScenes: string[];
  currentTitle: string | null;
  currentHook: string | null;
  hasYoutubeVideoUrl: boolean;
  initialSubmagicStatus: string | null;
  initialSubmagicData: {
    id: string;
    status: string;
    previewUrl: string | null;
    downloadUrl: string | null;
    directUrl: string | null;
    failureReason: string | null;
    updatedAt: string | null;
    magicClips: Array<{
      id: string;
      title: string;
      status: string;
      duration: number | null;
      previewUrl: string | null;
      downloadUrl: string | null;
      directUrl: string | null;
      viralityTotal: number | null;
    }>;
  } | null;
}

export function ProjectGeneratorStack({
  projectId,
  concept,
  projectTitle,
  proposedTitles,
  shortlistedTitles,
  shortlistedHooks,
  savedScenes,
  currentTitle,
  currentHook,
  hasYoutubeVideoUrl,
  initialSubmagicStatus,
  initialSubmagicData,
}: ProjectGeneratorStackProps) {
  const [activeGenerator, setActiveGenerator] = useState<GeneratorKey | null>(null);
  const [openSections, setOpenSections] = useState<Record<SectionKey, boolean>>({
    ideate: true,
    generate: false,
    consolidate: false,
    distribute: false,
  });
  const [shortlistedTitlesState, setShortlistedTitlesState] = useState<string[]>(shortlistedTitles);
  const [shortlistedHooksState, setShortlistedHooksState] = useState<string[]>(shortlistedHooks);
  const [savedScenesState, setSavedScenesState] = useState<string[]>(savedScenes);

  const derivedCurrentHook = shortlistedHooksState[0] ?? currentHook;

  const toggleSection = (section: SectionKey) => {
    setOpenSections((current) => ({
      ...current,
      [section]: !current[section],
    }));
  };

  return (
    <section className="space-y-12 lg:space-y-14">
      <SectionFrame
        title="1. Ideate"
        description="Capture the seed idea before you generate anything else."
        isOpen={openSections.ideate}
        onToggle={() => toggleSection("ideate")}
      >
        <AutoSaveTextarea
          projectId={projectId}
          field="concept"
          label="Concept (Your Seed Idea)"
          initialValue={concept}
          placeholder="Write out your raw idea. Vagueness is fine and we can refine it together."
          rows={4}
          variant="light"
          hideLabel
        />
      </SectionFrame>

      <SectionFrame
        title="2. Generate"
        description="Turn the idea into candidate titles, hooks, and scenes."
        isOpen={openSections.generate}
        onToggle={() => toggleSection("generate")}
      >
        <div className="divide-y divide-border/70">
          <div className="py-3 first:pt-0">
            <TitleIdeation
              projectId={projectId}
              concept={concept}
              proposedTitles={proposedTitles}
              shortlistedTitles={shortlistedTitlesState}
              isExpanded={activeGenerator === "title"}
              onActivate={() => setActiveGenerator("title")}
              onShortlistedTitlesChange={setShortlistedTitlesState}
            />
          </div>

          <div className="py-3">
            <HookGenerator
              projectId={projectId}
              concept={concept}
              projectTitle={projectTitle}
              shortlistedHooks={shortlistedHooksState}
              isExpanded={activeGenerator === "hook"}
              onActivate={() => setActiveGenerator("hook")}
              onShortlistedHooksChange={setShortlistedHooksState}
            />
          </div>

          <div className="py-3 last:pb-0">
            <ScenePlannerGenerator
              projectId={projectId}
              initialValue={savedScenesState.map((item) => `- [ ] ${item}`).join("\n")}
              isExpanded={activeGenerator === "scene"}
              onActivate={() => setActiveGenerator("scene")}
              onSavedScenesChange={setSavedScenesState}
            />
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        title="3. Consolidate"
        description="Pick the best pieces and see whether the generated direction holds together."
        isOpen={openSections.consolidate}
        onToggle={() => toggleSection("consolidate")}
      >
        <ConsolidatorPhase
          projectId={projectId}
          shortlistedTitles={shortlistedTitlesState}
          shortlistedHooks={shortlistedHooksState}
          savedScenes={savedScenesState}
          currentTitle={currentTitle}
          currentHook={derivedCurrentHook}
        />
      </SectionFrame>

      <SectionFrame
        title="4. Distribute"
        description="Review and download the clips that Submagic generated."
        isOpen={openSections.distribute}
        onToggle={() => toggleSection("distribute")}
      >
        <SubmagicMagicClipsPanel
          projectId={projectId}
          hasYoutubeVideoUrl={hasYoutubeVideoUrl}
          initialStatus={initialSubmagicStatus}
          initialData={initialSubmagicData}
        />
      </SectionFrame>
    </section>
  );
}
