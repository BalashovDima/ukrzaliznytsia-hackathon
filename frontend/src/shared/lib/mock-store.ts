import type { Wagon } from "@/entities/wagon/types";
import type { Shipment } from "@/entities/shipment/types";
import { STATIONS } from "@/shared/config/stations";

function generateWagons(): Wagon[] {
  const wagons: Wagon[] = [];
  const types: Wagon["type"][] = ["gondola", "grain_hopper", "cement_hopper"];
  const distribution = { gondola: 220, grain_hopper: 130, cement_hopper: 100 };

  let idx = 0;
  for (const type of types) {
    const count = distribution[type];
    for (let i = 0; i < count; i++) {
      const station = STATIONS[idx % STATIONS.length];
      wagons.push({
        id: `W-${String(idx + 1).padStart(4, "0")}`,
        type,
        currentStationId: station.id,
        isEmpty: Math.random() > 0.3, // ~70% empty
      });
      idx++;
    }
  }
  return wagons;
}

class MockStore {
  wagons: Wagon[];
  shipments: Shipment[];
  confirmedSavings: number;

  constructor() {
    this.wagons = generateWagons();
    this.shipments = [
      {
        id: "SH-001",
        cargoType: "ore",
        wagonCount: 12,
        originStationId: "st-04",
        destinationStationId: "st-10",
        deadline: "2026-04-10",
        status: "pending",
        createdAt: "2026-04-03T10:00:00Z",
      },
      {
        id: "SH-002",
        cargoType: "grain",
        wagonCount: 8,
        originStationId: "st-07",
        destinationStationId: "st-03",
        deadline: "2026-04-12",
        status: "pending",
        createdAt: "2026-04-03T14:00:00Z",
      },
      {
        id: "SH-003",
        cargoType: "cement",
        wagonCount: 5,
        originStationId: "st-02",
        destinationStationId: "st-12",
        deadline: "2026-04-08",
        status: "matched",
        createdAt: "2026-04-02T09:00:00Z",
      },
      {
        id: "SH-004",
        cargoType: "crushed_stone",
        wagonCount: 15,
        originStationId: "st-05",
        destinationStationId: "st-01",
        deadline: "2026-04-15",
        status: "confirmed",
        createdAt: "2026-04-01T08:00:00Z",
      },
    ];
    this.confirmedSavings = 48600;
  }

  addShipment(shipment: Shipment) {
    this.shipments.push(shipment);
  }

  confirmSuggestion(savingsUah: number) {
    this.confirmedSavings += savingsUah;
  }
}

export const mockStore = new MockStore();
