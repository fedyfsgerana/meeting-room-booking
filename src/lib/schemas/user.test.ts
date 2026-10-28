import { describe, expect, it } from "vitest";
import {
  passwordResetSchema,
  userCreateSchema,
  type UserCreateInput,
} from "./user";

const valid: UserCreateInput = {
  email: "dewi.lestari@example.com",
  name: "Dewi Lestari",
  jobTitle: "Staf Rekrutmen",
  departmentId: "7",
  accessGroupId: "1",
  password: "rahasia123",
};

describe("userCreateSchema", () => {
  it("menerima pengguna yang benar", () => {
    expect(userCreateSchema.safeParse(valid).success).toBe(true);
  });

  it("mewajibkan email yang valid", () => {
    expect(userCreateSchema.safeParse({ ...valid, email: "" }).success).toBe(false);
    expect(userCreateSchema.safeParse({ ...valid, email: "dewi@" }).success).toBe(false);
  });

  it("merapikan email menjadi huruf kecil", () => {
    const result = userCreateSchema.safeParse({ ...valid, email: " Dewi@Example.com " });
    expect(result.success && result.data.email).toBe("dewi@example.com");
  });

  it("mewajibkan password minimal 8 karakter", () => {
    expect(userCreateSchema.safeParse({ ...valid, password: "1234567" }).success).toBe(false);
  });

  it("mewajibkan departemen dan hak akses", () => {
    expect(userCreateSchema.safeParse({ ...valid, departmentId: "" }).success).toBe(false);
    expect(userCreateSchema.safeParse({ ...valid, accessGroupId: "" }).success).toBe(false);
  });
});

describe("passwordResetSchema", () => {
  it("menolak ulangi password yang berbeda", () => {
    const result = passwordResetSchema.safeParse({
      password: "rahasia123",
      confirm: "rahasia124",
    });
    expect(result.success).toBe(false);
    if (result.success) return;
    expect(result.error.issues[0]?.path).toEqual(["confirm"]);
  });

  it("menerima password yang sama", () => {
    expect(
      passwordResetSchema.safeParse({
        password: "rahasia123",
        confirm: "rahasia123",
      }).success,
    ).toBe(true);
  });
});
