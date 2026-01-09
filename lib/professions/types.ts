// lib/professions/types.ts
import { driveNames } from "@/lib/core-utils/fit-core";

export type DriveName = (typeof driveNames)[number];
export type DriveScore = 0 | 1 | 2 | 3 | 4 | 5;

export type DriveScores = Record<DriveName, DriveScore>;

export type LocalizedText = {
  en: string;
  zh: string;
};

export type OccupationSubtype = {
  name: string;
  name_i18n?: LocalizedText;
  drives: DriveScores; // simulated environment drive demand (0..5)
};

export type OccupationMajor = {
  major: string;
  major_i18n?: LocalizedText;
  subtypes: OccupationSubtype[];
};

export type InstrumentPath = {
  sd: DriveName;
  td: DriveName;

  // share of sd energy diverted into this td (0..1)
  dr: number;

  // fraction of that diverted energy that becomes drained (0..1)
  lr: number;

  // optional: interpreted “effective transfer” share used for mismatch remediation
  effectiveTransfer: number; // dr * (1 - lr)

  // estimated drained energy on this sd->td path
  drainedEnergy: number;
};

export type DrainSummary = {
  totalDrainedEnergy: number;
  paths: InstrumentPath[];
};

export type MismatchProfile = {
  // mismatch[d] = innateAvg - imposed(d)
  mismatch: Record<DriveName, number>;
  totalDeficit: number; // sum of deficits (positive number)
};

export type ProfessionFitResult = {
  major: string;
  subtype: string;

  // mismatch before/after remediation via instrumentation
  raw: MismatchProfile;
  adjusted: MismatchProfile;

  // drain simulation under this profession profile
  drain: DrainSummary;
};
