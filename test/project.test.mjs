import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("项目清单按四类后台维护", async () => {
  const catalog = JSON.parse(
    await readFile(
      new URL("../src/catalog/project.json", import.meta.url),
      "utf8"
    )
  );

  assert.equal(catalog.project.code, "LANSHENG-PAYOUT-DEMO");
  assert.deepEqual(
    catalog.modules.map(([code]) => code),
    ["HOME", "ADMIN", "MERCHANT", "ADDRESS", "CROSS"]
  );
  assert.equal(catalog.pages.length, 1);
  assert.equal(catalog.documents.length, 1);
  assert.equal(new Set(catalog.pages.map((page) => page.id)).size, 1);
});

test("母板提供统一分类导航和页面展示区", async () => {
  const template = await readFile(
    new URL("../src/shell/index.template.html", import.meta.url),
    "utf8"
  );

  for (const expected of [
    "蓝盛代付",
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
});
