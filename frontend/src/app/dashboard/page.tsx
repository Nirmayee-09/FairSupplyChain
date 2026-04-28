"use client";

import dynamic from "next/dynamic";
import { useState, useEffect, useCallback, useRef } from "react";
import { useSupabaseRealtime, useAlertManager } from "@/hooks/useSupabaseRealtime";
import { predictBatch } from "@/lib/api";
import TopNav from "@/components/dashboard/TopNav";
import AnomalyMatrix from "@/components/dashboard/AnomalyMatrix";
import GeminiPanel from "@/components/dashboard/GeminiPanel";
import SegmentDrawer from "@/components/map/SegmentDrawer";
import RerouteModal from "@/components/map/RerouteModal";
import ScorecardModal from "@/components/fairness/ScorecardModal";
import type { AnomalyScore } from "@/lib/mockData";
import {
  MOCK_SEGMENTS,
  MOCK_SHIPMENTS,
  MOCK_ALTERNATIVE_ROUTES,
} from "@/lib/mockData";

// Mapbox must be client-only (uses browser APIs)
const RouteVisualizer = dynamic(
  () => import("@/components/map/RouteVisualizer"),
  { ssr: false, loading: () => <MapSkeleton /> }
);

function MapSkeleton() {
  return (
    <div className="w-full h-full rounded-2xl bg-fc-900/60 flex items-center justify-center animate-pulse">
      <div className="text-muted text-sm">Loading map…</div>
    </div>
  );
}

// ── Chennai Flood Replay types ─────────────────────────────────────────────
interface ReplayFrame {
  segment_id: string;
  current_timestamp_utc: string;
  isolation_forest_raw_score: number;
  normalized_risk_probability: number;
  dominant_anomalous_features: string[];
  model_confidence_interval: number[];
  risk_tier: string;
  hours_before_closure: number;
  event: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export default function DashboardPage() {
  // ── Realtime state (Supabase live → mock fallback) ─────────────────────
  const { anomalyScores, alerts: realtimeAlerts, connectionState, lastUpdated } =
    useSupabaseRealtime();
  const { unresolved, alerts, resolveAlert } = useAlertManager(realtimeAlerts);

  // ── Local UI state ────────────────────────────────────────────────────────
  const [selectedSegmentId, setSelectedSegmentId] = useState<string | null>(null);
  const [rerouteOpen, setRerouteOpen] = useState(false);
  const [fairnessOpen, setFairnessOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"map" | "matrix">("map");

  // ── Chennai Flood Replay state ────────────────────────────────────────────
  const [replayActive, setReplayActive] = useState(false);
  const [replayFrame, setReplayFrame] = useState<ReplayFrame | null>(null);
  const [replayOverrides, setReplayOverrides] = useState<AnomalyScore[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const startReplay = useCallback(async () => {
    // Abort any existing replay
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setReplayActive(true);
    setReplayFrame(null);
    setReplayOverrides([]);
    setActiveTab("map"); // Switch to map view

    try {
      const res = await fetch(
        `${API_BASE}/disruptions/demo/chennai-replay?delay_ms=0`,
        { signal: controller.signal }
      );
      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          if (controller.signal.aborted) return;

          const frame: ReplayFrame = JSON.parse(line);
          setReplayFrame(frame);

          // Override NH48 segments with this frame's risk colour
          setReplayOverrides(
            MOCK_SEGMENTS
              .filter((s) => s.nh_identifier === "NH48" && s.start_node_latlon[0] > 12 && s.start_node_latlon[0] < 14)
              .map((s) => ({
                segment_id: s.segment_id,
                current_timestamp_utc: frame.current_timestamp_utc,
                isolation_forest_raw_score: frame.isolation_forest_raw_score,
                normalized_risk_probability: frame.normalized_risk_probability,
                dominant_anomalous_features: frame.dominant_anomalous_features,
                model_confidence_interval: frame.model_confidence_interval as [number, number],
                risk_tier: frame.risk_tier as AnomalyScore["risk_tier"],
              }))
          );

          // 2-second pause between frames for visible colour transition
          await new Promise((r) => setTimeout(r, 2000));
        }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      console.error("Replay stream error:", err);
    } finally {
      if (!controller.signal.aborted) {
        // Keep final frame visible for 5 seconds then clean up
        await new Promise((r) => setTimeout(r, 5000));
        setReplayActive(false);
        setReplayFrame(null);
        setReplayOverrides([]);
      }
    }
  }, []);

  const stopReplay = useCallback(() => {
    if (abortRef.current) abortRef.current.abort();
    setReplayActive(false);
    setReplayFrame(null);
    setReplayOverrides([]);
  }, []);

  // ── Live prediction scoring via backend ───────────────────────────────────
  const fetchPredictions = useCallback(async () => {
    try {
      await predictBatch(MOCK_SEGMENTS);
    } catch {
      // Non-blocking — realtime hook already has mock fallback
    }
  }, []);

  useEffect(() => {
    fetchPredictions();
    const interval = setInterval(fetchPredictions, 60000);
    return () => clearInterval(interval);
  }, [fetchPredictions]);

  // ── Merge replay overrides into anomaly scores ────────────────────────────
const baseScores = anomalyScores ?? [];
const mergedScores = replayOverrides.length > 0
    ? baseScores.map((s) => {
        const override = replayOverrides.find((o) => o.segment_id === s.segment_id);
        return override ?? s;
      })
    : baseScores;

  // ── Derived data ──────────────────────────────────────────────────────────
  const selectedSegment = MOCK_SEGMENTS.find((s) => s.segment_id === selectedSegmentId) ?? null;
  const selectedScore = mergedScores.find((s) => s.segment_id === selectedSegmentId) ?? null;
  const selectedNH = selectedSegment?.nh_identifier ?? "NH48";

  const handleSegmentClick = (id: string) => {
    setSelectedSegmentId((prev) => (prev === id ? null : id));
  };

  const handleReroute = () => {
    setRerouteOpen(true);
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-fc-950">
      {/* ── Top Navigation ─────────────────────────────────────────────── */}
      <TopNav
        connectionState={connectionState}
        lastUpdated={lastUpdated}
        activeShipments={MOCK_SHIPMENTS.length}
        activeAlerts={unresolved.length}
        onFairnessClick={() => setFairnessOpen(true)}
      />

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <main className="flex-1 flex overflow-hidden min-h-0 p-3 gap-3">
        {/* Left column — Map + Tabs */}
        <div className="flex flex-col flex-1 min-w-0 gap-3">
          {/* Tab bar */}
          <div className="flex items-center gap-2">
            <TabBtn
              id="tab-map"
              active={activeTab === "map"}
              onClick={() => setActiveTab("map")}
              label="🗺 Live Route Viewport"
            />
            <TabBtn
              id="tab-matrix"
              active={activeTab === "matrix"}
              onClick={() => setActiveTab("matrix")}
              label="📊 Anomaly Matrix"
            />

            {/* Chennai Flood Replay button */}
            <button
              id="btn-chennai-replay"
              onClick={replayActive ? stopReplay : startReplay}
              className={
                replayActive
                  ? "ml-auto px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-red-600 to-orange-500 shadow-lg animate-pulse"
                  : "ml-auto px-4 py-1.5 rounded-xl text-sm font-semibold text-fc-200 bg-fc-800/60 hover:bg-gradient-to-r hover:from-red-600/80 hover:to-orange-500/80 hover:text-white border border-fc-700 transition-all"
              }
            >
              {replayActive ? "⏹ Stop Replay" : "🌊 Chennai Flood Replay"}
            </button>
          </div>

          {/* Tab panels */}
          <div className="flex-1 min-h-0 relative">
            {activeTab === "map" ? (
              <div className="h-full relative">
                <RouteVisualizer
                  segments={MOCK_SEGMENTS}
                  anomalyScores={mergedScores}
                  shipments={MOCK_SHIPMENTS}
                  selectedSegmentId={selectedSegmentId}
                  onSegmentClick={handleSegmentClick}
                />
                {/* Segment info drawer overlaid on map */}
                {selectedSegmentId && (
                  <SegmentDrawer
                    segment={selectedSegment}
                    score={selectedScore}
                    onClose={() => setSelectedSegmentId(null)}
                    onReroute={handleReroute}
                  />
                )}

                {/* ── Chennai Replay HUD ─────────────────────────────── */}
                {replayActive && replayFrame && (
                  <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 glass px-6 py-3 flex items-center gap-6 rounded-2xl border border-fc-600/40 shadow-2xl">
                    <div className="flex flex-col items-center">
                      <span className="text-[10px] uppercase tracking-widest text-muted font-semibold">Chennai Flood 2023</span>
                      <span className="text-2xl font-bold text-white font-mono tabular-nums">
                        T-{replayFrame.hours_before_closure}h
                      </span>
                    </div>
                    <div className="w-px h-10 bg-fc-600/40" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted">Timestamp</span>
                      <span className="text-sm font-mono text-fc-200">
                        {new Date(replayFrame.current_timestamp_utc).toLocaleString("en-IN", {
                          hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short",
                        })}
                      </span>
                    </div>
                    <div className="w-px h-10 bg-fc-600/40" />
                    <div className="flex flex-col">
                      <span className="text-xs text-muted">Risk</span>
                      <span
                        className="text-sm font-bold font-mono"
                        style={{
                          color: replayFrame.risk_tier === "RED" ? "#ef4444"
                            : replayFrame.risk_tier === "ORANGE" ? "#f97316"
                            : replayFrame.risk_tier === "YELLOW" ? "#eab308"
                            : "#22c55e"
                        }}
                      >
                        {(replayFrame.normalized_risk_probability * 100).toFixed(1)}% {replayFrame.risk_tier}
                      </span>
                    </div>
                    <div className="w-px h-10 bg-fc-600/40" />
                    <div className="flex flex-col max-w-[200px]">
                      <span className="text-xs text-muted">Event</span>
                      <span className="text-xs text-fc-300 leading-tight">{replayFrame.event}</span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="h-full glass overflow-hidden">
                <AnomalyMatrix
                  segments={MOCK_SEGMENTS}
                  scores={mergedScores}
                  onSegmentSelect={handleSegmentClick}
                  selectedId={selectedSegmentId}
                />
              </div>
            )}
          </div>
        </div>

        {/* Right panel — Gemini AI Insights */}
        <aside className="w-80 flex-shrink-0 glass overflow-hidden flex flex-col">
          <GeminiPanel alerts={alerts} onResolve={resolveAlert} />
        </aside>
      </main>

      {/* ── Modals ─────────────────────────────────────────────────────── */}
      <RerouteModal
        open={rerouteOpen}
        onClose={() => setRerouteOpen(false)}
        segmentId={selectedSegmentId}
        nhIdentifier={selectedNH}
        alternatives={MOCK_ALTERNATIVE_ROUTES}
      />

      <ScorecardModal open={fairnessOpen} onClose={() => setFairnessOpen(false)} />
    </div>
  );
}

function TabBtn({
  id, active, onClick, label,
}: {
  id: string;
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      id={id}
      onClick={onClick}
      className={
        active
          ? "px-4 py-1.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-accent-blue to-accent-purple shadow-accent-blue"
          : "px-4 py-1.5 rounded-xl text-sm font-semibold text-muted bg-fc-800/60 hover:text-fc-200 hover:bg-fc-700/60 border border-fc-700 transition-colors"
      }
    >
      {label}
    </button>
  );
}

