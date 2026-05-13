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
import {
  VIDEO_PROJECT_STAGE_LABELS,
  type VideoProjectStage,
} from "@/lib/video-projects";
import { ActionPanel } from "@/components/ui/action-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { SectionHeader } from "@/components/ui/section-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { IdeaCard, VideoCard } from "@/components/projects/project-cards";

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

const STAGE_STYLES: Record<KanbanStage, { lane: string; hover: string; tone: "info" | "warning" | "accent" | "success" }> = {
  DRAFTING: {
    lane: "bg-card/85",
    hover: "data-[over=true]:border-sky-500/45",
    tone: "info",
  },
  RECORDING: {
    lane: "bg-card/85",
    hover: "data-[over=true]:border-amber-500/45",
    tone: "warning",
  },
  EDITING: {
    lane: "bg-card/85",
    hover: "data-[over=true]:border-violet-500/45",
    tone: "accent",
  },
  PUBLISHED: {
    lane: "bg-card/85",
    hover: "data-[over=true]:border-emerald-500/45",
    tone: "success",
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
      <ActionPanel className="mb-3 border-dashed bg-card/70">
        <form onSubmit={handleSubmit}>
          <textarea
            value={line}
            onChange={(event) => setLine(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Type an idea title or fleeting thought. Press Enter to save."
            className="ideas-input w-full resize-none rounded-md border border-border bg-background/70 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
        </form>
      </ActionPanel>

      <SortableContext items={ideas.map((idea) => idea.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {ideas.length === 0 ? (
            <EmptyState
              compact
              title="No ideas yet"
              description="Drop in quick thoughts here to seed your next projects."
            />
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
      className={`min-w-0 rounded-lg border p-2.5 shadow-soft transition ${style.lane} ${style.hover}`}
    >
      <div className="flex items-center justify-between">
        <StatusBadge tone={style.tone}>{VIDEO_PROJECT_STAGE_LABELS[stage]}</StatusBadge>
        <span className="text-[11px] font-medium text-muted-foreground">{projects.length}</span>
      </div>

      <SortableContext items={projects.map((project) => project.id)} strategy={verticalListSortingStrategy}>
        <div className="mt-2.5 space-y-2.5">
          {projects.length === 0 ? (
            <EmptyState
              compact
              title="Empty stage"
              description="Drag a card here when work reaches this step."
            />
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
  const summary = project.notes || project.nextStep || project.concept || "No context added yet.";
  const channelBadge = project.youtubeChannelId ? (
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
  ) : null;

  return (
    <div
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
      className="cursor-grab active:cursor-grabbing"
    >
      {kind === "idea" ? (
        <IdeaCard title={project.title} dragging={isDragging} />
      ) : (
        <VideoCard title={project.title} summary={summary} dragging={isDragging} channel={channelBadge} />
      )}
    </div>
  );
}

function ProjectCardOverlay({ project }: { project: ProjectItem }) {
  const summary = project.notes || project.nextStep || project.concept || "No context added yet.";

  return (
    <div className="w-56 cursor-grabbing">
      <VideoCard title={project.title} summary={summary} className="border-accent shadow-panel" />
    </div>
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
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProjects(initialProjects);
  }, [initialProjects]);

  const effectiveChannelScope: ChannelScope =
    channelScope === "active" && !activeChannelId ? "all" : channelScope;

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
    if (effectiveChannelScope !== "active" || !activeChannelId) {
      return projects;
    }

    return projects.filter((project) => project.youtubeChannelId === activeChannelId);
  }, [projects, effectiveChannelScope, activeChannelId]);

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
      <SectionHeader
        eyebrow="Production board"
        title="Dashboard"
        description="Capture ideas fast, then move projects through production with clear stage ownership."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setChannelScope("all")}
              className={`h-9 rounded-md border px-3 text-sm font-medium transition cursor-pointer active:scale-[0.99] ${
                effectiveChannelScope === "all"
                  ? "border-foreground/35 bg-card text-foreground"
                  : "border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              All channels
            </button>

            <details ref={channelDetailsRef} className="relative">
              <summary
                className={`flex h-9 w-56 list-none cursor-pointer items-center justify-between rounded-md border px-3 text-sm transition active:scale-[0.99] ${
                  effectiveChannelScope === "active"
                    ? "border-foreground/35 bg-card text-foreground"
                    : "border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                <span className="truncate">
                  {effectiveChannelScope === "active" && activeChannelTitle
                    ? activeChannelTitle
                    : "Choose channel"}
                </span>
                <span className="ml-2 text-xs">▾</span>
              </summary>

              <ActionPanel className="absolute right-0 z-20 mt-2 w-72 p-2 shadow-panel">
                <div className="max-h-64 space-y-1 overflow-auto pr-1">
                  {channels.length === 0 ? (
                    <p className="rounded-md px-2 py-2 text-xs text-muted-foreground">
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
                          className={`flex w-full items-center justify-between rounded-md border px-2 py-2 text-left text-xs transition cursor-pointer active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 ${
                            isActive
                              ? "border-foreground/35 bg-card text-foreground"
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
                    className="w-full rounded-md border border-border px-2 py-2 text-left text-xs text-muted-foreground transition hover:text-foreground cursor-pointer active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isConnectingChannel ? "Opening Google..." : "Connect new channel"}
                  </button>
                </div>

                {channelActionError ? (
                  <p className="mt-2 px-1 text-[11px] text-destructive">{channelActionError}</p>
                ) : null}
              </ActionPanel>
            </details>
          </div>
        }
      />

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
        <IdeasSection ideas={ideas} channels={channels} onCreate={handleCreateIdea} />

        <div className="flex flex-wrap items-center gap-3 xl:justify-end">
          <Link
            href="/"
            className="rounded-md border border-border px-3 py-2 text-sm text-muted-foreground transition hover:text-foreground"
          >
            Use video generator
          </Link>
          <details ref={createProjectDetailsRef} className="group relative">
            <summary className="list-none cursor-pointer rounded-md bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground transition hover:opacity-90 active:scale-[0.99]">
              New project
            </summary>
            <ActionPanel className="absolute right-0 z-20 mt-3 w-88 p-4 shadow-panel">
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
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="proj-nextStep" className="text-xs text-muted-foreground">
                    Next step
                  </label>
                  <input
                    id="proj-nextStep"
                    name="nextStep"
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
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
                    className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full rounded-md border border-border px-3 py-2 text-sm text-foreground transition hover:bg-muted cursor-pointer active:scale-[0.99]"
                >
                  Create project
                </button>
              </form>
            </ActionPanel>
          </details>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
