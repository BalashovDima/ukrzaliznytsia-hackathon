import type { Shipment } from "@/entities/shipment/types";
import { mockStore } from "@/shared/lib/mock-store";

export async function getShipmentsApi(): Promise<Shipment[]> {
  await new Promise((r) => setTimeout(r, 200));
  return [...mockStore.shipments].reverse();
}
