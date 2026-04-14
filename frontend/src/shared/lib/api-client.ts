import type { Shipment, WagonSuggestion } from "@/entities/shipment/types";
import type { Wagon } from "@/entities/wagon/types";

const API_BASE = "http://127.0.0.1:8000/api";

type BackendRequest = {
  id: string;
  from_station_id: string;
  to_station_id: string;
  cargo_type: string;
  required_quantity: number;
  matched_quantity: number;
  status: string;
};

type BackendWagon = {
  id: string;
  type: string;
  current_station_id: string;
  status: string;
  destination_station_id: string | null;
};

type BackendStats = {
  total_empty_distance_km: number;
  total_empty_cost_uah: number;
  total_assignments: number;
  requests_fulfilled: number;
  requests_pending: number;
};

// Mappers
function mapRequestToShipment(req: BackendRequest): Shipment {
  // Map backend status to frontend ShipmentStatus
  let sStatus: Shipment["status"] = "pending";
  if (req.status === "partial") sStatus = "matched"; // partial -> matched for UI simplicity
  if (req.status === "fulfilled") sStatus = "confirmed";

  return {
    id: req.id,
    cargoType: req.cargo_type as any,
    wagonCount: req.required_quantity,
    originStationId: req.from_station_id,
    destinationStationId: req.to_station_id,
    deadline: new Date().toISOString(), // Mock deadline since backend doesn't store it
    status: sStatus,
    createdAt: new Date().toISOString(), // Mock created it since backend doesn't store it
  };
}

function mapWagon(w: BackendWagon): Wagon {
  return {
    id: w.id,
    type: w.type as any,
    currentStationId: w.current_station_id,
    isEmpty: w.status === "free" || w.status === "en_route_empty",
  };
}

class ApiClient {
  async getStats(): Promise<BackendStats> {
    const r = await fetch(`${API_BASE}/stats`);
    if (!r.ok) throw new Error("Failed to fetch stats");
    return r.json();
  }

  async getRequests(): Promise<Shipment[]> {
    const r = await fetch(`${API_BASE}/requests`);
    if (!r.ok) throw new Error("Failed to fetch requests");
    const data: BackendRequest[] = await r.json();
    return data.map(mapRequestToShipment);
  }

  async createRequest(values: {
    cargoType: string;
    wagonCount: number;
    originStationId: string;
    destinationStationId: string;
    deadline: string;
  }): Promise<Shipment> {
    const payload = {
      from_station_id: values.originStationId,
      to_station_id: values.destinationStationId,
      cargo_type: values.cargoType,
      required_quantity: values.wagonCount,
    };
    
    const r = await fetch(`${API_BASE}/requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    
    if (!r.ok) throw new Error("Failed to create request");
    const data = await r.json();
    return mapRequestToShipment(data);
  }

  async getFleet(): Promise<Wagon[]> {
    const r = await fetch(`${API_BASE}/fleet`);
    if (!r.ok) throw new Error("Failed to fetch fleet");
    const data: BackendWagon[] = await r.json();
    return data.map(mapWagon);
  }

  async getStations(): Promise<{ id: string; name: string }[]> {
    const r = await fetch(`${API_BASE}/stations`);
    if (!r.ok) throw new Error("Failed to fetch stations");
    return r.json();
  }

  async runMatching(): Promise<any> {
    const r = await fetch(`${API_BASE}/match`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
    });
    if (!r.ok) throw new Error("Failed to run matching");
    return r.json();
  }
}

export const apiClient = new ApiClient();
