import type { Metadata } from "next";
import { Suspense } from "react";
import { listActivities } from "@/backend/activity/queries";
import { requirePagePermission } from "@/backend/auth/guard";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { ActivityTable } from "@/frontend/components/settings/activity-table";
import { DateRangeForm } from "@/frontend/components/settings/date-range-form";
import { Card, CardHeader } from "@/frontend/components/ui/card";
import { PageHead } from "@/frontend/components/ui/page-head";
import { ACTIVITY_MODULES } from "@/lib/activity";
import { zonedNow } from "@/lib/time";

export const metadata: Metadata = { title: "Riwayat aktivitas" };

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 92;

type Props = {
  searchParams: Promise<{ dari?: string; sampai?: string; modul?: string }>;
};

function shift(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

async function RiwayatContent({ searchParams }: Props) {
  const me = await requirePagePermission("activity.view");
  const today = zonedNow(new Date()).date;
  const params = await searchParams;
  let to =
    params.sampai && DATE.test(params.sampai) && params.sampai <= today
      ? params.sampai
      : today;
  let from =
    params.dari && DATE.test(params.dari) ? params.dari : shift(to, -6);
  if (from > to) [from, to] = [to, from];
  if (from < shift(to, -MAX_DAYS)) from = shift(to, -MAX_DAYS);

  const moduleKey =
    ACTIVITY_MODULES.find((item) => item === params.modul) ?? null;
  const rows = await listActivities(from, to, moduleKey);

  return (
    <div className="stack">
      <Card>
        <CardHeader
          title="Filter aktivitas"
          description={`Menampilkan paling banyak 2.000 aktivitas terbaru, maksimal ${MAX_DAYS} hari.`}
        />
        <DateRangeForm
          from={from}
          to={to}
          max={today}
          moduleKey={moduleKey ?? "all"}
        />
      </Card>
      <ActivityTable
        rows={rows}
        canRestore={me.permissions.includes("activity.restore")}
      />
    </div>
  );
}

export default function RiwayatAktivitasPage({ searchParams }: Props) {
  return (
    <>
      <PageHead
        title="Riwayat aktivitas"
        description="Catatan login, login gagal, dan perubahan data oleh setiap pengguna, lengkap dengan alamat IP dan perangkat."
      />
      <Suspense fallback={<PageSkeleton withHead={false} />}>
        <RiwayatContent searchParams={searchParams} />
      </Suspense>
    </>
  );
}
