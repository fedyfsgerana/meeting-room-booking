type PersonCellProps = {
  name: string;
  sub?: string | null;
};

export function PersonCell({ name, sub }: PersonCellProps) {
  return (
    <div>
      <div className="cell-main">{name}</div>
      {sub && <div className="cell-sub">{sub}</div>}
    </div>
  );
}
