import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const merchantPath = "src/pages/TRX代收通道/TRX代收通道-demo.html";
const adminPath = "src/pages/机器人分层播报与多人确认/机器人分层播报与多人确认-demo.html";
const walletPath = "src/pages/钱包地址管理/钱包地址管理-demo.html";
const tierPath = "src/pages/目标池金额层级配置/目标池金额层级配置-demo.html";

test("TRX 下分手续费额外扣除，到账金额不扣手续费", async () => {
  const [merchant, admin] = await Promise.all([
    readFile(merchantPath, "utf8"),
    readFile(adminPath, "utf8")
  ]);

  assert.match(admin, /"200\.000000", "4\.000000", "200\.000000", "TRX", "TRON"/);
  assert.match(merchant, /amt:'500\.000000',fee:'2\.500000'.*real:'500\.000000'.*cur:'TRX'/);
  assert.match(merchant, /\$\{\(amount \+ fee\)\.toFixed\(6\)\}/);
  assert.match(merchant, /withdrawNetPreview'\)\.textContent = `\$\{amount\.toFixed\(6\)\}/);
  assert.match(admin, /手续费在下发金额之外额外扣除/);
});

test("商户下发可共用提现地址，TRX 协议展示为 TRON", async () => {
  const merchant = await readFile(merchantPath, "utf8");
  const sharedAddress = "TYvJU4XQ9XEu9ouJkBb7bsjfJ8EcaH1r3n";

  assert.equal(merchant.split(sharedAddress).length - 1 >= 2, true);
  assert.match(merchant, /TRX: \{ balance: 1500, address: '[^']+', protocol: 'TRON' \}/);
  assert.match(merchant, /<option>协议类型<\/option><option>TRON<\/option><option>TRC20<\/option>/);
});

test("地址池归属与分层标记口径一致", async () => {
  const [wallet, tier] = await Promise.all([
    readFile(walletPath, "utf8"),
    readFile(tierPath, "utf8")
  ]);

  assert.doesNotMatch(wallet, /蓝胜/);
  assert.match(wallet, /LS-USDT-N-L1/);
  assert.match(wallet, /LS-TRX-N-L1/);
  assert.match(tier, /prefix: "LS-USDT"/);
  assert.match(tier, /prefix: "LS-TRX"/);
});

test("需求页面不展示评审说明文案", async () => {
  const sources = await Promise.all(
    [merchantPath, adminPath, walletPath, tierPath].map((path) => readFile(path, "utf8"))
  );
  const combined = sources.join("\n");

  assert.doesNotMatch(combined, /（演示）|<b>说明：<\/b>|本期变更/);
});

test("页面导航关联表与当前清单一致", async () => {
  const [navigation, catalogText] = await Promise.all([
    readFile("docs/页面导航关联.md", "utf8"),
    readFile("src/catalog/project.json", "utf8")
  ]);
  const catalog = JSON.parse(catalogText);
  const navIds = Object.values(catalog.nav)
    .flatMap((groups) => groups)
    .flatMap((group) => group.items || [])
    .filter((item) => !item.static)
    .map((item) => item.id);

  assert.match(navigation, /admin-withdraw-fee/);
  for (const id of navIds) assert.match(navigation, new RegExp(`\\b${id}\\b`));
  assert.doesNotMatch(navigation, /admin-ch-flow|admin-mp-flow|admin-mp-prepay|merchant-account|merchant-paccount/);
  assert.doesNotMatch(navigation, /TRX代收归属|蓝胜/);
});

test("通道代收流水只保留原菜单，不关联 TRX 需求", async () => {
  const catalog = JSON.parse(await readFile("src/catalog/project.json", "utf8"));
  const accountGroup = catalog.nav.ADMIN.find((group) => group.label === "账户记录");
  const channelFlow = accountGroup.items.find((item) => item.title === "通道代收流水记录");

  assert.deepEqual(channelFlow, { title: "通道代收流水记录", static: true });
  assert.equal(catalog.nav.ADMIN.flatMap((group) => group.items || []).some((item) => item.id === "admin-ch-flow"), false);
});
