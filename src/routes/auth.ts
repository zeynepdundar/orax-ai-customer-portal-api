import { Router } from "express";
import { safeSelectAll } from "../lib/db";

const router = Router();

/**
 * Heuristics for picking the "id" and "name" columns of `portal.tenants` —
 * we don't have a typed model yet (run `prisma db pull` to fix that), so we
 * adapt to whatever the actual table uses.
 */
const TENANT_ID_FIELDS = ["id", "tenant_id", "tenantId", "uuid"];
const TENANT_NAME_FIELDS = [
  "name",
  "tenant_name",
  "company_name",
  "title",
  "display_name",
];

function pickField(row: Record<string, unknown>, candidates: string[]): string | null {
  for (const c of candidates) {
    if (c in row) return c;
  }
  return null;
}

type TenantOption = { id: string; name: string };

/**
 * Fetch the list of tenants the login dropdown should display. Returns
 * `{ id, name }` pairs even if the underlying column names differ.
 */
async function loadTenantOptions(): Promise<TenantOption[]> {
  const rows = await safeSelectAll("portal", "tenants", 200);
  if (rows.length === 0) return [];

  const idKey = pickField(rows[0], TENANT_ID_FIELDS);
  const nameKey = pickField(rows[0], TENANT_NAME_FIELDS);
  if (!idKey) return [];

  return rows
    .map((r) => ({
      id: String(r[idKey]),
      name: nameKey ? String(r[nameKey]) : String(r[idKey]),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Resolve the tenant to log in as.
 *   1. If the login form sent a `tenantId`, use it (and validate it exists).
 *   2. Otherwise if `DEV_TENANT_ID` env var is set, use that.
 *   3. Otherwise fall back to the first tenant in `portal.tenants`.
 */
async function resolveLoginTenant(
  options: TenantOption[],
  submittedTenantId: string | undefined
): Promise<TenantOption | null> {
  if (options.length === 0) return null;

  if (submittedTenantId) {
    const hit = options.find((t) => t.id === submittedTenantId);
    if (hit) return hit;
  }

  const envOverride = process.env.DEV_TENANT_ID;
  if (envOverride) {
    const hit = options.find((t) => t.id === envOverride);
    if (hit) return hit;
  }

  return options[0];
}

router.get("/login", async (req, res) => {
  if (req.session?.isLoggedIn) {
    return res.redirect("/dashboard");
  }

  let tenantOptions: TenantOption[] = [];
  let tenantLoadError: string | null = null;
  try {
    tenantOptions = await loadTenantOptions();
  } catch (err) {
    tenantLoadError = err instanceof Error ? err.message : String(err);
  }

  res.render("pages/login", {
    layout: "auth",
    title: "Sign in",
    tenantOptions,
    tenantLoadError,
    selectedTenantId: process.env.DEV_TENANT_ID || tenantOptions[0]?.id || "",
  });
});

router.post("/login", async (req, res) => {
  let options: TenantOption[] = [];
  try {
    options = await loadTenantOptions();
  } catch (err) {
    return res.status(500).render("pages/login", {
      layout: "auth",
      title: "Sign in",
      loginError:
        "Couldn't query portal.tenants: " +
        (err instanceof Error ? err.message : String(err)),
      tenantOptions: [],
    });
  }

  const submittedTenantId =
    typeof req.body?.tenantId === "string" && req.body.tenantId
      ? req.body.tenantId
      : undefined;
  const tenant = await resolveLoginTenant(options, submittedTenantId);

  if (!tenant) {
    return res.status(500).render("pages/login", {
      layout: "auth",
      title: "Sign in",
      loginError:
        "portal.tenants is empty (or has no detectable id column). Add at least one row to log in.",
      tenantOptions: options,
    });
  }

  req.session.isLoggedIn = true;
  req.session.tenantId = tenant.id;
  req.session.tenantName = tenant.name;
  req.session.user = {
    name: "Ahmet Yılmaz",
    email: req.body?.email || "ahmet@avixa.com",
  };
  res.redirect("/dashboard");
});

router.post("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/login");
  });
});

export default router;
