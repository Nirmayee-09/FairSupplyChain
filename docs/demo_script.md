# FairChain Demo Video Script

**Duration**: ~120 Seconds
**Target**: Hackathon Judges / Product Stakeholders
**Voiceover Tone**: Professional, confident, and tech-forward.

---

## 00:00 – 00:15 | Hook & Intro
**Visual**: Zoom into the FairChain Dashboard. The Mapbox "Live Route Viewport" is active, showing glowing blue segments across India's National Highways.
**Voiceover**: "Supply chains are fragile. A single flood or traffic anomaly can cost millions and delay critical cargo for days. Welcome to FairChain—the AI-powered disruption engine that turns raw sensor data into proactive logistics decisions."

---

## 00:15 – 00:40 | Real-Time Monitoring & Anomaly Matrix
**Visual**: Click on the **"Anomaly Matrix"** tab. Show the list of highways (NH48, NH16). Some rows show 0% risk (Green), others are drifting upwards.
**Voiceover**: "Our Tier-1 monitoring stack uses an Isolation Forest model to ingest live rainfall, water levels, and vehicle velocity. While other systems react to closures, FairChain detects anomalies hours before they become roadblocks. Every segment is scored in real-time, giving fleet managers a unified 'Anomaly Detection Matrix' of their entire network."

---

## 00:40 – 01:10 | The "Magic Moment" — Chennai Flood Replay
**Visual**: Click back to the Map tab. Press the **"🌊 Chennai Flood Replay"** button. The HUD appears: **"T-12h"**. As the clock ticks down, a segment on NH48 turns Orange at **T-6h**, then deep Red at **T-4h**.
**Voiceover**: "Let’s look at the magic. We’ve reconstructed the 2023 Chennai Floods. Watch as our model flags the NH48 corridor at T-minus 6 hours. While official road closures are still hours away, FairChain’s Isolation Forest detects the rainfall spike and velocity plunge, triggering a critical alert before the convoy even enters the danger zone."

---

## 01:10 – 01:35 | Gemini AI & Rerouting
**Visual**: Click on the Red segment on the map. The **Gemini AI Insight Console** on the right expands. It shows "Human Impact: 50 workers at risk" and "Actionable Advice: Reroute via Vellore."
**Voiceover**: "Data without context is noise. FairChain integrates Google Gemini 1.5 Pro to provide instant explainability. It translates raw ML scores into human impact statements and actionable logistics advice, ensuring your dispatchers know exactly *why* they need to pivot."

---

## 01:35 – 01:50 | The Fairness Layer
**Visual**: Click the **"Fairness Scorecard"** button in the top nav. A modal pops up showing the **"Disparate Impact Ratio"** and the **"Mitigation Engine"** results.
**Voiceover**: "But we go beyond logistics. FairChain’s Fairness Layer audits every contract. When our AI trust scores show bias against SMEs or women-owned carriers, our mitigation engine reweighs the metrics, ensuring an equitable distribution of contracts and building a truly inclusive supply chain."

---

## 01:50 – 02:00 | Conclusion
**Visual**: Zoom out to show the full dashboard: "All Systems Nominal." The FairChain logo fades in.
**Voiceover**: "Predictive. Explainable. Fair. This is the future of logistics. This is FairChain."

---

## Demo Checklist for Recording:
1. **Reset State**: Ensure Supabase is connected (Green 'Live' indicator).
2. **Matrix View**: Start on the Matrix to show the rows I just fixed.
3. **Replay Flow**: Trigger the Chennai Replay; it’s the most visually "WOW" feature.
4. **Modal Interaction**: Open the Fairness Scorecard to show the auditing depth.
