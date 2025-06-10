import { Package } from "lucide-react";
import * as LucideIcons from "lucide-react";

interface DynamicIconProps {
  name: string;
  className?: string;
  size?: number;
}

export const DynamicIcon = ({
  name,
  className = "",
  size = 20,
}: DynamicIconProps) => {
  const IconComponent = LucideIcons[
    name as keyof typeof LucideIcons
  ] as React.ComponentType<{ className?: string; size?: number }>;

  if (!IconComponent) {
    return <Package className={className} size={size} />;
  }

  return <IconComponent className={className} size={size} />;
};
