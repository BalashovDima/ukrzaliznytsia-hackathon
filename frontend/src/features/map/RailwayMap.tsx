import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';

const STATION_COLORS: Record<string, string> = {
  sorting: '#ef4444', // red-500
  border: '#a855f7', // purple-500
  port: '#3b82f6', // blue-500
  standard: '#22c55e', // green-500
};

export function RailwayMap() {
  const { data: stations = [] } = useQuery({ queryKey: ["stations-detailed"], queryFn: () => fetch('http://127.0.0.1:8000/api/stations').then(r => r.json()) });
  const { data: graph } = useQuery({ queryKey: ["graph"], queryFn: () => apiClient.getGraph() });

  // Center on Ukraine
  const mapCenter: [number, number] = [48.3794, 31.1656];

  const mapData = useMemo(() => {
    if (!stations.length || !graph) return { nodes: [], polylines: [] };
    
    // Quick lookup for coords
    const stationMap = new Map<string, any>();
    stations.forEach((s: any) => stationMap.set(s.id, s));

    const nodes = stations.map((s: any) => ({
      ...s,
      latLng: [s.x, s.y] as [number, number],
    }));

    const polylines = graph.edges.map((edge) => {
      const s1 = stationMap.get(edge.source);
      const s2 = stationMap.get(edge.target);
      if (s1 && s2) {
        return {
          id: `${edge.source}-${edge.target}`,
          positions: [[s1.x, s1.y], [s2.x, s2.y]] as [number, number][],
        };
      }
      return null;
    }).filter(Boolean) as any[];

    return { nodes, polylines };
  }, [stations, graph]);

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border shadow-sm relative z-0">
      <MapContainer center={mapCenter} zoom={6} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        
        {mapData.polylines.map((line) => (
          <Polyline 
            key={line.id} 
            positions={line.positions} 
            color="#94a3b8" 
            weight={1.5} 
            opacity={0.6}
            dashArray="4"
          />
        ))}

        {mapData.nodes.map((node) => (
          <CircleMarker
            key={node.id}
            center={node.latLng}
            radius={6}
            pathOptions={{ 
              fillColor: STATION_COLORS[node.type] || '#64748b', 
              color: '#ffffff', 
              weight: 1.5, 
              fillOpacity: 1 
            }}
          >
            <Tooltip direction="top" offset={[0, -10]} opacity={1}>
              <div className="font-semibold text-sm">{node.name}</div>
              <div className="text-xs text-muted-foreground capitalize">{node.type} Station</div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
      
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-md border shadow-sm z-[1000] text-xs space-y-1.5">
        <div className="font-semibold mb-2">Типи станцій</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div> Сортувальна</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500 border border-white"></div> Прикордонна</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div> Припортова</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div> Вантажна</div>
      </div>
    </div>
  );
}
