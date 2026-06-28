export type EatInfoLabeledBullet = {
  label: string;
  body: string;
};

export type EatInfoBullet = string | EatInfoLabeledBullet;

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
  bullets?: EatInfoBullet[];
  note?: string;
  footnoteBulletIndex?: number;
};

export type EatInfoSection = {
  title: string;
  body?: string[];
  blocks?: EatInfoBlock[];
  subsections?: EatInfoSubsection[];
  bullets?: string[];
};
