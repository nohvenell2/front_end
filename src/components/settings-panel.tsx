"use client";

import { useSettings } from "@/context/settings-context";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";

const WEIGHT_LABELS: Record<string, string> = {
  similarity: "유사도",
  popularity: "인기도",
  rating: "평점",
  recency: "최신성",
};

interface SettingsPanelProps {
  onApply?: () => void;
}

export function SettingsPanel({ onApply }: SettingsPanelProps) {
  const { settings, dispatch } = useSettings();

  return (
    <div className="flex flex-col gap-5 p-4 text-sm">
      {/* Count */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <Label className="text-xs text-muted-foreground font-semibold">추천 수</Label>
          <span className="text-xs font-semibold text-primary">{settings.count}</span>
        </div>
        <Slider
          min={5}
          max={20}
          step={1}
          value={[settings.count]}
          onValueChange={(v) => dispatch({ type: "SET_COUNT", payload: (v as number[])[0] })}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground/60">
          <span>5</span><span>20</span>
        </div>
      </div>

      <Separator />

      {/* Weights */}
      <div className="flex flex-col gap-4">
        <Label className="text-xs text-muted-foreground font-semibold">가중치</Label>
        {(["similarity", "popularity", "rating", "recency"] as const).map((key) => (
          <div key={key} className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <Label className="text-xs text-muted-foreground">{WEIGHT_LABELS[key]}</Label>
              <span className="text-xs text-primary">{settings.weights[key]}</span>
            </div>
            <Slider
              min={1}
              max={10}
              step={1}
              value={[settings.weights[key]]}
              onValueChange={(v) =>
                dispatch({ type: "SET_WEIGHT", payload: { key, value: (v as number[])[0] } })
              }
            />
          </div>
        ))}
      </div>

      <Separator />

      {/* Half-life */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <Label className="text-xs text-muted-foreground font-semibold">최신성 반감기</Label>
          <span className="text-xs text-primary">{settings.halfLifeDays}일</span>
        </div>
        <Slider
          min={180}
          max={3650}
          step={90}
          value={[settings.halfLifeDays]}
          onValueChange={(v) => dispatch({ type: "SET_HALF_LIFE_DAYS", payload: (v as number[])[0] })}
        />
        <div className="flex justify-between text-[10px] text-muted-foreground/60">
          <span>180일</span><span>3650일</span>
        </div>
      </div>

      <Separator />

      {/* Filters */}
      <div className="flex flex-col gap-4">
        <Label className="text-xs text-muted-foreground font-semibold">필터</Label>

        <div className="flex flex-col gap-1.5">
          <Label className="text-xs text-muted-foreground">출시일 이후</Label>
          <Input
            type="date"
            value={settings.filters.minReleaseDate}
            onChange={(e) =>
              dispatch({ type: "SET_FILTER", payload: { key: "minReleaseDate", value: e.target.value } })
            }
            className="h-8 text-xs bg-background border-border"
            style={{ colorScheme: "dark" }}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">최소 리뷰 수</Label>
            <span className="text-xs text-primary">{settings.filters.minReviewCount.toLocaleString()}</span>
          </div>
          <Input
            type="number"
            min={0}
            value={settings.filters.minReviewCount}
            onChange={(e) =>
              dispatch({ type: "SET_FILTER", payload: { key: "minReviewCount", value: Number(e.target.value) } })
            }
            className="h-8 text-xs bg-background border-border"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Label className="text-xs text-muted-foreground">긍정 비율 최소</Label>
            <span className="text-xs text-primary">{settings.filters.minPositivePercent}%</span>
          </div>
          <Slider
            min={0}
            max={100}
            step={1}
            value={[settings.filters.minPositivePercent]}
            onValueChange={(v) =>
              dispatch({ type: "SET_FILTER", payload: { key: "minPositivePercent", value: (v as number[])[0] } })
            }
          />
          <div className="flex justify-between text-[10px] text-muted-foreground/60">
            <span>0%</span><span>100%</span>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          onClick={() => dispatch({ type: "RESET_DEFAULTS" })}
        >
          초기화
        </Button>
        {onApply && (
          <Button
            variant="cta"
            size="sm"
            className="flex-1"
            onClick={onApply}
          >
            적용
          </Button>
        )}
      </div>
    </div>
  );
}
