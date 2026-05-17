import path from "path";
import i18next from "i18next";
import Backend from "i18next-fs-backend";
import i18nextMiddleware from "i18next-http-middleware";

export const SUPPORTED_LOCALES = ["en", "tr"] as const;
export type Locale = (typeof SUPPORTED_LOCALES)[number];
export const DEFAULT_LOCALE: Locale = (process.env.DEFAULT_LOCALE as Locale) || "en";

export const i18n = i18next;

export async function initI18n() {
  await i18n
    .use(Backend)
    .use(i18nextMiddleware.LanguageDetector)
    .init({
      backend: {
        loadPath: path.join(__dirname, "..", "i18n", "messages", "{{lng}}.json"),
      },
      fallbackLng: DEFAULT_LOCALE,
      preload: SUPPORTED_LOCALES as unknown as string[],
      supportedLngs: SUPPORTED_LOCALES as unknown as string[],
      ns: ["translation"],
      defaultNS: "translation",
      keySeparator: ".",
      nsSeparator: ":",
      detection: {
        order: ["querystring", "cookie", "header"],
        lookupQuerystring: "lng",
        lookupCookie: "i18next",
        caches: ["cookie"],
      },
      interpolation: { escapeValue: false },
    });
}
