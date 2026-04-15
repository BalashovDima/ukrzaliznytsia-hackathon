import numpy as np
from scipy.optimize import linear_sum_assignment
from typing import List, Dict
from models import ClientRequest, Wagon, Assignment, WagonStatus, CargoType, WagonType, MatchResult
from simulation_data import get_distance

# Map CargoType to WagonType
CARGO_TO_WAGON_MAP = {
    CargoType.ORE: WagonType.GONDOLA,
    CargoType.CRUSHED_STONE: WagonType.GONDOLA,
    CargoType.GRAIN: WagonType.GRAIN_HOPPER,
    CargoType.CEMENT: WagonType.CEMENT_HOPPER,
}

COST_PER_KM = 20.0  # UAH


def run_matching_algorithm(active_requests: List[ClientRequest], available_wagons: List[Wagon]) -> MatchResult:
    """
    Matches available wagons to clients' requests minimizing empty run distances.
    Prioritizes full fulfillment.

    Also runs a real greedy (naïve) algorithm as a baseline:
      - Assigns the first available wagon in fleet order (no optimization).
      - Stores those as naive_assignments so routes can be compared side-by-side.
    """
    all_assignments = []
    naive_assignments = []
    total_distance = 0.0
    total_cost = 0.0
    naive_total_distance = 0.0
    naive_total_cost = 0.0

    # Group requests by cargo type
    requests_by_type: Dict[WagonType, List[ClientRequest]] = {wt: [] for wt in WagonType}
    for req in active_requests:
        req_wt = CARGO_TO_WAGON_MAP[req.cargo_type]
        requests_by_type[req_wt].append(req)

    # Group free wagons by type
    wagons_by_type: Dict[WagonType, List[Wagon]] = {wt: [] for wt in WagonType}
    for w in available_wagons:
        if w.status == WagonStatus.FREE:
            wagons_by_type[w.type].append(w)

    # Process each wagon type independently
    for w_type in WagonType:
        type_requests = requests_by_type[w_type]
        type_wagons = wagons_by_type[w_type]

        if not type_requests or not type_wagons:
            continue

        # Expand requests into individual wagon slots
        required_slots = []
        for req in type_requests:
            remaining = req.required_quantity - req.matched_quantity
            for _ in range(remaining):
                required_slots.append(req)

        if not required_slots:
            continue

        num_wagons = len(type_wagons)
        num_slots = len(required_slots)

        # ── Build cost matrix (rows=wagons, cols=slots) ──────────────────
        cost_matrix = np.zeros((num_wagons, num_slots))
        for i, wagon in enumerate(type_wagons):
            for j, req in enumerate(required_slots):
                dist = get_distance(wagon.current_station_id, req.from_station_id)
                cost_matrix[i, j] = dist

        # ── Optimized: Hungarian algorithm ───────────────────────────────
        row_ind, col_ind = linear_sum_assignment(cost_matrix)

        for i, j in zip(row_ind, col_ind):
            wagon = type_wagons[i]
            req = required_slots[j]
            dist = float(cost_matrix[i, j])
            cost = dist * COST_PER_KM
            all_assignments.append(Assignment(
                wagon_id=wagon.id,
                request_id=req.id,
                from_station_id=wagon.current_station_id,
                to_station_id=req.from_station_id,
                distance=dist,
                cost=cost,
            ))
            total_distance += dist
            total_cost += cost

        # ── Naïve: first-available greedy ────────────────────────────────
        # Assign the first free wagon (in fleet insertion order) to each slot.
        # This simulates a dispatcher who picks without looking at distances.
        naive_available = list(range(num_wagons))  # wagon indices still available
        for j, req in enumerate(required_slots):
            if not naive_available:
                break
            i = naive_available.pop(0)  # take the first wagon in list
            wagon = type_wagons[i]
            dist = float(cost_matrix[i, j])
            cost = dist * COST_PER_KM
            naive_assignments.append(Assignment(
                wagon_id=wagon.id,
                request_id=req.id,
                from_station_id=wagon.current_station_id,
                to_station_id=req.from_station_id,
                distance=dist,
                cost=cost,
            ))
            naive_total_distance += dist
            naive_total_cost += cost

    return MatchResult(
        assignments=all_assignments,
        total_empty_distance=total_distance,
        total_empty_cost=total_cost,
        naive_assignments=naive_assignments,
        naive_empty_distance=naive_total_distance,
        naive_empty_cost=naive_total_cost,
    )
