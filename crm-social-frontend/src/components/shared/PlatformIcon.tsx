import { Facebook, Instagram, Linkedin } from 'lucide-react';
import type { Platform } from '@/types/social';

interface PlatformIconProps {
  platform: Platform;
  className?: string;
  size?: number;
}

export const platformColors: Record<Platform, string> = {
  facebook: '#1877F2',
  instagram: '#E4405F',
  linkedin: '#0A66C2',
};

export const platformGlowColors: Record<Platform, string> = {
  facebook: 'shadow-[0_0_15px_rgba(24,119,242,0.5)]',
  instagram: 'shadow-[0_0_15px_rgba(228,64,95,0.5)]',
  linkedin: 'shadow-[0_0_15px_rgba(10,102,194,0.5)]',
};

export const platformBorderColors: Record<Platform, string> = {
  facebook: 'border-[#1877F2]',
  instagram: 'border-[#E4405F]',
  linkedin: 'border-[#0A66C2]',
};

export function PlatformIcon({ platform, className = '', size = 20 }: PlatformIconProps) {
  const iconProps = { 
    size, 
    className,
    style: { color: platformColors[platform] } 
  };

  switch (platform) {
    case 'facebook':
      return <Facebook {...iconProps} />;
    case 'instagram':
      return <Instagram {...iconProps} />;
    case 'linkedin':
      return <Linkedin {...iconProps} />;
    default:
      return null;
  }
}

export function getPlatformName(platform: Platform): string {
  const names: Record<Platform, string> = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    linkedin: 'LinkedIn',
  };
  return names[platform];
}
