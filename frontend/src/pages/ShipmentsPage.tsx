import { useQuery } from "@tanstack/react-query";
import { getShipmentsApi } from "@/features/shipment-list/api/get-shipments";
import { ShipmentCard } from "@/features/shipment-list/ui/ShipmentCard";
import { AppLayout } from "@/app/layout/AppLayout";

export default function ShipmentsPage() {
  const { data: shipments = [], isLoading } = useQuery({
    queryKey: ["shipments"],
    queryFn: getShipmentsApi,
  });

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-header">Всі заявки</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {shipments.length} заявок у системі
          </p>
        </div>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Завантаження...</p>
        ) : (
          <div className="space-y-3 max-w-3xl">
            {shipments.map((s) => (
              <ShipmentCard key={s.id} shipment={s} />
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
