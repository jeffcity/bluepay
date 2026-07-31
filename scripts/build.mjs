import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const src = path.join(root, "src");

function safeJson(value) {
  return JSON.stringify(value)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

async function readDocument(document) {
  const file = path.resolve(src, document.source);
  if (!file.startsWith(`${src}${path.sep}`)) {
    throw new Error(`页面源越界：${document.source}`);
  }
  return readFile(file, "utf8");
}

const catalog = JSON.parse(
  await readFile(path.join(src, "catalog/project.json"), "utf8")
);
const documents = Object.fromEntries(
  await Promise.all(
    catalog.documents.map(async (document) => [
      document.id,
      await readDocument(document)
    ])
  )
);
const template = await readFile(
  path.join(src, "shell/index.template.html"),
  "utf8"
);
const output = template
  .replace("__PROJECT__", () => safeJson(catalog.project))
  .replace("__MODULES__", () => safeJson(catalog.modules))
  .replace("__PAGES__", () => safeJson(catalog.pages))
  .replace("__DOCUMENTS__", () => safeJson(documents));

if (/__(?:PROJECT|MODULES|PAGES|DOCUMENTS)__/.test(output)) {
  throw new Error("模板占位符未完全替换");
}
if (/\/Users\/|file:\/\//.test(output)) {
  throw new Error("构建产物包含本地绝对路径");
}

await mkdir(path.join(root, "dist"), { recursive: true });
await Promise.all([
  writeFile(path.join(root, "index.html"), output),
  writeFile(path.join(root, "dist/index.html"), output)
]);

console.log(
  `已构建 ${catalog.pages.length} 个页面、${catalog.documents.length} 个 Demo 文档。`
);
