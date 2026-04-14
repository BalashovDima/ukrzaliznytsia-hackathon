import type { Shipment } from "@/entities/shipment/types";
import { apiClient } from "@/shared/lib/api-client";

export async function getShipmentsApi(): Promise<Shipment[]> {
  const shipments = await apiClient.getRequests();
  return shipments.reverse(); // Show newest first
}
