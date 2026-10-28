import type { Metadata } from "next";
import { Suspense } from "react";
import { requirePagePermission } from "@/backend/auth/guard";
import { getSettings, listHolidays } from "@/backend/settings/queries";
import { PageSkeleton } from "@/frontend/components/layout/page-skeleton";
import { HolidaysManager } from "@/frontend/components/settings/holidays-manager";
import { SettingsForm } from "@/frontend/components/settings/settings-form";
import { PageHead } from "@/frontend/components/ui/page-head";

export const metadata: Metadata = { title: "Aturan booking" };

async function AturanBookingContent() {
  const me = await requirePagePermission("settings.view");
  const canEdit = me.permissions.includes("settings.update");
  const [settings, holidays] = await Promise.all([getSettings(), listHolidays()]);
  return (
    <div className="settings-grid">
      <SettingsForm settings={settings} readOnly={!canEdit} />
      <HolidaysManager holidays={holidays} canEdit={canEdit} />
    </div>
  );
}

export default function AturanBookingPage() {
  return (
    <>
      <PageHead
        title="Aturan booking"
        description="Atur batas waktu Draft, jam dan hari operasional, serta hari libur."
      />
      <Suspense fallback={<PageSkeleton withHead={false} variant="form" />}>
        <AturanBookingContent />
      </Suspense>
    </>
  );
}
