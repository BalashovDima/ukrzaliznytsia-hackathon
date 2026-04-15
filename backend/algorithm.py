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
    Also computes a naive baseline (random assignment expected cost) for comparison.
    """
    all_assignments = []
    total_distance = 0.0
    total_cost = 0.0
    naive_total_distance = 0.0
    naive_total_cost = 0.0

    # Group requests by cargo type, because we can only match specific wagons to specific cargo
    requests_by_type: Dict[WagonType, List[ClientRequest]] = {wt: [] for wt in WagonType}
    for req in active_requests:
        req_wt = CARGO_TO_WAGON_MAP[req.cargo_type]
        requests_by_type[req_wt].append(req)

    # Group wagons by type
    wagons_by_type: Dict[WagonType, List[Wagon]] = {wt: [] for wt in WagonType}
    for w in available_wagons:
        if w.status == WagonStatus.FREE:
            wagons_by_type[w.type].append(w)

    # Process each type independently
    for w_type in WagonType:
        type_requests = requests_by_type[w_type]
        type_wagons = wagons_by_type[w_type]

        if not type_requests or not type_wagons:
            continue

        # Create a list of "required slots"
        # If a request needs 5 wagons, it will have 5 slots in our matrix
        required_slots = []
        for req in type_requests:
            remaining = req.required_quantity - req.matched_quantity
            for _ in range(remaining):
                required_slots.append(req)

        if not required_slots:
            continue

        # We construct a cost matrix
        # Rows = available wagons
        # Cols = required wagon slots
        num_wagons = len(type_wagons)
        num_slots = len(required_slots)

        cost_matrix = np.zeros((num_wagons, num_slots))

        for i, wagon in enumerate(type_wagons):
            for j, req in enumerate(required_slots):
                # Calculate distance from wagon's current station to request's origin station
                dist = get_distance(wagon.current_station_id, req.from_station_id)
                cost_matrix[i, j] = dist

        # Solve assignment problem
        # linear_sum_assignment finds a matching that minimizes the sum of selected elements.
        row_ind, col_ind = linear_sum_assignment(cost_matrix)

        num_assigned = len(row_ind)

        # ── Naïve baseline: expected cost of random assignment ──
        # Mean cell value × number of pairs = expected total under random matching.
        if cost_matrix.size > 0 and num_assigned > 0:
            mean_distance = float(np.mean(cost_matrix))
            naive_total_distance += mean_distance * num_assigned
            naive_total_cost += mean_distance * COST_PER_KM * num_assigned

        # Create Assignment objects based on the result
        for i, j in zip(row_ind, col_ind):
            wagon = type_wagons[i]
            req = required_slots[j]
            dist = float(cost_matrix[i, j])
            cost = dist * COST_PER_KM
            
            assignment = Assignment(
                wagon_id=wagon.id,
                request_id=req.id,
                from_station_id=wagon.current_station_id,
                to_station_id=req.from_station_id,
                distance=dist,
                cost=cost
            )
            all_assignments.append(assignment)
            total_distance += dist
            total_cost += cost

    return MatchResult(
        assignments=all_assignments,
        total_empty_distance=total_distance,
        total_empty_cost=total_cost,
        naive_empty_distance=naive_total_distance,
        naive_empty_cost=naive_total_cost,
    )
