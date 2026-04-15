import random
import networkx as nx
from models import Station, StationType, Wagon, WagonType, WagonStatus
from typing import List, Tuple, Dict

# Set random seed for reproducible hackathon demo
random.seed(42)

# ──────────────────────────────────────────────────────────────
# Station type is set per-station below.  To change a station's
# type, just swap the "type" value — no other code to touch.
#
# Available types:  "sorting"  "border"  "port"  "standard"
# ──────────────────────────────────────────────────────────────
FRONTEND_STATIONS = [
  {"id": "st_01", "name": "Київ-Пасажирський", "type": "sorting",  "lat": 50.4401, "lng": 30.4927},
  {"id": "st_02", "name": "Львів",             "type": "sorting",  "lat": 49.8397, "lng": 24.0297},
  {"id": "st_03", "name": "Одеса",             "type": "port",     "lat": 46.4825, "lng": 30.7233},
  {"id": "st_04", "name": "Дніпро",            "type": "standard", "lat": 48.4647, "lng": 35.0462},
  {"id": "st_05", "name": "Харків",            "type": "standard", "lat": 49.9935, "lng": 36.2304},
  {"id": "st_06", "name": "Запоріжжя",         "type": "standard", "lat": 47.8388, "lng": 35.1396},
  {"id": "st_07", "name": "Вінниця",           "type": "standard", "lat": 49.2331, "lng": 28.4682},
  {"id": "st_08", "name": "Полтава",           "type": "standard", "lat": 49.5883, "lng": 34.5514},
  {"id": "st_09", "name": "Чернігів",          "type": "standard", "lat": 51.4982, "lng": 31.2893},
  {"id": "st_10", "name": "Кривий Ріг",        "type": "standard", "lat": 47.9105, "lng": 33.3918},
  {"id": "st_11", "name": "Суми",              "type": "standard", "lat": 50.9077, "lng": 34.7981},
  {"id": "st_12", "name": "Житомир",           "type": "standard", "lat": 50.2547, "lng": 28.6587},
  {"id": "st_13", "name": "Хмельницький",      "type": "standard", "lat": 49.4229, "lng": 26.9871},
  {"id": "st_14", "name": "Черкаси",           "type": "standard", "lat": 49.4444, "lng": 32.0598},
  {"id": "st_15", "name": "Рівне",             "type": "standard", "lat": 50.6199, "lng": 26.2516},
  {"id": "st_16", "name": "Івано-Франківськ",  "type": "standard", "lat": 48.9226, "lng": 24.7111},
  {"id": "st_17", "name": "Тернопіль",         "type": "standard", "lat": 49.5535, "lng": 25.5948},
  {"id": "st_18", "name": "Луцьк",             "type": "border",   "lat": 50.7472, "lng": 25.3254},
  {"id": "st_19", "name": "Ужгород",           "type": "border",   "lat": 48.6208, "lng": 22.2879},
  {"id": "st_20", "name": "Миколаїв",          "type": "port",     "lat": 46.975,  "lng": 32.0},
  {"id": "st_21", "name": "Кременчук",         "type": "standard", "lat": 49.0658, "lng": 33.42},
  {"id": "st_22", "name": "Знам'янка",         "type": "standard", "lat": 48.7117, "lng": 32.665},
  {"id": "st_23", "name": "Козятин",           "type": "standard", "lat": 49.7142, "lng": 28.835},
  {"id": "st_24", "name": "Фастів",            "type": "standard", "lat": 50.0747, "lng": 29.9185},
  {"id": "st_25", "name": "Шепетівка",         "type": "standard", "lat": 50.1833, "lng": 27.0667},
]

# ──────────────────────────────────────────────────────────────
# Railway connections between stations (undirected edges).
# Each tuple is (station_a_id, station_b_id).
# To add/remove a rail link, just edit this list.
# Edge weights are computed automatically from station coords.
# ──────────────────────────────────────────────────────────────
RAILWAY_CONNECTIONS = [
    # ── Main trunk: Київ — Фастів — Козятин — Вінниця — Хмельницький — Тернопіль — Львів
    ("st_01", "st_24"),  # Київ          → Фастів
    ("st_24", "st_23"),  # Фастів        → Козятин
    ("st_23", "st_07"),  # Козятин       → Вінниця
    ("st_07", "st_13"),  # Вінниця       → Хмельницький
    ("st_13", "st_17"),  # Хмельницький  → Тернопіль
    ("st_17", "st_02"),  # Тернопіль     → Львів

    # ── Western branches ──────────────────────────────────────
    ("st_02", "st_16"),  # Львів         → Івано-Франківськ
    ("st_16", "st_19"),  # Івано-Фр.     → Ужгород
    ("st_23", "st_25"),  # Козятин       → Шепетівка
    ("st_25", "st_15"),  # Шепетівка     → Рівне
    ("st_15", "st_18"),  # Рівне         → Луцьк
    ("st_15", "st_02"),  # Рівне         → Львів

    # ── Northern branch ───────────────────────────────────────
    ("st_01", "st_09"),  # Київ          → Чернігів
    ("st_01", "st_12"),  # Київ          → Житомир
    ("st_12", "st_23"),  # Житомир       → Козятин

    # ── Eastern corridor: Полтава — Харків ────────────────────
    ("st_01", "st_08"),  # Київ          → Полтава
    ("st_08", "st_05"),  # Полтава       → Харків
    ("st_05", "st_11"),  # Харків        → Суми

    # ── Central-Southern hub: Знам'янка ───────────────────────
    ("st_08", "st_21"),  # Полтава       → Кременчук
    ("st_21", "st_22"),  # Кременчук     → Знам'янка
    ("st_01", "st_14"),  # Київ          → Черкаси
    ("st_14", "st_22"),  # Черкаси       → Знам'янка

    # ── Southern lines: ports & industry ──────────────────────
    ("st_22", "st_10"),  # Знам'янка     → Кривий Ріг
    ("st_22", "st_20"),  # Знам'янка     → Миколаїв
    ("st_20", "st_03"),  # Миколаїв      → Одеса

    # ── Дніпро — Запоріжжя corridor ───────────────────────────
    ("st_04", "st_06"),  # Дніпро        → Запоріжжя
    ("st_04", "st_21"),  # Дніпро        → Кременчук
    ("st_04", "st_08"),  # Дніпро        → Полтава
    ("st_06", "st_10"),  # Запоріжжя     → Кривий Ріг
 
    # ── Additional corridors ───────────────────────────
    ("st_03", "st_07"),  # Одеса         → Вінниця
    ("st_19", "st_02"),  # Ужгород       → Львів
    ("st_09", "st_11"),  # Чернігів      → Суми
    ("st_07", "st_16"),  # Вінниця       → Івано-Франківськ
    
]

def generate_stations() -> Tuple[List[Station], nx.Graph]:
    stations = []
    G = nx.Graph()

    for s_data in FRONTEND_STATIONS:
        s = Station(
            id=s_data["id"],
            name=s_data["name"],
            type=StationType(s_data["type"]),
            x=s_data["lat"],
            y=s_data["lng"]
        )
        stations.append(s)
        G.add_node(s.id, pos=(s.x, s.y), obj=s)

    # Build edges from the manual connection list
    for a, b in RAILWAY_CONNECTIONS:
        pos_a = G.nodes[a]['pos']
        pos_b = G.nodes[b]['pos']
        dist = ((pos_a[0]-pos_b[0])**2 + (pos_a[1]-pos_b[1])**2)**0.5
        G.add_edge(a, b, weight=dist)

    return stations, G

def generate_wagons(stations: List[Station]) -> List[Wagon]:
    wagons = []
    for i in range(300):
        wagons.append(Wagon(
            id=f"W-GON-{i+1:03d}",
            type=WagonType.GONDOLA,
            current_station_id=random.choice(stations).id,
            status=WagonStatus.FREE if random.random() > 0.3 else WagonStatus.BUSY
        ))
    for i in range(100):
        wagons.append(Wagon(
            id=f"W-GRA-{i+1:03d}",
            type=WagonType.GRAIN_HOPPER,
            current_station_id=random.choice(stations).id,
            status=WagonStatus.FREE if random.random() > 0.3 else WagonStatus.BUSY
        ))
    for i in range(50):
        wagons.append(Wagon(
            id=f"W-CEM-{i+1:03d}",
            type=WagonType.CEMENT_HOPPER,
            current_station_id=random.choice(stations).id,
            status=WagonStatus.FREE if random.random() > 0.3 else WagonStatus.BUSY
        ))
    random.shuffle(wagons)
    return wagons

STATIC_STATIONS, RAILWAY_GRAPH = generate_stations()
STATIC_WAGONS = generate_wagons(STATIC_STATIONS)

DISTANCE_MATRIX = dict(nx.all_pairs_dijkstra_path_length(RAILWAY_GRAPH, weight='weight'))

def get_distance(station_a: str, station_b: str) -> float:
    try:
        # Scale abstract distance to KM approx (1 degree lat/lng ~ 111km)
        return float(DISTANCE_MATRIX[station_a][station_b]) * 111.0
    except KeyError:
        return 999999.0
