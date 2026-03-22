"use client";

import { useSettings } from "@/context/settings-context";

export function FilterControls() {
  const { settings, dispatch } = useSettings();
  const { filters } = settings;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Games not meeting these criteria will be excluded from results.
      </p>

      {/* Min release date */}
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="min-release-date">
          Minimum Release Date
        </label>
        <input
          id="min-release-date"
          type="date"
          value={filters.minReleaseDate}
          onChange={(e) =>
            dispatch({
              type: "SET_FILTER",
              payload: { key: "minReleaseDate", value: e.target.value },
            })
          }
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Min review count */}
      <div className="space-y-1">
        <label className="text-sm font-medium" htmlFor="min-review-count">
          Minimum Review Count
        </label>
        <input
          id="min-review-count"
          type="number"
          min={0}
          max={100000}
          value={filters.minReviewCount}
          onChange={(e) =>
            dispatch({
              type: "SET_FILTER",
              payload: {
                key: "minReviewCount",
                value: parseInt(e.target.value) || 0,
              },
            })
          }
          className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>

      {/* Min positive percent */}
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <label className="font-medium" htmlFor="min-positive-percent">
            Minimum Positive Review %
          </label>
          <span className="text-muted-foreground">
            {filters.minPositivePercent}%
          </span>
        </div>
        <input
          id="min-positive-percent"
          type="range"
          min={0}
          max={100}
          step={5}
          value={filters.minPositivePercent}
          onChange={(e) =>
            dispatch({
              type: "SET_FILTER",
              payload: {
                key: "minPositivePercent",
                value: parseInt(e.target.value),
              },
            })
          }
          className="w-full accent-primary"
        />
      </div>
    </div>
  );
}
