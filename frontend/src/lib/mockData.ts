// ─── Types ────────────────────────────────────────────────────────────────────

export interface RouteSegment {
  segment_id: string;
  nh_identifier: string;
  start_node_latlon: [number, number];
  end_node_latlon: [number, number];
  base_distance_km: number;
  historical_delay_variance: number;
  geometry?: GeoJSON.LineString;
}

export interface AnomalyScore {
  segment_id: string;
  normalized_risk_probability: number;
  isolation_forest_raw_score: number;
  dominant_anomalous_features: string[];
  model_confidence_interval: [number, number];
  current_timestamp_utc: string;
  risk_tier?: "RED" | "ORANGE" | "YELLOW" | "GREEN";
}

export interface Shipment {
  shipment_id: string;
  segment_id: string;
  cargo_type: string;
  value_inr: number;
  latlon: [number, number];
  status: "on-time" | "delayed" | "at-risk";
}

export interface AlternativeRoute {
  id: string;
  label: string;
  via: string;
  distance_km: number;
  estimated_delay_min: number;
  cost_inr: number;
  carrier_type: "large-enterprise" | "sme" | "women-owned";
  raw_ml_confidence: number;
  fairness_adjusted_confidence: number;
  recommended: boolean;
}

export interface GeminiAlert {
  id: string;
  segment_id: string;
  nh_identifier: string;
  severity: "critical" | "high" | "moderate";
  headline: string;          // short title shown collapsed
  body: string;              // full AI text shown expanded
  created_at: string;        // ISO timestamp
  resolved: boolean;
}

export interface SupplierRecord {
  supplier_id: string;
  name: string;
  category: "large-enterprise" | "sme" | "women-owned" | "developing-economy";
  location_tier: 0 | 1;
  business_size: 0 | 1;
  owner_gender: 0 | 1;
  years_active: number;
  on_time_delivery_rate: number;
  defect_rate: number;
  actual_performance_score: number;
  ai_trust_score: number;
  contract_awarded: 0 | 1;
}

// ─── Mock Segments (28 segments across 10 highways) ──────────────────────────

export const MOCK_SEGMENTS: RouteSegment[] = [
  // NH48 — Chennai → Bengaluru
  { segment_id: "nh48-seg-01", nh_identifier: "NH48", start_node_latlon: [13.0827, 80.2707], end_node_latlon: [12.6819, 79.9845], base_distance_km: 68.2, historical_delay_variance: 1.2 },
  { segment_id: "nh48-seg-02", nh_identifier: "NH48", start_node_latlon: [12.6819, 79.9845], end_node_latlon: [12.3428, 79.6981], base_distance_km: 55.4, historical_delay_variance: 0.9 },
  { segment_id: "nh48-seg-03", nh_identifier: "NH48", start_node_latlon: [12.3428, 79.6981], end_node_latlon: [12.1279, 78.1482], base_distance_km: 88.7, historical_delay_variance: 1.5 },
  { segment_id: "nh48-seg-04", nh_identifier: "NH48", start_node_latlon: [12.1279, 78.1482], end_node_latlon: [12.9716, 77.5946], base_distance_km: 77.3, historical_delay_variance: 1.1 },
  { segment_id: "nh48-seg-05", nh_identifier: "NH48", start_node_latlon: [12.9716, 77.5946], end_node_latlon: [28.6139, 77.2090], base_distance_km: 56.0, historical_delay_variance: 0.7 },
  // NH48 — Delhi → Jaipur
  { segment_id: "nh48-seg-06", nh_identifier: "NH48", start_node_latlon: [28.6139, 77.2090], end_node_latlon: [27.0238, 76.1422], base_distance_km: 135.0, historical_delay_variance: 0.8 },
  { segment_id: "nh48-seg-07", nh_identifier: "NH48", start_node_latlon: [27.0238, 76.1422], end_node_latlon: [26.9124, 75.7873], base_distance_km: 65.0, historical_delay_variance: 0.6 },
  // NH16 — Kolkata → Visakhapatnam
  { segment_id: "nh16-seg-01", nh_identifier: "NH16", start_node_latlon: [22.5726, 88.3639], end_node_latlon: [20.9517, 85.0985], base_distance_km: 220.0, historical_delay_variance: 1.4 },
  { segment_id: "nh16-seg-02", nh_identifier: "NH16", start_node_latlon: [20.9517, 85.0985], end_node_latlon: [19.8135, 85.8312], base_distance_km: 170.0, historical_delay_variance: 1.0 },
  { segment_id: "nh16-seg-03", nh_identifier: "NH16", start_node_latlon: [19.8135, 85.8312], end_node_latlon: [17.6868, 83.2185], base_distance_km: 165.0, historical_delay_variance: 1.3 },
  { segment_id: "nh16-seg-04", nh_identifier: "NH16", start_node_latlon: [17.6868, 83.2185], end_node_latlon: [13.0827, 80.2707], base_distance_km: 200.0, historical_delay_variance: 0.9 },
  // NH44 — Bengaluru → Hyderabad
  { segment_id: "nh44-seg-01", nh_identifier: "NH44", start_node_latlon: [12.9716, 77.5946], end_node_latlon: [14.4673, 77.7103], base_distance_km: 175.0, historical_delay_variance: 1.1 },
  { segment_id: "nh44-seg-02", nh_identifier: "NH44", start_node_latlon: [14.4673, 77.7103], end_node_latlon: [15.8281, 78.0373], base_distance_km: 160.0, historical_delay_variance: 0.8 },
  { segment_id: "nh44-seg-03", nh_identifier: "NH44", start_node_latlon: [15.8281, 78.0373], end_node_latlon: [17.3850, 78.4867], base_distance_km: 145.0, historical_delay_variance: 0.7 },
  // NH45 — Bengaluru → Mysuru
  { segment_id: "nh45-seg-01", nh_identifier: "NH45", start_node_latlon: [12.9716, 77.5946], end_node_latlon: [12.5510, 76.9174], base_distance_km: 75.0, historical_delay_variance: 0.5 },
  { segment_id: "nh45-seg-02", nh_identifier: "NH45", start_node_latlon: [12.5510, 76.9174], end_node_latlon: [12.2958, 76.6394], base_distance_km: 65.0, historical_delay_variance: 0.4 },
  // NH32 — Chennai → Pondicherry
  { segment_id: "nh32-seg-01", nh_identifier: "NH32", start_node_latlon: [13.0827, 80.2707], end_node_latlon: [12.5165, 79.9876], base_distance_km: 78.0, historical_delay_variance: 1.5 },
  { segment_id: "nh32-seg-02", nh_identifier: "NH32", start_node_latlon: [12.5165, 79.9876], end_node_latlon: [11.9416, 79.8083], base_distance_km: 72.0, historical_delay_variance: 2.1 },
  // NH19 — Delhi → Agra → Kanpur
  { segment_id: "nh19-seg-01", nh_identifier: "NH19", start_node_latlon: [28.6139, 77.2090], end_node_latlon: [27.1767, 78.0081], base_distance_km: 205.0, historical_delay_variance: 0.9 },
  { segment_id: "nh19-seg-02", nh_identifier: "NH19", start_node_latlon: [27.1767, 78.0081], end_node_latlon: [26.8467, 80.9462], base_distance_km: 148.0, historical_delay_variance: 0.8 },
  { segment_id: "nh19-seg-03", nh_identifier: "NH19", start_node_latlon: [26.8467, 80.9462], end_node_latlon: [25.3176, 82.9739], base_distance_km: 130.0, historical_delay_variance: 1.0 },
  // NH58 — Delhi → Dehradun
  { segment_id: "nh58-seg-01", nh_identifier: "NH58", start_node_latlon: [28.6139, 77.2090], end_node_latlon: [29.0900, 77.6700], base_distance_km: 95.0, historical_delay_variance: 0.7 },
  { segment_id: "nh58-seg-02", nh_identifier: "NH58", start_node_latlon: [29.0900, 77.6700], end_node_latlon: [29.9457, 78.1642], base_distance_km: 105.0, historical_delay_variance: 1.2 },
  { segment_id: "nh58-seg-03", nh_identifier: "NH58", start_node_latlon: [29.9457, 78.1642], end_node_latlon: [30.3165, 78.0322], base_distance_km: 50.0, historical_delay_variance: 1.8 },
  // NH27 — Lucknow → Varanasi
  { segment_id: "nh27-seg-01", nh_identifier: "NH27", start_node_latlon: [26.8467, 80.9462], end_node_latlon: [26.4499, 81.8937], base_distance_km: 118.0, historical_delay_variance: 0.6 },
  { segment_id: "nh27-seg-02", nh_identifier: "NH27", start_node_latlon: [26.4499, 81.8937], end_node_latlon: [25.8000, 82.5500], base_distance_km: 110.0, historical_delay_variance: 0.9 },
  { segment_id: "nh27-seg-03", nh_identifier: "NH27", start_node_latlon: [25.8000, 82.5500], end_node_latlon: [25.3176, 82.9739], base_distance_km: 95.0, historical_delay_variance: 0.7 },
  // SH-Local — Chennai intra-city
  { segment_id: "sh-local-01", nh_identifier: "SH-Local", start_node_latlon: [13.0500, 80.2200], end_node_latlon: [13.0100, 80.1800], base_distance_km: 5.2, historical_delay_variance: 2.1 },
];

// ─── Mock Anomaly Scores ──────────────────────────────────────────────────────

export const MOCK_ANOMALY_SCORES: AnomalyScore[] = MOCK_SEGMENTS.map((seg, i) => {
  const risk = [0.92, 0.78, 0.45, 0.31, 0.18, 0.22, 0.15, 0.67, 0.55, 0.48, 0.39,
                0.28, 0.21, 0.19, 0.14, 0.12, 0.88, 0.95, 0.33, 0.27, 0.23, 0.41,
                0.53, 0.72, 0.29, 0.24, 0.18, 0.85][i] ?? 0.3;
  const featureOptions = [
    ["rainfall_spike", "water_level_rise"],
    ["velocity_plunge", "incident_count_spike"],
    ["visibility_drop", "historical_delay_variance"],
    ["segment_load_factor"],
    ["nominal"],
  ];
  const features = featureOptions[Math.min(Math.floor(risk * 4), 4)];
  return {
    segment_id: seg.segment_id,
    normalized_risk_probability: risk,
    isolation_forest_raw_score: -(risk * 0.4 + 0.1),
    dominant_anomalous_features: features,
    model_confidence_interval: [
      parseFloat((risk - 0.08).toFixed(3)),
      parseFloat((risk + 0.08).toFixed(3)),
    ],
    current_timestamp_utc: new Date().toISOString(),
    risk_tier: risk >= 0.8 ? "RED" : risk >= 0.6 ? "ORANGE" : risk >= 0.4 ? "YELLOW" : "GREEN",
  };
});

// ─── Mock Alerts ─────────────────────────────────────────────────────────────

export const MOCK_ALERTS: GeminiAlert[] = [
  {
    id: "alert-001",
    segment_id: "nh32-seg-02",
    nh_identifier: "NH32",
    severity: "critical",
    headline: "Severe flooding puts 50 workers and ₹20L in perishable cargo at immediate risk.",
    body: "Reroute shipment via NH44 and hold perishable goods at inland temperature-controlled warehouse. Isolation Forest flagged a rainfall_spike anomaly 4 hours before official road closure on NH32.",
    created_at: new Date(Date.now() - 12 * 60000).toISOString(),
    resolved: false,
  },
  {
    id: "alert-002",
    segment_id: "nh48-seg-01",
    nh_identifier: "NH48",
    severity: "critical",
    headline: "Flash flood warning on NH48 — ₹15L electronics convoy at risk.",
    body: "Halt convoy at Tambaram depot and initiate alternate SH-Local bypass immediately. Model confidence interval: 0.84–1.00. Dominant features: rainfall_spike, water_level_rise.",
    created_at: new Date(Date.now() - 5 * 60000).toISOString(),
    resolved: false,
  },
  {
    id: "alert-003",
    segment_id: "nh16-seg-01",
    nh_identifier: "NH16",
    severity: "high",
    headline: "Road obstruction on NH16 delays 200+ workers and ₹8L FMCG cargo.",
    body: "Divert via NH12 and notify downstream warehouses of a 4-hour buffer delay. Dominant features: velocity_plunge, incident_count_spike. Risk score: 0.67.",
    created_at: new Date(Date.now() - 28 * 60000).toISOString(),
    resolved: false,
  },
];

// ─── Mock Shipments ───────────────────────────────────────────────────────────

export const MOCK_SHIPMENTS: Shipment[] = [
  { shipment_id: "SHP-001", segment_id: "nh48-seg-01", cargo_type: "Perishables", value_inr: 2000000, latlon: [13.0200, 80.1500], status: "at-risk" },
  { shipment_id: "SHP-002", segment_id: "nh32-seg-02", cargo_type: "Electronics", value_inr: 1500000, latlon: [12.2000, 79.9000], status: "delayed" },
  { shipment_id: "SHP-003", segment_id: "nh44-seg-01", cargo_type: "Pharmaceuticals", value_inr: 800000, latlon: [13.5000, 77.6500], status: "on-time" },
  { shipment_id: "SHP-004", segment_id: "nh19-seg-01", cargo_type: "FMCG", value_inr: 500000, latlon: [27.8000, 77.9000], status: "on-time" },
  { shipment_id: "SHP-005", segment_id: "nh16-seg-01", cargo_type: "Textiles", value_inr: 1200000, latlon: [21.5000, 86.5000], status: "at-risk" },
  { shipment_id: "SHP-006", segment_id: "nh48-seg-04", cargo_type: "Automotive", value_inr: 4500000, latlon: [12.5000, 77.8000], status: "on-time" },
  { shipment_id: "SHP-007", segment_id: "nh27-seg-02", cargo_type: "Agri-products", value_inr: 300000, latlon: [26.0000, 82.2000], status: "on-time" },
  { shipment_id: "SHP-008", segment_id: "nh58-seg-02", cargo_type: "Industrial", value_inr: 900000, latlon: [29.5000, 77.9000], status: "delayed" },
];

// ─── Mock Alternative Routes ──────────────────────────────────────────────────

export const MOCK_ALTERNATIVE_ROUTES: AlternativeRoute[] = [
  {
    id: "route-a",
    label: "Route A — Enterprise Partner",
    via: "NH4 via Vellore",
    distance_km: 380,
    estimated_delay_min: 45,
    cost_inr: 500000,
    carrier_type: "large-enterprise",
    raw_ml_confidence: 0.95,
    fairness_adjusted_confidence: 0.95,
    recommended: false,
  },
  {
    id: "route-b",
    label: "Route B — Local SME ✓ Fairness Pick",
    via: "SH-Local via Tambaram",
    distance_km: 345,
    estimated_delay_min: 30,
    cost_inr: 150000,
    carrier_type: "sme",
    raw_ml_confidence: 0.45,
    fairness_adjusted_confidence: 0.92,
    recommended: true,
  },
  {
    id: "route-c",
    label: "Route C — Women-Owned Carrier",
    via: "NH32 Coastal",
    distance_km: 420,
    estimated_delay_min: 60,
    cost_inr: 210000,
    carrier_type: "women-owned",
    raw_ml_confidence: 0.38,
    fairness_adjusted_confidence: 0.81,
    recommended: false,
  },
];

// ─── Mock Suppliers (for Fairness Scorecard) ──────────────────────────────────

function makeSup(
  id: string, cat: SupplierRecord["category"], tier: 0|1, size: 0|1,
  gender: 0|1, years: number, otd: number, defect: number, actual: number, ai: number, awarded: 0|1
): SupplierRecord {
  return { supplier_id: id, name: `Supplier ${id}`, category: cat, location_tier: tier,
           business_size: size, owner_gender: gender, years_active: years,
           on_time_delivery_rate: otd, defect_rate: defect,
           actual_performance_score: actual, ai_trust_score: ai, contract_awarded: awarded };
}

export const MOCK_SUPPLIERS: SupplierRecord[] = [
  makeSup("S001", "large-enterprise", 1, 1, 1, 15, 97, 0.8, 94, 93, 1),
  makeSup("S002", "large-enterprise", 1, 1, 1, 12, 95, 1.1, 91, 90, 1),
  makeSup("S003", "large-enterprise", 1, 1, 0, 18, 98, 0.6, 96, 95, 1),
  makeSup("S004", "sme",              0, 0, 1,  5, 91, 1.5, 88, 73, 0),
  makeSup("S005", "sme",              0, 0, 1,  3, 89, 1.8, 85, 69, 0),
  makeSup("S006", "sme",              0, 0, 0,  7, 93, 1.2, 90, 76, 0),
  makeSup("S007", "women-owned",      0, 0, 0,  4, 90, 1.4, 87, 71, 0),
  makeSup("S008", "women-owned",      0, 0, 0,  6, 92, 1.3, 89, 74, 0),
  makeSup("S009", "developing-economy", 0, 0, 1, 2, 86, 2.1, 82, 66, 0),
  makeSup("S010", "developing-economy", 0, 0, 0, 3, 88, 1.9, 84, 68, 0),
  makeSup("S011", "large-enterprise", 1, 1, 1, 20, 99, 0.4, 97, 96, 1),
  makeSup("S012", "sme",              0, 0, 1,  8, 94, 1.0, 91, 77, 1),
];