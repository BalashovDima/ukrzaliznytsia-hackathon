import { AppLayout } from "@/app/layout/AppLayout";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";
import { Banknote, TrendingUp, Train, MapPin } from "lucide-react";

export default function AnalyticsPage() {
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: () => apiClient.getStats() });
  const { data: fleet = [] } = useQuery({ queryKey: ["fleet"], queryFn: () => apiClient.getFleet() });
  const { data: shipments = [] } = useQuery({ queryKey: ["requests"], queryFn: () => apiClient.getRequests() });

  const totalWagons = fleet.length;
  const emptyWagons = fleet.filter((w) => w.isEmpty).length;
  const shipmentCount = shipments.length;
  const utilization = totalWagons ? Math.round(((totalWagons - emptyWagons) / totalWagons) * 100) : 0;
  
  const currentCost = stats?.total_empty_cost_uah || 0;
  const naiveCost = stats?.naive_empty_cost_uah || 0;
  const savings = Math.max(0, naiveCost - currentCost);

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-header">Аналітика</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Ключові показники ефективності
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl">
          <div className="stat-card space-y-2">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-success" />
              <span className="text-sm font-medium text-muted-foreground">
                Загальна економія
              </span>
            </div>
            <p className="text-3xl font-bold text-success">
              {savings.toLocaleString("uk-UA")} ₴
            </p>
            <p className="text-xs text-muted-foreground">
              За рахунок розумного підбору вагонів
            </p>
          </div>

          <div className="stat-card space-y-2">
            <div className="flex items-center gap-2">
              <Train className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Використання вагонів
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{utilization}%</p>
            <p className="text-xs text-muted-foreground">
              {totalWagons - emptyWagons} із {totalWagons} завантажено
            </p>
          </div>

          <div className="stat-card space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-info" />
              <span className="text-sm font-medium text-muted-foreground">
                Заявок оброблено
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">
              {shipmentCount}
            </p>
            <p className="text-xs text-muted-foreground">
              Активних та завершених клієнтських заявок
            </p>
          </div>

          <div className="stat-card space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-warning" />
              <span className="text-sm font-medium text-muted-foreground">
                Станцій у мережі
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">25</p>
            <p className="text-xs text-muted-foreground">
              Покриття по всій Україні
            </p>
          </div>

          <div className="stat-card space-y-2">
            <div className="flex items-center gap-2">
              <Banknote className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-muted-foreground">
                Оптимізовані витрати
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">{currentCost.toLocaleString("uk-UA")} ₴</p>
            <p className="text-xs text-muted-foreground">
              Сумарна вартість порожнього пробігу
            </p>
          </div>

          <div className="stat-card space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-destructive" />
              <span className="text-sm font-medium text-muted-foreground">
                Витрати без оптимізації
              </span>
            </div>
            <p className="text-3xl font-bold text-destructive">{naiveCost.toLocaleString("uk-UA")} ₴</p>
            <p className="text-xs text-muted-foreground">
              Витрати при жадібному (випадковому) розподілі
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
