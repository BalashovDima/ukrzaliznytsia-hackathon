from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Dict
import uuid

from models import Station, Wagon, ClientRequest, Assignment, RequestStatus, WagonStatus, MatchResult
from simulation_data import STATIC_STATIONS, STATIC_WAGONS
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

state = AppState()

@app.get("/api/stations", response_model=List[Station])
def get_stations():
    return state.stations

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
    
    return match_result

@app.get("/api/stats")
def get_stats():
    return {
        "total_empty_distance_km": round(state.total_empty_distance, 2),
        "total_empty_cost_uah": round(state.total_empty_cost, 2),
        "total_assignments": len(state.assignments),
        "requests_fulfilled": len([r for r in state.requests if r.status == RequestStatus.FULFILLED]),
        "requests_pending": len([r for r in state.requests if r.status != RequestStatus.FULFILLED])
    }

@app.post("/api/simulation/step")
def simulate_step():
    """
    Advances the simulation step.
    Moves wagons that are EN_ROUTE_EMPTY to their destinations.
    Normally, we'd calculate movement along the graph. For the MVP, we just teleport them to destination
    and switch their status back to FREE, assuming they unloaded (or transitioned to full loaded run skipping the loaded step).
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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
