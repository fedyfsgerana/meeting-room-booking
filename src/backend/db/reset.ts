import "dotenv/config";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";

const env = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
    NODE_ENV: z.string().optional(),
    RESET_CONFIRM: z.string().optional(),
  })
  .parse(process.env);

const TABLES = [
  "activity_logs",
  "notifications",
  "booking_events",
  "bookings",
  "holidays",
  "sessions",
  "department_approvers",
  "access_group_departments",
  "rooms",
  "users",
  "departments",
  "access_groups",
  "app_settings",
];

async function main() {
  if (env.NODE_ENV === "production")
    throw new Error("Reset database tidak boleh dijalankan di produksi.");
  if (env.RESET_CONFIRM !== "ya")
    throw new Error("Isi RESET_CONFIRM=ya untuk menghapus semua data.");

  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });
  const db = drizzle({ client: pool, casing: "snake_case" });

  try {
    await db.execute(
      sql.raw(
        `truncate table ${TABLES.map((table) => `"${table}"`).join(", ")} restart identity cascade`,
      ),
    );
    console.log(`Semua data di ${TABLES.length} tabel dihapus.`);
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Reset gagal:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
