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
    <section className="space-y-12 lg:space-y-14">
      <div className="space-y-6">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">2. Generate</h2>

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
      </div>

      <div className="space-y-6 pt-6">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">3. Consolidate</h2>

        <ConsolidatorPhase
          projectId={projectId}
          shortlistedTitles={shortlistedTitlesState}
          shortlistedHooks={shortlistedHooksState}
          savedScenes={savedScenesState}
          currentTitle={currentTitle}
          currentHook={derivedCurrentHook}
        />
      </div>
    </section>
  );
}
