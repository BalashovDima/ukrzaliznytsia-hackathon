import type { CargoType } from "@/entities/wagon/types";
import type { WagonSuggestion } from "@/entities/shipment/types";
import { findWagonSuggestions } from "../model/find-suggestion";

/** Mock API endpoint: GET /wagon-suggestion */
export async function getWagonSuggestion(
  originStationId: string,
  cargoType: CargoType,
  count: number = 3,
): Promise<WagonSuggestion[]> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 300));
  return findWagonSuggestions(originStationId, cargoType, count);
}
