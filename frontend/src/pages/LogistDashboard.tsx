import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getShipmentsApi } from "@/features/shipment-list/api/get-shipments";
import { getWagonSuggestion } from "@/features/wagon-selection/api/get-suggestion";
import { ShipmentCard } from "@/features/shipment-list/ui/ShipmentCard";
import { WagonSuggestionCard } from "@/features/wagon-selection/ui/WagonSuggestionCard";
import { TrendingUp, Train, PackageCheck, Banknote, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { AppLayout } from "@/app/layout/AppLayout";
import type { Shipment } from "@/entities/shipment/types";
import { apiClient } from "@/shared/lib/api-client";
import { RailwayMap } from "@/features/map/RailwayMap";

export default function LogistDashboard() {
  const queryClient = useQueryClient();
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(
    null,
  );

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
    enabled: !!selectedShipment,
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
      setSelectedShipment(null); // Clear selection since states changed
    },
    onError: () => {
      toast.error("Помилка при запуску алгоритму");
    }
  });

  const pendingCount = shipments.filter((s) => s.status === "pending").length;
  const totalWagons = fleet.length;
  const emptyWagons = fleet.filter((w) => w.isEmpty).length;
  const matchSavings = stats?.total_empty_cost_uah || 0; // Displaying cost as savings metric for hackathon demo

  const handleGlobalConfirm = () => {
    matchMutation.mutate();
  };

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
          <RailwayMap />
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
                  <ShipmentCard
                    key={s.id}
                    shipment={s}
                    onClick={() => setSelectedShipment(s)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Smart suggestion panel */}
          <div className="lg:col-span-2 space-y-3">
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
