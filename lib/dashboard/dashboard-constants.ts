// app/dashboard-constants.ts

export type MessageKey = 
  | "welcome" 
  | "imposed"      // Changed from 'public'
  | "surface"     // Changed from 'private'
  | "innate" 
  | "report";

export interface ConfigDescription {
  titleKey: string;
  descriptionKey: string;
  color: string;
  tag?: string;
}

export const configDescriptions: Record<MessageKey, ConfigDescription> = {
  welcome: {
    titleKey: "dashboard.welcome.title",
    descriptionKey: "dashboard.welcome.description",
    color: "text-slate-800"
  },
  imposed: {
    titleKey: "dashboard.imposed.title",
    descriptionKey: "dashboard.imposed.description",
    color: "text-[#93a97c]" // Matching your Green card
  },
  surface: {
    titleKey: "dashboard.surface.title",
    descriptionKey: "dashboard.surface.description",
    color: "text-[#7c94be]" // Matching your Blue card
  },
  innate: {
    titleKey: "dashboard.innate.title",
    descriptionKey: "dashboard.innate.description",
    color: "text-[#684c9b]" // Matching your Purple card
  },
  report: {
    titleKey: "dashboard.report.title",
    descriptionKey: "dashboard.report.description",
    color: "text-[#c77b84]" // Matching your Rosewood card
  }
};
