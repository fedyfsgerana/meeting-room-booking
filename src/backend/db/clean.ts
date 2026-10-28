import "dotenv/config";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import { ADMIN_GROUP_CODE } from "../../lib/permissions";

const env = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
    NODE_ENV: z.string().optional(),
    RESET_CONFIRM: z.string().optional(),
  })
  .parse(process.env);

const ADMIN_EMAIL = "administrator@example.com";

async function main() {
  if (env.NODE_ENV === "production")
    throw new Error("Pembersihan data tidak boleh dijalankan di produksi.");
  if (env.RESET_CONFIRM !== "ya")
    throw new Error("Isi RESET_CONFIRM=ya untuk membersihkan data.");

  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });
  const db = drizzle({ client: pool, casing: "snake_case" });

  try {
    const [admin] = (
      await db.execute<{ user_id: number; group_id: number }>(sql`
        select u.id as user_id, g.id as group_id
        from users u
        join access_groups g on g.id = u.access_group_id
        where lower(u.email) = ${ADMIN_EMAIL} and g.code = ${ADMIN_GROUP_CODE}
      `)
    ).rows;
    if (!admin)
      throw new Error(
        `Akun ${ADMIN_EMAIL} dengan hak akses Administrator tidak ditemukan. Jalankan pnpm db:seed.`,
      );

    await db.transaction(async (tx) => {
      await tx.execute(sql`
        truncate table activity_logs, notifications, booking_events, bookings, department_approvers, rooms, holidays, sessions
        restart identity
      `);
      await tx.execute(sql`delete from users where id <> ${admin.user_id}`);
      await tx.execute(
        sql`delete from access_group_departments where access_group_id <> ${admin.group_id}`,
      );
      await tx.execute(
        sql`delete from access_groups where id <> ${admin.group_id}`,
      );
      await tx.execute(
        sql`select setval(pg_get_serial_sequence('users', 'id'), (select max(id) from users))`,
      );
      await tx.execute(
        sql`select setval(pg_get_serial_sequence('access_groups', 'id'), (select max(id) from access_groups))`,
      );
    });
    console.log(
      `Data dibersihkan. Tersisa akun ${ADMIN_EMAIL}, hak akses Administrator, dan departemen.`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    "Pembersihan gagal:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
