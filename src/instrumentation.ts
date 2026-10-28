export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { startJobs } = await import("@/backend/jobs");
  await startJobs()?.catch(() => undefined);
}
