import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("项目清单只保留后台、商户和地址池", async () => {
  const catalog = JSON.parse(
    await readFile(
      new URL("../src/catalog/project.json", import.meta.url),
      "utf8"
    )
  );

  assert.equal(catalog.project.code, "BLUEPAY-DEMO");
  assert.deepEqual(catalog.modules, [
    ["ADMIN", "后台"],
    ["MERCHANT", "商户"],
    ["ADDRESS", "地址池"]
  ]);
  assert.equal(catalog.project.name, "Bluepay");
  assert.ok(Array.isArray(catalog.pages));
  assert.ok(Array.isArray(catalog.documents));
  assert.equal(catalog.pages.length, catalog.documents.length);
  assert.ok(catalog.pages.every((page) => page.moduleCodes.includes("ADMIN")));
});

test("母板只显示 Bluepay 和三个端", async () => {
  const template = await readFile(
    new URL("../src/shell/index.template.html", import.meta.url),
    "utf8"
  );

  for (const expected of [
    "Bluepay",
    "Demo 分类",
    "已打开页面",
    "mainNav",
    "worktabs",
    "__MODULES__",
    "__PAGES__",
    "__DOCUMENTS__"
  ]) {
    assert.match(
      template,
      new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  }
  for (const removed of ["需求 Demo 中心", "项目说明", "跨后台", "HTML DEMO"]) {
    assert.doesNotMatch(template, new RegExp(removed));
  }
});
