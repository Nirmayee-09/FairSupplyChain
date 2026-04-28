"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { fetchInitialScores, fetchInitialAlerts } from "@/lib/api";
import {
  MOCK_ANOMALY_SCORES,
  MOCK_ALERTS,
  type AnomalyScore,
  type GeminiAlert,
} from "@/lib/mockData";

type ConnectionState = "connecting" | "live" | "offline" | "demo";

interface RealtimeState {
  anomalyScores: AnomalyScore[];
  alerts: GeminiAlert[];
  connectionState: ConnectionState;
  lastUpdated: Date | null;
}

// Simulate live drift on anomaly scores — mimics historical event replay
function driftScores(base: AnomalyScore[]): AnomalyScore[] {
  return base.map((s) => {
    const drift = (Math.random() - 0.5) * 0.04;
    const newProb = Math.min(1, Math.max(0, s.normalized_risk_probability + drift));
    return {
      ...s,
      normalized_risk_probability: parseFloat(newProb.toFixed(3)),
      current_timestamp_utc: new Date().toISOString(),
    };
  });
}

export function useSupabaseRealtime(): RealtimeState {
  const [state, setState] = useState<RealtimeState>({
    anomalyScores: MOCK_ANOMALY_SCORES,
    alerts: MOCK_ALERTS,
    connectionState: "connecting",
    lastUpdated: null,
  });

  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isConfigured =
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

  // ── Demo simulation loop ─────────────────────────────────────────────────
  const startDemoLoop = useCallback(() => {
    setState((prev) => ({ ...prev, connectionState: "demo" }));
    demoIntervalRef.current = setInterval(() => {
      setState((prev) => ({
        ...prev,
        anomalyScores: driftScores(prev.anomalyScores),
        lastUpdated: new Date(),
      }));
    }, 4000);
  }, []);

  // ── Fetch initial data from Supabase tables, then subscribe ─────────────
  useEffect(() => {
    if (!isConfigured) {
      // Fallback to demo mode
      const t = setTimeout(startDemoLoop, 800);
      return () => {
        clearTimeout(t);
        if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
      };
    }

    // Fetch initial data from Supabase tables (REST), falling back to mock
    let cancelled = false;

    async function loadInitialData() {
      const [scoresResult, alertsResult] = await Promise.all([
        fetchInitialScores(),
        fetchInitialAlerts(),
      ]);

      if (cancelled) return;

      const isLive = scoresResult.live || alertsResult.live;

      if (isLive) {
        setState((prev) => ({
          ...prev,
          anomalyScores: scoresResult.data.length > 0 ? scoresResult.data : prev.anomalyScores,
          alerts: alertsResult.data.length > 0 ? alertsResult.data : prev.alerts,
          connectionState: "live",
          lastUpdated: new Date(),
        }));
      } else {
        startDemoLoop();
      }
    }

    loadInitialData();

    // ── Supabase realtime subscription ──────────────────────────────────
    const channel = supabase
      .channel("fairchain-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "segment_states" },
        (payload) => {
          const incoming = payload.new as AnomalyScore;
          setState((prev) => ({
            ...prev,
            anomalyScores: prev.anomalyScores.some(
              (s) => s.segment_id === incoming.segment_id,
            )
              ? prev.anomalyScores.map((s) =>
                  s.segment_id === incoming.segment_id
                    ? { ...s, ...incoming }
                    : s,
                )
              : [...prev.anomalyScores, incoming],
            lastUpdated: new Date(),
          }));
        },
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        (payload) => {
          const incoming = payload.new as GeminiAlert;
          setState((prev) => ({
            ...prev,
            alerts: [incoming, ...prev.alerts].slice(0, 20),
            lastUpdated: new Date(),
          }));
        },
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          setState((prev) => ({
            ...prev,
            connectionState: "live",
            lastUpdated: new Date(),
          }));
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          setState((prev) => ({ ...prev, connectionState: "offline" }));
          // Attempt recovery via demo loop
          startDemoLoop();
        }
      });

    channelRef.current = channel;

    return () => {
      cancelled = true;
      channel.unsubscribe();
      if (demoIntervalRef.current) clearInterval(demoIntervalRef.current);
    };
  }, [isConfigured, startDemoLoop]);

  return state;
}

// ── Alert resolution helper ──────────────────────────────────────────────────
export function useAlertManager(initialAlerts: GeminiAlert[]) {
  const [alerts, setAlerts] = useState<GeminiAlert[]>(initialAlerts);

  // Sync when initialAlerts changes (e.g. from realtime updates)
  useEffect(() => {
    setAlerts(initialAlerts);
  }, [initialAlerts]);

  const resolveAlert = useCallback((id: string) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a)),
    );
  }, []);

  const unresolved = alerts.filter((a) => !a.resolved);
  const resolved = alerts.filter((a) => a.resolved);

  return { alerts, unresolved, resolved, resolveAlert };
}
