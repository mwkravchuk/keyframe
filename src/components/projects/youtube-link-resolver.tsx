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
        await fetch("/api/youtube/link/resolve", {
          method: "POST",
        });
      } finally {
        router.replace("/projects");
        router.refresh();
      }
    }

    void resolveLink();
  }, [router, shouldResolve]);

  return null;
}
