"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { SearchSelect } from "./search-select";

export const PAGE_SIZES = [10, 25, 50];

type PaginationProps = {
  id: string;
  page: number;
  pageSize: number;
  total: number;
  unit: string;
  onPage: (page: number) => void;
  onPageSize: (size: number) => void;
};

function pageNumbers(page: number, pages: number): Array<number | "gap"> {
  if (pages <= 7) return Array.from({ length: pages }, (_, index) => index + 1);
  const result: Array<number | "gap"> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  if (start > 2) result.push("gap");
  for (let n = start; n <= end; n += 1) result.push(n);
  if (end < pages - 1) result.push("gap");
  result.push(pages);
  return result;
}

export function Pagination({
  id,
  page,
  pageSize,
  total,
  unit,
  onPage,
  onPageSize,
}: PaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const start = total ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(total, page * pageSize);

  return (
    <div className="pager">
      <span className="pg-info">
        {total ? (
          <>
            Menampilkan{" "}
            <b>
              {start}–{end}
            </b>{" "}
            dari <b>{total}</b> {unit}
          </>
        ) : (
          "Tidak ada data"
        )}
      </span>
      <div className="pager-r">
        <span className="pg-size">
          <span>Tampilkan</span>
          <SearchSelect
            id={`${id}-size`}
            options={PAGE_SIZES.map((size) => ({
              value: String(size),
              label: String(size),
            }))}
            defaultValue={String(pageSize)}
            ariaLabel="Jumlah baris per halaman"
            onChange={(value) => onPageSize(Number(value))}
          />
        </span>
        <nav className="pages" aria-label="Halaman">
          <button
            type="button"
            className="pg-nav"
            onClick={() => onPage(page - 1)}
            disabled={page <= 1}
            aria-label="Halaman sebelumnya"
            title="Sebelumnya"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          {pageNumbers(page, pages).map((n, index) =>
            n === "gap" ? (
              <span key={`gap-${index}`} className="pg-gap" aria-hidden="true">
                …
              </span>
            ) : (
              <button
                key={n}
                type="button"
                onClick={() => onPage(n)}
                aria-current={n === page ? "page" : undefined}
                aria-label={`Halaman ${n}`}
              >
                {n}
              </button>
            ),
          )}
          <button
            type="button"
            className="pg-nav"
            onClick={() => onPage(page + 1)}
            disabled={page >= pages}
            aria-label="Halaman berikutnya"
            title="Berikutnya"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </nav>
      </div>
    </div>
  );
}
