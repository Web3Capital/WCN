// One-off: add proper next-intl keys for the dashboard/users and
// dashboard/settings pages, sourcing values from each locale's cache.
// This is a template for migrating more pages off `<T>` later — the
// migration unit is a single page's worth of strings.

import { readFileSync, writeFileSync } from "fs";
import { join } from "path";

const ROOT = process.cwd();
const MESSAGES = (locale) => join(ROOT, "messages", `${locale}.json`);
const CACHE = (locale) => join(ROOT, "messages", "cache", `${locale}.json`);

const LOCALES = ["en", "zh", "ja", "ko", "es", "fr", "de", "pt", "ar", "ru"];

// English values are the source of truth and live in messages/en.json.
// For each locale, we pull from messages/cache/{locale}.json (which now
// has both auto-translated and curated entries).
const PAGES = {
  usersPage: {
    eyebrow: "Admin",
    title: "Users",
    subtitle: "Manage user accounts and roles.",
    nonAdmin: "User management is only available to administrators.",
  },
  settingsPage: {
    eyebrow: "Account",
    title: "Settings",
    subtitle: "Security, sessions, and preferences.",
  },
};

function deepMerge(target, source) {
  for (const k of Object.keys(source)) {
    if (typeof source[k] === "object" && source[k] && !Array.isArray(source[k])) {
      target[k] = deepMerge(target[k] && typeof target[k] === "object" ? target[k] : {}, source[k]);
    } else {
      target[k] = source[k];
    }
  }
  return target;
}

function translateValue(enValue, cache) {
  return cache[enValue] && cache[enValue] !== enValue ? cache[enValue] : enValue;
}

for (const locale of LOCALES) {
  const messagesPath = MESSAGES(locale);
  const bundle = JSON.parse(readFileSync(messagesPath, "utf-8"));
  const cache = locale === "en" ? {} : JSON.parse(readFileSync(CACHE(locale), "utf-8"));

  const newPages = {};
  for (const [page, strings] of Object.entries(PAGES)) {
    newPages[page] = {};
    for (const [key, enValue] of Object.entries(strings)) {
      newPages[page][key] = locale === "en" ? enValue : translateValue(enValue, cache);
    }
  }

  if (!bundle.dashboard) bundle.dashboard = {};
  deepMerge(bundle.dashboard, newPages);

  writeFileSync(messagesPath, JSON.stringify(bundle, null, 2) + "\n", "utf-8");
  console.log(`[${locale}] added/updated dashboard.usersPage + dashboard.settingsPage`);
}

console.log("\nDone.");
