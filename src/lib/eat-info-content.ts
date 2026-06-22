export type EatInfoBlock = {
  title: string;
  body: string[];
  bullets?: string[];
  subsections?: EatInfoSubsection[];
};

export type EatInfoSubsection = {
  title: string;
  titleIcon?: string;
  lead?: string;
  leadIcon?: string;
  body?: string[];
  bullets?: string[];
};

export type EatInfoSection = {
  title: string;
  body?: string[];
  blocks?: EatInfoBlock[];
  subsections?: EatInfoSubsection[];
  bullets?: string[];
};

export const EAT_INFO_SECTIONS: EatInfoSection[] = [
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
        leadIcon: "⚙️",
        body: [
          "The pancreas reacts to rising blood sugar by pumping out insulin. This hormone acts like a key, unlocking your cells to store the incoming energy.",
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
          "Feast (e.g., a large Thanksgiving dinner, a heavy restaurant cheat meal): 3 hours",
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
          "Your body taps into glycogen—the sugar pantry stored inside your liver. As the hours tick by, this pantry runs low. This triggers a chemical switch (AMPK) to open up \"office hours\" and begin building the recycling bins needed for cellular cleanup.",
        ],
      },
      {
        title: "Movement",
        leadIcon: "🏋🏻‍♀️",
        lead: "Calisthenics or fasted jogging",
        body: [
          "Doing pushups, planks, or bodyweight work forces your muscles to burn through their own private glycogen pantries. This creates an empty vacuum, meaning the next time you eat, sugar goes straight to your muscles instead of your fat cells. If you go for a steady jog late in this phase, you aggressively drain the remaining liver pantry, acting like a fast-forward button that brings the cleanup crew to town hours ahead of schedule.",
        ],
      },
      {
        title: "Phase Duration",
        titleIcon: "⏳",
        bullets: [
          "Small Snack: 6 hours",
          "Reasonable Meal: 10 hours",
          "Feast: 14 hours",
        ],
      },
    ],
  },
  {
    title: "Phase 4: Autophagy",
    body: [
      "You have successfully emptied the liver pantry. Because the master supply trucks haven't arrived, your cells enter an incredibly healthy survival mode.",
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
        leadIcon: "🏃🏻‍♀️",
        lead: "Steady cardio",
        body: [
          "A light jog or aerobic exercise while deep in Autophagy acts like a turbo-charge for cellular recycling. Your body is fully restricted from using sugar, meaning it aggressively scavenges old proteins and body fat to keep you moving.",
        ],
      },
      {
        title: "Phase Duration",
        titleIcon: "⏳",
        bullets: [
          "All Meal Sizes: 24 hours (Once you cross the finish line into Autophagy, the cellular cleanup crew runs for up to three days, or until your next bite of food!)",
        ],
      },
    ],
  },
];
