import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getShipmentsApi } from "@/features/shipment-list/api/get-shipments";
import { ShipmentCard } from "@/features/shipment-list/ui/ShipmentCard";
import {
  TrendingUp,
  Train,
  PackageCheck,
  Banknote,
  Zap,
  X,
  MapPin,
  ArrowRight,
  Route,
  ChevronLeft,
} from "lucide-react";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  const [inspectedRequestId, setInspectedRequestId] = useState<string | null>(
    null,
  );
  // Toggle: show naive (greedy) algorithm routes on the map
  const [showNaiveRoute, setShowNaiveRoute] = useState(false);

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

  // Fetch route details when inspecting a matched requet
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
      queryClient.invalidateQueries({ queryKey: ["wagon-summary"] });
      const matchSavings = Math.max(0, (result.naive_empty_cost || 0) - result.total_empty_cost);
      toast.success(
        `Алгоритм завершив розподіл!\nВитрати: ${result.total_empty_cost.toLocaleString("uk-UA")} ₴\nЕкономія: ~${matchSavings.toLocaleString("uk-UA")} ₴`
      );
      setSelectedShipment(null);
      setInspectedRequestId(null);
    },
    onError: () => {
      toast.error("Помилка при запуску алгоритму");
    },
  });

  // Build route highlight data for the map
  const routeHighlight: RouteHighlight | null = useMemo(() => {
    if (!routeDetails || !routeDetails.assignments.length) return null;

    const emptyRunPaths = routeDetails.assignments.map((a) =>
      a.empty_run.path.map((p) => p.id),
    );
    const loadedRunPath = routeDetails.assignments[0].loaded_run.path.map(
      (p) => p.id,
    );
    const wagonOrigins = routeDetails.assignments.map(
      (a) => a.empty_run.from_station_id,
    );

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

  // Build NAIVE route highlight from naive_comparison paths
  const naiveRouteHighlight: RouteHighlight | null = useMemo(() => {
    if (!routeDetails || !routeDetails.assignments.length) return null;
    const assignmentsWithNaive = routeDetails.assignments.filter(
      (a) => a.naive_comparison !== null,
    );
    if (!assignmentsWithNaive.length) return null;

    const emptyRunPaths = assignmentsWithNaive.map((a) =>
      a.naive_comparison!.path.map((p) => p.id),
    );
    const loadedRunPath = routeDetails.assignments[0].loaded_run.path.map(
      (p) => p.id,
    );
    const wagonOrigins = assignmentsWithNaive.map(
      (a) => a.naive_comparison!.from_station_id,
    );

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
  
  const emptyRunCost = stats?.total_empty_cost_uah || 0;
  const naiveCost = stats?.naive_empty_cost_uah || 0;
  const matchSavings = Math.max(0, naiveCost - emptyRunCost);

  const handleShipmentClick = (shipment: Shipment) => {
    if (shipment.status === "pending") {
      setSelectedShipment(shipment);
      setInspectedRequestId(null);
      setShowNaiveRoute(false);
      if (window.innerWidth < 1024) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      if (inspectedRequestId === shipment.id) {
        setInspectedRequestId(null);
        setSelectedShipment(null);
        setShowNaiveRoute(false);
      } else {
        setInspectedRequestId(shipment.id);
        setSelectedShipment(shipment);
        if (window.innerWidth < 1024) {
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
      }
    }
  };

  const handleCloseInspection = () => {
    setInspectedRequestId(null);
    setSelectedShipment(null);
    setShowNaiveRoute(false);
  };

  const handleGlobalConfirm = () => {
    matchMutation.mutate();
  };

  const isInspecting = !!inspectedRequestId;
  const isPanelActive = !!selectedShipment;

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
            {matchMutation.isPending ? (
              "Обчислення..."
            ) : (
              <>
                <Zap className="h-4 w-4" />
                Запустити розумний розподіл
              </>
            )}
          </button>
        </div>

        {/* Map Visualization */}
        <div className="w-full">
          <RailwayMap 
            routeHighlight={isInspecting ? (showNaiveRoute ? naiveRouteHighlight : routeHighlight) : null} 
            showNaiveRoute={showNaiveRoute}
          />
        </div>

        {/* Stats */}
        <div className={cn("grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4", isPanelActive && "max-lg:hidden")}>
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
            icon={<Banknote className="h-5 w-5 text-orange-500" />}
            label="Витрати на порожні"
            value={`${emptyRunCost.toLocaleString("uk-UA")} ₴`}
          />
          <StatCard
            icon={<TrendingUp className="h-5 w-5 text-success" />}
            label="Зекономлено"
            value={`${matchSavings.toLocaleString("uk-UA")} ₴`}
            highlight
          />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Shipment list */}
          <div className={cn("lg:col-span-3 space-y-3", isPanelActive && "max-lg:hidden")}>
            <h2 className="section-title">Заявки на перевезення</h2>
            {isShipmentsLoading ? (
              <p className="text-sm text-muted-foreground">Завантаження...</p>
            ) : (
              <div className="space-y-3">
                {shipments.map((s) => (
                  <div
                    key={s.id}
                    className={`transition-all ${inspectedRequestId === s.id ? "ring-2 ring-primary rounded-lg" : ""}`}
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
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleCloseInspection}
                      className="lg:hidden p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                    >
                      <ChevronLeft className="h-5 w-5" />
                      <span className="text-sm font-medium">Назад</span>
                    </button>
                    <h2 className="section-title flex items-center gap-2 lg:m-0 max-lg:hidden">
                      <Route className="h-4 w-4" />
                      Деталі маршруту
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Algorithm toggle */}
                    {naiveRouteHighlight && (
                      <div className="flex items-center rounded-md border overflow-hidden text-xs font-medium">
                        <button
                          onClick={() => setShowNaiveRoute(false)}
                          className={`px-2.5 py-1 transition-colors ${
                            !showNaiveRoute
                              ? "bg-blue-600 text-white"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          🧠 Алгоритм
                        </button>
                        <button
                          onClick={() => setShowNaiveRoute(true)}
                          className={`px-2.5 py-1 transition-colors ${
                            showNaiveRoute
                              ? "bg-orange-500 text-white"
                              : "bg-background text-muted-foreground hover:bg-muted"
                          }`}
                        >
                          🎲 Жадібний
                        </button>
                      </div>
                    )}
                    <button
                      onClick={handleCloseInspection}
                      className="hidden lg:block p-1.5 rounded-md hover:bg-muted transition-colors"
                      title="Закрити"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
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
                        <span>
                          Вантаж:{" "}
                          <strong>
                            {CARGO_TYPE_LABELS[
                              routeDetails.request
                                .cargo_type as keyof typeof CARGO_TYPE_LABELS
                            ] || routeDetails.request.cargo_type}
                          </strong>
                        </span>
                        <span>
                          Потрібно:{" "}
                          <strong>
                            {routeDetails.request.required_quantity}
                          </strong>
                        </span>
                        <span>
                          Призначено:{" "}
                          <strong className="text-success">
                            {routeDetails.totals.wagons_assigned}
                          </strong>
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-xs border-t pt-2 mt-1">
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1 w-full">
                          <div className="text-muted-foreground">🧠 Алгоритм:</div>
                          <div className="font-medium text-blue-600">
                            {routeDetails.totals.total_empty_distance_km.toLocaleString("uk-UA")} км
                            {" · "}
                            {routeDetails.totals.total_empty_cost_uah.toLocaleString("uk-UA")} ₴
                          </div>
                          {routeDetails.totals.naive_empty_cost_uah > 0 && (
                            <>
                              <div className="text-muted-foreground">🎲 Випадковий:</div>
                              <div className="font-medium text-orange-500">
                                {routeDetails.totals.naive_empty_distance_km.toLocaleString("uk-UA")} км
                                {" · "}
                                {routeDetails.totals.naive_empty_cost_uah.toLocaleString("uk-UA")} ₴
                              </div>
                              <div className="text-muted-foreground">💰 Економія:</div>
                              <div className="font-bold text-emerald-600">
                                {routeDetails.totals.savings_km.toLocaleString("uk-UA")} км
                                {" · "}
                                {routeDetails.totals.savings_uah.toLocaleString("uk-UA")} ₴
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Individual wagon assignments */}
                    {routeDetails.assignments.map((a) => (
                      <div
                        key={a.wagon_id}
                        className="rounded-lg border bg-card p-4 space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-semibold">
                            {a.wagon_id}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium">
                            {WAGON_TYPE_LABELS[
                              a.wagon_type as keyof typeof WAGON_TYPE_LABELS
                            ] || a.wagon_type}
                          </span>
                        </div>

                        {/* Smart pick (optimized) */}
                        <div className="text-xs space-y-1 bg-blue-50 rounded-md px-3 py-2">
                          <div className="font-semibold text-blue-700 flex items-center gap-1">
                            🧠 Алгоритм: <span className="font-mono ml-1">{a.wagon_id}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {a.empty_run.path.map((p) => p.name).join(" → ")}
                          </div>
                          <div className="flex gap-3 font-medium text-blue-700">
                            <span>{a.empty_run.distance_km.toLocaleString("uk-UA")} км</span>
                            <span>{a.empty_run.cost_uah.toLocaleString("uk-UA")} ₴</span>
                          </div>
                        </div>

                        {/* Naive pick (greedy) */}
                        {a.naive_comparison && (
                          <div className="text-xs space-y-1 bg-orange-50 rounded-md px-3 py-2">
                            <div className="font-semibold text-orange-700 flex items-center gap-1">
                              🎲 Випадковий: <span className="font-mono ml-1">{a.naive_comparison.wagon_id}</span>
                            </div>
                            <div className="text-muted-foreground">
                              {a.naive_comparison.path.map((p) => p.name).join(" → ")}
                            </div>
                            <div className="flex gap-3 font-medium text-orange-700">
                              <span>{a.naive_comparison.distance_km.toLocaleString("uk-UA")} км</span>
                              <span>{a.naive_comparison.cost_uah.toLocaleString("uk-UA")} ₴</span>
                            </div>
                            {a.naive_comparison.savings_uah > 0 && (
                              <div className="text-emerald-700 font-bold">
                                💰 -{a.naive_comparison.savings_km.toLocaleString("uk-UA")} км · -{a.naive_comparison.savings_uah.toLocaleString("uk-UA")} ₴ економія
                              </div>
                            )}
                          </div>
                        )}

                        {/* Loaded run leg */}
                        <div className="text-xs space-y-1">
                          <div className="font-semibold text-blue-600 flex items-center gap-1">
                            📦 Вантажний рейс
                          </div>
                          <div className="text-muted-foreground pl-4">
                            {a.loaded_run.path.map((p) => p.name).join(" → ")}
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
              /* ── Pending Request Info Panel ── */
              <>
                <div className="flex items-center gap-3 mb-2">
                  <button
                    onClick={handleCloseInspection}
                    className="lg:hidden p-1.5 -ml-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex items-center gap-1"
                  >
                    <ChevronLeft className="h-5 w-5" />
                    <span className="text-sm font-medium">Назад</span>
                  </button>
                  <h2 className="section-title lg:m-0 max-lg:hidden">
                    💡 Глобальна оптимізація
                  </h2>
                </div>
                {!selectedShipment ? (
                  <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                    Оберіть заявку зліва, щоб переглянути деталі
                  </div>
                ) : selectedShipment.status !== "pending" ? (
                  <div className="rounded-lg border bg-card p-6 text-center text-sm text-muted-foreground">
                    Заявка вже опрацьована
                  </div>
                ) : (
                  <div className="rounded-lg border bg-card p-6 space-y-4">
                    <div className="text-center space-y-2">
                      <Zap className="h-8 w-8 text-orange-500 mx-auto" />
                      <h3 className="font-semibold text-base">Заявка додана до черги обробки</h3>
                      <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                        Заявка <strong>{selectedShipment.id}</strong> очікує на розподіл {selectedShipment.wagonCount} вагонів.
                      </p>
                    </div>
                    <div className="bg-muted p-4 rounded-md text-sm text-muted-foreground text-center">
                      Натисніть <strong>«Запустити розумний розподіл»</strong> вгорі сторінки, щоб застосувати алгоритм глобальної оптимізації до всіх очікуючих заявок.
                    </div>
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
