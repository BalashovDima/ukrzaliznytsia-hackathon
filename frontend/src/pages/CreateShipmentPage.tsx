import { AppLayout } from "@/app/layout/AppLayout";
import { CreateShipmentForm } from "@/features/create-shipment/ui/CreateShipmentForm";

export default function CreateShipmentPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="page-header">Нова заявка на перевезення</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Заповніть форму для створення заявки
          </p>
        </div>
        <CreateShipmentForm />
      </div>
    </AppLayout>
  );
}
