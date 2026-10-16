"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SliderProps {
  value?: number[];
  defaultValue?: number[];
  min?: number;
  max?: number;
  step?: number;
  onValueChange?: (value: number[]) => void;
  className?: string;
  disabled?: boolean;
}

export const Slider = React.forwardRef<HTMLInputElement, SliderProps>(
  (
    {
      value,
      defaultValue,
      min = 0,
      max = 100,
      step = 1,
      onValueChange,
      className,
      disabled = false,
      ...props
    },
    ref
  ) => {
    const currentVal = value?.[0] ?? defaultValue?.[0] ?? min;

    return (
      <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
        <input
          ref={ref}
          type="range"
          min={min}
          max={max}
          step={step}
          value={currentVal}
          disabled={disabled}
          onChange={(e) => onValueChange?.([Number(e.target.value)])}
          className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary focus:outline-none focus:ring-2 focus:ring-primary/20 disabled:opacity-50 disabled:cursor-not-allowed"
          {...props}
        />
      </div>
    );
  }
);
Slider.displayName = "Slider";
