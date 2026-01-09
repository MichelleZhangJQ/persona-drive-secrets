export type Locale = "en" | "zh";
export type BilingualMode = "single" | "bilingual";

export const headerI18n = {
  nav: {
    main: { en: "Main", zh: "主页" },
    theories: { en: "Theories", zh: "理论" },
    orders: { en: "Orders", zh: "订单" },
  },
  auth: {
    loading: { en: "Loading...", zh: "加载中..." },
    cartTitle: { en: "Cart", zh: "购物车" },
    welcome: { en: "Welcome", zh: "欢迎" },
    logout: { en: "Log Out", zh: "退出登录" },
    loginSignup: { en: "Log in / Sign up", zh: "登录 / 注册" },
    saveAccount: { en: "Save Account", zh: "保存账号" },
    login: { en: "Log In", zh: "登录" },
  },
  lang: {
    selectorLabel: { en: "Language selector", zh: "语言选择" },
    english: { en: "English", zh: "英语" },
    chinese: { en: "Chinese", zh: "中文" },
    bilingual: { en: "Bilingual", zh: "双语" },
  },
} as const;

export function pick(item: { en: string; zh: string }, locale: Locale, mode: BilingualMode) {
  if (mode === "bilingual") return `${item.en} / ${item.zh}`;
  return locale === "zh" ? item.zh : item.en;
}
