import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";
import { createProjectAction } from "./actions";
import { ProjectsPipelineBoard } from "@/components/projects/projects-pipeline-board";
import { YoutubeProfileSyncButton } from "@/components/projects/youtube-profile-sync-button";
import { CreatorAvatarImage, CreatorBannerImage } from "@/components/projects/creator-profile-media";
import { YoutubeChannelSelector } from "@/components/projects/youtube-channel-selector";
import { ConnectYoutubeChannelButton } from "@/components/projects/connect-youtube-channel-button";
import { YoutubeLinkResolver } from "@/components/projects/youtube-link-resolver";

function withCacheBust(url: string | null, linkedAt?: Date | null) {
  if (!url) {
    return null;
  }

  if (!linkedAt) {
    return url;
  }

  const separator = url.includes("?") ? "&" : "?";
  return `${url}${separator}v=${linkedAt.getTime()}`;
}

function toHighResYoutubeBanner(url: string | null) {
  if (!url) {
    return null;
  }

  if (!url.includes("yt3.googleusercontent.com") || url.includes("=")) {
    return url;
  }

  return `${url}=w2048`;
}

export default async function ProjectsPage({
  searchParams,
}: {
  searchParams: Promise<{ link?: string }>;
}) {
  const params = await searchParams;
  const shouldResolveLink = params.link === "1";

  const session = await getServerSession(authOptions);
  const userId = await getUserIdWithDevBypass(session?.user?.id);

  if (!userId) {
    redirect("/login");
  }

  const creator = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name: true,
      image: true,
      youtubeAvatarUrl: true,
      youtubeBannerUrl: true,
      youtubeChannelTitle: true,
      youtubeLinkedAt: true,
      youtubeChannels: {
        select: {
          channelId: true,
          title: true,
          isActive: true,
        },
        orderBy: [{ isActive: "desc" }, { updatedAt: "desc" }],
      },
    },
  });

  const projects = await prisma.videoProject.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }],
    select: {
      id: true,
      title: true,
      concept: true,
      notes: true,
      nextStep: true,
      stage: true,
      youtubeChannelId: true,
    },
  });

  const channelTitleMap = new Map(
    (creator?.youtubeChannels ?? []).map((c) => [c.channelId, c.title]),
  );

  const projectItems = projects.map((project) => ({
    id: project.id,
    title: project.title,
    concept: project.concept,
    notes: project.notes,
    nextStep: project.nextStep,
    stage: project.stage,
    youtubeChannelId: project.youtubeChannelId,
    youtubeChannelTitle: project.youtubeChannelId
      ? (channelTitleMap.get(project.youtubeChannelId) ?? null)
      : null,
  }));

  const creatorName = creator?.youtubeChannelTitle?.trim() || creator?.name?.trim() || session?.user?.name?.trim() || "Creator";
  const creatorAvatarPrimaryUrl = withCacheBust(
    creator?.youtubeAvatarUrl || null,
    creator?.youtubeLinkedAt,
  );
  const creatorAvatarFallbackUrl = withCacheBust(
    creator?.image || session?.user?.image || null,
    creator?.youtubeLinkedAt,
  );
  const creatorBannerPrimaryUrl = withCacheBust(
    toHighResYoutubeBanner(creator?.youtubeBannerUrl || null),
    creator?.youtubeLinkedAt,
  );
  const creatorBannerFallbackUrl = withCacheBust(
    creator?.youtubeBannerUrl || null,
    creator?.youtubeLinkedAt,
  );
  const hasYoutubeProfile = Boolean(creator?.youtubeAvatarUrl || creator?.youtubeBannerUrl);
  const creatorInitials = creatorName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("") || "CR";

  return (
    <section>
      <YoutubeLinkResolver shouldResolve={shouldResolveLink} />

      <div className="relative left-1/2 w-screen -translate-x-1/2 border-t border-border">
        <CreatorBannerImage
          creatorName={creatorName}
          bannerPrimaryUrl={creatorBannerPrimaryUrl}
          bannerFallbackUrl={creatorBannerFallbackUrl}
        />

        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center justify-between gap-5 px-6 pb-5 pt-4 lg:px-10">
          <div className="flex items-center gap-4">
            <CreatorAvatarImage
              creatorName={creatorName}
              creatorInitials={creatorInitials}
              avatarPrimaryUrl={creatorAvatarPrimaryUrl}
              avatarFallbackUrl={creatorAvatarFallbackUrl}
            />

            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">{creatorName}</h1>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <YoutubeChannelSelector channels={creator?.youtubeChannels ?? []} />
            <ConnectYoutubeChannelButton />
            <YoutubeProfileSyncButton hasYoutubeProfile={hasYoutubeProfile} />
          </div>
        </div>
      </div>

      <div className="mx-auto mt-8 w-full max-w-6xl">
        <ProjectsPipelineBoard
          initialProjects={projectItems}
          channels={creator?.youtubeChannels ?? []}
          createProjectAction={createProjectAction}
        />
      </div>
    </section>
  );
}
