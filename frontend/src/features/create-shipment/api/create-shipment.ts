import type { Shipment } from "@/entities/shipment/types";
import type { CreateShipmentValues } from "../types";
import { apiClient } from "@/shared/lib/api-client";

export async function createShipmentApi(
  values: CreateShipmentValues,
): Promise<Shipment> {
  return await apiClient.createRequest(values);
}
