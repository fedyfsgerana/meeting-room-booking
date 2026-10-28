import { Search } from "lucide-react";
import { Button } from "@/frontend/components/ui/button";
import { Field, Input } from "@/frontend/components/ui/field";
import { SearchSelect } from "@/frontend/components/ui/search-select";
import { ACTIVITY_MODULE_LABEL, ACTIVITY_MODULES } from "@/lib/activity";

const MODULE_OPTIONS = [
  { value: "all", label: "Semua modul" },
  ...ACTIVITY_MODULES.map((item) => ({
    value: item,
    label: ACTIVITY_MODULE_LABEL[item],
  })),
];

type DateRangeFormProps = {
  from: string;
  to: string;
  max: string;
  moduleKey: string;
};

export function DateRangeForm({
  from,
  to,
  max,
  moduleKey,
}: DateRangeFormProps) {
  return (
    <form className="range-form" method="get">
      <Field label="Dari tanggal" htmlFor="range-from">
        <Input
          id="range-from"
          name="dari"
          type="date"
          defaultValue={from}
          max={max}
        />
      </Field>
      <Field label="Sampai tanggal" htmlFor="range-to">
        <Input
          id="range-to"
          name="sampai"
          type="date"
          defaultValue={to}
          max={max}
        />
      </Field>
      <Field label="Modul" htmlFor="range-module">
        <SearchSelect
          id="range-module"
          name="modul"
          options={MODULE_OPTIONS}
          defaultValue={moduleKey}
          placeholder="Semua modul"
        />
      </Field>
      <Button type="submit" variant="primary" icon={Search}>
        Tampilkan
      </Button>
    </form>
  );
}
