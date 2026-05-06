"use client";

import { useMemo, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import {
  VIDEO_PROJECT_STAGE_LABELS,
  type VideoProjectStage,
} from "@/lib/video-projects";

type ProjectItem = {
  id: string;
  title: string;
  concept: string | null;
  notes: string | null;
  nextStep: string | null;
  stage: VideoProjectStage;
};

type Props = {
  initialProjects: ProjectItem[];
};

const IDEA_STAGE: VideoProjectStage = "IDEA";
const KANBAN_STAGES = ["DRAFTING", "RECORDING", "EDITING", "PUBLISHED"] as const;

type KanbanStage = (typeof KANBAN_STAGES)[number];

const STAGE_STYLES: Record<
  KanbanStage,
  { lane: string; badge: string; count: string; hover: string }
> = {
  DRAFTING: {
    lane: "border-sky-500/25 bg-sky-500/6",
    badge: "border-sky-400/35 bg-sky-400/14 text-sky-300",
    count: "text-sky-300",
    hover: "data-[over=true]:border-sky-300/40",
  },
  RECORDING: {
    lane: "border-blue-500/25 bg-blue-500/6",
    badge: "border-blue-400/35 bg-blue-400/14 text-blue-300",
    count: "text-blue-300",
    hover: "data-[over=true]:border-blue-300/40",
  },
  EDITING: {
    lane: "border-violet-500/25 bg-violet-500/6",
    badge: "border-violet-400/35 bg-violet-400/14 text-violet-300",
    count: "text-violet-300",
    hover: "data-[over=true]:border-violet-300/40",
  },
  PUBLISHED: {
    lane: "border-emerald-500/25 bg-emerald-500/6",
    badge: "border-emerald-400/35 bg-emerald-400/14 text-emerald-300",
    count: "text-emerald-300",
    hover: "data-[over=true]:border-emerald-300/40",
  },
};

async function updateProjectStage(projectId: string, stage: VideoProjectStage) {
  const response = await fetch(`/api/projects/${projectId}/stage`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ stage }),
  });

  if (!response.ok) {
    throw new Error("Failed to update stage");
  }
}

async function createIdea(title: string, notes: string) {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, notes }),
  });

  if (!response.ok) {
    throw new Error("Failed to create idea");
  }

  const data = (await response.json()) as { project: ProjectItem };
  return data.project;
}

function IdeasSection({
  ideas,
  onCreate,
}: {
  ideas: ProjectItem[];
  onCreate: (title: string, notes: string) => Promise<void>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: IDEA_STAGE });
  const [line, setLine] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function submitIdea(event?: FormEvent<HTMLFormElement>) {
    event?.preventDefault();
    const nextLine = line.trim();

    if (!nextLine || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      await onCreate(nextLine, "");
      setLine("");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    await submitIdea(event);
  }

  async function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Enter" || event.shiftKey) {
      return;
    }

    event.preventDefault();
    await submitIdea();
  }

  return (
    <section
      ref={setNodeRef}
      data-over={isOver}
      className="py-3 data-[over=true]:[&_.ideas-input]:border-accent"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold tracking-wide text-foreground">Ideas</h3>
        <span className="text-xs text-muted-foreground">{ideas.length}</span>
      </div>

      <form onSubmit={handleSubmit} className="mb-3 border-b border-border pb-3">
        <textarea
          value={line}
          onChange={(event) => setLine(event.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder="Type an idea title or fleeting thought... Press Enter to save."
          className="ideas-input w-full resize-none rounded-sm border border-border bg-transparent px-2.5 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
        />
      </form>

      <SortableContext items={ideas.map((idea) => idea.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-1.5">
          {ideas.length === 0 ? (
            <p className="px-1 py-2 text-[11px] text-muted-foreground">
              No ideas yet. Add one line and keep moving.
            </p>
          ) : (
            ideas.map((idea) => (
              <ProjectCard key={idea.id} project={idea} kind="idea" />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function StageColumn({
  stage,
  projects,
}: {
  stage: KanbanStage;
  projects: ProjectItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const style = STAGE_STYLES[stage];

  return (
    <section
      ref={setNodeRef}
      data-over={isOver}
      className={`min-w-0 rounded-md border p-2.5 transition ${style.lane} ${style.hover}`}
    >
      <div className="flex items-center justify-between">
        <span className={`inline-flex items-center rounded-sm border px-1.5 py-0.5 text-[10px] font-semibold tracking-wide ${style.badge}`}>
          {VIDEO_PROJECT_STAGE_LABELS[stage]}
        </span>
        <span className={`text-[11px] font-medium ${style.count}`}>{projects.length}</span>
      </div>

      <SortableContext items={projects.map((project) => project.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-2.5 space-y-2.5">
          {projects.length === 0 ? (
            <p className="rounded-sm border border-dashed border-border px-2 py-3 text-center text-[11px] text-muted-foreground">
              No projects in this stage.
            </p>
          ) : (
            projects.map((project) => (
              <ProjectCard key={project.id} project={project} kind="project" />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function ProjectCard({
  project,
  kind,
}: {
  project: ProjectItem;
  kind: "idea" | "project";
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });

  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={() => {
        if (!isDragging && kind === "project") {
          router.push(`/projects/${project.id}`);
        }
      }}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`group cursor-grab rounded-sm border bg-card px-2.5 py-2.5 active:cursor-grabbing ${
        isDragging ? "border-accent opacity-35" : "border-border"
      }`}
    >
      {kind === "idea" ? (
        <div className="flex items-center justify-between gap-2 border-l-2 border-border/80 pl-2">
          <p className="line-clamp-2 text-[13px] leading-snug text-foreground/95">{project.title}</p>
          <span className="rounded-sm border border-border p-1 text-muted-foreground opacity-20 transition group-hover:opacity-100">
            <GripVertical size={14} />
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-2">
            <p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground transition hover:text-accent">
              {project.title}
            </p>
            <span className="rounded-sm border border-border p-1 text-muted-foreground opacity-20 transition group-hover:opacity-100">
              <GripVertical size={14} />
            </span>
          </div>

          <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
            {project.notes || project.nextStep || project.concept || "No context added yet."}
          </p>
        </>
      )}
    </article>
  );
}

function ProjectCardOverlay({ project }: { project: ProjectItem }) {
  return (
    <article className="w-56 cursor-grabbing rounded-sm border border-accent bg-card px-2.5 py-2.5 shadow-xl shadow-black/20">
      <div className="flex items-start justify-between gap-2">
        <p className="line-clamp-2 text-[13px] font-medium leading-snug text-foreground">{project.title}</p>
        <span className="rounded-sm border border-border p-1 text-muted-foreground">
          <GripVertical size={14} />
        </span>
      </div>

      <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">
        {project.notes || project.nextStep || project.concept || "No context added yet."}
      </p>
    </article>
  );
}

export function ProjectsPipelineBoard({ initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const ideas = useMemo(
    () => projects.filter((project) => project.stage === IDEA_STAGE),
    [projects],
  );

  const projectsByStage = useMemo(() => {
    return KANBAN_STAGES.reduce<Record<KanbanStage, ProjectItem[]>>((acc, stage) => {
      acc[stage] = projects.filter((project) => project.stage === stage);
      return acc;
    }, {} as Record<KanbanStage, ProjectItem[]>);
  }, [projects]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveProjectId(String(event.active.id));
  }

  async function handleCreateIdea(title: string, notes: string) {
    const project = await createIdea(title, notes);
    setProjects((current) => [project, ...current]);
  }

  async function handleMove(projectId: string, stage: VideoProjectStage) {
    const previousProjects = projects;

    setProjects((current) =>
      current.map((project) =>
        project.id === projectId
          ? {
              ...project,
              stage,
            }
          : project,
      ),
    );

    try {
      await updateProjectStage(projectId, stage);
    } catch {
      setProjects(previousProjects);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveProjectId(null);

    const { active, over } = event;

    if (!over) {
      return;
    }

    const projectId = String(active.id);
    const targetId = String(over.id);

    const project = projects.find((item) => item.id === projectId);
    if (!project) {
      return;
    }

    const targetStage = [IDEA_STAGE, ...KANBAN_STAGES].includes(targetId as VideoProjectStage)
      ? (targetId as VideoProjectStage)
      : projects.find((item) => item.id === targetId)?.stage;

    if (!targetStage || targetStage === project.stage) {
      return;
    }

    await handleMove(project.id, targetStage);
  }

  function handleDragCancel() {
    setActiveProjectId(null);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <IdeasSection ideas={ideas} onCreate={handleCreateIdea} />

      <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {KANBAN_STAGES.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            projects={projectsByStage[stage]}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProject ? <ProjectCardOverlay project={activeProject} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
