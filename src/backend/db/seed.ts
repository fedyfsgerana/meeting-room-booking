import "dotenv/config";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import { ADMIN_GROUP_CODE, ALL_PERMISSIONS } from "../../lib/permissions";
import { hashPassword } from "../auth/password";
import { accessGroups, appSettings, departments, users } from "./schema";

const env = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
    SEED_ADMIN_PASSWORD: z.string().min(8, "SEED_ADMIN_PASSWORD minimal 8 karakter"),
  })
  .parse(process.env);

const DEPARTMENTS = [
  { code: "IT", name: "Information Technology" },
  { code: "HR", name: "Human Resources" },
  { code: "FIN", name: "Finance" },
  { code: "GA", name: "General Affairs" },
  { code: "OPS", name: "Operations" },
  { code: "MKT", name: "Marketing" },
];

async function main() {
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });
  const db = drizzle({ client: pool, casing: "snake_case" });

  try {
    await db.transaction(async (tx) => {
      await tx.insert(departments).values(DEPARTMENTS).onConflictDoNothing({ target: departments.code });

      await tx
        .insert(accessGroups)
        .values({
          code: ADMIN_GROUP_CODE,
          name: "Administrator",
          description: "Pengelola aplikasi, ruang, pengguna, dan akses.",
          permissions: ALL_PERMISSIONS,
          locked: true,
        })
        .onConflictDoUpdate({
          target: accessGroups.code,
          set: { name: "Administrator", permissions: ALL_PERMISSIONS, locked: true },
        });

      const [it] = await tx.select({ id: departments.id }).from(departments).where(eq(departments.code, "IT")).limit(1);
      const [admin] = await tx
        .select({ id: accessGroups.id })
        .from(accessGroups)
        .where(eq(accessGroups.code, ADMIN_GROUP_CODE))
        .limit(1);

      const inserted = await tx
        .insert(users)
        .values({
          email: "administrator@example.com",
          name: "Administrator",
          jobTitle: "Administrator Sistem",
          departmentId: it.id,
          accessGroupId: admin.id,
          passwordHash: await hashPassword(env.SEED_ADMIN_PASSWORD),
        })
        .onConflictDoNothing()
        .returning({ id: users.id });

      await tx.insert(appSettings).values({ id: 1 }).onConflictDoNothing({ target: appSettings.id });

      console.log(`Departemen contoh: ${DEPARTMENTS.length}`);
      console.log("Hak akses Administrator siap.");
      console.log(inserted.length ? "Akun administrator dibuat." : "Akun administrator sudah ada, tidak diubah.");
      console.log("Pengaturan default siap.");
    });
    console.log("Data awal selesai.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error("Data awal gagal:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
