"use client";

import { useUrlState } from "@/components/url-state";
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from "@/lib/sheet/search-params";

export function PageSizeSelect({ value }: { value: number }) {
  const { navigate } = useUrlState();

  return (
    <label className="flex items-center gap-2 text-sm text-ink-2">
      Rows
      <select
        value={value}
        onChange={(event) => {
          const size = Number(event.target.value);
          navigate({ pageSize: size === DEFAULT_PAGE_SIZE ? null : String(size) });
        }}
        className="h-8 rounded-[3px] border border-rule bg-card px-2 text-sm text-ink"
      >
        {PAGE_SIZES.map((size) => (
          <option key={size} value={size}>
            {size}
          </option>
        ))}
      </select>
    </label>
  );
}
