"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type BannerProps = {
  creatorName: string;
  bannerPrimaryUrl: string | null;
  bannerFallbackUrl: string | null;
};

export function CreatorBannerImage({
  creatorName,
  bannerPrimaryUrl,
  bannerFallbackUrl,
}: BannerProps) {
  const bannerCandidates = useMemo(
    () => [bannerPrimaryUrl, bannerFallbackUrl].filter(Boolean) as string[],
    [bannerPrimaryUrl, bannerFallbackUrl],
  );

  const [bannerIndex, setBannerIndex] = useState(0);

  const bannerSrc = bannerCandidates[bannerIndex] ?? null;

  function handleBannerError() {
    setBannerIndex((current) => current + 1);
  }

  return (
    <div className="relative h-36 border-b border-border bg-surface-2 sm:h-44 lg:h-52">
      {bannerSrc ? (
        <Image
          key={bannerSrc}
          src={bannerSrc}
          alt={`${creatorName} banner`}
          onError={handleBannerError}
          fill
          sizes="100vw"
          className="object-cover"
        />
      ) : (
        <>
          <div className="absolute inset-0 bg-[linear-gradient(160deg,rgba(255,255,255,0.07),transparent_40%),linear-gradient(20deg,rgba(255,255,255,0.04),transparent_55%),repeating-linear-gradient(120deg,rgba(255,255,255,0.03)_0,rgba(255,255,255,0.03)_2px,transparent_2px,transparent_22px)]" />
          <div className="absolute inset-x-6 bottom-3 mx-auto w-full max-w-6xl px-6 text-[11px] font-medium tracking-wide text-muted-foreground/90 lg:px-10">
            YouTube banner will appear here after integration.
          </div>
        </>
      )}
    </div>
  );
}

type AvatarProps = {
  creatorName: string;
  creatorInitials: string;
  avatarPrimaryUrl: string | null;
  avatarFallbackUrl: string | null;
};

export function CreatorAvatarImage({
  creatorName,
  creatorInitials,
  avatarPrimaryUrl,
  avatarFallbackUrl,
}: AvatarProps) {
  const avatarCandidates = useMemo(
    () => [avatarPrimaryUrl, avatarFallbackUrl].filter(Boolean) as string[],
    [avatarPrimaryUrl, avatarFallbackUrl],
  );
  const [avatarIndex, setAvatarIndex] = useState(0);
  const avatarSrc = avatarCandidates[avatarIndex] ?? null;

  function handleAvatarError() {
    setAvatarIndex((current) => current + 1);
  }

  return (
    <div className="relative -mt-14 flex h-28 w-28 items-center justify-center overflow-hidden rounded-full border border-border bg-background text-sm font-semibold text-foreground shadow-lg shadow-black/15 sm:-mt-16 sm:h-32 sm:w-32">
      {avatarSrc ? (
        <Image
          key={avatarSrc}
          src={avatarSrc}
          alt={`${creatorName} avatar`}
          onError={handleAvatarError}
          fill
          sizes="128px"
          className="object-cover"
        />
      ) : (
        <span>{creatorInitials}</span>
      )}
    </div>
  );
}
