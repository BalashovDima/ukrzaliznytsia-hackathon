# Empty Run Buster — System Overview

> Technical documentation describing how the system works under the hood.

---

## 1. Problem Statement

When a client requests cargo transport (e.g. grain from Одеса to Львів), wagons of the correct type need to be sent to the **origin station** first. If the nearest suitable wagon is currently sitting in Харків, it must travel Харків → Одеса **empty** — this is called an **empty run** (порожній пробіг). The system's goal is to **minimize the total cost of empty runs** across all pending requests simultaneously.

---

## 2. Architecture Overview

```
┌─────────────────┐        ┌──────────────────────────────┐
│   Frontend       │  HTTP  │   Backend (FastAPI)           │
│   (React + Vite) │◄──────►│                              │
│                  │        │  ┌──────────────────────────┐ │
│  • RailwayMap    │        │  │  In-memory State         │ │
│  • LogistDashboard│       │  │  - stations[]            │ │
│  • DevPanel      │        │  │  - wagons[]              │ │
│                  │        │  │  - requests[]            │ │
│                  │        │  │  - assignments[]         │ │
│                  │        │  └──────────────────────────┘ │
│                  │        │  ┌──────────────────────────┐ │
│                  │        │  │  Algorithm (scipy)       │ │
│                  │        │  │  Hungarian method        │ │
│                  │        │  └──────────────────────────┘ │
│                  │        │  ┌──────────────────────────┐ │
│                  │        │  │  Railway Graph (networkx)│ │
│                  │        │  │  Dijkstra shortest paths │ │
│                  │        │  └──────────────────────────┘ │
└─────────────────┘        └──────────────────────────────┘
```

**Key technologies:**
- **Backend**: Python, FastAPI, NetworkX, NumPy, SciPy
- **Frontend**: React, TypeScript, Leaflet (react-leaflet), TanStack Query

---

## 3. Railway Graph & Distance Calculation

### 3.1 Graph Construction

The railway network is modeled as a **weighted undirected graph** using NetworkX.

- **Nodes** = 25 Ukrainian stations (defined in `FRONTEND_STATIONS`)
- **Edges** = manually defined railway connections (defined in `RAILWAY_CONNECTIONS`)
- **Edge weight** = Euclidean distance between station coordinates (in degrees)

```python
# Edge weight calculation (simulation_data.py)
dist = ((lat_a - lat_b)**2 + (lng_a - lng_b)**2)**0.5
```

### 3.2 Distance Matrix

At startup, the system pre-computes **all-pairs shortest path distances** using Dijkstra's algorithm:

```python
DISTANCE_MATRIX = dict(nx.all_pairs_dijkstra_path_length(RAILWAY_GRAPH, weight='weight'))
```

This gives O(1) lookup for the distance between any two stations.

### 3.3 Unit Conversion

Graph weights are in **degrees**. To convert to kilometres:

```python
distance_km = graph_distance * 111.0
```

> The `111.0` factor approximates **1 degree ≈ 111 km** (valid for mid-latitudes like Ukraine ~48°N).

> [!NOTE]
> This is a simplification. Real distances would account for latitude-dependent longitude scaling and actual rail track paths. For the hackathon demo this is sufficiently accurate.

---

## 4. The Matching Algorithm

**File:** `algorithm.py`  
**Solver:** `scipy.optimize.linear_sum_assignment` (Hungarian algorithm)

### 4.1 Input

| Input | Description |
|-------|-------------|
| `active_requests` | List of `ClientRequest` objects with status `PENDING` or `PARTIAL` |
| `available_wagons` | Full list of all `Wagon` objects (filtered to `FREE` status internally) |

Each request specifies:
- `from_station_id` — where the cargo needs to be **picked up**
- `to_station_id` — where the cargo needs to be **delivered**
- `cargo_type` — one of: `ore`, `crushed_stone`, `grain`, `cement`
- `required_quantity` — how many wagons are needed
- `matched_quantity` — how many have already been assigned (for partial matches)

### 4.2 Cargo → Wagon Type Mapping

Not every wagon can carry every cargo. The mapping is:

| Cargo Type | Required Wagon Type |
|------------|-------------------|
| Ore (руда) | Gondola (піввагон) |
| Crushed Stone (щебінь) | Gondola (піввагон) |
| Grain (зерно) | Grain Hopper (зерновоз) |
| Cement (цемент) | Cement Hopper (цементовоз) |

### 4.3 Algorithm Steps

The algorithm processes **each wagon type independently**:

#### Step 1: Group by wagon type

```
requests_by_type[GONDOLA]      = [req_A (ore, needs 3), req_B (stone, needs 2)]
requests_by_type[GRAIN_HOPPER] = [req_C (grain, needs 5)]
...
```

#### Step 2: Expand to slot-level

Each request that needs N wagons becomes N individual "slots" in the matrix. Example: if `req_A` needs 3 gondola wagons, it produces 3 slots — all pointing to the same `from_station_id`.

```
slots = [req_A, req_A, req_A, req_B, req_B]  // 5 total slots for gondola
```

#### Step 3: Build the cost matrix

A 2D matrix where:
- **Rows** = available free wagons of this type
- **Columns** = required wagon slots
- **Cell value** = `get_distance(wagon.current_station, request.from_station)` — the empty run distance in km

```
                  slot_0(req_A)  slot_1(req_A)  slot_2(req_A)  slot_3(req_B)  slot_4(req_B)
wagon_GON_001     234.5          234.5          234.5          561.2          561.2
wagon_GON_002     678.9          678.9          678.9          112.3          112.3
wagon_GON_003     445.1          445.1          445.1          890.4          890.4
...
```

> [!IMPORTANT]
> Note that duplicate slots for the same request have identical distances. This allows the optimizer to assign multiple wagons to one request.

#### Step 4: Solve with Hungarian Algorithm

```python
row_ind, col_ind = linear_sum_assignment(cost_matrix)
```

`linear_sum_assignment` solves the **assignment problem** — it finds a one-to-one matching between wagons and slots that **minimizes the total sum of selected distances**.

- **Time complexity:** O(n³) where n = max(num_wagons, num_slots)
- **Optimality:** The solution is **globally optimal** for the given cost matrix — no other assignment can achieve a lower total empty run distance.

> [!NOTE]
> If there are more wagons than slots, some wagons stay unassigned (which is fine).
> If there are more slots than wagons, some slots go unfilled (request becomes `PARTIAL`).

#### Step 5: Create assignments

For each matched (wagon, slot) pair:
```python
assignment = Assignment(
    wagon_id     = wagon.id,
    request_id   = slot.request.id,
    from_station = wagon.current_station,  # where wagon is now
    to_station   = request.from_station,   # where cargo pickup is
    distance     = empty_run_km,
    cost         = empty_run_km * COST_PER_KM
)
```

### 4.4 Output

```python
MatchResult(
    assignments=[...],           # list of Assignment objects
    total_empty_distance=1234.5, # sum of all empty run distances (km)
    total_empty_cost=24690.0     # sum of all costs (UAH)
)
```

---

## 5. Cost Calculation

### 5.1 Formula

```
cost = empty_run_distance_km × COST_PER_KM
```

Where:
- `COST_PER_KM` = **20.0 UAH/km** (configurable constant in `algorithm.py`)
- `empty_run_distance_km` = shortest path distance through the railway graph, converted from degrees to km

### 5.2 What counts as "cost"

Only the **empty run** (wagon's current position → cargo pickup point) incurs cost in the optimization. The **loaded run** (pickup → delivery) is the same regardless of which wagon is chosen, so it's not part of the optimization objective.

### 5.3 Example

A gondola wagon at Харків (st_05) is assigned to a request that loads at Одеса (st_03).

```
Shortest path: Харків → Полтава → Кременчук → Знам'янка → Миколаїв → Одеса
Graph distance: ~6.8 degrees
Distance in km: 6.8 × 111 ≈ 754.8 km
Cost: 754.8 × 20 = 15,096 UAH
```

---

## 6. State Management & Simulation

### 6.1 In-Memory State

All data lives in `AppState` (no database):

| Field | Description |
|-------|-------------|
| `stations` | 25 stations (immutable after init) |
| `wagons` | 450 wagons (300 gondola, 100 grain hopper, 50 cement hopper) |
| `requests` | Client requests (created via API or generated) |
| `assignments` | Results of matching algorithm runs |
| `total_empty_distance` | Running total of empty km |
| `total_empty_cost` | Running total of empty cost |

### 6.2 Wagon Lifecycle

```
FREE → (algorithm matches) → EN_ROUTE_EMPTY → (simulation step) → FREE
```

1. **FREE**: Wagon is at a station, available for assignment
2. **EN_ROUTE_EMPTY**: Algorithm assigned it; it's traveling empty to the pickup station
3. **Simulation step** (`POST /api/simulation/step`): All EN_ROUTE_EMPTY wagons instantly arrive at their destination and become FREE again
4. **BUSY**: ~30% of wagons start as BUSY (simulating already-loaded wagons). These are excluded from matching.

### 6.3 Request Lifecycle

```
PENDING → (partial match) → PARTIAL → (full match) → FULFILLED
```

- `matched_quantity` tracks how many wagons have been assigned so far
- When `matched_quantity >= required_quantity` → status becomes `FULFILLED`

---

## 7. Route Visualization

When inspecting a fulfilled request (`GET /api/requests/{id}/route-details`), the backend computes:

1. **Empty run path**: `nx.shortest_path(graph, wagon_station, pickup_station)` — the station-by-station route the wagon travels empty
2. **Loaded run path**: `nx.shortest_path(graph, pickup_station, delivery_station)` — the route the loaded cargo takes

These are drawn on the map:
- **Orange dashed line** = empty run
- **Green solid line** = loaded run
- **В marker** = wagon origin
- **З marker** = loading station
- **Д marker** = delivery station

---

## 8. Fleet Composition

| Wagon Type | Count | ID Format | Carries |
|------------|-------|-----------|---------|
| Gondola (піввагон) | 300 | `W-GON-001` | Ore, Crushed Stone |
| Grain Hopper (зерновоз) | 100 | `W-GRA-001` | Grain |
| Cement Hopper (цементовоз) | 50 | `W-CEM-001` | Cement |

**Initial distribution**: Random across all 25 stations (seeded with `random.seed(42)` for reproducibility).  
**Initial status**: ~70% FREE, ~30% BUSY.

---

## 9. API Endpoints Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/stations` | List all stations |
| GET | `/api/stations/wagon-summary` | Per-station wagon count breakdown |
| GET | `/api/fleet` | List all wagons |
| GET | `/api/requests` | List all client requests |
| POST | `/api/requests` | Create a new request |
| POST | `/api/requests/generate?count=N` | Generate N random requests |
| POST | `/api/requests/clear` | Delete all requests & assignments |
| POST | `/api/match` | Run the matching algorithm |
| GET | `/api/requests/{id}/route-details` | Get assignment routes for a request |
| POST | `/api/simulation/step` | Advance simulation (deliver en-route wagons) |
| POST | `/api/fleet/reset` | Randomize all wagon positions |
| GET | `/api/graph` | Get railway graph edges |
| GET | `/api/stats` | Get global metrics |

---

## 10. Key Design Decisions

1. **Hungarian algorithm over greedy**: A greedy approach (assign closest wagon first) can miss globally optimal solutions. The Hungarian method guarantees minimum total distance.

2. **Per-type independent solving**: Since cargo types are strictly mapped to wagon types, solving each type independently doesn't lose optimality — a gondola can never fulfill a grain request anyway.

3. **Slot expansion**: Expanding a request for N wagons into N identical slots is the standard way to handle multi-unit demand in assignment problems without breaking the one-to-one structure.

4. **Pre-computed distance matrix**: Computing all-pairs Dijkstra once at startup (O(V² log V)) is much faster than computing paths on-the-fly during matching.

5. **Degree-based distances**: Using coordinate geometry instead of real rail distances is a simplification, but the relative ordering of distances is preserved — the optimizer still picks the closest wagon.
