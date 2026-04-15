from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import uuid
import networkx as nx

from models import Station, Wagon, ClientRequest, Assignment, RequestStatus, WagonStatus, MatchResult, CargoType
from simulation_data import STATIC_STATIONS, STATIC_WAGONS, RAILWAY_GRAPH, generate_wagons, get_distance
from algorithm import run_matching_algorithm

app = FastAPI(title="Empty Run Buster API", version="1.0.0")

# Allow all CORS for hackathon
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In-memory Database
class AppState:
    def __init__(self):
        self.stations: List[Station] = list(STATIC_STATIONS)
        self.wagons: List[Wagon] = list(STATIC_WAGONS)
        self.requests: List[ClientRequest] = []
        self.assignments: List[Assignment] = []

        # Metrics
        self.total_empty_distance: float = 0.0
        self.total_empty_cost: float = 0.0
        self.naive_empty_distance: float = 0.0
        self.naive_empty_cost: float = 0.0

state = AppState()

@app.get("/api/stations", response_model=List[Station])
def get_stations():
    return state.stations

@app.get("/api/stations/wagon-summary")
def get_wagon_summary():
    """Per-station wagon counts for map visualisation."""
    summary = {}
    for s in state.stations:
        summary[s.id] = {
            "free": 0,
            "busy": 0,
            "en_route": 0,
            "total": 0,
            "by_type": {},
        }

    for w in state.wagons:
        sid = w.current_station_id
        if sid not in summary:
            continue
        bucket = summary[sid]
        bucket["total"] += 1

        if w.status == WagonStatus.FREE:
            bucket["free"] += 1
        elif w.status == WagonStatus.BUSY:
            bucket["busy"] += 1
        else:
            bucket["en_route"] += 1

        wt = w.type.value
        if wt not in bucket["by_type"]:
            bucket["by_type"][wt] = {"free": 0, "busy": 0, "en_route": 0}
        if w.status == WagonStatus.FREE:
            bucket["by_type"][wt]["free"] += 1
        elif w.status == WagonStatus.BUSY:
            bucket["by_type"][wt]["busy"] += 1
        else:
            bucket["by_type"][wt]["en_route"] += 1

    return summary

@app.get("/api/fleet", response_model=List[Wagon])
def get_fleet():
    return state.wagons

@app.get("/api/requests", response_model=List[ClientRequest])
def get_requests():
    return state.requests

@app.post("/api/requests", response_model=ClientRequest)
def create_request(request: ClientRequest):
    # Ensure ID is generated if not provided or just force a new one
    if not request.id or request.id == "string":
        request.id = f"REQ-{uuid.uuid4().hex[:6].upper()}"
    
    # Validation
    if request.from_station_id not in [s.id for s in state.stations]:
        raise HTTPException(status_code=400, detail="Invalid from_station_id")
    if request.to_station_id not in [s.id for s in state.stations]:
        raise HTTPException(status_code=400, detail="Invalid to_station_id")
        
    state.requests.append(request)
    return request

@app.post("/api/match", response_model=MatchResult)
def match_wagons():
    # Filter pending and partial requests
    active_requests = [r for r in state.requests if r.status in [RequestStatus.PENDING, RequestStatus.PARTIAL]]
    
    if not active_requests:
        return MatchResult(assignments=[], total_empty_distance=0.0, total_empty_cost=0.0)

    # Run the optimized matching algorithm
    match_result = run_matching_algorithm(active_requests, state.wagons)
    
    # Apply results to state
    for assignment in match_result.assignments:
        # Update wagon status
        wagon = next((w for w in state.wagons if w.id == assignment.wagon_id), None)
        if wagon:
            wagon.status = WagonStatus.EN_ROUTE_EMPTY
            wagon.destination_station_id = assignment.to_station_id
        
        # Update request status
        req = next((r for r in state.requests if r.id == assignment.request_id), None)
        if req:
            req.matched_quantity += 1
            if req.matched_quantity >= req.required_quantity:
                req.status = RequestStatus.FULFILLED
            else:
                req.status = RequestStatus.PARTIAL
                
        state.assignments.append(assignment)
        
    # Update global metrics
    state.total_empty_distance += match_result.total_empty_distance
    state.total_empty_cost += match_result.total_empty_cost
    state.naive_empty_distance += match_result.naive_empty_distance
    state.naive_empty_cost += match_result.naive_empty_cost
    
    return match_result

@app.get("/api/stats")
def get_stats():
    return {
        "total_empty_distance_km": round(state.total_empty_distance, 2),
        "total_empty_cost_uah": round(state.total_empty_cost, 2),
        "naive_empty_distance_km": round(state.naive_empty_distance, 2),
        "naive_empty_cost_uah": round(state.naive_empty_cost, 2),
        "total_assignments": len(state.assignments),
        "requests_fulfilled": len([r for r in state.requests if r.status == RequestStatus.FULFILLED]),
        "requests_pending": len([r for r in state.requests if r.status != RequestStatus.FULFILLED])
    }

@app.post("/api/simulation/step")
def simulate_step():
    """
    Advances the simulation step.
    Moves wagons that are EN_ROUTE_EMPTY to their destinations.
    """
    arrived_wagons = []
    for wagon in state.wagons:
        if wagon.status == WagonStatus.EN_ROUTE_EMPTY and wagon.destination_station_id:
            # Reached customer, cargo gets loaded...
            wagon.current_station_id = wagon.destination_station_id
            wagon.destination_station_id = None
            wagon.status = WagonStatus.FREE  # Or we could switch to EN_ROUTE_LOADED if we were tracking loaded runs
            arrived_wagons.append(wagon.id)
            
    return {"message": "Step advanced.", "arrived_wagons": arrived_wagons}

@app.get("/api/graph")
def get_graph():
    edges = []
    # Build edges list dynamically
    for u, v in RAILWAY_GRAPH.edges():
        edges.append({"source": u, "target": v})
    return {"edges": edges}

@app.get("/api/requests/{request_id}/route-details")
def get_route_details(request_id: str):
    """
    Returns detailed route info for a matched/fulfilled request:
    - Each assignment with its wagon details
    - The full shortest path for the empty run (wagon → pickup)
    - The full shortest path for the loaded run (pickup → delivery)
    """
    req = next((r for r in state.requests if r.id == request_id), None)
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req_assignments = [a for a in state.assignments if a.request_id == request_id]

    # Build station lookup
    station_map = {s.id: s for s in state.stations}

    details = []
    for a in req_assignments:
        wagon = next((w for w in state.wagons if w.id == a.wagon_id), None)

        # Compute full path for empty run (wagon origin → request origin)
        try:
            empty_path = nx.shortest_path(RAILWAY_GRAPH, a.from_station_id, a.to_station_id, weight='weight')
        except nx.NetworkXNoPath:
            empty_path = [a.from_station_id, a.to_station_id]

        # Compute full path for loaded run (request origin → request destination)
        try:
            loaded_path = nx.shortest_path(RAILWAY_GRAPH, req.from_station_id, req.to_station_id, weight='weight')
        except nx.NetworkXNoPath:
            loaded_path = [req.from_station_id, req.to_station_id]

        loaded_distance = get_distance(req.from_station_id, req.to_station_id)

        # Resolve station names for path readability
        def path_with_names(path):
            return [{"id": sid, "name": station_map[sid].name if sid in station_map else sid} for sid in path]

        details.append({
            "wagon_id": a.wagon_id,
            "wagon_type": wagon.type.value if wagon else "unknown",
            "wagon_status": wagon.status.value if wagon else "unknown",
            "empty_run": {
                "from_station_id": a.from_station_id,
                "from_station_name": station_map.get(a.from_station_id, None) and station_map[a.from_station_id].name,
                "to_station_id": a.to_station_id,
                "to_station_name": station_map.get(a.to_station_id, None) and station_map[a.to_station_id].name,
                "path": path_with_names(empty_path),
                "distance_km": round(a.distance, 1),
                "cost_uah": round(a.cost, 1),
            },
            "loaded_run": {
                "from_station_id": req.from_station_id,
                "from_station_name": station_map.get(req.from_station_id, None) and station_map[req.from_station_id].name,
                "to_station_id": req.to_station_id,
                "to_station_name": station_map.get(req.to_station_id, None) and station_map[req.to_station_id].name,
                "path": path_with_names(loaded_path),
                "distance_km": round(loaded_distance, 1),
            },
        })

    total_empty_dist = sum(d["empty_run"]["distance_km"] for d in details)
    total_empty_cost = sum(d["empty_run"]["cost_uah"] for d in details)

    return {
        "request": {
            "id": req.id,
            "from_station_id": req.from_station_id,
            "from_station_name": station_map.get(req.from_station_id, None) and station_map[req.from_station_id].name,
            "to_station_id": req.to_station_id,
            "to_station_name": station_map.get(req.to_station_id, None) and station_map[req.to_station_id].name,
            "cargo_type": req.cargo_type.value,
            "required_quantity": req.required_quantity,
            "matched_quantity": req.matched_quantity,
            "status": req.status.value,
        },
        "assignments": details,
        "totals": {
            "total_empty_distance_km": round(total_empty_dist, 1),
            "total_empty_cost_uah": round(total_empty_cost, 1),
            "wagons_assigned": len(details),
        }
    }

@app.post("/api/requests/clear")
def clear_requests():
    state.requests.clear()
    state.assignments.clear()
    state.total_empty_distance = 0.0
    state.total_empty_cost = 0.0
    state.naive_empty_distance = 0.0
    state.naive_empty_cost = 0.0
    return {"message": "All requests cleared"}

@app.post("/api/fleet/reset")
def reset_fleet():
    # Regenerate a random layout of the fleet
    new_fleet = generate_wagons(state.stations)
    state.wagons = new_fleet
    return {"message": "Fleet randomized and reset"}

@app.post("/api/requests/generate")
def generate_requests(count: int = 5):
    """Generate N random requests for demo/testing purposes."""
    import random as rng
    cargo_types = list(CargoType)
    generated = []
    for _ in range(count):
        from_st = rng.choice(state.stations)
        to_st = rng.choice([s for s in state.stations if s.id != from_st.id])
        qty = rng.randint(1, 8)
        req = ClientRequest(
            id=f"REQ-{uuid.uuid4().hex[:6].upper()}",
            from_station_id=from_st.id,
            to_station_id=to_st.id,
            cargo_type=rng.choice(cargo_types),
            required_quantity=qty,
        )
        state.requests.append(req)
        generated.append(req)
    return {"message": f"Generated {count} requests", "requests": generated}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
