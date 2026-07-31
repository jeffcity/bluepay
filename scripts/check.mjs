import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  await readFile(path.join(root, "src/catalog/project.json"), "utf8")
);
const moduleCodes = new Set(catalog.modules.map(([code]) => code));
const pageIds = catalog.pages.map((page) => page.id);
const documentIds = new Set(catalog.documents.map((document) => document.id));

assert.equal(catalog.project.code, "BLUEPAY-DEMO");
assert.equal(new Set(pageIds).size, pageIds.length, "页面 ID 不得重复");
assert.equal(
  documentIds.size,
  catalog.documents.length,
  "文档 ID 不得重复"
);

for (const document of catalog.documents) {
  assert.match(document.source, /^pages\//, `${document.id} 页面源目录不正确`);
  await stat(path.join(root, "src", document.source));
}

for (const page of catalog.pages) {
  assert.match(
    page.id,
    /^LS-(?:HOME|ADM|MER|ADR|CRS)-\d{3}$/,
    `${page.id} 不符合页面 ID 规则`
  );
  assert.ok(moduleCodes.has(page.moduleCode), `${page.id} 后台归属不存在`);
  assert.ok(documentIds.has(page.doc), `${page.id} 对应 Demo 文档不存在`);
}

const [index, distribution] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "dist/index.html"), "utf8")
]);

assert.equal(index, distribution, "根入口与发布构建结果不一致");
assert.doesNotMatch(index, /\/Users\/|file:\/\//);
assert.match(index, /蓝盛代付/);

console.log(
  `检查通过：${catalog.pages.length} 个页面、${catalog.documents.length} 个 Demo 文档。`
);
