# Nudge eat model — rules summary

Draft spec for metabolic review. Wording/UI may differ in the app; logic below is the intended behavior.

---

## Profile constants

| Constant | Value |
|----------|--------|
| Liver glycogen cap | **90g** (woman) |
| Liver “empty” floor | **20% of cap = 18g** (not literal 0g) |
| Fat storage baseline | **3.6g** from annual labs (manual profile update) |
| Meal → liver deposit (max) | Snack **8g**, medium **45g**, feast **90g** |

---

## Meal logging

- Every logged meal **adds to the active cycle** (no ignoring smaller meals, no “upgrade only” replacement).
- If the previous cycle has expired, start a fresh cycle with the new meal.
- Multiple meals can overlap; each runs its own fill schedule.

---

## Phase priority (what the user is “in”)

Evaluated in this order:

1. **Digestion (stomach)** — **latest meal only**
2. **Pancreas ramp-down** — **latest meal only**
3. **Liver draining** — liver **above 18g**, and not in (1) or (2)
4. **Autophagy** — liver has reached the **18g floor** (drain stopped)
5. **Inactive** — after autophagy window ends (~24h), back to default until next meal

**Eating pauses liver drain.** When a new meal is logged, digestion/pancreas start for that meal; drain does not run during those phases.

---

## Liver fill (during digestion + pancreas)

- Glycogen is deposited into the liver **during the combined digestion + pancreas window**, not after a separate fixed “liver phase” timer.
- **No drain** while digestion or pancreas is active (for the latest meal).
- Deposit shape over that combined window: **~15% / ~70% / ~15%** of that meal’s grams in three segments:

| Meal | Digestion + pancreas | Segment lengths |
|------|----------------------|-----------------|
| Snack | 1h + 1h = **2h** | 30min / 1h / 30min |
| Medium | 2h + 2h = **4h** | 1h / 2h / 1h |
| Feast | 3h + 3h = **6h** | 1.5h / 3h / 1.5h |

- Multiple meals deposit on their own schedules; **total liver grams capped at 90g**.
- **Overflow:** if already at 90g and still eating/depositing, extra goes to **fat storage** (triglycerides), not liver.

---

## Liver drain (after pancreas, above floor)

- Drain runs **only when** the user is **not** in digestion or pancreas (latest meal past those phases).
- **No fixed liver-phase duration** per meal size; emptying time depends on **current grams** in the tank.
- **Exponential decay** at rest:

  ```
  G(t) = G_current × e^(-k × t)
  ```

  - `G(t)` = remaining liver glycogen (grams) after `t` hours of draining
  - `G_current` = grams when drain segment starts (or resumes after eating)
  - `k` = **0.12** (metabolic resting decay constant)
  - `t` = hours spent draining (**clock pauses** while eating / in digestion or pancreas)

- Drain continues until liver reaches **18g** (20% of **90g cap**).
- **At 18g, drain stops.** Liver never reaches literal 0g in this model; **18g = “empty”** for app purposes.

### Reference: exponential drain from a starting level

```typescript
function liverAfterDrainHours(grams: number, drainHours: number): number {
  const k = 0.12;
  return grams * Math.exp(-k * drainHours);
}

// Example: 90g feast pantry after 4h of draining (continuous, no pauses)
// remaining ≈ 55.7g
```

### Reference: % remaining vs hours (any starting level)

Ratio remaining = `e^(-0.12 × t)`. Same curve whether starting from 8g or 90g.

| Hours draining | % of starting level remaining |
|----------------|-------------------------------|
| 0 | 100% |
| 1 | ~88.7% |
| 2 | ~78.7% |
| 4 | ~61.9% |
| 6 | ~48.7% |
| 8 | ~38.3% |
| 10 | ~30.1% |
| 12 | ~23.7% |
| 14 | ~18.6% |

Note: autophagy trigger is **20% of cap (18g absolute)**, not 18.6% of starting meal size.

---

## Autophagy

- **Starts when liver hits 18g** (20% of cap). Drain has **stopped**; this is a phase switch, not “drain getting very slow.”
- **Fat burning starts at the same moment** (not while liver is still draining above 18g).
- Autophagy lasts **~24 hours**, then cycle ends / app returns to inactive default (not treated as a multi-day fast if user doesn’t log).

---

## Fat storage (triglycerides)

- **Display:** `3.6g + Xg` or `3.6g − Xg` — lab baseline ± app-predicted delta (not a full body fat simulation).
- **Increase (+):** overflow when liver is at **90g cap** during fill.
- **Decrease (−):** **4g/hour** during autophagy (from the moment liver hits the **18g floor**).
- Fat burning is **not** modeled during liver drain or during digestion/pancreas.
- Baseline (3.6g) updated manually when new labs arrive; delta behavior on baseline update TBD.

---

## Removed / not used

- Per-meal fixed **liver phase hours** (old 6h / 10h / 14h windows) — replaced by fill curve + exponential drain to floor.
- “Ignore smaller meal if bigger meal active” — replaced by multi-meal overlap.
- Liver draining to **0g** — replaced by **18g floor**.
- Fat burn only at literal **0g liver** — replaced by fat burn at **18g floor / autophagy start**.

---

## Example timeline (feast + snack)

- **Feast 8am** — up to 90g deposited over 6h fill window (3h digestion + 3h pancreas).
- **Snack 12pm** — up to 8g over 2h fill window, while feast may still be depositing.

| Time | Phase | Notes |
|------|-------|-------|
| 12:00–1:00pm | Digestion (snack) | Latest meal; no drain; deposits continue |
| 1:00–2:00pm | Pancreas (snack) | Latest meal; no drain |
| After 2:00pm | Liver draining | Exponential drain on combined load until **18g** |
| At 18g | Autophagy | Drain stops; fat burn **4g/hr** for ~24h |

Exact grams-over-time depends on overlap, cap, and overflow rules.

---

## Open questions (for metabolic review)

1. Is **20% of cap (18g)** the right autophagy trigger and “functional zero”?
2. Is **k = 0.12** reasonable for glycogen drain between meals?
3. Is **4g/h** fat burn during autophagy plausible as a single rate?
4. Fill curve **15% / 70% / 15%** over digestion+pancreas — any better shape?
5. Overflow to fat only at cap — anything else to model?
