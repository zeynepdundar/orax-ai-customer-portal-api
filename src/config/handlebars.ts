import path from "path";
import { Application } from "express";
import { engine } from "express-handlebars";
import { ICONS } from "../views/icons";

/**
 * Handlebars helpers that close the gap between the React/Next code we migrated
 * from and a server-rendered Handlebars setup. Most helpers mirror small utility
 * patterns the React components relied on (className concatenation, lookups, etc.)
 */
const helpers: Record<string, (...args: any[]) => any> = {
  // Translation helper — used as {{t "dashboard.title"}}
  t(this: any, key: string) {
    // express-handlebars exposes res.locals as `this` when rendering
    if (typeof this.t === "function") {
      return this.t(key);
    }
    return key;
  },

  // Translation with namespace lookup that supports interpolation:
  // {{tInterp "materials.resultsFound" count=5}}
  tInterp(this: any, key: string, options: any) {
    if (typeof this.t === "function") {
      return this.t(key, options.hash || {});
    }
    return key;
  },

  // Equality helpers
  eq(a: unknown, b: unknown) {
    return a === b;
  },
  ne(a: unknown, b: unknown) {
    return a !== b;
  },
  and(...args: unknown[]) {
    const list = args.slice(0, -1);
    return list.every(Boolean);
  },
  or(...args: unknown[]) {
    const list = args.slice(0, -1);
    return list.some(Boolean);
  },
  not(value: unknown) {
    return !value;
  },

  // class-list helper — accepts strings, undefined, false; concatenates truthy ones
  cx(...args: unknown[]) {
    const list = args.slice(0, -1);
    return list.filter((c) => typeof c === "string" && c.length > 0).join(" ");
  },

  // Returns one of two values based on a condition (replaces ternary in templates)
  ifElse(cond: unknown, truthy: unknown, falsy: unknown) {
    return cond ? truthy : falsy;
  },

  // Format a number with thousands separators (en-US, matches toLocaleString())
  formatNumber(value: unknown) {
    const n = Number(value);
    if (Number.isNaN(n)) return value;
    return n.toLocaleString("en-US");
  },

  // JSON stringify for embedding data in <script> tags
  json(value: unknown) {
    return JSON.stringify(value).replace(/</g, "\\u003c");
  },

  // Inline a Lucide-style icon by name. Usage: {{icon "package" class="w-5 h-5"}}
  icon(this: any, name: string, options: any) {
    const klass = (options && options.hash && options.hash.class) || "w-4 h-4";
    const svg = ICONS[name];
    if (!svg) {
      return `<!-- icon "${name}" not found -->`;
    }
    // Inject the class into the root <svg ...>
    return svg.replace("<svg", `<svg class="${klass}"`);
  },

  // Look up a property dynamically: {{lookup obj key}} — built into Handlebars,
  // but provide a safer string variant
  prop(obj: any, key: string) {
    if (!obj || typeof obj !== "object") return "";
    return obj[key];
  },

  // True if the given path matches (or is a prefix of) the current request path.
  // Usage: {{#if (isActive item.path currentPath)}}...{{/if}}
  isActive(itemPath: string, currentPath: string) {
    if (!itemPath || !currentPath) return false;
    return currentPath === itemPath || currentPath.startsWith(itemPath + "/");
  },

  // Render the current year (login page footer)
  year() {
    return new Date().getFullYear();
  },

  // capitalize first letter (used for avatar initials)
  initial(value: unknown) {
    if (typeof value !== "string" || value.length === 0) return "";
    return value.charAt(0).toUpperCase();
  },
};

export function configureHandlebars(app: Application) {
  const viewsDir = path.join(__dirname, "..", "views");

  app.engine(
    "hbs",
    engine({
      extname: ".hbs",
      defaultLayout: "app",
      layoutsDir: path.join(viewsDir, "layouts"),
      partialsDir: [
        path.join(viewsDir, "partials"),
        path.join(viewsDir, "partials", "ui"),
        path.join(viewsDir, "partials", "layout"),
      ],
      helpers,
    })
  );

  app.set("view engine", "hbs");
  app.set("views", viewsDir);
}
