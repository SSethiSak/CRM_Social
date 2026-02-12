import { Facebook, Instagram, Linkedin, Send } from "lucide-react";
import type { Platform } from "@/types/social";

// TikTok icon component (lucide doesn't have TikTok)
function TikTokIcon({
  size = 20,
  className = "",
  style,
}: {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      style={style}
    >
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
    </svg>
  );
}

interface PlatformIconProps {
  platform: Platform;
  className?: string;
  size?: number;
}

export const platformColors: Record<Platform, string> = {
  facebook: "#1877F2",
  instagram: "#E4405F",
  linkedin: "#0A66C2",
  tiktok: "#000000",
  telegram: "#26A5E4",
};

export const platformGlowColors: Record<Platform, string> = {
  facebook: "shadow-[0_0_15px_rgba(24,119,242,0.5)]",
  instagram: "shadow-[0_0_15px_rgba(228,64,95,0.5)]",
  linkedin: "shadow-[0_0_15px_rgba(10,102,194,0.5)]",
  tiktok: "shadow-[0_0_15px_rgba(255,0,80,0.5)]",
  telegram: "shadow-[0_0_15px_rgba(38,165,228,0.5)]",
};

export const platformBorderColors: Record<Platform, string> = {
  facebook: "border-[#1877F2]",
  instagram: "border-[#E4405F]",
  linkedin: "border-[#0A66C2]",
  tiktok: "border-[#FF0050]",
  telegram: "border-[#26A5E4]",
};

export function PlatformIcon({
  platform,
  className = "",
  size = 20,
}: PlatformIconProps) {
  const iconProps = {
    size,
    className,
    style: { color: platformColors[platform] },
  };

  switch (platform) {
    case "facebook":
      return <Facebook {...iconProps} />;
    case "instagram":
      return <Instagram {...iconProps} />;
    case "linkedin":
      return <Linkedin {...iconProps} />;
    case "tiktok":
      return <TikTokIcon {...iconProps} />;
    case "telegram":
      return <Send {...iconProps} />;
    default:
      return null;
  }
}

export function getPlatformName(platform: Platform): string {
  const names: Record<Platform, string> = {
    facebook: "Facebook",
    instagram: "Instagram",
    linkedin: "LinkedIn",
    tiktok: "TikTok",
    telegram: "Telegram",
  };
  return names[platform];
}
