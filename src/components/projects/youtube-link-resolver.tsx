"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type Props = {
  shouldResolve: boolean;
};

export function YoutubeLinkResolver({ shouldResolve }: Props) {
  const router = useRouter();
  const didRunRef = useRef(false);

  useEffect(() => {
    if (!shouldResolve || didRunRef.current) {
      return;
    }

    didRunRef.current = true;

    async function resolveLink() {
      try {
        const response = await fetch("/api/youtube/link/resolve", {
          method: "POST",
        });

        if (!response.ok) {
          const body = (await response.json().catch(() => null)) as { error?: string } | null;
          console.error("YouTube link resolve failed", body ?? { status: response.status });
        } else {
          const body = (await response.json().catch(() => null)) as { syncFailed?: boolean; syncResult?: unknown } | null;
          if (body?.syncFailed) {
            console.error("YouTube profile sync failed after link", body.syncResult);
          }
        }
      } finally {
        router.replace("/projects");
        router.refresh();
      }
    }

    void resolveLink();
  }, [router, shouldResolve]);

  return null;
}
