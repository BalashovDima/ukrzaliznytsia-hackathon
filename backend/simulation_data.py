import random
import networkx as nx
from models import Station, StationType, Wagon, WagonType, WagonStatus
from typing import List, Tuple, Dict

# Set random seed for reproducible hackathon demo
random.seed(42)

def generate_stations() -> Tuple[List[Station], nx.Graph]:
    stations = []
    # 25 stations: 2 sorting, 2 border, 2 port, 19 standard
    types = (
        [StationType.SORTING] * 2 +
        [StationType.BORDER] * 2 +
        [StationType.PORT] * 2 +
        [StationType.STANDARD] * 19
    )
    random.shuffle(types)

    # Let's place them on a 1000x1000 grid
    # We will also build a connected graph
    G = nx.Graph()

    for i in range(25):
        station_id = f"st_{i+1:02d}"
        x, y = random.uniform(0, 1000), random.uniform(0, 1000)
        s = Station(
            id=station_id,
            name=f"{types[i].value.capitalize()} Station {i+1}",
            type=types[i],
            x=x,
            y=y
        )
        stations.append(s)
        G.add_node(station_id, pos=(x, y), obj=s)

    # Connect them to form a realistic-ish railway network (e.g. Gabriel Graph or minimum spanning tree + some random edges)
    # Simple approach: connect to 2-3 nearest neighbors
    for n1 in G.nodes():
        pos1 = G.nodes[n1]['pos']
        distances = []
        for n2 in G.nodes():
            if n1 != n2:
                pos2 = G.nodes[n2]['pos']
                dist = ((pos1[0]-pos2[0])**2 + (pos1[1]-pos2[1])**2)**0.5
                distances.append((dist, n2))
        distances.sort()
        # Add closest 2 edges to ensure connected and looking like a network
        for j in range(2):
            if not G.has_edge(n1, distances[j][1]):
                G.add_edge(n1, distances[j][1], weight=distances[j][0])

    # Ensure the graph is fully connected
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
    # 300 gondolas
    for i in range(300):
        wagons.append(Wagon(
            id=f"W-GON-{i+1:03d}",
            type=WagonType.GONDOLA,
            current_station_id=random.choice(stations).id
        ))
    
    # 100 grain hoppers
    for i in range(100):
        wagons.append(Wagon(
            id=f"W-GRA-{i+1:03d}",
            type=WagonType.GRAIN_HOPPER,
            current_station_id=random.choice(stations).id
        ))
    
    # 50 cement hoppers
    for i in range(50):
        wagons.append(Wagon(
            id=f"W-CEM-{i+1:03d}",
            type=WagonType.CEMENT_HOPPER,
            current_station_id=random.choice(stations).id
        ))
    
    # Shuffle for randomness
    random.shuffle(wagons)
    return wagons

# Initialize simulated world
STATIC_STATIONS, RAILWAY_GRAPH = generate_stations()
STATIC_WAGONS = generate_wagons(STATIC_STATIONS)

# Precalculate all pairs shortest path length (distances)
DISTANCE_MATRIX = dict(nx.all_pairs_dijkstra_path_length(RAILWAY_GRAPH, weight='weight'))

def get_distance(station_a: str, station_b: str) -> float:
    try:
        return float(DISTANCE_MATRIX[station_a][station_b])
    except KeyError:
        return 999999.0
