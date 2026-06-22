# Eat timelines reference (temporary)

Scientifically grounded, optimized timelines tailored to the app's structure.

## 1. Small Snack (Minimal Fuel)

Because half an apple or a piece of dark chocolate contains very few carbohydrates and calories, the liver storage phase is brief, and the cellular cleanup crew gets called in much sooner.

```
Phase                               Duration
────────────────────────────────────────────────────────────────────────
Digestion                           1 hour
Pancreas Ramp-Down                  1 hour
Eating from Storage                 6 hours (absolute floor for a true low-calorie snack)
Autophagy (Cleaning Day)            24 hours
```

**Total time to hit Autophagy:** 8 hours after eating.

## 2. Reasonable Meal (Standard Fuel)

A normal, balanced meal fills up your immediate bloodstream and provides a solid deposit of glycogen into your liver, setting a textbook metabolic pace.

```
Phase                               Duration
────────────────────────────────────────────────────────────────────────
Digestion                           2 hours
Pancreas Ramp-Down                  2 hours
Eating from Storage                 10 hours (middle-of-the-road average for standard glycogen stores)
Autophagy (Cleaning Day)            24 hours
```

**Total time to hit Autophagy:** 14 hours after eating.

## 3. Feast (Overloaded Fuel)

An absolute gorge completely overflows your liver's storage capacity. Blood sugar and insulin stay elevated for an extended period, meaning it takes a long time before the body is willing to look at its deep cellular reserves.

```
Phase                               Duration
────────────────────────────────────────────────────────────────────────
Digestion                           3 hours
Pancreas Ramp-Down                  3 hours
Eating from Storage                 14 hours (maximum end of the spectrum as the liver is packed to the brim)
Autophagy (Cleaning Day)            24 hours
```

**Total time to hit Autophagy:** 20 hours after eating.

## Summary guide for app code

Exact duration (in hours) for each phase based on user input:

```
Phase                      Small Snack    Reasonable Meal    Feast
────────────────────────────────────────────────────────────────────
1. Digestion               1 hour         2 hours            3 hours
2. Pancreas Ramp-Down      1 hour         2 hours            3 hours
3. Eating from Storage     6 hours        10 hours           14 hours
4. Autophagy               24 hours       24 hours           24 hours
────────────────────────────────────────────────────────────────────
Total Fasting Timeline     32 hours       38 hours           44 hours
```
