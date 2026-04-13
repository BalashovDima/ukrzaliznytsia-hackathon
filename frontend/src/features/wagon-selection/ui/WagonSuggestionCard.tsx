import { WagonSuggestion } from "@/entities/shipment/types";
import { WAGON_TYPE_LABELS, WagonType } from "@/entities/wagon/types";
import { MapPin, TrendingDown, Truck } from "lucide-react";

interface Props {
  suggestion: WagonSuggestion;
  onConfirm?: () => void;
}

export function WagonSuggestionCard({ suggestion, onConfirm }: Props) {
  const badge =
    suggestion.distanceKm < 100
      ? "efficiency-badge-green"
      : suggestion.distanceKm < 200
        ? "efficiency-badge-yellow"
        : "efficiency-badge-red";

  const label =
    suggestion.distanceKm < 100
      ? "Відмінно"
      : suggestion.distanceKm < 200
        ? "Прийнятно"
        : "Далеко";

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{suggestion.wagonId}</span>
        </div>
        <span className={badge}>{label}</span>
      </div>

      <div className="space-y-1.5 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="text-xs font-medium uppercase tracking-wide">
            Тип:
          </span>
          <span className="text-foreground">
            {WAGON_TYPE_LABELS[suggestion.wagonType as WagonType]}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-3.5 w-3.5" />
          <span className="text-foreground">
            {suggestion.currentStationName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <TrendingDown className="h-3.5 w-3.5" />
          <span className="text-foreground">
            {suggestion.distanceKm} км · Економія{" "}
            <strong className="text-success">
              {suggestion.savingsUah.toLocaleString("uk-UA")} ₴
            </strong>
          </span>
        </div>
      </div>

      {onConfirm && (
        <button
          onClick={onConfirm}
          className="w-full rounded-md bg-primary py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Підтвердити призначення
        </button>
      )}
    </div>
  );
}
