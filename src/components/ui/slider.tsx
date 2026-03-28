"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

// base-ui Slider.Thumb renders a <script> tag that React rejects in client
// components. Replaced with a native <input type="range"> that is styled to
// match the shadcn look and accepts the same value/onValueChange API.

interface SliderProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue" | "onChange"> {
  value?: number[]
  defaultValue?: number[]
  onValueChange?: (value: number[]) => void
  min?: number
  max?: number
  step?: number
}

function Slider({
  className,
  value,
  defaultValue,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  ...props
}: SliderProps) {
  const current = value?.[0] ?? defaultValue?.[0] ?? min
  const pct = ((current - min) / (max - min)) * 100

  return (
    <div
      data-slot="slider"
      className={cn("relative flex w-full touch-none items-center", className)}
    >
      <div className="relative w-full h-1 rounded-full bg-muted overflow-visible">
        {/* filled track */}
        <div
          className="absolute left-0 top-0 h-full bg-primary rounded-full pointer-events-none"
          style={{ width: `${pct}%` }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={current}
          disabled={disabled}
          onChange={(e) => onValueChange?.([Number(e.target.value)])}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:pointer-events-none"
          aria-valuemin={min}
          aria-valuemax={max}
          aria-valuenow={current}
          {...props}
        />
        {/* thumb */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-3 rounded-full bg-white border border-ring ring-ring/50 pointer-events-none transition-[box-shadow]"
          style={{ left: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export { Slider }
