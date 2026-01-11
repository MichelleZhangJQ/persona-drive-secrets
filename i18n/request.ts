import { getRequestConfig } from "next-intl/server";
import { locales, defaultLocale } from "@/i18n/config";

export default getRequestConfig(async ({ locale }) => {
  const resolvedLocale = locales.includes(locale as any) ? locale : defaultLocale;

  const home = (await import(`@/locales/${resolvedLocale}/home.json`)).default;
  const tests = (await import(`@/locales/${resolvedLocale}/tests.json`)).default;
  const jung = (await import(`@/locales/${resolvedLocale}/jung.json`)).default;
  const jungReport = (await import(`@/locales/${resolvedLocale}/jung-report.json`)).default;

  // ✅ add this
  const overall = (await import(`@/locales/${resolvedLocale}/overall.json`)).default;

  return {
    locale: resolvedLocale,
    messages: { ...home, ...tests, ...jung, ...jungReport, ...overall },
  };
});