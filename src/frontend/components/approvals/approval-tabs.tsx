import Link from "next/link";
import { cx } from "@/lib/cx";
import { APPROVAL_MODE_LABEL, type ApprovalMode } from "@/lib/approvals";

type ApprovalTabsProps = {
  modes: ApprovalMode[];
  current: ApprovalMode;
  counts: Partial<Record<ApprovalMode, number>>;
};

export function ApprovalTabs({ modes, current, counts }: ApprovalTabsProps) {
  if (modes.length < 2) return null;
  return (
    <nav className="seg seg-tabs" aria-label="Tahap persetujuan">
      {modes.map((mode) => (
        <Link
          key={mode}
          href={`/persetujuan?tahap=${mode}`}
          className={cx(mode === current && "active")}
          aria-current={mode === current ? "page" : undefined}
          scroll={false}
        >
          {APPROVAL_MODE_LABEL[mode]}
          <span className="n">{counts[mode] ?? 0}</span>
        </Link>
      ))}
    </nav>
  );
}
