import { prisma } from "./prisma";

/**
 * Postgres types that Prisma's raw-query deserializer cannot represent.
 * We cast each of these to text in the SELECT clause so `$queryRawUnsafe`
 * doesn't throw "Failed to deserialize column of type …".
 *
 * Extend this list as new offenders surface.
 */
const UNSUPPORTED_TYPES = new Set<string>([
  "tsvector",
  "tsquery",
  "geometry",
  "geography",
  "ltree",
  "lquery",
  "ltxtquery",
  "cube",
  "hstore",
]);

type ColumnInfo = {
  column_name: string;
  data_type: string;
  udt_name: string;
};

/**
 * Quote an identifier (schema/table/column) for safe inlining into raw SQL.
 * Doubles internal quotes — matches Postgres rules.
 */
function quoteIdent(name: string): string {
  return '"' + name.replace(/"/g, '""') + '"';
}

/**
 * Fetch column metadata for the given table from `information_schema`.
 */
async function getColumns(schema: string, table: string): Promise<ColumnInfo[]> {
  return (await prisma.$queryRawUnsafe(
    `SELECT column_name, data_type, udt_name
       FROM information_schema.columns
      WHERE table_schema = $1 AND table_name = $2
      ORDER BY ordinal_position`,
    schema,
    table
  )) as ColumnInfo[];
}

/**
 * Build a projection (SELECT clause) that casts Prisma-incompatible column
 * types to text. Takes an already-fetched column list so callers can reuse
 * the metadata for other things (e.g. picking the right param cast).
 */
function buildProjectionFromColumns(cols: ColumnInfo[]): string {
  return cols
    .map((c) => {
      const isUnsupported =
        UNSUPPORTED_TYPES.has(c.data_type) || UNSUPPORTED_TYPES.has(c.udt_name);
      const ident = quoteIdent(c.column_name);
      return isUnsupported ? `${ident}::text AS ${ident}` : ident;
    })
    .join(", ");
}

/**
 * When binding a JS value to a Postgres column whose type can't be
 * implicitly coerced from text (uuid, integer, timestamps, …), we need to
 * cast the parameter on the SQL side. Maps the Postgres `udt_name` to the
 * cast suffix to apply on the corresponding `$N` placeholder.
 *
 *   tenant_id = $1::uuid
 *   count     = $2::integer
 */
function paramCastFor(udtName: string | undefined): string {
  switch (udtName) {
    case "uuid":
      return "::uuid";
    case "int2":
      return "::smallint";
    case "int4":
      return "::integer";
    case "int8":
      return "::bigint";
    case "numeric":
      return "::numeric";
    case "float4":
      return "::real";
    case "float8":
      return "::double precision";
    case "bool":
      return "::boolean";
    case "date":
      return "::date";
    case "timestamp":
      return "::timestamp";
    case "timestamptz":
      return "::timestamptz";
    case "time":
      return "::time";
    case "json":
      return "::json";
    case "jsonb":
      return "::jsonb";
    default:
      return ""; // text/varchar etc. don't need an explicit cast
  }
}

function clampLimit(limit: number): number {
  return Number.isFinite(limit) && limit > 0
    ? Math.min(Math.floor(limit), 1000)
    : 200;
}

/**
 * Build a SELECT * equivalent that casts Prisma-incompatible types to text
 * so `$queryRawUnsafe` can deserialize the result.
 *
 *   const rows = await safeSelectAll("portal", "customers", 200);
 *
 * Returns rows as plain `Record<string, unknown>` objects.
 */
export async function safeSelectAll(
  schema: string,
  table: string,
  limit = 200
): Promise<Record<string, unknown>[]> {
  const cols = await getColumns(schema, table);
  if (cols.length === 0) {
    throw new Error(`Table ${schema}.${table} has no columns (does it exist?).`);
  }
  const projection = buildProjectionFromColumns(cols);
  const sql = `SELECT ${projection} FROM ${quoteIdent(schema)}.${quoteIdent(
    table
  )} LIMIT ${clampLimit(limit)}`;
  return (await prisma.$queryRawUnsafe(sql)) as Record<string, unknown>[];
}

/**
 * Like `safeSelectAll` but with a parameterized, type-aware WHERE clause.
 *
 * For each entry in `where`, the corresponding column's type is looked up
 * and the parameter placeholder is cast on the SQL side. This is what makes
 * `tenant_id = $1::uuid` work even when the JS value is a plain string.
 *
 *   const rows = await safeSelectAllWhere(
 *     "portal", "customers",
 *     { tenant_id: tenantId },
 *     200
 *   );
 */
export async function safeSelectAllWhere(
  schema: string,
  table: string,
  where: Record<string, unknown>,
  limit = 200
): Promise<Record<string, unknown>[]> {
  const cols = await getColumns(schema, table);
  if (cols.length === 0) {
    throw new Error(`Table ${schema}.${table} has no columns (does it exist?).`);
  }

  const projection = buildProjectionFromColumns(cols);
  const colTypes = new Map(cols.map((c) => [c.column_name, c.udt_name]));

  const keys = Object.keys(where);
  const values = keys.map((k) => where[k]);
  const whereClause = keys.length
    ? "WHERE " +
      keys
        .map((k, i) => {
          const cast = paramCastFor(colTypes.get(k));
          return `${quoteIdent(k)} = $${i + 1}${cast}`;
        })
        .join(" AND ")
    : "";

  const sql = `SELECT ${projection} FROM ${quoteIdent(schema)}.${quoteIdent(
    table
  )} ${whereClause} LIMIT ${clampLimit(limit)}`;

  return (await prisma.$queryRawUnsafe(sql, ...values)) as Record<string, unknown>[];
}

/**
 * Returns the column names of the given table. Useful for callers that need
 * to discover the real schema before deciding what to query.
 */
export async function listColumns(schema: string, table: string): Promise<string[]> {
  const cols = await getColumns(schema, table);
  return cols.map((c) => c.column_name);
}
