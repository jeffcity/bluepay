import assert from "node:assert/strict";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(
  await readFile(path.join(root, "src/catalog/project.json"), "utf8")
);
const moduleCodes = new Set(catalog.modules.map(([code]) => code));
const pageIds = catalog.pages.map((page) => page.id);
const documentIds = new Set(catalog.documents.map((document) => document.id));
const documentSources = catalog.documents.map((document) => document.source);

assert.equal(catalog.project.code, "BLUEPAY-DEMO");
assert.equal(new Set(pageIds).size, pageIds.length, "页面 ID 不得重复");
assert.equal(
  documentIds.size,
  catalog.documents.length,
  "文档 ID 不得重复"
);
assert.equal(
  new Set(documentSources).size,
  documentSources.length,
  "同一页面源不得重复登记"
);
assert.ok(catalog.nav, "必须登记产品导航 nav");

async function collectHtmlSources(directory, prefix = "pages") {
  const sources = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    const relative = `${prefix}/${entry.name}`;
    if (entry.isDirectory()) {
      sources.push(...(await collectHtmlSources(absolute, relative)));
    } else if (entry.isFile() && entry.name.endsWith(".html")) {
      sources.push(relative);
    }
  }
  return sources;
}

const actualSources = await collectHtmlSources(path.join(root, "src/pages"));
assert.deepEqual(
  actualSources.sort(),
  [...documentSources].sort(),
  "src/pages 下的正式 HTML 页面源必须全部且仅登记一次，不得保留未登记副本"
);

for (const document of catalog.documents) {
  assert.match(document.source, /^pages\//, `${document.id} 页面源目录不正确`);
  await stat(path.join(root, "src", document.source));
}

for (const page of catalog.pages) {
  assert.match(
    page.id,
    /^BP-REQ-\d{3}$/,
    `${page.id} 不符合页面 ID 规则`
  );
  assert.ok(
    Array.isArray(page.moduleCodes) && page.moduleCodes.length > 0,
    `${page.id} 至少登记一个影响端`
  );
  assert.equal(
    new Set(page.moduleCodes).size,
    page.moduleCodes.length,
    `${page.id} 影响端不得重复`
  );
  for (const moduleCode of page.moduleCodes) {
    assert.ok(moduleCodes.has(moduleCode), `${page.id} 影响端不存在`);
  }
  assert.ok(documentIds.has(page.doc), `${page.id} 对应 Demo 文档不存在`);
}

const navIds = [];
const referencedDocuments = new Set(catalog.pages.map((page) => page.doc));
for (const [code, groups] of Object.entries(catalog.nav)) {
  assert.ok(moduleCodes.has(code), `nav 端 ${code} 不存在`);
  assert.ok(Array.isArray(groups), `nav.${code} 必须是分组数组`);
  for (const group of groups) {
    assert.ok(group.label, `nav.${code} 分组缺少 label`);
    for (const item of group.items || []) {
      if (item.static) {
        assert.ok(item.title, `静态导航缺少 title`);
        continue;
      }
      assert.match(item.id, /^(admin|merchant|address|beauty)-[a-z0-9-]+$/, `${item.id} 页面 id 不规范`);
      assert.ok(item.title, `${item.id} 缺少 title`);
      assert.ok(documentIds.has(item.doc), `${item.id} doc 不存在`);
      assert.ok(Array.isArray(item.req) && item.req.length, `${item.id} 需关联 req`);
      referencedDocuments.add(item.doc);
      for (const req of item.req) {
        assert.ok(pageIds.includes(req), `${item.id} 关联需求 ${req} 不存在`);
      }
      navIds.push(item.id);
    }
  }
}
for (const document of catalog.documents) {
  assert.ok(referencedDocuments.has(document.id), `${document.id} 未被业务页面或需求使用`);
}
assert.equal(new Set(navIds).size, navIds.length, "导航页面 ID 不得重复");
assert.ok((catalog.nav.ADMIN || []).some((g) => (g.items || []).length), "后台导航不能为空");
assert.ok((catalog.nav.MERCHANT || []).some((g) => (g.items || []).length), "商户导航不能为空");
assert.ok((catalog.nav.BEAUTY_MERCHANT || []).some((g) => (g.items || []).length), "美人桥商户端导航不能为空");
assert.ok(
  catalog.nav.MERCHANT.flatMap((g) => g.items || []).filter((item) => !item.static).every((item) => item.id.startsWith("merchant-")),
  "商户导航只能挂 merchant-* 页面"
);
assert.ok(
  catalog.nav.ADMIN.flatMap((g) => g.items || []).filter((item) => !item.static).every((item) => item.id.startsWith("admin-")),
  "后台导航只能挂 admin-* 页面"
);
assert.ok(
  (catalog.nav.ADDRESS || []).flatMap((g) => g.items || []).filter((item) => !item.static).every((item) => item.id.startsWith("address-")),
  "地址池导航只能挂 address-* 页面"
);
assert.ok(
  (catalog.nav.BEAUTY_MERCHANT || []).flatMap((g) => g.items || []).filter((item) => !item.static).every((item) => item.id.startsWith("beauty-")),
  "美人桥商户端导航只能挂 beauty-* 页面"
);

const [index, distribution] = await Promise.all([
  readFile(path.join(root, "index.html"), "utf8"),
  readFile(path.join(root, "dist/index.html"), "utf8")
]);

assert.equal(index, distribution, "根入口与发布构建结果不一致");
assert.doesNotMatch(index, /\/Users\/|file:\/\//);
assert.match(index, /Bluepay/);
assert.doesNotMatch(index, /需求 Demo 中心|项目说明|跨后台|HTML DEMO/);
assert.match(index, /id="sideNav"/);
assert.match(index, /const NAV=/);
assert.match(index, /admin-collect/);
assert.match(index, /merchant-order/);

console.log(
  `检查通过：${catalog.pages.length} 个需求、${navIds.length} 个导航页、${catalog.documents.length} 个正式页面源。`
);
