"use client";

import { useState } from "react";
import { TitleIdeation } from "@/components/projects/title-ideation";
import { HookGenerator } from "@/components/projects/hook-generator";
import { ScenePlannerGenerator } from "@/components/projects/scene-planner-generator";
import { ConsolidatorPhase } from "@/components/projects/consolidator-phase";

type GeneratorKey = "title" | "hook" | "scene";

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
}: ProjectGeneratorStackProps) {
  const [activeGenerator, setActiveGenerator] = useState<GeneratorKey | null>(null);
  const [shortlistedTitlesState, setShortlistedTitlesState] = useState<string[]>(shortlistedTitles);
  const [shortlistedHooksState, setShortlistedHooksState] = useState<string[]>(shortlistedHooks);
  const [savedScenesState, setSavedScenesState] = useState<string[]>(savedScenes);

  const derivedCurrentHook = shortlistedHooksState[0] ?? currentHook;

  return (
    <>
      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Generate</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Build packaging options.</h2>
        </div>

        <div className="space-y-5">
          <TitleIdeation
            projectId={projectId}
            concept={concept}
            proposedTitles={proposedTitles}
            shortlistedTitles={shortlistedTitlesState}
            isExpanded={activeGenerator === "title"}
            onActivate={() => setActiveGenerator("title")}
            onShortlistedTitlesChange={setShortlistedTitlesState}
          />

          <HookGenerator
            projectId={projectId}
            concept={concept}
            projectTitle={projectTitle}
            shortlistedHooks={shortlistedHooksState}
            isExpanded={activeGenerator === "hook"}
            onActivate={() => setActiveGenerator("hook")}
            onShortlistedHooksChange={setShortlistedHooksState}
          />

          <ScenePlannerGenerator
            projectId={projectId}
            initialValue={savedScenesState.map((item) => `- [ ] ${item}`).join("\n")}
            isExpanded={activeGenerator === "scene"}
            onActivate={() => setActiveGenerator("scene")}
            onSavedScenesChange={setSavedScenesState}
          />
        </div>
      </section>

      <section className="space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Consolidate</p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">Pick what you are shipping.</h2>
        </div>

        <ConsolidatorPhase
          projectId={projectId}
          shortlistedTitles={shortlistedTitlesState}
          shortlistedHooks={shortlistedHooksState}
          savedScenes={savedScenesState}
          currentTitle={currentTitle}
          currentHook={derivedCurrentHook}
        />
      </section>
    </>
  );
}
