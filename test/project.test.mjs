import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("项目清单含四端与产品导航", async () => {
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
    ["ADDRESS", "地址池"],
    ["BEAUTY_MERCHANT", "美人桥商户端"]
  ]);
  assert.ok(catalog.nav.ADMIN.length);
  assert.ok(catalog.nav.MERCHANT.length);
  assert.ok(catalog.nav.ADDRESS.length);
  assert.ok(catalog.nav.BEAUTY_MERCHANT.length);
  assert.ok(catalog.nav.ADDRESS.some((g) => g.items.some((i) => i.id === "address-wallet")));
  assert.ok(catalog.nav.ADMIN.some((g) => g.items.some((i) => i.id === "admin-collect")));
  assert.ok(catalog.nav.ADMIN.some((g) => g.items.some((i) => i.id === "admin-merchant-transfer")));
  assert.ok(catalog.nav.ADMIN.some((g) => g.items.some((i) => i.id === "admin-daifu-flow")));
  assert.ok(catalog.nav.ADMIN.some((g) => g.items.some((i) => i.id === "admin-pay-order")));
  assert.ok(catalog.nav.MERCHANT.some((g) => g.items.some((i) => i.id === "merchant-order")));
  assert.ok(catalog.nav.BEAUTY_MERCHANT.some((g) => g.items.some((i) => i.id === "beauty-order-list")));
  assert.ok(catalog.nav.ADMIN.flatMap((g) => g.items || []).find((i) => i.id === "admin-pay-order").req.includes("BP-REQ-012"));
  assert.ok(catalog.nav.BEAUTY_MERCHANT.flatMap((g) => g.items || []).find((i) => i.id === "beauty-order-list").req.includes("BP-REQ-012"));
  assert.deepEqual(catalog.pages.find((page) => page.id === "BP-REQ-012").moduleCodes, ["ADMIN", "BEAUTY_MERCHANT"]);
  assert.ok(catalog.pages.every((page) => page.moduleCodes.includes("ADMIN") || page.moduleCodes.includes("MERCHANT") || page.moduleCodes.includes("ADDRESS") || page.moduleCodes.includes("BEAUTY_MERCHANT")));
});

test("母板为顶栏四端 + 产品左侧导航", async () => {
  const template = await readFile(
    new URL("../src/shell/index.template.html", import.meta.url),
    "utf8"
  );

  for (const expected of [
    "Bluepay",
    "mainNav",
    "sideNav",
    "__MODULES__",
    "__NAV__",
    "__DOCUMENTS__",
    "beauty-merchant-reference",
    "__BP_SURFACE__",
    "__BP_BOOT__"
  ]) {
    assert.match(
      template,
      new RegExp(expected.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    );
  }
  for (const removed of [
    "需求 Demo 中心",
    "项目说明",
    "跨后台",
    "HTML DEMO",
    "worktabs"
  ]) {
    assert.doesNotMatch(template, new RegExp(removed));
  }
});
