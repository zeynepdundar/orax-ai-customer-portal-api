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

  const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(Math.floor(limit), 1000) : 200;

  const projection = cols
    .map((c) => {
      const isUnsupported =
        UNSUPPORTED_TYPES.has(c.data_type) || UNSUPPORTED_TYPES.has(c.udt_name);
      const ident = quoteIdent(c.column_name);
      return isUnsupported ? `${ident}::text AS ${ident}` : ident;
    })
    .join(", ");

  const sql = `SELECT ${projection} FROM ${quoteIdent(schema)}.${quoteIdent(
    table
  )} LIMIT ${safeLimit}`;

  return (await prisma.$queryRawUnsafe(sql)) as Record<string, unknown>[];
}
