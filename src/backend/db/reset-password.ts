import "dotenv/config";
import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { z } from "zod";
import { hashPassword } from "../auth/password";
import { sessions, users } from "./schema";

const env = z
  .object({
    DATABASE_URL: z.string().min(1, "DATABASE_URL wajib diisi"),
    RESET_EMAIL: z.string().trim().min(1, "RESET_EMAIL wajib diisi"),
    RESET_PASSWORD: z.string().min(8, "RESET_PASSWORD minimal 8 karakter"),
  })
  .parse(process.env);

async function main() {
  const pool = new Pool({ connectionString: env.DATABASE_URL, max: 1 });
  const db = drizzle({ client: pool, casing: "snake_case" });

  try {
    const passwordHash = await hashPassword(env.RESET_PASSWORD);
    const [user] = await db
      .update(users)
      .set({ passwordHash, active: true })
      .where(sql`lower(${users.email}) = ${env.RESET_EMAIL.toLowerCase()}`)
      .returning({ id: users.id, name: users.name });

    if (!user) {
      console.error(`Pengguna "${env.RESET_EMAIL}" tidak ditemukan.`);
      process.exitCode = 1;
      return;
    }

    await db.delete(sessions).where(eq(sessions.userId, user.id));
    console.log(
      `Password ${user.name} (${env.RESET_EMAIL}) diatur ulang dan akunnya diaktifkan.`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(
    "Atur ulang password gagal:",
    error instanceof Error ? error.message : error,
  );
  process.exitCode = 1;
});
