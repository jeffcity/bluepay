import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";
import vm from "node:vm";

test("构建生成一致的本地入口", async () => {
  await promisify(execFile)(process.execPath, ["scripts/build.mjs"]);
  const [root, dist] = await Promise.all([
    readFile("index.html", "utf8"),
    readFile("dist/index.html", "utf8")
  ]);

  assert.equal(root, dist);
  assert.match(root, /Bluepay/);
  assert.match(root, /\["ADMIN","后台"\]/);
  assert.match(root, /\["MERCHANT","商户"\]/);
  assert.match(root, /\["ADDRESS","地址池"\]/);
  assert.match(root, /\["BEAUTY_MERCHANT","美人桥商户端"\]/);
  assert.doesNotMatch(root, /需求 Demo 中心|项目说明|跨后台|HTML DEMO/);
  assert.doesNotMatch(root, /\/Users\/|file:\/\//);
  assert.match(root, /id="sideNav"/);
  assert.match(root, /const NAV=/);
  assert.match(root, /admin-collect/);
  assert.match(root, /merchant-order/);
  assert.match(root, /merchant-payout-prepay/);
  assert.match(root, /merchant-collect-account/);
  assert.match(root, /merchant-payout-account/);
  assert.match(root, /admin-pay-order/);
  assert.match(root, /beauty-order-list/);
  assert.match(root, /admin-black-list/);

  const documentStart =
    root.indexOf("const DOCUMENTS=") + "const DOCUMENTS=".length;
  const documentEnd = root.indexOf(";\n    const mainNav=", documentStart);
  const documents = JSON.parse(root.slice(documentStart, documentEnd));
  assert.ok(documents["商户充值订单统计栏位-demo"]);
  assert.match(documents["商户充值订单统计栏位-demo"], /成功订单总额/);
  assert.ok(documents["机器人分层播报与多人确认-demo"]);
  assert.match(documents["机器人分层播报与多人确认-demo"], /TG确认状态/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /cryptoOrder|虚拟币充值订单管理/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /<table class="crypto-order-table">/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /<colgroup class="crypto-order-columns">[^]*width:210px[^]*width:160px[^]*width:100px[^]*<\/colgroup>/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /cur:"VND"[^]*rate:"26,673\.00",floatRate:"0\.0200",floatAmount:"0\.00"/);
  assert.doesNotMatch(documents["机器人分层播报与多人确认-demo"], /26,150\.00 → 26,150\.02|0\.0200 VND\/USDT|0\.00000292/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /<th>余额<\/th>/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /<th>预付<\/th>/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /<th>剩余预付<\/th>/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /USDT/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /TRX/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /VND/);
  const collectSource = documents["机器人分层播报与多人确认-demo"].slice(
    documents["机器人分层播报与多人确认-demo"].indexOf("function collectPage()"),
    documents["机器人分层播报与多人确认-demo"].indexOf("let cryptoRateRows")
  );
  assert.match(collectSource, /const vndTurnover = \["100,000", "0", "250,000", "0", "0", "50,000"\]\[i\]/);
  assert.match(collectSource, /asset-line vnd[^]*>VND<[^]*vndTurnover/);
  assert.equal((collectSource.match(/>VND</g) || []).length, 1);
  assert.match(documents["机器人分层播报与多人确认-demo"], /cryptoConfig|虚拟币充值配置/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /新增币种|不同法币/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /data-crypto-rate-edit/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /openCryptoRateModal/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /data-crypto-rate-save/);
  assert.doesNotMatch(documents["机器人分层播报与多人确认-demo"], /统一汇率浮动比例|统一浮动比例/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /<th>浮动汇率<\/th>/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /cur: "CNY"[^]*floating: "0\.1430"[^]*effective: "7\.2953"/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /cur: "VND"[^]*floating: "523\.00"[^]*effective: "26,673\.00"/);
  assert.doesNotMatch(documents["机器人分层播报与多人确认-demo"], /cryptoUnifiedFloatRatio|calculateCryptoFloatingRate|saveCryptoUnifiedFloatRatio|data-crypto-unified-float-save/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /data-crypto-rate-floating/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /汇率状态/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /已获取/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /获取失败/);
  assert.doesNotMatch(documents["机器人分层播报与多人确认-demo"], /最低下单金额|data-crypto-rate-min|data-crypto-rate-toggle/);
  assert.ok(documents["商户增加资金划转-demo"]);
  assert.match(documents["商户增加资金划转-demo"], /确认出款（资金划转）/);
  assert.match(documents["商户增加资金划转-demo"], /订单摘要/);
  assert.match(documents["商户增加资金划转-demo"], /data-confirm-payout/);
  assert.match(documents["商户增加资金划转-demo"], /TG 确认记录/);
  assert.ok(documents["商户代付流水记录-demo"]);
  assert.match(documents["商户代付流水记录-demo"], /accountLedgerPage\("payout-record"\)/);
  assert.match(documents["商户代付流水记录-demo"], /walletBelongsToLedger/);
  assert.match(documents["商户代付流水记录-demo"], /TRF202608180005/);
  assert.match(documents["商户代付流水记录-demo"], /USDT代付预付/);
  assert.ok(documents["商户代收流水记录-demo"]);
  assert.match(documents["商户代收流水记录-demo"], /accountLedgerPage\("collect-record"\)/);
  assert.ok(documents["美人桥订单管理-demo"]);
  assert.match(documents["美人桥订单管理-demo"], /美人桥工号/);
  assert.match(documents["美人桥订单管理-demo"], /未处理订单提醒/);
  assert.match(documents["美人桥订单管理-demo"], /充值币种/);
  assert.match(documents["美人桥订单管理-demo"], /上分金额（CNY）/);
  assert.match(documents["美人桥订单管理-demo"], /应转数量/);
  assert.match(documents["美人桥订单管理-demo"], /兑CNY汇率/);
  assert.match(documents["美人桥订单管理-demo"], /浮动数量/);
  assert.match(documents["美人桥订单管理-demo"], /浮动费率/);
  assert.match(documents["美人桥订单管理-demo"], /currency:'TRX'/);
  assert.match(documents["美人桥订单管理-demo"], /美人桥默认汇率设置/);
  assert.match(documents["美人桥订单管理-demo"], /beautyRateSettings/);
  assert.match(documents["美人桥订单管理-demo"], /bluepay\.beauty-merchant-cny-rates\.v3/);
  assert.match(documents["美人桥订单管理-demo"], /<th>币种<\/th><th>汇率（兑 CNY）<\/th><th>默认<\/th>/);
  assert.match(documents["美人桥订单管理-demo"], /data-rate-currency="USDT"[^>]*role="switch"/);
  assert.match(documents["美人桥订单管理-demo"], /data-rate-currency="TRX"[^>]*role="switch"/);
  assert.match(documents["美人桥订单管理-demo"], /defaultEnabled:\{USDT:true,TRX:false\}/);
  assert.match(documents["美人桥订单管理-demo"], /USDT 未开启默认汇率时查询线上 USDT\/CNY/);
  assert.match(documents["美人桥订单管理-demo"], /TRX 未开启默认汇率时无法创建 TRX 订单/);
  assert.doesNotMatch(documents["美人桥订单管理-demo"], /data-default-currency=|defaultCurrency|role="radio"/);
  assert.doesNotMatch(documents["美人桥订单管理-demo"], /id="rateCurrency"/);
  assert.doesNotMatch(documents["美人桥订单管理-demo"], /<th>USDT\/CNY<\/th>|<th>上浮费用<\/th>|<th>产生费率<\/th>/);
  assert.doesNotMatch(documents["美人桥订单管理-demo"], /应上分U|兑U汇率|1 USDT ≈[^<]*TRX/);
  assert.match(documents["美人桥订单管理-demo"], /不经过 USDT 中转/);
  assert.doesNotMatch(documents["美人桥订单管理-demo"], /统一汇率表/);
  assert.match(documents["美人桥订单管理-demo"], /data-credit/);
  assert.match(documents["美人桥订单管理-demo"], /data-log/);
  assert.ok(documents["美人桥统计报表-demo"]);
  assert.match(documents["美人桥统计报表-demo"], /商户报表/);
  assert.match(documents["美人桥统计报表-demo"], /归属收款统计报表/);
  assert.match(documents["美人桥统计报表-demo"], /上分金额（CNY）/);
  assert.match(documents["美人桥统计报表-demo"], /充值数量/);
  assert.match(documents["美人桥统计报表-demo"], /充值币种/);
  assert.doesNotMatch(documents["美人桥统计报表-demo"], /<th>今日充值<\/th>|<th>应转U<\/th>/);
  assert.match(documents["美人桥统计报表-demo"], /产生费率/);
  assert.match(documents["美人桥统计报表-demo"], /上浮费用/);
  assert.match(documents["美人桥统计报表-demo"], /百分比/);
  assert.match(documents["美人桥统计报表-demo"], /同一商户同一天存在不同充值币种时按币种分行统计/);
  assert.match(documents["美人桥统计报表-demo"], /导出 Excel/);
  assert.match(documents["美人桥统计报表-demo"], /收入总额\(应转u\)/);
  assert.match(documents["美人桥统计报表-demo"], /暂无数据，可调整筛选条件后重试/);
  assert.ok(documents["美人桥商户端订单列表-demo"]);
  assert.match(documents["美人桥商户端订单列表-demo"], /美人桥工号/);
  assert.match(documents["美人桥商户端订单列表-demo"], /修改密码|订单列表/);
  assert.match(documents["美人桥商户端订单列表-demo"], /TRX充值/);
  assert.match(documents["美人桥商户端订单列表-demo"], /id="createAmountLabel">请输入金额<\/label>/);
  assert.match(documents["美人桥商户端订单列表-demo"], /label:'请输入USDT数量'/);
  assert.match(documents["美人桥商户端订单列表-demo"], /label:'请输入TRX数量'/);
  assert.match(documents["美人桥商户端订单列表-demo"], /上分金额（CNY）/);
  assert.match(documents["美人桥商户端订单列表-demo"], /应转数量/);
  assert.match(documents["美人桥商户端订单列表-demo"], /兑CNY汇率/);
  assert.match(documents["美人桥商户端订单列表-demo"], /beautyRateSettings/);
  assert.match(documents["美人桥商户端订单列表-demo"], /bluepay\.beauty-merchant-cny-rates\.v3/);
  assert.match(documents["美人桥商户端订单列表-demo"], /onlineUsdtCnyRate=6\.71/);
  assert.match(documents["美人桥商户端订单列表-demo"], /线上 USDT\/CNY 汇率/);
  assert.match(documents["美人桥商户端订单列表-demo"], /TRX 默认汇率未启用，当前无法创建 TRX 充值订单/);
  assert.match(documents["美人桥商户端订单列表-demo"], /defaultEnabled\.TRX/);
  assert.match(documents["美人桥商户端订单列表-demo"], /payAmount\*quote\.effective/);
  assert.doesNotMatch(documents["美人桥商户端订单列表-demo"], /currencyToMethod/);
  assert.match(documents["美人桥商户端订单列表-demo"], /本单锁定汇率/);
  assert.match(documents["美人桥商户端订单列表-demo"], /source:'本单锁定汇率'/);
  assert.match(documents["美人桥商户端订单列表-demo"], /createAmount'\)\.disabled=Boolean\(item\)/);
  assert.match(documents["美人桥商户端订单列表-demo"], /保留本单锁定的/);
  assert.match(documents["美人桥商户端订单列表-demo"], /不经过 USDT 中转/);
  assert.doesNotMatch(documents["美人桥商户端订单列表-demo"], /应上分U|兑U汇率|creditU|\.usdt/);
  assert.doesNotMatch(documents["美人桥商户端订单列表-demo"], /<th>USDT→CNY<\/th>|<th>上浮费用<\/th>/);
  assert.doesNotMatch(documents["美人桥商户端订单列表-demo"], /统一汇率表/);
  assert.match(documents["美人桥商户端订单列表-demo"], /data-edit/);
  assert.match(documents["美人桥订单管理-demo"], /currency:'TRX'[^]*status:'done',credit:'done'[^]*address:'TDEMOTrx/);
  assert.ok(documents["封禁IP管理-demo"]);
  assert.match(documents["封禁IP管理-demo"], /24 小时/);
  assert.match(documents["封禁IP管理-demo"], /Google验证码/);
  assert.match(documents["封禁IP管理-demo"], /解除临时拉黑/);
  assert.match(documents["封禁IP管理-demo"], /<th>主键<\/th>/);
  assert.match(documents["封禁IP管理-demo"], /请输入备注/);
  assert.match(documents["封禁IP管理-demo"], /解除方式/);
  assert.doesNotMatch(documents["封禁IP管理-demo"], /批量删除/);
  assert.doesNotMatch(documents["封禁IP管理-demo"], /selectAll|row-check|batchDelete/);
  for (const documentName of [
    "商户增加资金划转-demo",
    "商户代付流水记录-demo",
    "商户代收流水记录-demo"
  ]) {
    assert.match(documents[documentName], /<th>备注<\/th>/);
    assert.doesNotMatch(documents[documentName], /处理备注/);
    assert.match(documents[documentName], /资金划转给：/);
    assert.match(documents[documentName], /入账来源：/);
  }
  assert.ok(documents["TRX代收通道-demo"]);
  assert.match(documents["TRX代收通道-demo"], /m-order|代收订单/);
  assert.match(documents["TRX代收通道-demo"], /商户代付预付/);
  assert.match(documents["TRX代收通道-demo"], /资金划转入账/);
  assert.match(documents["TRX代收通道-demo"], /入账来源：/);
  assert.match(documents["TRX代收通道-demo"], /代收账户记录/);
  assert.match(documents["TRX代收通道-demo"], /代付账户记录/);
  assert.match(documents["TRX代收通道-demo"], /资金划转转出/);
  assert.match(documents["TRX代收通道-demo"], /TRF202608180005/);
  assert.match(documents["TRX代收通道-demo"], /付款方到实际出账钱包查看转出去向/);
  assert.doesNotMatch(documents["TRX代收通道-demo"], /付款商户在相同入口查看对应转出记录/);
  assert.match(documents["TRX代收通道-demo"], /全部通道/);
  assert.match(documents["TRX代收通道-demo"], /完成起始时间/);
  assert.match(documents["TRX代收通道-demo"], /商户代理费/);
  assert.match(documents["TRX代收通道-demo"], /交易金额/);
});

test("美人桥 CNY 上分金额最多两位小数且拒绝科学计数法", async () => {
  const source = await readFile("src/pages/美人桥商户端订单列表/美人桥商户端订单列表-demo.html", "utf8");
  const decimalFunction = source.match(/function decimalPlaces\(value\)\{[^\n]+\}/)?.[0];
  assert.ok(decimalFunction, "缺少金额小数位校验函数");
  const sandbox = {};
  vm.runInNewContext(`${decimalFunction};result=[decimalPlaces('950'),decimalPlaces('950.12'),decimalPlaces('950.123'),decimalPlaces('1e-7')]`, sandbox);
  assert.deepEqual(Array.from(sandbox.result), [0, 2, 3, Infinity]);
});

test("资金划转只关联资金划转订单和实际钱包流水", async () => {
  const catalog = JSON.parse(await readFile("src/catalog/project.json", "utf8"));
  const adminItems = catalog.nav.ADMIN.flatMap((group) => group.items || []);
  const recharge = adminItems.find((item) => item.id === "admin-recharge");
  const transfer = adminItems.find((item) => item.id === "admin-merchant-transfer");

  assert.deepEqual(recharge.req, ["BP-REQ-001"]);
  assert.deepEqual(transfer.req, ["BP-REQ-003"]);
  assert.doesNotMatch(catalog.pages.find((page) => page.id === "BP-REQ-008").summary, /均可在商户代付预付/);
  assert.match(catalog.pages.find((page) => page.id === "BP-REQ-008").summary, /实际出账钱包/);
});

test("代收商户管理同时关联 TRX 与 VND 需求", async () => {
  const catalog = JSON.parse(await readFile("src/catalog/project.json", "utf8"));
  const adminItems = catalog.nav.ADMIN.flatMap((group) => group.items || []);
  const collect = adminItems.find((item) => item.id === "admin-collect");
  const vndRequirement = catalog.pages.find((page) => page.id === "BP-REQ-004");

  assert.deepEqual(collect.req, ["BP-REQ-005", "BP-REQ-004"]);
  assert.match(vndRequirement.summary, /原始 VND 金额.*不重复计入 USDT 今日成交/);
});

test("后台默认进产品导航页且商户不串后台", async () => {
  await promisify(execFile)(process.execPath, ["scripts/build.mjs"]);
  const root = await readFile("index.html", "utf8");
  const scriptStart = root.indexOf("<script>") + "<script>".length;
  const scriptEnd = root.indexOf("</script>", scriptStart);
  const script = root.slice(scriptStart, scriptEnd);
  const listeners = new Map();
  const elements = new Map();

  function element(id) {
    if (!elements.has(id)) {
      elements.set(id, {
        id,
        hidden: false,
        innerHTML: "",
        srcdoc: "",
        textContent: "",
        title: "",
        classList: { add() {}, remove() {}, toggle() {} },
        addEventListener(type, listener) {
          listeners.set(`${id}:${type}`, listener);
        },
        removeAttribute() {}
      });
    }
    return elements.get(id);
  }

  const location = { hash: "" };
  vm.runInNewContext(script, {
    document: { getElementById: element, body: { classList: { toggle() {} } } },
    history: {
      replaceState(_state, _title, hash) {
        location.hash = hash;
      }
    },
    location,
    addEventListener() {},
    clearTimeout() {},
    setTimeout() {},
    JSON
  });

  assert.match(element("sideNav").innerHTML, /代收商户管理|商户充值订单|虚拟币充值/);
  assert.match(element("sideNav").innerHTML, /通道代收流水记录/);
  assert.doesNotMatch(element("sideNav").innerHTML, /data-page="undefined"/);
  assert.match(element("demoFrame").srcdoc, /__BP_SURFACE__=\"ADMIN\"|__BP_SURFACE__='ADMIN'|__BP_SURFACE__=\"ADMIN\"/);
  assert.match(element("demoFrame").srcdoc, /__BP_BOOT__/);
  assert.match(element("demoFrame").srcdoc, /bp-embed|__BP_EMBED__/);
  // default admin page should not be merchant surface
  assert.doesNotMatch(element("demoFrame").srcdoc, /__BP_SURFACE__=\"MERCHANT\"/);

  const clickMain = listeners.get("mainNav:click");
  assert.equal(typeof clickMain, "function");
  clickMain({
    target: {
      closest(sel) {
        if (sel === "[data-module]") return { dataset: { module: "MERCHANT" } };
        return null;
      }
    }
  });
  assert.match(element("sideNav").innerHTML, /代收订单|商户下发提现/);
  assert.doesNotMatch(element("sideNav").innerHTML, /代收商户管理|虚拟币充值配置/);
  assert.match(element("demoFrame").srcdoc, /__BP_SURFACE__=\"MERCHANT\"/);
  assert.match(element("demoFrame").srcdoc, /m-order|__BP_BOOT__=\"m-order\"/);
});
