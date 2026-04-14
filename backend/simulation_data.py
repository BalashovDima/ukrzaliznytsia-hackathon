import random
import networkx as nx
from models import Station, StationType, Wagon, WagonType, WagonStatus
from typing import List, Tuple, Dict

# Set random seed for reproducible hackathon demo
random.seed(42)

FRONTEND_STATIONS = [
  {"id": "st_01", "name": "Київ-Пасажирський", "lat": 50.4401, "lng": 30.4927},
  {"id": "st_02", "name": "Львів", "lat": 49.8397, "lng": 24.0297},
  {"id": "st_03", "name": "Одеса", "lat": 46.4825, "lng": 30.7233},
  {"id": "st_04", "name": "Дніпро", "lat": 48.4647, "lng": 35.0462},
  {"id": "st_05", "name": "Харків", "lat": 49.9935, "lng": 36.2304},
  {"id": "st_06", "name": "Запоріжжя", "lat": 47.8388, "lng": 35.1396},
  {"id": "st_07", "name": "Вінниця", "lat": 49.2331, "lng": 28.4682},
  {"id": "st_08", "name": "Полтава", "lat": 49.5883, "lng": 34.5514},
  {"id": "st_09", "name": "Чернігів", "lat": 51.4982, "lng": 31.2893},
  {"id": "st_10", "name": "Кривий Ріг", "lat": 47.9105, "lng": 33.3918},
  {"id": "st_11", "name": "Суми", "lat": 50.9077, "lng": 34.7981},
  {"id": "st_12", "name": "Житомир", "lat": 50.2547, "lng": 28.6587},
  {"id": "st_13", "name": "Хмельницький", "lat": 49.4229, "lng": 26.9871},
  {"id": "st_14", "name": "Черкаси", "lat": 49.4444, "lng": 32.0598},
  {"id": "st_15", "name": "Рівне", "lat": 50.6199, "lng": 26.2516},
  {"id": "st_16", "name": "Івано-Франківськ", "lat": 48.9226, "lng": 24.7111},
  {"id": "st_17", "name": "Тернопіль", "lat": 49.5535, "lng": 25.5948},
  {"id": "st_18", "name": "Луцьк", "lat": 50.7472, "lng": 25.3254},
  {"id": "st_19", "name": "Ужгород", "lat": 48.6208, "lng": 22.2879},
  {"id": "st_20", "name": "Миколаїв", "lat": 46.975, "lng": 32.0},
  {"id": "st_21", "name": "Кременчук", "lat": 49.0658, "lng": 33.42},
  {"id": "st_22", "name": "Знам'янка", "lat": 48.7117, "lng": 32.665},
  {"id": "st_23", "name": "Козятин", "lat": 49.7142, "lng": 28.835},
  {"id": "st_24", "name": "Фастів", "lat": 50.0747, "lng": 29.9185},
  {"id": "st_25", "name": "Шепетівка", "lat": 50.1833, "lng": 27.0667},
]

def generate_stations() -> Tuple[List[Station], nx.Graph]:
    stations = []
    # Assign some random types
    types = (
        [StationType.SORTING] * 2 +
        [StationType.BORDER] * 2 +
        [StationType.PORT] * 2 +
        [StationType.STANDARD] * 19
    )
    random.shuffle(types)

    G = nx.Graph()

    for i, s_data in enumerate(FRONTEND_STATIONS):
        s = Station(
            id=s_data["id"],
            name=s_data["name"],
            type=types[i],
            x=s_data["lat"],
            y=s_data["lng"]
        )
        stations.append(s)
        G.add_node(s.id, pos=(s.x, s.y), obj=s)

    # Connect them based on geographic proximity
    for n1 in G.nodes():
        pos1 = G.nodes[n1]['pos']
        distances = []
        for n2 in G.nodes():
            if n1 != n2:
                pos2 = G.nodes[n2]['pos']
                # Rough approximation of distance for graph topology
                dist = ((pos1[0]-pos2[0])**2 + (pos1[1]-pos2[1])**2)**0.5
                distances.append((dist, n2))
        distances.sort()
        # Connect to closest 3 stations
        for j in range(min(3, len(distances))):
            if not G.has_edge(n1, distances[j][1]):
                G.add_edge(n1, distances[j][1], weight=distances[j][0])

    if not nx.is_connected(G):
        components = list(nx.connected_components(G))
        for i in range(len(components)-1):
            n1 = list(components[i])[0]
            n2 = list(components[i+1])[0]
            pos1 = G.nodes[n1]['pos']
            pos2 = G.nodes[n2]['pos']
            dist = ((pos1[0]-pos2[0])**2 + (pos1[1]-pos2[1])**2)**0.5
            G.add_edge(n1, n2, weight=dist)

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
