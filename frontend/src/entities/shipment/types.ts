import type { CargoType } from "@/entities/wagon/types";

export type ShipmentStatus =
  | "pending"
  | "matched"
  | "confirmed"
  | "in_transit"
  | "delivered";

export interface Shipment {
  id: string;
  cargoType: CargoType;
  wagonCount: number;
  originStationId: string;
  destinationStationId: string;
  deadline: string; // ISO date
  status: ShipmentStatus;
  createdAt: string;
}

export interface WagonSuggestion {
  wagonId: string;
  wagonType: string;
  currentStationId: string;
  currentStationName: string;
  distanceKm: number;
  savingsUah: number;
}
