import type { CargoType } from "@/entities/wagon/types";
import type { WagonSuggestion } from "@/entities/shipment/types";
import { findWagonSuggestions } from "../model/find-suggestion";

export async function getWagonSuggestion(
  originStationId: string,
  cargoType: CargoType,
  count: number = 3,
): Promise<WagonSuggestion[]> {
  return findWagonSuggestions(originStationId, cargoType, count);
}
