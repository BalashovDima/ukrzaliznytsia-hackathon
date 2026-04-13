import type { Shipment } from "@/entities/shipment/types";
import type { CreateShipmentValues } from "../types";
import { mockStore } from "@/shared/lib/mock-store";

let counter = mockStore.shipments.length;

export async function createShipmentApi(
  values: CreateShipmentValues,
): Promise<Shipment> {
  await new Promise((r) => setTimeout(r, 400));
  counter++;
  const shipment: Shipment = {
    id: `SH-${String(counter).padStart(3, "0")}`,
    cargoType: values.cargoType,
    wagonCount: values.wagonCount,
    originStationId: values.originStationId,
    destinationStationId: values.destinationStationId,
    deadline: values.deadline,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  mockStore.addShipment(shipment);
  return shipment;
}
