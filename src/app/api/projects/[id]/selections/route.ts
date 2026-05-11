import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserIdWithDevBypass } from "@/lib/dev-auth-bypass";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = await getUserIdWithDevBypass(session?.user?.id);

    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { field, value } = body;

    if (!field || value === undefined) {
      return Response.json(
        { error: "Field and value are required" },
        { status: 400 }
      );
    }

    // Validate field names
    const validFields = [
      "shortlistedTitles",
      "title",
      "shortlistedHooks",
      "selectedAngle",
      "notes",
      "concept",
      "nextStep",
      "targetPublishAt",
      "youtubeChannelId",
    ];

    if (!validFields.includes(field)) {
      return Response.json(
        { error: "Invalid field" },
        { status: 400 }
      );
    }

    // Verify project belongs to user
    const project = await prisma.videoProject.findFirst({
      where: { id, userId },
    });

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    // Update the field
    const updateData: Record<string, string | null | Date> = {};

    if (
      field === "shortlistedTitles" ||
      field === "shortlistedHooks"
    ) {
      if (!Array.isArray(value)) {
        return Response.json(
          { error: `${field} must be an array` },
          { status: 400 }
        );
      }

      const normalized = value
        .map((item) => {
          if (typeof item === "string") {
            return item.trim();
          }

          return item;
        })
        .filter((item) => {
          if (typeof item === "string") {
            return item.length > 0;
          }

          return item !== null && item !== undefined;
        });

      updateData[field] = JSON.stringify(normalized);
    } else if (field === "targetPublishAt") {
      if (value == null || value === "") {
        updateData[field] = null;
      } else {
        const parsed = new Date(String(value));
        if (Number.isNaN(parsed.getTime())) {
          return Response.json(
            { error: "targetPublishAt must be a valid date" },
            { status: 400 }
          );
        }
        updateData[field] = parsed;
      }
    } else if (field === "youtubeChannelId") {
      updateData[field] = value == null || value === "" ? null : String(value);
    } else {
      updateData[field] = value == null ? null : String(value);
    }

    const updated = await prisma.videoProject.update({
      where: { id },
      data: updateData,
    });

    return Response.json({ success: true, project: updated });
  } catch (error) {
    console.error("Selection save error:", error);
    return Response.json(
      { error: "Failed to save selection" },
      { status: 500 }
    );
  }
}
