"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useSettings } from "@/context/settings-context";
import { WeightSliders } from "./weight-sliders";
import { FilterControls } from "./filter-controls";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { settings, dispatch } = useSettings();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Recommendation Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* Recommendation count */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Number of Recommendations</span>
              <span className="text-muted-foreground">{settings.count}</span>
            </div>
            <Slider
              min={5}
              max={20}
              step={1}
              value={settings.count}
              onValueChange={(v) =>
                dispatch({ type: "SET_COUNT", payload: v as number })
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>5</span>
              <span>20</span>
            </div>
          </div>

          <hr />

          {/* Weights */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Scoring Weights</h3>
            <WeightSliders />
          </div>

          <hr />

          {/* Filters */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Exclusion Filters</h3>
            <FilterControls />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => dispatch({ type: "RESET_DEFAULTS" })}
          >
            Reset to Defaults
          </Button>
          <Button onClick={() => onOpenChange(false)}>Done</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
