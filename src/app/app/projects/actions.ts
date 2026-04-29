"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { VideoProjectStage } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function getCurrentUserId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error("Unauthorized");
  }

  return userId;
}

function parseStage(value: FormDataEntryValue | null): VideoProjectStage {
  if (typeof value !== "string") {
    return VideoProjectStage.IDEA;
  }

  if (Object.values(VideoProjectStage).includes(value as VideoProjectStage)) {
    return value as VideoProjectStage;
  }

  return VideoProjectStage.IDEA;
}

export async function createProjectAction(formData: FormData) {
  const userId = await getCurrentUserId();

  const title = String(formData.get("title") ?? "").trim();
  const concept = String(formData.get("concept") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const nextStep = String(formData.get("nextStep") ?? "").trim();
  const targetPublishAtRaw = String(formData.get("targetPublishAt") ?? "").trim();

  if (!title) {
    return;
  }

  await prisma.videoProject.create({
    data: {
      userId,
      title,
      concept: concept || null,
      notes: notes || null,
      nextStep: nextStep || null,
      targetPublishAt: targetPublishAtRaw ? new Date(targetPublishAtRaw) : null,
    },
  });

  revalidatePath("/app/projects");
}

export async function moveProjectStageAction(formData: FormData) {
  const userId = await getCurrentUserId();

  const projectId = String(formData.get("projectId") ?? "");
  const stage = parseStage(formData.get("stage"));

  if (!projectId) {
    return;
  }

  await prisma.videoProject.updateMany({
    where: {
      id: projectId,
      userId,
    },
    data: {
      stage,
    },
  });

  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${projectId}`);
}

export async function updateProjectAction(formData: FormData) {
  const userId = await getCurrentUserId();

  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const concept = String(formData.get("concept") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();
  const nextStep = String(formData.get("nextStep") ?? "").trim();
  const stage = parseStage(formData.get("stage"));
  const targetPublishAtRaw = String(formData.get("targetPublishAt") ?? "").trim();

  if (!id || !title) {
    return;
  }

  await prisma.videoProject.updateMany({
    where: {
      id,
      userId,
    },
    data: {
      title,
      concept: concept || null,
      notes: notes || null,
      nextStep: nextStep || null,
      stage,
      targetPublishAt: targetPublishAtRaw ? new Date(targetPublishAtRaw) : null,
    },
  });

  revalidatePath("/app/projects");
  revalidatePath(`/app/projects/${id}`);
}
