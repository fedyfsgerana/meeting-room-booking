const COMMON = new Set([
  "password",
  "password1",
  "password123",
  "p@ssw0rd",
  "passw0rd",
  "12345678",
  "123456789",
  "1234567890",
  "87654321",
  "11111111",
  "00000000",
  "abcd1234",
  "abc12345",
  "qwerty123",
  "qwertyuiop",
  "admin123",
  "admin1234",
  "administrator",
  "welcome1",
  "iloveyou",
  "bismillah",
  "indonesia",
  "booking123",
  "meeting123",
  "rahasia123",
]);

export const PASSWORD_HINT =
  "Minimal 8 karakter, berisi huruf dan angka, dan tidak memuat nama atau email.";

type Identity = {
  name?: string | null;
  email?: string | null;
};

function parts(identity: Identity) {
  const local = identity.email?.split("@")[0] ?? "";
  const words = [local, ...local.split(/[._-]+/), ...(identity.name ?? "").split(/\s+/)];
  return words
    .map((word) => word.trim().toLowerCase())
    .filter((word) => word.length >= 4);
}

export function passwordProblem(password: string, identity: Identity = {}) {
  const value = password.toLowerCase();
  if (password.length < 8) return "Password minimal 8 karakter.";
  if (!/[a-z]/i.test(password) || !/\d/.test(password))
    return "Password harus berisi huruf dan angka.";
  if (/^(.)\1+$/.test(password))
    return "Password tidak boleh berisi satu karakter berulang.";
  if (COMMON.has(value))
    return "Password ini terlalu umum dan mudah ditebak. Pilih yang lain.";
  if (parts(identity).some((word) => value.includes(word)))
    return "Password tidak boleh memuat nama atau email.";
  return null;
}
