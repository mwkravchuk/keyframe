"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
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
  youtubeChannelId: string | null;
  youtubeChannelTitle: string | null;
};

type ChannelInfo = {
  channelId: string;
  title: string | null;
  avatarUrl?: string | null;
  isActive?: boolean;
};

type Props = {
  initialProjects: ProjectItem[];
  channels: ChannelInfo[];
  createProjectAction: (formData: FormData) => Promise<void>;
};

type ChannelScope = "all" | "active";

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

async function createIdea(title: string, notes: string, youtubeChannelId?: string | null) {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ title, notes, youtubeChannelId: youtubeChannelId ?? null }),
  });

  if (!response.ok) {
    throw new Error("Failed to create idea");
  }

  const data = (await response.json()) as { project: ProjectItem };
  return data.project;
}

function IdeasSection({
  ideas,
  channels,
  onCreate,
}: {
  ideas: ProjectItem[];
  channels: ChannelInfo[];
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
      <form onSubmit={handleSubmit} className="mb-3">
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
              <ProjectCard key={idea.id} project={idea} kind="idea" channels={channels} />
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
  channels,
}: {
  stage: KanbanStage;
  projects: ProjectItem[];
  channels: ChannelInfo[];
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
              <ProjectCard key={project.id} project={project} kind="project" channels={channels} />
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
  channels,
}: {
  project: ProjectItem;
  kind: "idea" | "project";
  channels: ChannelInfo[];
}) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: project.id,
  });
  const channel = project.youtubeChannelId
    ? channels.find((c) => c.channelId === project.youtubeChannelId)
    : null;
  const channelAvatarUrl = channel?.avatarUrl ?? null;
  const channelInitial = (channel?.title?.trim()?.[0] ?? "Y").toUpperCase();

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
            <div className="flex items-center gap-1.5">
              {project.youtubeChannelId && (
                <span
                  className="inline-flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-[9px] font-semibold text-muted-foreground"
                  title={channel?.title ?? project.youtubeChannelTitle ?? "YouTube channel"}
                >
                  {channelAvatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={channelAvatarUrl}
                      alt={channel?.title ?? "YouTube channel avatar"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span>{channelInitial}</span>
                  )}
                </span>
              )}

              <span className="rounded-sm border border-border p-1 text-muted-foreground opacity-20 transition group-hover:opacity-100">
                <GripVertical size={14} />
              </span>
            </div>
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

export function ProjectsPipelineBoard({ initialProjects, channels, createProjectAction }: Props) {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const createProjectDetailsRef = useRef<HTMLDetailsElement>(null);
  const channelDetailsRef = useRef<HTMLDetailsElement>(null);
  const [channelScope, setChannelScope] = useState<ChannelScope>("all");
  const [channelActionError, setChannelActionError] = useState<string | null>(null);
  const [isSwitchingChannel, setIsSwitchingChannel] = useState(false);
  const [isConnectingChannel, setIsConnectingChannel] = useState(false);
  const activeChannelId = useMemo(
    () => channels.find((c) => c.isActive)?.channelId ?? channels[0]?.channelId ?? null,
    [channels],
  );
  const activeChannelTitle = useMemo(() => {
    if (!activeChannelId) {
      return null;
    }

    return channels.find((c) => c.channelId === activeChannelId)?.title ?? activeChannelId;
  }, [activeChannelId, channels]);

  useEffect(() => {
    setProjects(initialProjects);
  }, [initialProjects]);

  useEffect(() => {
    if (channelScope === "active" && !activeChannelId) {
      setChannelScope("all");
    }
  }, [channelScope, activeChannelId]);
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

  const visibleProjects = useMemo(() => {
    if (channelScope !== "active" || !activeChannelId) {
      return projects;
    }

    return projects.filter((project) => project.youtubeChannelId === activeChannelId);
  }, [projects, channelScope, activeChannelId]);

  const ideas = useMemo(
    () => visibleProjects.filter((project) => project.stage === IDEA_STAGE),
    [visibleProjects],
  );

  const projectsByStage = useMemo(() => {
    return KANBAN_STAGES.reduce<Record<KanbanStage, ProjectItem[]>>((acc, stage) => {
      acc[stage] = visibleProjects.filter((project) => project.stage === stage);
      return acc;
    }, {} as Record<KanbanStage, ProjectItem[]>);
  }, [visibleProjects]);

  const activeProject = useMemo(
    () => visibleProjects.find((project) => project.id === activeProjectId) ?? null,
    [visibleProjects, activeProjectId],
  );

  function handleDragStart(event: DragStartEvent) {
    setActiveProjectId(String(event.active.id));
  }

  async function handleCreateIdea(title: string, notes: string) {
    const project = await createIdea(title, notes, activeChannelId);
    const channelTitleMap = new Map(channels.map((c) => [c.channelId, c.title]));
    const enriched = {
      ...project,
      youtubeChannelTitle: project.youtubeChannelId
        ? (channelTitleMap.get(project.youtubeChannelId) ?? null)
        : null,
    };
    setProjects((current) => [enriched, ...current]);
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

    const project = visibleProjects.find((item) => item.id === projectId);
    if (!project) {
      return;
    }

    const targetStage = [IDEA_STAGE, ...KANBAN_STAGES].includes(targetId as VideoProjectStage)
      ? (targetId as VideoProjectStage)
      : visibleProjects.find((item) => item.id === targetId)?.stage;

    if (!targetStage || targetStage === project.stage) {
      return;
    }

    await handleMove(project.id, targetStage);
  }

  function handleDragCancel() {
    setActiveProjectId(null);
  }

  async function handleChooseChannel(channelId: string) {
    if (!channelId || isSwitchingChannel) {
      return;
    }

    setChannelActionError(null);
    setIsSwitchingChannel(true);

    try {
      const response = await fetch("/api/youtube/channels/active", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ channelId }),
      });

      const data = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(data.error || "Failed to switch channel.");
      }

      setChannelScope("active");
      channelDetailsRef.current?.removeAttribute("open");
      router.refresh();
    } catch (error) {
      setChannelActionError(error instanceof Error ? error.message : "Failed to switch channel.");
    } finally {
      setIsSwitchingChannel(false);
    }
  }

  async function handleConnectChannel() {
    if (isConnectingChannel) {
      return;
    }

    setChannelActionError(null);
    setIsConnectingChannel(true);

    try {
      const response = await fetch("/api/youtube/link-context", {
        method: "POST",
      });

      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "Failed to prepare channel linking.");
      }

      await signIn(
        "google",
        { callbackUrl: "/projects?link=1" },
        {
          prompt: "select_account consent",
          scope: "openid email profile https://www.googleapis.com/auth/youtube.readonly",
          access_type: "offline",
          include_granted_scopes: "false",
        },
      );
    } catch (error) {
      setChannelActionError(error instanceof Error ? error.message : "Failed to connect channel.");
      setIsConnectingChannel(false);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="flex items-center justify-between gap-4 pb-4">
        <span className="text-sm font-semibold tracking-tight text-foreground">Projects</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setChannelScope("all")}
            className={`h-9 rounded-sm border px-3 text-sm font-medium transition ${
              channelScope === "all"
                ? "border-foreground/35 text-foreground"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            All channels
          </button>

          <details ref={channelDetailsRef} className="relative">
            <summary
              className={`flex h-9 w-56 list-none cursor-pointer items-center justify-between rounded-sm border px-3 text-sm transition ${
                channelScope === "active"
                  ? "border-foreground/35 text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <span className="truncate">
                {channelScope === "active" && activeChannelTitle
                  ? activeChannelTitle
                  : "Choose channel"}
              </span>
              <span className="ml-2 text-xs">▾</span>
            </summary>

            <div className="absolute right-0 z-20 mt-2 w-72 rounded-sm border border-border bg-card p-2 shadow-2xl shadow-black/20">
              <div className="max-h-64 space-y-1 overflow-auto pr-1">
                {channels.length === 0 ? (
                  <p className="rounded-sm px-2 py-2 text-xs text-muted-foreground">
                    No linked channels yet.
                  </p>
                ) : (
                  channels.map((channel) => {
                    const isActive = channel.channelId === activeChannelId;

                    return (
                      <button
                        key={channel.channelId}
                        type="button"
                        disabled={isSwitchingChannel}
                        onClick={() => {
                          void handleChooseChannel(channel.channelId);
                        }}
                        className={`flex w-full items-center justify-between rounded-sm border px-2 py-2 text-left text-xs transition disabled:cursor-not-allowed disabled:opacity-60 ${
                          isActive
                            ? "border-foreground/35 text-foreground"
                            : "border-border text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        <span className="truncate">{channel.title?.trim() || channel.channelId}</span>
                        {isActive ? <span className="ml-2 shrink-0 text-[10px]">Active</span> : null}
                      </button>
                    );
                  })
                )}
              </div>

              <div className="mt-2 border-t border-border pt-2">
                <button
                  type="button"
                  disabled={isConnectingChannel}
                  onClick={() => {
                    void handleConnectChannel();
                  }}
                  className="w-full rounded-sm border border-border px-2 py-2 text-left text-xs text-muted-foreground transition hover:text-foreground disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isConnectingChannel ? "Opening Google..." : "Connect new channel"}
                </button>
              </div>

              {channelActionError ? (
                <p className="mt-2 px-1 text-[11px] text-rose-400">{channelActionError}</p>
              ) : null}
            </div>
          </details>
        </div>
      </div>

      <IdeasSection ideas={ideas} channels={channels} onCreate={handleCreateIdea} />

      <div className="flex items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="rounded-sm border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Use video generator
          </Link>
          <details ref={createProjectDetailsRef} className="group relative">
            <summary className="list-none cursor-pointer rounded-sm bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90">
              New project
            </summary>
            <div className="absolute right-0 z-20 mt-3 w-90 rounded-sm border border-border bg-card p-4 shadow-2xl shadow-black/20">
              <form
                action={createProjectAction}
                onSubmit={() => {
                  createProjectDetailsRef.current?.removeAttribute("open");
                }}
                className="space-y-3"
              >
                <input type="hidden" name="stage" value="DRAFTING" />
                {activeChannelId && (
                  <input type="hidden" name="youtubeChannelId" value={activeChannelId} />
                )}
                <div>
                  <label htmlFor="proj-title" className="text-xs text-muted-foreground">
                    Title
                  </label>
                  <input
                    id="proj-title"
                    name="title"
                    required
                    className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="proj-concept" className="text-xs text-muted-foreground">
                    Concept
                  </label>
                  <textarea
                    id="proj-concept"
                    name="concept"
                    rows={3}
                    className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="proj-nextStep" className="text-xs text-muted-foreground">
                    Next step
                  </label>
                  <input
                    id="proj-nextStep"
                    name="nextStep"
                    className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="proj-targetPublishAt" className="text-xs text-muted-foreground">
                    Target publish date
                  </label>
                  <input
                    id="proj-targetPublishAt"
                    name="targetPublishAt"
                    type="date"
                    className="mt-1 w-full rounded-sm border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-sm border border-border px-3 py-2 text-sm text-foreground transition hover:bg-muted"
                >
                  Create project
                </button>
              </form>
            </div>
          </details>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {KANBAN_STAGES.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            projects={projectsByStage[stage]}
            channels={channels}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProject ? <ProjectCardOverlay project={activeProject} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
