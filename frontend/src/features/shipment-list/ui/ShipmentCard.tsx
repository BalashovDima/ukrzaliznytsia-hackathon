import { Shipment } from "@/entities/shipment/types";
import {
  CARGO_TYPE_LABELS,
  CARGO_TO_WAGON,
  WAGON_TYPE_LABELS,
} from "@/entities/wagon/types";
import { getStationById } from "@/shared/config/stations";
import { ArrowRight, Calendar, Package, Train } from "lucide-react";

interface Props {
  shipment: Shipment;
  onClick?: () => void;
}

const STATUS_LABELS: Record<string, string> = {
  pending: "Очікує",
  matched: "Підібрано",
  confirmed: "Підтверджено",
  in_transit: "В дорозі",
  delivered: "Доставлено",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "efficiency-badge-yellow",
  matched: "efficiency-badge-green",
  confirmed: "efficiency-badge-green",
  in_transit: "efficiency-badge-green",
  delivered: "efficiency-badge-green",
};

export function ShipmentCard({ shipment, onClick }: Props) {
  const origin = getStationById(shipment.originStationId);
  const destination = getStationById(shipment.destinationStationId);

  return (
    <div
      onClick={onClick}
      className="rounded-lg border bg-card p-5 space-y-3 cursor-pointer hover:shadow-md transition-shadow"
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-mono text-muted-foreground">
          {shipment.id}
        </span>
        <span className={STATUS_STYLES[shipment.status]}>
          {STATUS_LABELS[shipment.status]}
        </span>
      </div>

      <div className="flex items-center gap-2 text-sm font-medium">
        <span>{origin?.name ?? "—"}</span>
        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
        <span>{destination?.name ?? "—"}</span>
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Package className="h-3.5 w-3.5" />
          {CARGO_TYPE_LABELS[shipment.cargoType]}
        </span>
        <span className="flex items-center gap-1">
          <Train className="h-3.5 w-3.5" />
          {shipment.wagonCount} ×{" "}
          {WAGON_TYPE_LABELS[CARGO_TO_WAGON[shipment.cargoType]]}
        </span>
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {new Date(shipment.deadline).toLocaleDateString("uk-UA")}
        </span>
      </div>
    </div>
  );
}
