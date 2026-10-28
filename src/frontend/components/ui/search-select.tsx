"use client";

import { useEffect, useRef } from "react";
import TomSelect from "tom-select";

export type SelectOption = { value: string; label: string };

type SearchSelectProps = {
  id: string;
  name?: string;
  options: SelectOption[];
  defaultValue?: string;
  placeholder?: string;
  disabled?: boolean;
  ariaLabel?: string;
  clearable?: boolean;
  onChange?: (value: string) => void;
};

export function SearchSelect({
  id,
  name,
  options,
  defaultValue = "",
  placeholder,
  disabled = false,
  ariaLabel,
  clearable = false,
  onChange,
}: SearchSelectProps) {
  const selectRef = useRef<HTMLSelectElement>(null);
  const changeRef = useRef(onChange);

  useEffect(() => {
    changeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const element = selectRef.current;
    if (!element) return;
    const control = new TomSelect(element, {
      create: false,
      allowEmptyOption: false,
      maxOptions: 500,
      dropdownParent: "body",
      placeholder: placeholder ?? "Ketik untuk mencari",
      plugins: clearable
        ? { clear_button: { title: "Kosongkan pilihan" } }
        : [],
      render: {
        no_results: () => '<div class="no-results">Tidak ditemukan</div>',
      },
      onChange: (value: unknown) => changeRef.current?.(String(value)),
    });
    return () => control.destroy();
  }, [placeholder, clearable]);

  return (
    <select
      ref={selectRef}
      id={id}
      name={name}
      defaultValue={defaultValue}
      disabled={disabled}
      aria-label={ariaLabel}
      className="select"
    >
      {placeholder !== undefined && <option value="" />}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
