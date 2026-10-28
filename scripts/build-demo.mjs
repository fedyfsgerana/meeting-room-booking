import { readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("..", import.meta.url));
const stylesDir = `${root}src/frontend/styles/`;
const files = (await readdir(stylesDir)).filter((name) => name.endsWith(".css")).sort();
const css = (await Promise.all(files.map((name) => readFile(`${stylesDir}${name}`, "utf8")))).join("\n");
const template = await readFile(`${root}demo/template.html`, "utf8");

if (!template.includes("/* APP_CSS */")) throw new Error("Penanda /* APP_CSS */ tidak ditemukan di demo/template.html");

await writeFile(`${root}demo/index.html`, template.replace("/* APP_CSS */", () => css));
console.log(`demo/index.html dibuat dari ${files.length} file CSS aplikasi.`);
