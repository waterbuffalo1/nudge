"use client";

import type { CSSProperties } from "react";
import {
  type EatInfoBlock,
  type EatInfoBullet,
  type EatInfoSection,
  type EatInfoSubsection,
} from "@/lib/eat-info-types";

const sectionTitleClassName =
  "eat-info-section-title text-lg font-semibold tracking-tight text-foreground";

const blockTitleClassName =
  "eat-info-block-title text-base font-semibold tracking-tight text-foreground";

const bodyClassName =
  "eat-info-body text-sm font-medium leading-relaxed tracking-tight text-muted";

const leadClassName = "font-semibold text-foreground";

const listClassName = `${bodyClassName} list-disc pl-5`;

const calloutTitleClassName =
  "eat-info-callout-title text-sm font-semibold tracking-tight text-foreground";

const noteClassName =
  "eat-info-note eat-info-body pt-1 text-xs font-medium leading-relaxed tracking-tight text-muted";

function getBulletKey(item: EatInfoBullet): string {
  return typeof item === "string" ? item : item.label;
}

function renderBulletText(text: string, hasFootnoteMarker: boolean) {
  if (!hasFootnoteMarker) {
    return text;
  }

  const colonIndex = text.indexOf(":");
  if (colonIndex === -1) {
    return (
      <>
        {text}
        <sup className="relative -top-0.5" aria-hidden>
          *
        </sup>
      </>
    );
  }

  return (
    <>
      {text.slice(0, colonIndex)}
      <sup className="relative -top-0.5" aria-hidden>
        *
      </sup>
      {text.slice(colonIndex)}
    </>
  );
}

function renderBulletItem(
  item: EatInfoBullet,
  hasFootnoteMarker: boolean,
) {
  if (typeof item === "string") {
    return renderBulletText(item, hasFootnoteMarker);
  }

  return (
    <>
      <span className={leadClassName}>{item.label}</span> {item.body}
    </>
  );
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
      <h4 className={calloutTitleClassName}>
        {subsection.titleIcon ? (
          <>
            <InfoEmoji icon={subsection.titleIcon} />{" "}
          </>
        ) : null}
        {subsection.title}
      </h4>
      {subsection.lead ? (
        <p className={bodyClassName}>
          {subsection.leadIcon ? (
            <>
              <InfoEmoji icon={subsection.leadIcon} />{" "}
            </>
          ) : null}
          <span className={leadClassName}>{subsection.lead}.</span>
          {subsection.body?.[0] ? ` ${subsection.body[0]}` : null}
        </p>
      ) : null}
      {subsection.body?.slice(bodyStartIndex).map((paragraph, index) => (
        <p key={paragraph} className={bodyClassName}>
          {index === 0 && !subsection.lead && subsection.leadIcon ? (
            <>
              <InfoEmoji icon={subsection.leadIcon} />{" "}
            </>
          ) : null}
          {paragraph}
        </p>
      ))}
      {subsection.bullets ? (
        <ul className={listClassName}>
          {subsection.bullets.map((item, index) => (
            <li key={getBulletKey(item)}>
              {renderBulletItem(
                item,
                Boolean(subsection.note) &&
                  subsection.footnoteBulletIndex === index,
              )}
            </li>
          ))}
        </ul>
      ) : null}
      {subsection.note ? (
        <p className={noteClassName}>
          <span aria-hidden>* </span>
          {subsection.note}
        </p>
      ) : null}
    </div>
  );
}

function InfoBlock({ block }: { block: EatInfoBlock }) {
  return (
    <div className="flex flex-col gap-2">
      <h3 className={blockTitleClassName}>{block.title}</h3>
      {block.body.map((paragraph) => (
        <p key={paragraph} className={bodyClassName}>
          {paragraph}
        </p>
      ))}
      {block.subsections?.map((subsection) => (
        <InfoSubsection key={subsection.title} subsection={subsection} />
      ))}
      {block.bullets ? (
        <ul className={listClassName}>
          {block.bullets.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function EatInfoScreen({
  sections,
  fontScale,
}: {
  sections: EatInfoSection[];
  fontScale: number;
}) {
  return (
    <div
      className="eat-info-screen flex min-h-0 flex-1 flex-col overflow-y-auto pb-[max(2.5rem,env(safe-area-inset-bottom))]"
      style={
        {
          "--eat-info-scale": fontScale,
        } as CSSProperties
      }
    >
      <div className="flex flex-col gap-8 pr-1">
        {sections.map((section) => (
          <section key={section.title} className="flex flex-col gap-4">
            <h2 className={sectionTitleClassName}>{section.title}</h2>

            {section.body?.map((paragraph) => (
              <p key={paragraph} className={bodyClassName}>
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
              <ul className={listClassName}>
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
