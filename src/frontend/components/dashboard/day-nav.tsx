"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { IconButton } from "@/frontend/components/ui/icon-button";
import { Input } from "@/frontend/components/ui/field";

function shiftDate(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export function DayNav({
  date,
  today,
  basePath = "/",
}: {
  date: string;
  today: string;
  basePath?: string;
}) {
  const router = useRouter();
  const go = (value: string) => {
    if (value)
      router.push(value === today ? basePath : `${basePath}?tanggal=${value}`, {
        scroll: false,
      });
  };

  return (
    <div className="day-nav">
      <Button
        size="sm"
        icon={CalendarDays}
        onClick={() => go(today)}
        disabled={date === today}
      >
        Hari ini
      </Button>
      <IconButton
        icon={ChevronLeft}
        label="Hari sebelumnya"
        onClick={() => go(shiftDate(date, -1))}
      />
      <Input
        type="date"
        value={date}
        onChange={(event) => go(event.target.value)}
        aria-label="Pilih tanggal"
      />
      <IconButton
        icon={ChevronRight}
        label="Hari berikutnya"
        onClick={() => go(shiftDate(date, 1))}
      />
    </div>
  );
}
