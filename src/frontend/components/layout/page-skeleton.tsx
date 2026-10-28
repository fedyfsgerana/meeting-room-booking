type PageSkeletonProps = {
  withHead?: boolean;
  variant?: "table" | "form" | "dashboard" | "monitoring";
};

const ROWS = Array.from({ length: 6 }, (_, index) => index);
const FIELDS = Array.from({ length: 6 }, (_, index) => index);

function TableSkeleton() {
  return (
    <div className="card sk-panel">
      <div className="sk-toolbar">
        <span className="sk sk-search" />
        <span className="sk sk-seg" />
      </div>
      <div className="sk-grid sk-thead">
        <span className="sk sk-cell sk-xs" />
        <span className="sk sk-cell sk-sm" />
        <span className="sk sk-cell sk-sm" />
        <span className="sk sk-cell sk-sm" />
        <span className="sk sk-cell sk-xs" />
        <span className="sk sk-cell sk-xs sk-end" />
      </div>
      {ROWS.map((row) => (
        <div key={row} className="sk-grid sk-row">
          <span className="sk sk-cell sk-xs" />
          <span className="sk-stack">
            <span className="sk sk-cell sk-lg" />
            <span className="sk sk-cell sk-sm" />
          </span>
          <span className="sk sk-cell sk-md" />
          <span className="sk sk-cell sk-md" />
          <span className="sk sk-pill" />
          <span className="sk-acts">
            <span className="sk sk-btn" />
            <span className="sk sk-btn" />
          </span>
        </div>
      ))}
      <div className="sk-pager">
        <span className="sk sk-cell sk-info" />
        <span className="sk sk-cell sk-pages" />
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="card sk-panel">
      <div className="sk-form-head">
        <span className="sk sk-cell sk-md" />
        <span className="sk sk-cell sk-lg" />
      </div>
      <div className="sk-form-body">
        {FIELDS.map((field) => (
          <span key={field} className="sk-field">
            <span className="sk sk-cell sk-sm" />
            <span className="sk sk-input" />
          </span>
        ))}
      </div>
      <div className="sk-form-foot">
        <span className="sk sk-button" />
        <span className="sk sk-button sk-button-primary" />
      </div>
    </div>
  );
}

function MiniCards({ count }: { count: number }) {
  return (
    <div className="sk-cards">
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="card sk-mini">
          <span className="sk sk-cell sk-sm" />
          <span className="sk sk-big" />
          <span className="sk sk-cell sk-md" />
        </div>
      ))}
    </div>
  );
}

function TimelineSkeleton() {
  return (
    <div className="card sk-panel">
      <div className="sk-form-head sk-tl-head">
        <span className="sk-stack">
          <span className="sk sk-cell sk-md" />
          <span className="sk sk-cell sk-sm" />
        </span>
        <span className="sk sk-pages" />
      </div>
      {ROWS.map((row) => (
        <div key={row} className="sk-tl-row">
          <span className="sk-stack">
            <span className="sk sk-cell sk-lg" />
            <span className="sk sk-cell sk-sm" />
          </span>
          <span className="sk-tl-track">
            <span
              className="sk sk-slot"
              style={{
                left: `${8 + ((row * 17) % 50)}%`,
                width: `${12 + ((row * 7) % 14)}%`,
              }}
            />
          </span>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton({
  withHead = true,
  variant = "table",
}: PageSkeletonProps) {
  return (
    <div className="page-loading" aria-busy="true" aria-label="Memuat halaman">
      {withHead && (
        <div className="sk-head">
          <span className="sk sk-title" />
          <span className="sk sk-line" />
        </div>
      )}
      {variant === "dashboard" && (
        <>
          <MiniCards count={5} />
          <TimelineSkeleton />
        </>
      )}
      {variant === "monitoring" && (
        <>
          <MiniCards count={4} />
          <TableSkeleton />
        </>
      )}
      {variant === "table" && <TableSkeleton />}
      {variant === "form" && <FormSkeleton />}
    </div>
  );
}
