export type Origin = {
  dari?: string;
  tahap?: string;
  tanggal?: string;
  ruang?: string;
};

const STAGES = ["approver", "pic"];
const DATE = /^\d{4}-\d{2}-\d{2}$/;

function clean(origin: Origin) {
  if (origin.dari === "persetujuan") {
    return {
      dari: "persetujuan",
      tahap:
        origin.tahap && STAGES.includes(origin.tahap)
          ? origin.tahap
          : undefined,
    };
  }
  if (origin.dari === "beranda") {
    return {
      dari: "beranda",
      tanggal:
        origin.tanggal && DATE.test(origin.tanggal)
          ? origin.tanggal
          : undefined,
    };
  }
  if (
    origin.dari === "monitoring" &&
    origin.ruang &&
    /^\d+$/.test(origin.ruang)
  ) {
    return {
      dari: "monitoring",
      ruang: origin.ruang,
      tanggal:
        origin.tanggal && DATE.test(origin.tanggal)
          ? origin.tanggal
          : undefined,
    };
  }
  return null;
}

export function originQuery(origin: Origin) {
  const value = clean(origin);
  if (!value) return "";
  const params = new URLSearchParams(
    Object.entries(value).filter((entry): entry is [string, string] =>
      Boolean(entry[1]),
    ),
  );
  return `?${params.toString()}`;
}

export function originBack(origin: Origin) {
  const value = clean(origin);
  if (value?.dari === "persetujuan")
    return value.tahap ? `/persetujuan?tahap=${value.tahap}` : "/persetujuan";
  if (value?.dari === "beranda")
    return value.tanggal ? `/?tanggal=${value.tanggal}` : "/";
  if (value?.dari === "monitoring" && "ruang" in value) {
    return `/monitoring/${value.ruang}${value.tanggal ? `?tanggal=${value.tanggal}` : ""}`;
  }
  return "/booking";
}
