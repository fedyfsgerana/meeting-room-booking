"use client";

import { cx } from "@/lib/cx";

type SegmentedOption<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

type SegmentedProps<T extends string> = {
  label: string;
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
}: SegmentedProps<T>) {
  return (
    <div className="seg" role="group" aria-label={label}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          className={cx(option.value === value && "active")}
          aria-pressed={option.value === value}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="n">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
