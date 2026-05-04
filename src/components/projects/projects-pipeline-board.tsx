"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
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
  VIDEO_PROJECT_STAGES,
  type VideoProjectStage,
} from "@/lib/video-projects";

type ProjectItem = {
  id: string;
  title: string;
  concept: string | null;
  nextStep: string | null;
  stage: VideoProjectStage;
};

type Props = {
  initialProjects: ProjectItem[];
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

function StageColumn({
  stage,
  projects,
}: {
  stage: VideoProjectStage;
  projects: ProjectItem[];
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });

  return (
    <section
      ref={setNodeRef}
      className={`border-t pt-3 ${isOver ? "border-accent" : "border-border"}`}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-medium tracking-wide text-foreground">
          {VIDEO_PROJECT_STAGE_LABELS[stage]}
        </h2>
        <span className="text-xs text-muted-foreground">{projects.length}</span>
      </div>

      <SortableContext items={projects.map((project) => project.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-3 space-y-3">
          {projects.length === 0 ? (
            <p className="text-xs text-muted-foreground">No projects in this stage.</p>
          ) : (
            projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          )}
        </div>
      </SortableContext>
    </section>
  );
}

function ProjectCard({
  project,
}: {
  project: ProjectItem;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });

  return (
    <article
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={`cursor-grab border bg-card px-3 py-3 active:cursor-grabbing ${
        isDragging ? "border-accent opacity-35" : "border-border"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <Link
          href={`/projects/${project.id}`}
          className="text-sm font-medium text-foreground transition hover:text-accent"
        >
          {project.title}
        </Link>
        <button
          type="button"
          aria-label={`Drag ${project.title}`}
          className="rounded-md border border-border p-1 text-muted-foreground"
          tabIndex={-1}
        >
          <GripVertical size={14} />
        </button>
      </div>

      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {project.nextStep || project.concept || "No context added yet."}
      </p>
    </article>
  );
}

function ProjectCardOverlay({ project }: { project: ProjectItem }) {
  return (
    <article className="cursor-grabbing border border-accent bg-card px-3 py-3 shadow-xl shadow-black/15">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-foreground">{project.title}</p>
        <span className="rounded-md border border-border p-1 text-muted-foreground">
          <GripVertical size={14} />
        </span>
      </div>

      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {project.nextStep || project.concept || "No context added yet."}
      </p>
    </article>
  );
}

export function ProjectsPipelineBoard({ initialProjects }: Props) {
  const [projects, setProjects] = useState(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const projectsByStage = useMemo(() => {
    return VIDEO_PROJECT_STAGES.reduce<Record<VideoProjectStage, ProjectItem[]>>((acc, stage) => {
      acc[stage] = projects.filter((project) => project.stage === stage);
      return acc;
    }, {} as Record<VideoProjectStage, ProjectItem[]>);
  }, [projects]);

  const activeProject = useMemo(
    () => projects.find((project) => project.id === activeProjectId) ?? null,
    [projects, activeProjectId],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveProjectId(String(event.active.id));
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

    const targetStage = VIDEO_PROJECT_STAGES.includes(targetId as VideoProjectStage)
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
      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        {VIDEO_PROJECT_STAGES.map((stage) => (
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
