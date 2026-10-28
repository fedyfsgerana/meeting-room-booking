type RoomCellProps = {
  name: string;
  capacity: number;
};

export function RoomCell({ name, capacity }: RoomCellProps) {
  return (
    <div>
      <div className="cell-main">{name}</div>
      <div className="cell-sub">{capacity} orang</div>
    </div>
  );
}
