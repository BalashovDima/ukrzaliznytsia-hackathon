import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getShipmentsApi } from "@/features/shipment-list/api/get-shipments";
import { getWagonSuggestion } from "@/features/wagon-selection/api/get-suggestion";
import { ShipmentCard } from "@/features/shipment-list/ui/ShipmentCard";
import { WagonSuggestionCard } from "@/features/wagon-selection/ui/WagonSuggestionCard";
import { TrendingUp, Train, PackageCheck, Banknote, Zap, X, MapPin, ArrowRight, Route } from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/app/layout/AppLayout";
import type { Shipment } from "@/entities/shipment/types";
import { apiClient } from "@/shared/lib/api-client";
import { RailwayMap, type RouteHighlight } from "@/features/map/RailwayMap";
import { WAGON_TYPE_LABELS, CARGO_TYPE_LABELS } from "@/entities/wagon/types";

export default function LogistDashboard() {
  const queryClient = useQueryClient();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );
  // Route inspection mode: when a matched/confirmed shipment is selected
  const [inspectedRequestId, setInspectedRequestId] = useState<string | null>(null);

  const { data: shipments = [], isLoading: isShipmentsLoading } = useQuery({
    queryKey: ["shipments"],
    queryFn: getShipmentsApi,
  });

  const { data: fleet = [] } = useQuery({
    queryKey: ["fleet"],
    queryFn: () => apiClient.getFleet(),
  });

  const { data: stats } = useQuery({
    queryKey: ["stats"],
    queryFn: () => apiClient.getStats(),
  });

  const { data: suggestions = [] } = useQuery({
    queryKey: ["wagon-suggestion", selectedShipment?.id],
    queryFn: () =>
      selectedShipment
        ? getWagonSuggestion(
            selectedShipment.originStationId,
            selectedShipment.cargoType,
            selectedShipment.wagonCount,
          )
        : Promise.resolve([]),
    enabled: !!selectedShipment && selectedShipment.status === "pending",
  });

  // Fetch route details when inspecting a matched request
  const { data: routeDetails, isLoading: isRouteLoading } = useQuery({
    queryKey: ["route-details", inspectedRequestId],
    queryFn: () => apiClient.getRouteDetails(inspectedRequestId!),
    enabled: !!inspectedRequestId,
  });

  const matchMutation = useMutation({
    mutationFn: () => apiClient.runMatching(),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["fleet"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      queryClient.invalidateQueries({ queryKey: ["wagon-suggestion"] });
      queryClient.invalidateQueries({ queryKey: ["wagon-summary"] });
      toast.success(`Глобальний алгоритм відпрацював! 
      Витрати на порожній пробіг склали: ${result.total_empty_cost.toLocaleString("uk-UA")} ₴`);
      setSelectedShipment(null);
      setInspectedRequestId(null);
    },
    onError: () => {
      toast.error("Помилка при запуску алгоритму");
    }
  });

  // Build route highlight data for the map
  const routeHighlight: RouteHighlight | null = useMemo(() => {
    if (!routeDetails || !routeDetails.assignments.length) return null;

    const emptyRunPaths = routeDetails.assignments.map(a =>
      a.empty_run.path.map(p => p.id)
    );
    const loadedRunPath = routeDetails.assignments[0].loaded_run.path.map(p => p.id);
    const wagonOrigins = routeDetails.assignments.map(a => a.empty_run.from_station_id);

    return {
      emptyRunPaths,
      loadedRunPath,
      highlightStations: {
        wagonOrigins,
        pickupStation: routeDetails.request.from_station_id,
        deliveryStation: routeDetails.request.to_station_id,
      },
    };
  }, [routeDetails]);

  const pendingCount = shipments.filter((s) => s.status === "pending").length;
  const totalWagons = fleet.length;
  const emptyWagons = fleet.filter((w) => w.isEmpty).length;
  const matchSavings = stats?.total_empty_cost_uah || 0;

  const handleShipmentClick = (shipment: Shipment) => {
    if (shipment.status === "pending") {
      // Pending → show suggestions
      setSelectedShipment(shipment);
      setInspectedRequestId(null);
    } else {
      // Matched/Confirmed → toggle route inspection
      if (inspectedRequestId === shipment.id) {
        // Clicking again → deselect
        setInspectedRequestId(null);
        setSelectedShipment(null);
      } else {
        setInspectedRequestId(shipment.id);
        setSelectedShipment(shipment);
      }
    }
  };

  const handleCloseInspection = () => {
    setInspectedRequestId(null);
    setSelectedShipment(null);
  };

  const handleGlobalConfirm = () => {
    matchMutation.mutate();
  };

  const isInspecting = !!inspectedRequestId;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="page-header">Дашборд логіста</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Огляд заявок та розумний підбір вагонів
            </p>
          </div>
          <button 
            onClick={handleGlobalConfirm}
            disabled={matchMutation.isPending || pendingCount === 0}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 disabled:opacity-50"
          >
            {matchMutation.isPending ? "Обчислення..." : (
              <>
                <Zap className="h-4 w-4" />
                Запустити розумний розподіл
              </>
            )}
          </button>
        </div>

        {/* Map Visualization */}
        <div className="w-full">
          <RailwayMap routeHighlight={routeHighlight} />
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<PackageCheck className="h-5 w-5 text-primary" />}
            label="Заявок очікує"
            value={pendingCount}
          />
          <StatCard
            icon={<Train className="h-5 w-5 text-info" />}
            label="Вагонів всього"
            value={totalWagons}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-success" />}
            label="Порожніх вагонів"
            value={emptyWagons}
          />
          <StatCard
            icon={<Banknote className="h-5 w-5 text-warning" />}
            label="Зекономлено"
            value={`${matchSavings.toLocaleString("uk-UA")} ₴`}
            highlight
          />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Shipment list */}
          <div className="lg:col-span-3 space-y-3">
            <h2 className="section-title">Заявки на перевезення</h2>
            {isShipmentsLoading ? (
              <p className="text-sm text-muted-foreground">Завантаження...</p>
            ) : (
              <div className="space-y-3">
                {shipments.map((s) => (
                  <div 
                    key={s.id}
                    className={`transition-all ${inspectedRequestId === s.id ? 'ring-2 ring-primary rounded-lg' : ''}`}
                  >
                    <ShipmentCard
                      shipment={s}
                      onClick={() => handleShipmentClick(s)}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right panel: suggestion or route details */}
          <div className="lg:col-span-2 space-y-3">
            {isInspecting ? (
              /* ── Route inspection panel ── */
              <>
                <div className="flex items-center justify-between">
                  <h2 className="section-title flex items-center gap-2">
                    <Route className="h-4 w-4" />
                    Деталі маршруту
                  </h2>
                  <button
                    onClick={handleCloseInspection}
                    className="p-1.5 rounded-md hover:bg-muted transition-colors"
                    title="Закрити"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {isRouteLoading ? (
                  <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                    Завантаження маршруту...
                  </div>
                ) : routeDetails && routeDetails.assignments.length > 0 ? (
                  <div className="space-y-3">
                    {/* Summary card */}
                    <div className="rounded-lg border bg-card p-4 space-y-2">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" />
                        <span>{routeDetails.request.from_station_name}</span>
                        <ArrowRight className="h-3 w-3 text-muted-foreground" />
                        <span>{routeDetails.request.to_station_name}</span>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span>Вантаж: <strong>{CARGO_TYPE_LABELS[routeDetails.request.cargo_type as keyof typeof CARGO_TYPE_LABELS] || routeDetails.request.cargo_type}</strong></span>
                        <span>Потрібно: <strong>{routeDetails.request.required_quantity}</strong></span>
                        <span>Призначено: <strong className="text-success">{routeDetails.totals.wagons_assigned}</strong></span>
                      </div>
                      <div className="flex items-center gap-4 text-xs border-t pt-2 mt-1">
                        <span>Порожній пробіг: <strong className="text-orange-500">{routeDetails.totals.total_empty_distance_km.toLocaleString("uk-UA")} км</strong></span>
                        <span>Вартість: <strong className="text-orange-500">{routeDetails.totals.total_empty_cost_uah.toLocaleString("uk-UA")} ₴</strong></span>
                      </div>
                    </div>

                    {/* Individual wagon assignments */}
                    {routeDetails.assignments.map((a, idx) => (
                      <div key={a.wagon_id} className="rounded-lg border bg-card p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold">{a.wagon_id}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                            {WAGON_TYPE_LABELS[a.wagon_type as keyof typeof WAGON_TYPE_LABELS] || a.wagon_type}
                          </span>
                        </div>

                        {/* Empty run leg */}
                        <div className="text-xs space-y-1">
                          <div className="font-semibold text-orange-500 flex items-center gap-1">
                            🚃 Порожній пробіг
                          </div>
                          <div className="text-muted-foreground pl-4">
                            {a.empty_run.path.map(p => p.name).join(' → ')}
                          </div>
                          <div className="pl-4 flex gap-3">
                            <span>{a.empty_run.distance_km.toLocaleString("uk-UA")} км</span>
                            <span className="text-orange-500 font-medium">{a.empty_run.cost_uah.toLocaleString("uk-UA")} ₴</span>
                          </div>
                        </div>

                        {/* Loaded run leg */}
                        <div className="text-xs space-y-1">
                          <div className="font-semibold text-green-600 flex items-center gap-1">
                            📦 Вантажний рейс
                          </div>
                          <div className="text-muted-foreground pl-4">
                            {a.loaded_run.path.map(p => p.name).join(' → ')}
                          </div>
                          <div className="pl-4">
                            <span>{a.loaded_run.distance_km.toLocaleString("uk-UA")} км</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                    Немає призначених вагонів для цієї заявки
                  </div>
                )}
              </>
            ) : (
              /* ── Smart suggestion panel (default) ── */
              <>
                <h2 className="section-title">🧠 Розумна пропозиція (Локальна)</h2>
                {!selectedShipment ? (
                  <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                    Оберіть заявку зліва, щоб побачити рекомендовані найближчі вагони
                  </div>
                ) : selectedShipment.status !== "pending" ? (
                  <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                    Заявка вже опрацьована
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Заявка <strong>{selectedShipment.id}</strong> — потрібно{" "}
                      {selectedShipment.wagonCount} вагонів
                    </p>
                    {suggestions.length === 0 ? (
                      <p className="text-sm text-muted-foreground">
                        Немає доступних вагонів для даного вантажу
                      </p>
                    ) : (
                      <>
                      {suggestions.map((s) => (
                        <WagonSuggestionCard
                          key={s.wagonId}
                          suggestion={s}
                          onConfirm={handleGlobalConfirm}
                        />
                      ))}
                      <p className="text-xs text-muted-foreground text-center mt-4">
                        Натисніть «Призначити» щоб запустити глобальний алгоритм для всіх очікуючих заявок.
                      </p>
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

function StatCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="stat-card">
      <div className="flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p
            className={`text-xl font-bold ${
              highlight ? "text-success" : "text-foreground"
            }`}
          >
            {value}
          </p>
        </div>
      </div>
    </div>
  );
}
