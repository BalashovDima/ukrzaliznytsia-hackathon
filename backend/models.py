from enum import Enum
from typing import List, Optional, Dict
from pydantic import BaseModel, Field

class StationType(str, Enum):
    SORTING = "sorting"
    BORDER = "border"
    PORT = "port"
    STANDARD = "standard"

class Station(BaseModel):
    id: str
    name: str
    type: StationType
    x: float
    y: float

class WagonType(str, Enum):
    GONDOLA = "gondola"
    GRAIN_HOPPER = "grain_hopper"
    CEMENT_HOPPER = "cement_hopper"

class WagonStatus(str, Enum):
    FREE = "free"
    BUSY = "busy"
    EN_ROUTE_EMPTY = "en_route_empty"
    EN_ROUTE_LOADED = "en_route_loaded"

class Wagon(BaseModel):
    id: str
    type: WagonType
    current_station_id: str
    status: WagonStatus = WagonStatus.FREE
    destination_station_id: Optional[str] = None

class CargoType(str, Enum):
    ORE = "ore"
    CRUSHED_STONE = "crushed_stone"
    GRAIN = "grain"
    CEMENT = "cement"

class RequestStatus(str, Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    FULFILLED = "fulfilled"

class ClientRequest(BaseModel):
    id: Optional[str] = None
    from_station_id: str
    to_station_id: str
    cargo_type: CargoType
    required_quantity: int
    matched_quantity: int = 0
    status: RequestStatus = RequestStatus.PENDING

class Assignment(BaseModel):
    wagon_id: str
    request_id: str
    from_station_id: str
    to_station_id: str
    distance: float
    cost: float

class MatchResult(BaseModel):
    assignments: List[Assignment]
    total_empty_distance: float
    total_empty_cost: float
    naive_empty_distance: float = 0.0
    naive_empty_cost: float = 0.0
