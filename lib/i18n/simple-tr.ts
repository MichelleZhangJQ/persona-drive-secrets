type AnyRecord = Record<string, any>;

function deepGet(obj: AnyRecord, key: string) {
  return key.split(".").reduce((acc, k) => {
    if (acc && typeof acc === "object") return acc[k];
    return undefined;
  }, obj);
}

function formatTemplate(text: string, values?: Record<string, any>) {
  if (!values) return text;
  return text.replace(/\{(\w+)\}/g, (_, k) => {
    const v = values[k];
    return v === undefined || v === null ? "" : String(v);
  });
}

export function makeTr(opts: { en: AnyRecord; zh: AnyRecord; locale: string }) {
  const isZh = opts.locale?.startsWith("zh");
  return (key: string, values?: Record<string, any>) => {
    const primary = isZh ? opts.zh : opts.en;
    const fallback = opts.en;

    const s = deepGet(primary, key) ?? deepGet(fallback, key) ?? key;
    return typeof s === "string" ? formatTemplate(s, values) : key;
  };
}
