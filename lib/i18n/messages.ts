import en from "@/locales/en/home.json";
import zh from "@/locales/zh/home.json";

export type Locale = "en" | "zh";

type MessageBundle = typeof en;

const bundles: Record<Locale, MessageBundle> = {
  en,
  zh,
};

function resolveMessage(bundle: MessageBundle, key: string) {
  const base = bundle.home as Record<string, any>;
  return key.split(".").reduce<any>((acc, part) => (acc ? acc[part] : undefined), base);
}

function interpolate(template: string, values?: Record<string, string | number>) {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, key) => {
    const value = values[key];
    return value === undefined ? match : String(value);
  });
}

export function getHomeMessage(
  locale: string,
  key: string,
  values?: Record<string, string | number>
) {
  const normalized: Locale = locale === "zh" ? "zh" : "en";
  const bundle = bundles[normalized] ?? bundles.en;
  const raw = resolveMessage(bundle, key);
  if (typeof raw !== "string") return key;
  return interpolate(raw, values);
}
