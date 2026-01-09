import { driveNames, type DriveName } from "@/lib/core-utils/fit-core";

export const DRIVE_I18N: Record<
  DriveName,
  { en: string; zh: string; defEn: string; defZh: string }
> = {
  Exploration: {
    en: "Exploration",
    zh: "探索创新",
    defEn: "your drive for seeking new experiences, knowledge, and variety in your environment.",
    defZh: "你追求新体验、知识与环境变化的驱动力。",
  },
  Achievement: {
    en: "Achievement",
    zh: "目标成就",
    defEn: "your drive for accomplishing goals, overcoming obstacles, and attaining mastery.",
    defZh: "你追求完成目标、克服障碍并获得成就感的驱动力。",
  },
  Dominance: {
    en: "Dominance",
    zh: "主导决策",
    defEn: "your drive for influence, control, and asserting your will over your surroundings.",
    defZh: "你追求影响力、控制力与主导环境的驱动力。",
  },
  Pleasure: {
    en: "Pleasure",
    zh: "娱乐享受",
    defEn: "your drive for immediate gratification, comfort, and sensory enjoyment.",
    defZh: "你追求即时满足、舒适与感官享受的驱动力。",
  },
  Care: {
    en: "Care",
    zh: "亲密守护",
    defEn: "your drive for nurturing others, providing protection, and maintaining emotional bonds.",
    defZh: "你照顾他人、提供保护与维护亲密情感连接的驱动力。",
  },
  Affiliation: {
    en: "Affiliation",
    zh: "人际关系",
    defEn: "your drive for social belonging, collaboration, and being part of a group.",
    defZh: "你追求归属、协作与群体融入感的驱动力。",
  },
  Value: {
    en: "Value",
    zh: "道德价值",
    defEn: "your drive for satisfying the moral and social standards of your internal compass.",
    defZh: "你追求符合内在道德与社会标准的驱动力。",
  },
};

export function driveLabel(drive: DriveName, locale?: string) {
  const entry = DRIVE_I18N[drive];
  if (!entry) return drive;
  return locale?.startsWith("zh") ? entry.zh : entry.en;
}

export function driveDef(drive: DriveName, locale?: string) {
  const entry = DRIVE_I18N[drive];
  if (!entry) return "";
  return locale?.startsWith("zh") ? entry.defZh : entry.defEn;
}

export function driveInitial(drive: DriveName, locale?: string) {
  const label = driveLabel(drive, locale);
  return label ? label.slice(0, 1) : drive[0];
}

export function driveOrder() {
  return driveNames as DriveName[];
}
