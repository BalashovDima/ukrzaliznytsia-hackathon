import React, { useMemo } from "react";
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Polyline,
  Tooltip,
  Marker,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/shared/lib/api-client";

const STATION_COLORS: Record<string, string> = {
  sorting: "#ef4444",
  border: "#a855f7",
  port: "#3b82f6",
  standard: "#22c55e",
};

const WAGON_TYPE_LABELS: Record<string, string> = {
  gondola: "Піввагон",
  grain_hopper: "Зерновоз",
  cement_hopper: "Цементовоз",
};

const STATION_TYPE_LABELS: Record<string, string> = {
  sorting: "Сортувальна",
  border: "Прикордонна",
  port: "Припортова",
  standard: "Вантажна",
};

/** Route highlight data passed from the dashboard */
export interface RouteHighlight {
  /** Each array is a sequence of station IDs forming a path segment */
  emptyRunPaths: string[][];
  /** The loaded run path (same for all wagons in a request) */
  loadedRunPath: string[];
  /** Station IDs to highlight specially (origins / destination) */
  highlightStations: {
    wagonOrigins: string[];
    pickupStation: string;
    deliveryStation: string;
  };
}

/** Build a Leaflet DivIcon that shows the wagon count badge next to a station */
function createWagonBadgeIcon(summary: {
  free: number;
  busy: number;
  en_route: number;
  total: number;
}) {
  const { free, total } = summary;
  if (total === 0) return null;

  const freeRatio = free / total;
  let bgColor = "#ef4444";
  if (freeRatio > 0.6) bgColor = "#22c55e";
  else if (freeRatio > 0.3) bgColor = "#f59e0b";

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
    className: "",
    iconSize: [28, 16],
    iconAnchor: [-6, 8],
  });
}

/** Build a special highlighted station icon */
function createHighlightIcon(label: string, color: string) {
  const html = `
    <div style="
      display: flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: ${color};
      border: 2.5px solid #fff;
      box-shadow: 0 0 0 3px ${color}44, 0 2px 8px rgba(0,0,0,0.3);
      color: #fff;
      font-size: 9px;
      font-weight: 800;
      font-family: 'Inter', system-ui, sans-serif;
      pointer-events: none;
    ">
      ${label}
    </div>
  `;
  return L.divIcon({
    html,
    className: "",
    iconSize: [22, 22],
    iconAnchor: [11, 11],
  });
}

/** Build rich tooltip HTML for a station */
function buildTooltipHtml(
  node: any,
  summary?: {
    free: number;
    busy: number;
    en_route: number;
    total: number;
    by_type: Record<string, { free: number; busy: number; en_route: number }>;
  },
) {
  const stationType = STATION_TYPE_LABELS[node.type] || node.type;

  let wagonRows = "";
  if (summary && summary.total > 0) {
    const typeEntries = Object.entries(summary.by_type);
    if (typeEntries.length > 0) {
      wagonRows = typeEntries
        .map(([wtype, counts]) => {
          const label = WAGON_TYPE_LABELS[wtype] || wtype;
          return `
          <tr style="font-size:11px;">
            <td style="padding:1px 6px 1px 0; color:#64748b;">${label}</td>
            <td style="padding:1px 4px; color:#22c55e; text-align:right;">${counts.free}</td>
            <td style="padding:1px 4px; color:#ef4444; text-align:right;">${counts.busy}</td>
            <td style="padding:1px 4px; color:#f59e0b; text-align:right;">${counts.en_route}</td>
          </tr>
        `;
        })
        .join("");
    }
  }

  const noWagons = !summary || summary.total === 0;

  return `
    <div style="min-width:160px; font-family:'Inter',system-ui,sans-serif;">
      <div style="font-weight:700; font-size:13px; margin-bottom:2px;">${node.name}</div>
      <div style="font-size:11px; color:#64748b; margin-bottom:6px; text-transform:capitalize;">${stationType}</div>
      ${
        noWagons
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
        `
      }
    </div>
  `;
}

interface RailwayMapProps {
  routeHighlight?: RouteHighlight | null;
  showNaiveRoute?: boolean;
}

export function RailwayMap({
  routeHighlight,
  showNaiveRoute,
}: RailwayMapProps) {
  const { data: stations = [] } = useQuery({
    queryKey: ["stations-detailed"],
    queryFn: () => apiClient.getStations(),
  });
  const { data: graph } = useQuery({
    queryKey: ["graph"],
    queryFn: () => apiClient.getGraph(),
  });
  const { data: wagonSummary } = useQuery({
    queryKey: ["wagon-summary"],
    queryFn: () => apiClient.getWagonSummary(),
    refetchInterval: 5000,
  });

  const mapCenter: [number, number] = [48.3794, 31.1656];

  const mapData = useMemo(() => {
    if (!stations.length || !graph)
      return { nodes: [], polylines: [], stationMap: new Map() };

    const stationMap = new Map<string, any>();
    stations.forEach((s: any) => stationMap.set(s.id, s));

    const nodes = stations.map((s: any) => ({
      ...s,
      latLng: [s.x, s.y] as [number, number],
    }));

    const polylines = graph.edges
      .map((edge) => {
        const s1 = stationMap.get(edge.source);
        const s2 = stationMap.get(edge.target);
        if (s1 && s2) {
          return {
            id: `${edge.source}-${edge.target}`,
            positions: [
              [s1.x, s1.y],
              [s2.x, s2.y],
            ] as [number, number][],
          };
        }
        return null;
      })
      .filter(Boolean) as any[];

    return { nodes, polylines, stationMap };
  }, [stations, graph]);

  /** Convert a path (station IDs) to LatLng array for Polyline */
  const pathToPositions = (path: string[]): [number, number][] => {
    return path
      .map((sid) => {
        const s = mapData.stationMap.get(sid);
        return s ? ([s.x, s.y] as [number, number]) : null;
      })
      .filter(Boolean) as [number, number][];
  };

  const isRouteMode = !!routeHighlight;

  return (
    <div className="w-full h-[400px] rounded-xl overflow-hidden border shadow-sm relative z-0">
      <MapContainer
        center={mapCenter}
        zoom={6}
        scrollWheelZoom={false}
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />

        {/* Base railway lines — dimmed when route is highlighted */}
        {mapData.polylines.map((line) => (
          <Polyline
            key={line.id}
            positions={line.positions}
            color="#94a3b8"
            weight={1.5}
            opacity={isRouteMode ? 0.15 : 0.6}
            dashArray="4"
          />
        ))}

        {/* Route highlight: empty run paths (orange dashed) */}
        {isRouteMode &&
          routeHighlight!.emptyRunPaths.map((path, i) => {
            const positions = pathToPositions(path);
            const emptyColor = showNaiveRoute ? "#f97316" : "#3b82f6";
            return positions.length >= 2 ? (
              <Polyline
                key={`empty-${i}`}
                positions={positions}
                color={emptyColor}
                weight={3.5}
                opacity={0.85}
                dashArray="8 6"
              >
                <Tooltip sticky opacity={1}>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  >
                    {showNaiveRoute ? "🎲 Жадібний:" : "🧠 Алгоритм:"} Порожній
                    пробіг
                  </span>
                </Tooltip>
              </Polyline>
            ) : null;
          })}

        {/* Route highlight: loaded run path (green solid) */}
        {isRouteMode &&
          (() => {
            const positions = pathToPositions(routeHighlight!.loadedRunPath);
            return positions.length >= 2 ? (
              <Polyline
                positions={positions}
                color="#22c55e"
                weight={4}
                opacity={0.9}
              >
                <Tooltip sticky opacity={1}>
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "Inter, system-ui, sans-serif",
                    }}
                  >
                    📦 Вантажний рейс (завантаження → доставка)
                  </span>
                </Tooltip>
              </Polyline>
            ) : null;
          })()}

        {/* Station markers */}
        {mapData.nodes.map((node) => {
          const summary = wagonSummary?.[node.id];
          const badgeIcon = summary ? createWagonBadgeIcon(summary) : null;

          // In route mode, check if this station is special
          const hl = routeHighlight?.highlightStations;
          const isWagonOrigin = hl?.wagonOrigins.includes(node.id);
          const isPickup = hl?.pickupStation === node.id;
          const isDelivery = hl?.deliveryStation === node.id;
          const isHighlighted = isWagonOrigin || isPickup || isDelivery;

          // Dim non-involved stations in route mode
          const stationOpacity = isRouteMode && !isHighlighted ? 0.3 : 1;

          return (
            <React.Fragment key={node.id}>
              <CircleMarker
                center={node.latLng}
                radius={isHighlighted ? 8 : 6}
                pathOptions={{
                  fillColor: STATION_COLORS[node.type] || "#64748b",
                  color: "#ffffff",
                  weight: isHighlighted ? 2.5 : 1.5,
                  fillOpacity: stationOpacity,
                  opacity: stationOpacity,
                }}
              >
                <Tooltip direction="top" offset={[0, -10]} opacity={1}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: buildTooltipHtml(node, summary),
                    }}
                  />
                </Tooltip>
              </CircleMarker>

              {/* Wagon count badge (hide in route mode for clarity) */}
              {!isRouteMode && badgeIcon && (
                <Marker
                  position={node.latLng}
                  icon={badgeIcon}
                  interactive={false}
                />
              )}

              {/* Route mode: special markers for highlighted stations */}
              {isRouteMode && isWagonOrigin && (
                <Marker
                  position={node.latLng}
                  icon={createHighlightIcon(
                    "В",
                    showNaiveRoute ? "#f97316" : "#3b82f6",
                  )}
                  interactive={false}
                />
              )}
              {isRouteMode && isPickup && (
                <Marker
                  position={node.latLng}
                  icon={createHighlightIcon("З", "#3b82f6")}
                  interactive={false}
                />
              )}
              {isRouteMode && isDelivery && (
                <Marker
                  position={node.latLng}
                  icon={createHighlightIcon("Д", "#22c55e")}
                  interactive={false}
                />
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>

      {/* Legend overlay */}
      <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-sm p-3 rounded-md border shadow-sm z-[1000] text-xs space-y-1.5">
        {isRouteMode ? (
          <>
            <div className="font-semibold mb-2">Маршрут заявки</div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-0.5 border-t-2 border-dashed"
                style={{ borderColor: showNaiveRoute ? "#f97316" : "#3b82f6" }}
              ></div>
              {showNaiveRoute
                ? "🎲 Жадібний: Порожній"
                : "🧠 Алгоритм: Порожній"}
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-0.5"
                style={{ borderTop: "2.5px solid #22c55e" }}
              ></div>
              Вантажний рейс (спільний)
            </div>
            <div className="border-t my-1.5"></div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                style={{ background: showNaiveRoute ? "#f97316" : "#3b82f6" }}
              >
                В
              </div>{" "}
              Вагон (початок)
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                style={{ background: "#3b82f6" }}
              >
                З
              </div>{" "}
              Завантаження
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold"
                style={{ background: "#22c55e" }}
              >
                Д
              </div>{" "}
              Доставка
            </div>
          </>
        ) : (
          <>
            <div className="font-semibold mb-2">Типи станцій</div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-white"></div>{" "}
              Сортувальна
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-purple-500 border border-white"></div>{" "}
              Прикордонна
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 border border-white"></div>{" "}
              Припортова
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500 border border-white"></div>{" "}
              Вантажна
            </div>
            <div className="border-t my-2"></div>
            <div className="font-semibold mb-1">Вагони</div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-3 rounded-sm border border-white"
                style={{ background: "#22c55e" }}
              ></div>{" "}
              Багато вільних
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-3 rounded-sm border border-white"
                style={{ background: "#f59e0b" }}
              ></div>{" "}
              Частково зайняті
            </div>
            <div className="flex items-center gap-2">
              <div
                className="w-4 h-3 rounded-sm border border-white"
                style={{ background: "#ef4444" }}
              ></div>{" "}
              Мало вільних
            </div>
          </>
        )}
      </div>
    </div>
  );
}
