import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("项目清单含三端与产品导航", async () => {
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
  assert.ok(catalog.nav.ADMIN.length);
  assert.ok(catalog.nav.MERCHANT.length);
  assert.ok(catalog.nav.ADDRESS.length);
  assert.ok(catalog.nav.ADDRESS.some((g) => g.items.some((i) => i.id === "address-wallet")));
  assert.ok(catalog.nav.ADMIN.some((g) => g.items.some((i) => i.id === "admin-collect")));
  assert.ok(catalog.nav.ADMIN.some((g) => g.label === "虚拟币订单管理"));
  assert.ok(catalog.nav.ADMIN.some((g) => g.label === "TG 通知管理"));
  assert.ok(catalog.nav.ADMIN.some((g) => g.items.some((i) => i.id === "admin-tg-system-message")));
  assert.ok(catalog.nav.ADMIN.some((g) => g.items.some((i) => i.id === "admin-merchant-transfer")));
  const accountRecords = catalog.nav.ADMIN.find((g) => g.label === "账户记录");
  assert.equal(
    accountRecords.items.find((i) => i.id === "admin-mc-flow").doc,
    "商户代收流水记录-demo"
  );
  assert.ok(accountRecords.items.some((i) => i.id === "admin-merchant-payout-flow"));
  assert.ok(catalog.nav.MERCHANT.some((g) => g.items.some((i) => i.id === "merchant-order")));
  for (const doc of [
    "VND法币代收-demo",
    "TRX代收通道-demo",
    "钱包地址管理-demo",
    "目标池金额层级配置-demo",
    "TG系统消息配置-demo",
    "商户增加资金划转-demo",
    "商户代收流水记录-demo",
    "商户代付流水记录-demo"
  ]) {
    assert.ok(catalog.documents.some((item) => item.id === doc));
  }
  assert.ok(catalog.pages.every((page) => page.moduleCodes.includes("ADMIN") || page.moduleCodes.includes("MERCHANT") || page.moduleCodes.includes("ADDRESS")));
});

test("母板为顶栏三端 + 产品左侧导航", async () => {
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
