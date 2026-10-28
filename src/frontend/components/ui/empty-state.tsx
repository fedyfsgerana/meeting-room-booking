import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  description?: string;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
}: EmptyStateProps) {
  return (
    <div className="empty">
      <Icon aria-hidden="true" />
      <h3>{title}</h3>
      {description && <p>{description}</p>}
    </div>
  );
}
