"use client";

import { useEffect, useState } from "react";
import {
  EAT_INFO_SECTIONS,
  type EatInfoBlock,
  type EatInfoSubsection,
} from "@/lib/eat-info-content";

const FONT_SCALE_STEPS = [0.85, 0.925, 1, 1.1, 1.2, 1.35] as const;
const DEFAULT_FONT_SCALE_INDEX = 2;
const EAT_INFO_FONT_SCALE_KEY = "eat-info-font-scale";

const fontControlClassName =
  "flex size-8 touch-manipulation items-center justify-center rounded-full text-base font-medium text-muted active:text-foreground disabled:opacity-35 disabled:active:text-muted";

function readStoredFontScaleIndex(): number {
  if (typeof window === "undefined") {
    return DEFAULT_FONT_SCALE_INDEX;
  }

  const raw = window.localStorage.getItem(EAT_INFO_FONT_SCALE_KEY);
  if (!raw) {
    return DEFAULT_FONT_SCALE_INDEX;
  }

  const parsed = Number.parseInt(raw, 10);
  if (
    Number.isNaN(parsed) ||
    parsed < 0 ||
    parsed >= FONT_SCALE_STEPS.length
  ) {
    return DEFAULT_FONT_SCALE_INDEX;
  }

  return parsed;
}

function InfoEmoji({ icon }: { icon: string }) {
  return (
    <span className="eat-phase-emoji-color-inline" aria-hidden>
      {icon}
    </span>
  );
}

function InfoSubsection({ subsection }: { subsection: EatInfoSubsection }) {
  const bodyStartIndex = subsection.lead ? 1 : 0;

  return (
    <div className="flex flex-col gap-1 pt-1">
      <h4 className="eat-info-callout-title">
        {subsection.titleIcon ? (
          <>
            <InfoEmoji icon={subsection.titleIcon} />{" "}
          </>
        ) : null}
        {subsection.title}
      </h4>
      {subsection.lead ? (
        <p className="eat-info-body">
          {subsection.leadIcon ? (
            <>
              <InfoEmoji icon={subsection.leadIcon} />{" "}
            </>
          ) : null}
          <span className="eat-info-lead">{subsection.lead}.</span>
          {subsection.body?.[0] ? ` ${subsection.body[0]}` : null}
        </p>
      ) : null}
      {subsection.body?.slice(bodyStartIndex).map((paragraph, index) => (
        <p key={paragraph} className="eat-info-body">
          {index === 0 && !subsection.lead && subsection.leadIcon ? (
            <>
              <InfoEmoji icon={subsection.leadIcon} />{" "}
            </>
          ) : null}
          {paragraph}
        </p>
      ))}
      {subsection.bullets ? (
        <ul className="eat-info-body eat-info-list">
          {subsection.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function InfoBlock({ block }: { block: EatInfoBlock }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="eat-info-block-title">{block.title}</h3>
      {block.body.map((paragraph) => (
        <p key={paragraph} className="eat-info-body">
          {paragraph}
        </p>
      ))}
      {block.subsections?.map((subsection) => (
        <InfoSubsection key={subsection.title} subsection={subsection} />
      ))}
      {block.bullets ? (
        <ul className="eat-info-body eat-info-list">
          {block.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function EatInfoScreen() {
  const [fontScaleIndex, setFontScaleIndex] = useState(DEFAULT_FONT_SCALE_INDEX);

  useEffect(() => {
    setFontScaleIndex(readStoredFontScaleIndex());
  }, []);

  useEffect(() => {
    window.localStorage.setItem(
      EAT_INFO_FONT_SCALE_KEY,
      String(fontScaleIndex),
    );
  }, [fontScaleIndex]);

  const canDecrease = fontScaleIndex > 0;
  const canIncrease = fontScaleIndex < FONT_SCALE_STEPS.length - 1;

  return (
    <div
      className="eat-info-screen flex min-h-0 flex-1 flex-col overflow-y-auto pb-[max(2.5rem,env(safe-area-inset-bottom))]"
      style={
        {
          "--eat-info-scale": FONT_SCALE_STEPS[fontScaleIndex],
        } as React.CSSProperties
      }
    >
      <div className="sticky top-0 z-10 -mx-1 mb-4 flex justify-end gap-1 bg-background/90 pb-2 pt-1 backdrop-blur-sm">
        <button
          type="button"
          className={fontControlClassName}
          aria-label="Decrease text size"
          disabled={!canDecrease}
          onClick={() => {
            setFontScaleIndex((current) => Math.max(0, current - 1));
          }}
        >
          −
        </button>
        <button
          type="button"
          className={fontControlClassName}
          aria-label="Increase text size"
          disabled={!canIncrease}
          onClick={() => {
            setFontScaleIndex((current) =>
              Math.min(FONT_SCALE_STEPS.length - 1, current + 1),
            );
          }}
        >
          +
        </button>
      </div>

      <div className="flex flex-col gap-8 pr-1">
        {EAT_INFO_SECTIONS.map((section) => (
          <section key={section.title} className="flex flex-col gap-4">
            <h2 className="eat-info-section-title">{section.title}</h2>

            {section.body?.map((paragraph) => (
              <p key={paragraph} className="eat-info-body">
                {paragraph}
              </p>
            ))}

            {section.blocks?.map((block) => (
              <InfoBlock key={block.title} block={block} />
            ))}

            {section.subsections?.map((subsection) => (
              <InfoSubsection key={subsection.title} subsection={subsection} />
            ))}

            {section.bullets ? (
              <ul className="eat-info-body eat-info-list">
                {section.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}
          </section>
        ))}
      </div>
    </div>
  );
}
