"use client";

import { useEffect, useRef, useCallback } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { riskColor } from "@/lib/utils";
import type { RouteSegment, AnomalyScore, Shipment } from "@/lib/mockData";

interface RouteVisualizerProps {
  segments: RouteSegment[];
  anomalyScores: AnomalyScore[];
  shipments: Shipment[];
  selectedSegmentId: string | null;
  onSegmentClick: (segmentId: string) => void;
}

// Build a GeoJSON feature collection from segments + scores
function buildSegmentGeoJSON(
  segments: RouteSegment[],
  scores: AnomalyScore[]
): GeoJSON.FeatureCollection {
  const scoreMap = new Map(scores.map((s) => [s.segment_id, s]));
  return {
    type: "FeatureCollection",
    features: segments.map((seg) => {
      const score = scoreMap.get(seg.segment_id);
      const risk = score?.normalized_risk_probability ?? 0;

      // Use the pre-defined geometry with intermediate waypoints if available,
      // otherwise fall back to a straight line between start and end nodes.
      const geometry: GeoJSON.LineString = seg.geometry
        ? seg.geometry
        : {
            type: "LineString",
            coordinates: [
              [seg.start_node_latlon[1], seg.start_node_latlon[0]],
              [seg.end_node_latlon[1], seg.end_node_latlon[0]],
            ],
          };

      return {
        type: "Feature" as const,
        id: seg.segment_id,
        properties: {
          segment_id: seg.segment_id,
          nh_identifier: seg.nh_identifier,
          risk: risk,
          color: riskColor(risk),
          dominant_features: score?.dominant_anomalous_features?.join(", ") ?? "nominal",
          confidence_lo: score?.model_confidence_interval[0] ?? 0,
          confidence_hi: score?.model_confidence_interval[1] ?? 0,
        },
        geometry,
      };
    }),
  };
}

function buildShipmentGeoJSON(
  shipments: Shipment[],
  segments: RouteSegment[]
): GeoJSON.FeatureCollection {
  const segMap = new Map(segments.map((s) => [s.segment_id, s]));
  return {
    type: "FeatureCollection",
    features: shipments
      .map((ship) => {
        return {
          type: "Feature" as const,
          properties: {
            id: ship.shipment_id,
            cargo: ship.cargo_type,
            value: ship.value_inr,
            status: ship.status,
          },
          geometry: {
            type: "Point" as const,
            coordinates: [ship.latlon[1], ship.latlon[0]],
          },
        };
      })
      .filter(Boolean) as GeoJSON.Feature[],
  };
}

export default function RouteVisualizer({
  segments,
  anomalyScores,
  shipments,
  selectedSegmentId,
  onSegmentClick,
}: RouteVisualizerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const initializedRef = useRef(false);

  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";

  // ── Initialize map ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || initializedRef.current) return;
    initializedRef.current = true;

    mapboxgl.accessToken = token || "pk.demo";

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/dark-v11",
      center: [80.0, 22.5], // Centre of India
      zoom: 4.5,
      minZoom: 3,
      maxZoom: 12,
      projection: { name: "mercator" } as mapboxgl.Projection,
    });

    mapRef.current = map;

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");
    map.addControl(new mapboxgl.ScaleControl({ unit: "metric" }), "bottom-left");

    const popup = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      className: "fc-popup",
      maxWidth: "280px",
    });
    popupRef.current = popup;

    map.on("load", () => {
      // ── Segment routes layer ─────────────────────────────────────────
      const segGeo = buildSegmentGeoJSON(segments, anomalyScores);

      map.addSource("segments", { type: "geojson", data: segGeo });

      // Glow / halo underneath
      map.addLayer({
        id: "segments-glow",
        type: "line",
        source: "segments",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": 14,
          "line-opacity": 0.18,
          "line-blur": 8,
        },
      });

      // Main route line
      map.addLayer({
        id: "segments-line",
        type: "line",
        source: "segments",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": ["get", "color"],
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            4, 2,
            8, 5,
          ],
          "line-opacity": 0.9,
          "line-dasharray": [1, 0],
        },
      });

      // Animated dash overlay
      map.addLayer({
        id: "segments-dash",
        type: "line",
        source: "segments",
        layout: { "line-join": "round", "line-cap": "round" },
        paint: {
          "line-color": "#ffffff",
          "line-width": 1.5,
          "line-opacity": 0.55,
          "line-dasharray": [4, 8],
        },
      });

      // ── Shipment markers ─────────────────────────────────────────────
      const shipGeo = buildShipmentGeoJSON(shipments, segments);

      map.addSource("shipments", { type: "geojson", data: shipGeo });

      map.addLayer({
        id: "shipments-pulse",
        type: "circle",
        source: "shipments",
        paint: {
          "circle-radius": 14,
          "circle-color": "#3b82f6",
          "circle-opacity": 0.2,
          "circle-stroke-width": 0,
        },
      });

      map.addLayer({
        id: "shipments-dot",
        type: "circle",
        source: "shipments",
        paint: {
          "circle-radius": 7,
          "circle-color": "#3b82f6",
          "circle-stroke-color": "#e2e8f0",
          "circle-stroke-width": 1.5,
          "circle-opacity": 1,
        },
      });

      // ── Hover interactions ────────────────────────────────────────────
      map.on("mousemove", "segments-line", (e) => {
        if (!e.features?.length) return;
        map.getCanvas().style.cursor = "pointer";
        const props = e.features[0].properties!;
        const riskPct = ((props.risk as number) * 100).toFixed(1);
        popup
          .setLngLat(e.lngLat)
          .setHTML(
            `<div class="fc-popup-inner">
               <div class="fc-popup-nh">${props.nh_identifier}</div>
               <div class="fc-popup-risk" style="color:${props.color}">Risk: ${riskPct}%</div>
               <div class="fc-popup-feat">${props.dominant_features || "No anomaly detected"}</div>
             </div>`
          )
          .addTo(map);
      });

      map.on("mouseleave", "segments-line", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      map.on("mousemove", "shipments-dot", (e) => {
        if (!e.features?.length) return;
        map.getCanvas().style.cursor = "pointer";
        const p = e.features[0].properties!;
        popup
          .setLngLat(e.lngLat)
          .setHTML(
            `<div class="fc-popup-inner">
               <span class="fc-popup-nh">${p.id}</span>
               <div class="fc-popup-feat">Cargo: ${p.cargo}</div>
               <div class="fc-popup-feat">Status: ${p.status.toUpperCase()}</div>
               <div class="fc-popup-risk" style="color:#3b82f6">Value: ₹${(p.value / 100000).toFixed(1)}L</div>
             </div>`
          )
          .addTo(map);
      });

      map.on("mouseleave", "shipments-dot", () => {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      map.on("click", "segments-line", (e) => {
        if (!e.features?.length) return;
        onSegmentClick(e.features[0].properties!.segment_id as string);
      });
    });

    return () => {
      popup.remove();
      map.remove();
      initializedRef.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // ── Update segment colors live ─────────────────────────────────────────
  const updateSegments = useCallback(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    const src = map.getSource("segments") as mapboxgl.GeoJSONSource | undefined;
    if (src) {
      src.setData(buildSegmentGeoJSON(segments, anomalyScores));
    }
  }, [segments, anomalyScores]);

  useEffect(() => {
    updateSegments();
  }, [updateSegments]);

  // ── Highlight selected segment ─────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (selectedSegmentId) {
      map.setPaintProperty("segments-line", "line-width", [
        "case",
        ["==", ["id"], selectedSegmentId],
        8,
        ["interpolate", ["linear"], ["zoom"], 4, 2, 8, 5],
      ]);
    } else {
      map.setPaintProperty("segments-line", "line-width", [
        "interpolate", ["linear"], ["zoom"], 4, 2, 8, 5,
      ]);
    }
  }, [selectedSegmentId]);

  return (
    <div className="relative w-full h-full rounded-2xl overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" id="mapbox-container" />

      {/* Legend overlay */}
      <div className="absolute bottom-8 right-4 glass-sm px-3 py-2 text-xs space-y-1.5 z-10">
        <div className="text-muted font-semibold uppercase tracking-widest mb-1">Risk Level</div>
        {[
          { color: "#ef4444", label: "Critical  ≥75%" },
          { color: "#f97316", label: "High      ≥50%" },
          { color: "#eab308", label: "Moderate  ≥25%" },
          { color: "#22c55e", label: "Clear     <25%" },
        ].map(({ color, label }) => (
          <div key={color} className="flex items-center gap-2">
            <span className="w-6 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
            <span className="text-fc-400 font-mono">{label}</span>
          </div>
        ))}
        <div className="border-t border-fc-700 pt-1.5 flex items-center gap-2 mt-1">
          <span className="w-2 h-2 rounded-full bg-accent-blue flex-shrink-0" />
          <span className="text-fc-400">Active shipment</span>
        </div>
      </div>

      {/* No token warning */}
      {!token && (
        <div className="absolute inset-0 flex items-center justify-center bg-fc-950/80 z-20 rounded-2xl">
          <div className="glass px-6 py-4 text-center max-w-sm">
            <div className="text-2xl mb-2">🗺️</div>
            <div className="font-semibold text-fc-200 mb-1">Mapbox Token Required</div>
            <div className="text-sm text-muted">
              Add <code className="text-accent-cyan font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</code> to{" "}
              <code className="text-accent-cyan font-mono">.env.local</code> to enable the live route map.
            </div>
          </div>
        </div>
      )}

      {/* Mapbox popup styles injected via globals.css */}
    </div>
  );
}
