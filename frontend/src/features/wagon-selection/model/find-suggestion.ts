import type { CargoType, WagonType } from "@/entities/wagon/types";
import type { WagonSuggestion } from "@/entities/shipment/types";
import { CARGO_TO_WAGON } from "@/entities/wagon/types";
import { getStationById } from "@/shared/config/stations";
import { haversineDistance } from "@/shared/lib/distance";
import { apiClient } from "@/shared/lib/api-client";

const COST_PER_KM_EMPTY = 20;

export async function findWagonSuggestions(
  originStationId: string,
  cargoType: CargoType,
  count: number,
): Promise<WagonSuggestion[]> {
  const requiredType: WagonType = CARGO_TO_WAGON[cargoType];
  const originStation = getStationById(originStationId);
  if (!originStation) return [];

  const wagons = await apiClient.getFleet();

  const candidates = wagons
    .filter((w) => w.type === requiredType && w.isEmpty)
    .map((w) => {
      const wStation = getStationById(w.currentStationId);
      if (!wStation) return null;
      const dist = haversineDistance(
        originStation.lat,
        originStation.lng,
        wStation.lat,
        wStation.lng,
      );
      return {
        wagonId: w.id,
        wagonType: w.type,
        currentStationId: w.currentStationId,
        currentStationName: wStation.name,
        distanceKm: dist,
        savingsUah: dist * COST_PER_KM_EMPTY,
      } satisfies WagonSuggestion;
    })
    .filter(Boolean) as WagonSuggestion[];

  candidates.sort((a, b) => a.distanceKm - b.distanceKm);
  return candidates.slice(0, count);
}
