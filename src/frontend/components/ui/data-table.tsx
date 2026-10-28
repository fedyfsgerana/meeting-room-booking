"use client";

import { useState, type ReactNode } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Search,
  type LucideIcon,
} from "lucide-react";
import { cx } from "@/lib/cx";
import { Card } from "./card";
import { EmptyState } from "./empty-state";
import { Input } from "./field";
import { PAGE_SIZES, Pagination } from "./pagination";
import { Segmented } from "./segmented";

export type SortValue = string | number | null | undefined;

export type Column<T> = {
  key: string;
  header: string;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => SortValue;
  className?: string;
};

export type TableFilter<T> = {
  value: string;
  label: string;
  test: (row: T) => boolean;
};

type SortState = { key: string; dir: "asc" | "desc" } | null;

type DataTableProps<T> = {
  id: string;
  rows: T[];
  rowKey: (row: T) => string | number;
  columns: Column<T>[];
  unit: string;
  searchPlaceholder: string;
  searchText: (row: T) => string;
  filters?: TableFilter<T>[];
  filterLabel?: string;
  actions?: (row: T) => ReactNode;
  toolbarExtra?: ReactNode;
  initialSort?: SortState;
  emptyIcon: LucideIcon;
  emptyTitle: string;
  emptyDescription?: string;
};

const collator = new Intl.Collator("id", {
  numeric: true,
  sensitivity: "base",
});

function compare(a: SortValue, b: SortValue) {
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty || bEmpty) return aEmpty === bEmpty ? 0 : aEmpty ? 1 : -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return collator.compare(String(a), String(b));
}

export function DataTable<T>({
  id,
  rows,
  rowKey,
  columns,
  unit,
  searchPlaceholder,
  searchText,
  filters,
  filterLabel = "Filter",
  actions,
  toolbarExtra,
  initialSort = null,
  emptyIcon,
  emptyTitle,
  emptyDescription,
}: DataTableProps<T>) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState(filters?.[0]?.value ?? "");
  const [sort, setSort] = useState<SortState>(initialSort);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

  const keyword = query.trim().toLowerCase();
  const searched = keyword
    ? rows.filter((row) => searchText(row).toLowerCase().includes(keyword))
    : rows;
  const activeFilter = filters?.find((item) => item.value === filter);
  const filtered = activeFilter ? searched.filter(activeFilter.test) : searched;

  const getValue = sort
    ? columns.find((column) => column.key === sort.key)?.sortValue
    : undefined;
  const direction = sort?.dir === "desc" ? -1 : 1;
  const sorted = getValue
    ? [...filtered].sort(
        (a, b) => compare(getValue(a), getValue(b)) * direction,
      )
    : filtered;

  const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const current = Math.min(page, pages);
  const pageRows = sorted.slice((current - 1) * pageSize, current * pageSize);

  const toggleSort = (key: string) => {
    setSort((state) => {
      if (!state || state.key !== key) return { key, dir: "asc" };
      if (state.dir === "asc") return { key, dir: "desc" };
      return null;
    });
    setPage(1);
  };

  return (
    <Card className="table-card">
      <div className="toolbar">
        <div className="search">
          <Input
            icon={Search}
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setPage(1);
            }}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
          />
        </div>
        {((filters && filters.length > 1) || toolbarExtra) && (
          <div className="toolbar-r">
            {toolbarExtra}
            {filters && filters.length > 1 && (
              <Segmented
                label={filterLabel}
                value={filter}
                onChange={(value) => {
                  setFilter(value);
                  setPage(1);
                }}
                options={filters.map((item) => ({
                  value: item.value,
                  label: item.label,
                  count: searched.filter(item.test).length,
                }))}
              />
            )}
          </div>
        )}
      </div>
      {pageRows.length ? (
        <div className="table-wrap">
          <table className="dt">
            <thead>
              <tr>
                <th className="num-col">No</th>
                {columns.map((column) => {
                  const active = sort?.key === column.key;
                  const SortIcon = active
                    ? sort.dir === "asc"
                      ? ArrowUp
                      : ArrowDown
                    : ArrowUpDown;
                  return (
                    <th
                      key={column.key}
                      className={column.className}
                      aria-sort={
                        active
                          ? sort.dir === "asc"
                            ? "ascending"
                            : "descending"
                          : undefined
                      }
                    >
                      {column.sortValue ? (
                        <button
                          type="button"
                          className={cx("sort", active && "active")}
                          onClick={() => toggleSort(column.key)}
                        >
                          {column.header}
                          <SortIcon aria-hidden="true" />
                        </button>
                      ) : (
                        column.header
                      )}
                    </th>
                  );
                })}
                {actions && <th className="ta-r">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {pageRows.map((row, index) => (
                <tr key={rowKey(row)}>
                  <td className="num-col">
                    {(current - 1) * pageSize + index + 1}
                  </td>
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={column.className}
                      data-label={column.header}
                    >
                      {column.render(row)}
                    </td>
                  ))}
                  {actions && (
                    <td className="ta-r">
                      <div className="row-acts">{actions(row)}</div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <EmptyState
          icon={emptyIcon}
          title={
            rows.length
              ? `${unit.charAt(0).toUpperCase()}${unit.slice(1)} tidak ditemukan`
              : emptyTitle
          }
          description={
            rows.length ? "Coba kata kunci atau filter lain." : emptyDescription
          }
        />
      )}
      <Pagination
        id={id}
        page={current}
        pageSize={pageSize}
        total={sorted.length}
        unit={unit}
        onPage={setPage}
        onPageSize={(size) => {
          setPageSize(size);
          setPage(1);
        }}
      />
    </Card>
  );
}
