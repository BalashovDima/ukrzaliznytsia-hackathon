import React, { useMemo } from 'react';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, Marker } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/shared/lib/api-client';

const STATION_COLORS: Record<string, string> = {
  sorting: '#ef4444',
  border: '#a855f7',
  port: '#3b82f6',
  standard: '#22c55e',
};

const WAGON_TYPE_LABELS: Record<string, string> = {
  gondola: 'Піввагон',
  grain_hopper: 'Зерновоз',
  cement_hopper: 'Цементовоз',
};

const STATION_TYPE_LABELS: Record<string, string> = {
  sorting: 'Сортувальна',
  border: 'Прикордонна',
  port: 'Припортова',
  standard: 'Вантажна',
};

/** Build a Leaflet DivIcon that shows the wagon count badge next to a station */
function createWagonBadgeIcon(summary: { free: number; busy: number; en_route: number; total: number }) {
  const { free, busy, en_route, total } = summary;
  if (total === 0) return null;

  // Badge color based on ratio of free wagons
  const freeRatio = free / total;
  let bgColor = '#ef4444'; // mostly busy → red
  if (freeRatio > 0.6) bgColor = '#22c55e'; // mostly free → green
  else if (freeRatio > 0.3) bgColor = '#f59e0b'; // mixed → amber

  const html = `
    <div style="
      display: flex;
      align-items: center;
      gap: 2px;
      background: ${bgColor};
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      font-family: 'Inter', system-ui, sans-serif;
      padding: 1px 5px;
      border-radius: 8px;
      border: 1.5px solid rgba(255,255,255,0.9);
      box-shadow: 0 1px 4px rgba(0,0,0,0.25);
      white-space: nowrap;
      line-height: 1.3;
      min-width: 18px;
      justify-content: center;
      pointer-events: none;
    ">
      ${total}
    </div>
  `;

  return L.divIcon({
    html,
    className: '', // Disable default leaflet-div-icon style
    iconSize: [28, 16],
    iconAnchor: [-6, 8], // Offset so it appears to the right & center of the station dot
  });
}

/** Build rich tooltip HTML for a station */
function buildTooltipHtml(
  node: any,
  summary?: { free: number; busy: number; en_route: number; total: number; by_type: Record<string, { free: number; busy: number; en_route: number }> }
) {
  const stationType = STATION_TYPE_LABELS[node.type] || node.type;

  let wagonRows = '';
  if (summary && summary.total > 0) {
    // Per-type rows
    const typeEntries = Object.entries(summary.by_type);
    if (typeEntries.length > 0) {
      wagonRows = typeEntries.map(([wtype, counts]) => {
        const label = WAGON_TYPE_LABELS[wtype] || wtype;
        return `
          <tr style="font-size:11px;">
            <td style="padding:1px 6px 1px 0; color:#64748b;">${label}</td>
            <td style="padding:1px 4px; color:#22c55e; text-align:right;">${counts.free}</td>
            <td style="padding:1px 4px; color:#ef4444; text-align:right;">${counts.busy}</td>
            <td style="padding:1px 4px; color:#f59e0b; text-align:right;">${counts.en_route}</td>
          </tr>
        `;
      }).join('');
    }
  }

  const noWagons = !summary || summary.total === 0;

  return `
    <div style="min-width:160px; font-family:'Inter',system-ui,sans-serif;">
      <div style="font-weight:700; font-size:13px; margin-bottom:2px;">${node.name}</div>
      <div style="font-size:11px; color:#64748b; margin-bottom:6px; text-transform:capitalize;">${stationType}</div>
      ${noWagons
        ? '<div style="font-size:11px; color:#94a3b8; font-style:italic;">Немає вагонів</div>'
        : `
          <div style="display:flex; gap:10px; margin-bottom:5px;">
            <span style="font-size:11px;"><b style="color:#22c55e;">${summary!.free}</b> вільн.</span>
            <span style="font-size:11px;"><b style="color:#ef4444;">${summary!.busy}</b> зайн.</span>
            <span style="font-size:11px;"><b style="color:#f59e0b;">${summary!.en_route}</b> в дорозі</span>
          </div>
          <table style="border-collapse:collapse; width:100%;">
            <thead>
              <tr style="font-size:10px; color:#94a3b8; border-bottom:1px solid #e2e8f0;">
                <th style="text-align:left; padding:0 6px 2px 0;">Тип</th>
                <th style="text-align:right; padding:0 4px 2px;">✓</th>
                <th style="text-align:right; padding:0 4px 2px;">✗</th>
                <th style="text-align:right; padding:0 4px 2px;">→</th>
              </tr>
            </thead>
            <tbody>
              ${wagonRows}
            </tbody>
          </table>
        `}
    </div>
  `;
}

export function RailwayMap() {
  const { data: stations = [] } = useQuery({
    queryKey: ["stations-detailed"],
    queryFn: () => fetch('http://127.0.0.1:8000/api/stations').then(r => r.json()),
  });
  const { data: graph } = useQuery({
    queryKey: ["graph"],
    queryFn: () => apiClient.getGraph(),
  });
  const { data: wagonSummary } = useQuery({
    queryKey: ["wagon-summary"],
    queryFn: () => apiClient.getWagonSummary(),
    refetchInterval: 5000, // Auto-refresh every 5s so map stays live
  });

  const mapCenter: [number, number] = [48.3794, 31.1656];

  const mapData = useMemo(() => {
    if (!stations.length || !graph) return { nodes: [], polylines: [] };
    
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

        {mapData.nodes.map((node) => {
          const summary = wagonSummary?.[node.id];
          const badgeIcon = summary ? createWagonBadgeIcon(summary) : null;

          return (
            <React.Fragment key={node.id}>
              <CircleMarker
                center={node.latLng}
                radius={6}
                pathOptions={{ 
                  fillColor: STATION_COLORS[node.type] || '#64748b', 
                  color: '#ffffff', 
                  weight: 1.5, 
                  fillOpacity: 1 
                }}
              >
                <Tooltip
                  direction="top"
                  offset={[0, -10]}
                  opacity={1}
                >
                  <div dangerouslySetInnerHTML={{ __html: buildTooltipHtml(node, summary) }} />
                </Tooltip>
              </CircleMarker>

              {/* Wagon count badge */}
              {badgeIcon && (
                <Marker
                  position={node.latLng}
                  icon={badgeIcon}
                  interactive={false}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
      
      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-md border shadow-sm z-[1000] text-xs space-y-1.5">
        <div className="font-semibold mb-2">Типи станцій</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div> Сортувальна</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-purple-500 border border-white"></div> Прикордонна</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div> Припортова</div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div> Вантажна</div>
        <div className="border-t my-2"></div>
        <div className="font-semibold mb-1">Вагони</div>
        <div className="flex items-center gap-2"><div className="w-4 h-3 rounded-sm border border-white" style={{ background: '#22c55e' }}></div> Багато вільних</div>
        <div className="flex items-center gap-2"><div className="w-4 h-3 rounded-sm border border-white" style={{ background: '#f59e0b' }}></div> Частково зайняті</div>
        <div className="flex items-center gap-2"><div className="w-4 h-3 rounded-sm border border-white" style={{ background: '#ef4444' }}></div> Мало вільних</div>
      </div>
    </div>
  );
}
