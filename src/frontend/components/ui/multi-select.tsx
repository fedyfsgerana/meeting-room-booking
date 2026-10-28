"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCheck, X } from "lucide-react";
import TomSelect from "tom-select";
import type { SelectOption } from "./search-select";

type MultiSelectProps = {
  id: string;
  name: string;
  options: SelectOption[];
  defaultValues?: string[];
  placeholder?: string;
  disabled?: boolean;
};

export function MultiSelect({
  id,
  name,
  options,
  defaultValues = [],
  placeholder,
  disabled = false,
}: MultiSelectProps) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const controlRef = useRef<TomSelect | null>(null);
  const [count, setCount] = useState(defaultValues.length);

  useEffect(() => {
    const element = selectRef.current;
    if (!element) return;
    const control = new TomSelect(element, {
      create: false,
      maxOptions: 500,
      dropdownParent: "body",
      hidePlaceholder: true,
      closeAfterSelect: false,
      placeholder: placeholder ?? "Ketik untuk mencari",
      plugins: { remove_button: { title: "Hapus" } },
      render: {
        no_results: () => '<div class="no-results">Tidak ditemukan</div>',
      },
      onChange: (value: unknown) =>
        setCount(Array.isArray(value) ? value.length : 0),
    });
    controlRef.current = control;
    return () => {
      controlRef.current = null;
      control.destroy();
    };
  }, [placeholder]);

  const selectAll = () =>
    controlRef.current?.setValue(options.map((option) => option.value));
  const clearAll = () => controlRef.current?.clear();

  return (
    <div className="multi-select">
      <select
        ref={selectRef}
        id={id}
        name={name}
        multiple
        defaultValue={defaultValues}
        disabled={disabled}
        className="select"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {!disabled && options.length > 1 && (
        <div className="multi-actions">
          <span>
            {count} dari {options.length} dipilih
          </span>
          <button
            type="button"
            className="link-icon"
            onClick={selectAll}
            disabled={count === options.length}
          >
            <CheckCheck aria-hidden="true" />
            Pilih semua
          </button>
          <button
            type="button"
            className="link-icon"
            onClick={clearAll}
            disabled={count === 0}
          >
            <X aria-hidden="true" />
            Kosongkan
          </button>
        </div>
      )}
    </div>
  );
}
