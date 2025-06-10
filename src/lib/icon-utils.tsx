import {
  Package,
  Tag,
  Grid,
  List,
  Star,
  Heart,
  Play,
  Music,
  Image,
  Video,
  BookOpen,
  Gamepad2,
  Zap,
  Wrench,
  Palette,
  Code,
  Database,
  Server,
  Globe,
  Building2,
  Users,
  MessageCircle,
  Mail,
  Phone,
  LucideIcon,
} from "lucide-react";

const iconMap: Record<string, LucideIcon> = {
  Package,
  Tag,
  Grid,
  List,
  Star,
  Heart,
  Play,
  Music,
  Image,
  Video,
  BookOpen,
  Gamepad2,
  Zap,
  Tool: Wrench, // Map Tool to Wrench since Tool doesn't exist
  Palette,
  Code,
  Database,
  Server,
  Globe,
  Building2,
  Users,
  MessageCircle,
  Mail,
  Phone,
};

interface DynamicIconProps {
  name?: string | null;
  className?: string;
  size?: number;
}

export function DynamicIcon({
  name,
  className = "",
  size = 20,
}: DynamicIconProps) {
  if (!name || !iconMap[name]) {
    return <Package className={className} size={size} />;
  }

  const IconComponent = iconMap[name];
  return <IconComponent className={className} size={size} />;
}

export function getIconComponent(name?: string | null): LucideIcon {
  if (!name || !iconMap[name]) {
    return Package;
  }
  return iconMap[name];
}

