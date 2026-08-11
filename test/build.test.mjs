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
  assert.doesNotMatch(root, /需求 Demo 中心|项目说明|跨后台|HTML DEMO/);
  assert.doesNotMatch(root, /\/Users\/|file:\/\//);
  assert.match(root, /id="sideNav"/);
  assert.match(root, /const NAV=/);
  assert.match(root, /admin-collect/);
  assert.match(root, /merchant-order/);

  const documentStart =
    root.indexOf("const DOCUMENTS=") + "const DOCUMENTS=".length;
  const documentEnd = root.indexOf(";\n    const mainNav=", documentStart);
  const documents = JSON.parse(root.slice(documentStart, documentEnd));
  assert.ok(documents["商户充值订单统计栏位-demo"]);
  assert.match(documents["商户充值订单统计栏位-demo"], /成功订单总额/);
  assert.ok(documents["机器人分层播报与多人确认-demo"]);
  assert.match(documents["机器人分层播报与多人确认-demo"], /TG确认状态/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /cryptoOrder|虚拟币充值订单管理/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /<th>余额<\/th>/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /<th>预付<\/th>/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /<th>剩余预付<\/th>/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /USDT/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /TRX/);
  assert.ok(documents["TRX代收通道-demo"]);
  assert.match(documents["TRX代收通道-demo"], /m-order|代收订单/);
  assert.match(documents["TRX代收通道-demo"], /全部通道/);
  assert.match(documents["TRX代收通道-demo"], /完成起始时间/);
  assert.match(documents["TRX代收通道-demo"], /商户代理费/);
  assert.match(documents["TRX代收通道-demo"], /交易金额/);
  assert.ok(documents["VND法币代收-demo"]);
  assert.match(documents["VND法币代收-demo"], /虚拟币充值配置|汇率/);
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
