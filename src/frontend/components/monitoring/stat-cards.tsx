import type { LucideIcon } from "lucide-react";

export type StatTone =
  | "blue"
  | "green"
  | "amber"
  | "violet"
  | "teal"
  | "indigo"
  | "orange"
  | "rose";

export type Stat = {
  label: string;
  value: string;
  note: string;
  icon: LucideIcon;
  tone: StatTone;
};

export function StatCards({ stats }: { stats: Stat[] }) {
  return (
    <div className="stat-grid">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.label} className={`stat-card tone-${stat.tone}`}>
            <div className="stat-head">
              <span className="stat-label">{stat.label}</span>
              <span className="stat-ic">
                <Icon aria-hidden="true" />
              </span>
            </div>
            <div className="stat-value">{stat.value}</div>
            <div className="stat-note">{stat.note}</div>
          </div>
        );
      })}
    </div>
  );
}
