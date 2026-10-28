import "server-only";
import type { ActionResult } from "@/lib/action-result";
import type { Permission } from "@/lib/permissions";
import type { AssignmentField } from "@/lib/schemas/assignment";
import { findUserByEmail, userHasPermission } from "./queries";

type Resolved = { ok: true; userId: number } | { ok: false; error: ActionResult<AssignmentField> };

const PERMISSION_TEXT: Record<"approve_dept.approve" | "approve_room.approve", string> = {
  "approve_dept.approve": "Persetujuan penyetuju: Setujui",
  "approve_room.approve": "Cek Penanggung Jawab Ruang: Setujui",
};

export async function resolveAssignee(
  input: { userId: number | null; account: string | null },
  permission: Extract<Permission, "approve_dept.approve" | "approve_room.approve">,
): Promise<Resolved> {
  let userId = input.userId;

  if (userId === null && input.account !== null) {
    const account = await findUserByEmail(input.account);
    if (!account) {
      return {
        ok: false,
        error: { ok: false, fieldErrors: { account: "Akun dengan email itu tidak ditemukan." } },
      };
    }
    userId = account.id;
  }

  if (userId === null) {
    return { ok: false, error: { ok: false, fieldErrors: { account: "Isi email akun." } } };
  }

  if (!(await userHasPermission(userId, permission))) {
    return {
      ok: false,
      error: {
        ok: false,
        fieldErrors: {
          account: `Akun ini tidak aktif atau hak aksesnya belum mencakup ${PERMISSION_TEXT[permission]}. Ubah di Master → Pengguna.`,
        },
      },
    };
  }

  return { ok: true, userId };
}
