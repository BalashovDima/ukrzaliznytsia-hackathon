import { AppLayout } from "@/app/layout/AppLayout";
import { mockStore } from "@/shared/lib/mock-store";
import { Banknote, TrendingUp, Train, MapPin } from "lucide-react";

export default function AnalyticsPage() {
  const savings = mockStore.confirmedSavings;
  const totalWagons = mockStore.wagons.length;
  const emptyWagons = mockStore.wagons.filter((w) => w.isEmpty).length;
  const shipmentCount = mockStore.shipments.length;
  const utilization = Math.round(
    ((totalWagons - emptyWagons) / totalWagons) * 100,
  );

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
              Середня вартість порожнього пробігу: 20 ₴/км
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
                Прибуток від завантажених
              </span>
            </div>
            <p className="text-3xl font-bold text-foreground">30 ₴/км</p>
            <p className="text-xs text-muted-foreground">
              За кожен кілометр під навантаженням
            </p>
          </div>

          <div className="stat-card space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-destructive" />
              <span className="text-sm font-medium text-muted-foreground">
                Вартість порожнього пробігу
              </span>
            </div>
            <p className="text-3xl font-bold text-destructive">20 ₴/км</p>
            <p className="text-xs text-muted-foreground">
              Мінімізуємо через алгоритм підбору
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
