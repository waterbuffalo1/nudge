import {
  hoursToDrainToLevel,
  hoursToReachLiverFloor,
  LIVER_CAP_GRAMS,
  LIVER_FLOOR_GRAMS,
} from "./eat-metabolic";
import type { EatInfoSection } from "./eat-info-types";

function formatHours(hours: number): string {
  const rounded = Math.round(hours);
  if (rounded === 1) {
    return "1 hour";
  }
  return `${rounded} hours`;
}

const LIVER_HALF_GRAMS = LIVER_CAP_GRAMS / 2;
const fullToHalfHours = hoursToDrainToLevel(LIVER_CAP_GRAMS, LIVER_HALF_GRAMS);
const halfToFloorHours = hoursToDrainToLevel(
  LIVER_HALF_GRAMS,
  LIVER_FLOOR_GRAMS,
);
const fullToFloorHours = hoursToReachLiverFloor(LIVER_CAP_GRAMS);

export const EAT_INFO_1_SECTIONS: EatInfoSection[] = [
  {
    title: "What Happens After You Eat",
    body: [
      "Food is not just fuel — it kicks off a whole metabolic shift. Sugar enters your blood, insulin rises, your pancreas works, your liver stores glycogen, and eventually your body shifts toward cleanup and repair.",
      "This app tracks your progress through four distinct phases after each meal. The bigger the meal, the longer each phase lasts.",
    ],
  },
  {
    title: "Phase 1: Digestion",
    body: [
      "Your stomach and gut break food down, causing blood sugar to rise. A massive wave of blood flow shifts directly toward your digestive tract.",
    ],
    subsections: [
      {
        title: "The Food Science",
        leadIcon: "🔨",
        body: [
          "The pancreas reacts to rising blood sugar by pumping out insulin. This hormone acts like a hallway monitor, pestering the energy to get into your liver, fat, and muscle cells.",
          "When sugar floods your blood hallways, the hall monitor (insulin) shoves it into storage in a specific order:",
        ],
        bullets: [
          {
            label: "First Priority: The Major Lecture Halls (Active Muscles):",
            body: "If you are currently walking, moving, or have recently exercised, your muscles have empty, hungry storage vacuoles. Insulin prioritizes shoving glucose here first because active muscles can absorb massive amounts of sugar rapidly.",
          },
          {
            label: "Second Priority: The Principal's Pantry (The Liver):",
            body: "At the exact same time the muscles are filling, insulin opens the liver doors. It packs glucose into your 90g liver tank as glycogen until the tank hits its absolute physical capacity ceiling.",
          },
          {
            label: "Final Priority: The Overflow Storage Closets (Fat Cells):",
            body: "Your fat cells are the absolute last resort. If your muscles are completely inactive (full of energy already) and your liver tank hits its 90g cap, insulin has no choice left. It takes every remaining gram of overflow glucose, converts it into triglycerides, and crams it into your fat cells.",
          },
        ],
      },
      {
        title: "Movement",
        leadIcon: "🚶🏻‍♀️",
        lead: "The post-meal walk",
        body: [
          "Go for a 15–20 minute walk right after eating. Your leg muscles will pull sugar straight from your bloodstream without needing insulin. This blunts the blood sugar spike so your pancreas doesn't have to work nearly as hard.",
        ],
      },
      {
        title: "Avoid",
        leadIcon: "⚠️",
        lead: "Heavy jogging or intense weightlifting",
        body: [
          "Forcefully pulling blood away from your gut to your arms and legs causes cramping, indigestion, and sluggishness.",
        ],
      },
      {
        title: "Phase Duration",
        titleIcon: "⏳",
        bullets: [
          "Small Snack (e.g., half an apple, dark chocolate, a string cheese): 1 hour",
          "Reasonable Meal (e.g., a turkey avocado sandwich, chicken with rice & broccoli): 2 hours",
          "Feast (e.g., a large Thanksgiving dinner, a heavy restaurant meal): 3 hours",
        ],
      },
    ],
  },
  {
    title: "Phase 2: Pancreas Ramp-Down",
    body: [
      "Your blood sugar peaks and begins to settle. The pancreas actively senses this drop and shuts down the assembly line, stopping the production of new insulin.",
    ],
    subsections: [
      {
        title: "The Food Science",
        leadIcon: "🫁",
        body: [
          "Your blood sugar is drifting back toward its flat baseline. During this hour, your body is clearing out the leftover insulin that is still floating in your bloodstream.",
        ],
      },
      {
        title: "Movement",
        leadIcon: "🧘",
        lead: "Pure rest or yoga",
        body: [
          "Low stress is the absolute golden rule here. Your blood sugar is actively dropping; if you spike your stress hormones (cortisol or adrenaline), your liver will panic and dump emergency sugar back into your blood, forcing the pancreas to clock back in.",
        ],
      },
      {
        title: "Avoid",
        leadIcon: "⚠️",
        lead: "Intense cardio, heavy weights, or stressful mental tasks",
        body: [
          "Instead, opt for a slow stroll, light stretching, deep box breathing, or a large glass of water to dilute the blood and help it filter.",
        ],
      },
      {
        title: "Phase Duration",
        titleIcon: "⏳",
        bullets: [
          "Small Snack: 1 hour",
          "Reasonable Meal: 2 hours",
          "Feast: 3 hours",
        ],
      },
    ],
  },
  {
    title: "Phase 3: Eating from Storage",
    body: [
      "Fresh sugar from your meal is entirely gone, and your insulin levels hit baseline. Your body must now rely on its internal backups to keep your energy steady.",
    ],
    subsections: [
      {
        title: "The Food Science",
        leadIcon: "🍯",
        body: [
          "Your body taps into glycogen—the sugar pantry stored inside your liver. As the hours tick by, this pantry runs low. This triggers a chemical switch (AMPK) to open up \"office hours\" and begin building the recycling bins needed for cellular cleanup (autophagy).",
        ],
      },
      {
        title: "Movement",
        leadIcon: "🏋🏻‍♀️",
        lead: "Calisthenics or fasted jogging",
        body: [
          "Doing pushups, planks, or bodyweight work forces your muscles to burn through their own private glycogen pantries. This creates an empty vacuum, meaning the next time you eat, sugar goes straight to your muscles instead of your fat cells. If you go for a steady jog late in this phase, you aggressively drain the remaining liver glycogen, acting like a fast-forward button that brings the cleanup crew to town hours ahead of schedule.",
        ],
      },
      {
        title: "How quickly we use liver fuel",
        titleIcon: "⏳",
        bullets: [
          `Full to half-full: ${formatHours(fullToHalfHours)}`,
          `Half-full to about a quarter full: ${formatHours(halfToFloorHours)}`,
          `All liver glycogen depleted: ${formatHours(fullToFloorHours)} total`,
        ],
        footnoteBulletIndex: 2,
        note: "Your liver never really dips below about 20% — it keeps an emergency reserve.",
      },
    ],
  },
  {
    title: "Phase 4: Autophagy",
    body: [
      "You have successfully drained all the liver reserves. Because the master supply trucks haven't arrived, your cells enter an incredibly healthy survival mode.",
    ],
    subsections: [
      {
        title: "The Food Science",
        leadIcon: "🧹",
        body: [
          "Autophagy literally translates to \"self-eating.\" Your cells look around their internal rooms for alternative fuel. They hunt down misfolded proteins (linked to aging and brain fog), sluggish cellular power plants (mitochondria), and hidden pathogens, melting them down into fresh energy.",
        ],
      },
      {
        title: "Movement",
        leadIcon: "🧘‍♀️",
        lead: "Pure rest, gentle yoga, or a light stroll",
        body: [
          "Leaning into deep rest is a powerful strategy here. Your body requires massive amounts of internal energy to run its cellular recycling machinery. Staying still allows your cells to focus entirely on deep cleanup and repair without competing with active muscles.",
          "If you do move, keep it incredibly light, like a slow walk. Intensive exercise during deep fasting can trigger a stress response, causing your liver to frantically manufacture emergency sugar and spike your insulin.",
        ],
      },
      {
        title: "Duration",
        titleIcon: "⏳",
        body: [
          "Once you cross into autophagy, the cellular cleanup crew runs for 72 hours, or until your next bite of food.",
          "After that, you go into starvation, and we don't want that...",
        ],
      },
    ],
  },
];
