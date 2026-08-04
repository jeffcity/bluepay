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

  const documentStart =
    root.indexOf("const DOCUMENTS=") + "const DOCUMENTS=".length;
  const documentEnd = root.indexOf(";\n    const mainNav=", documentStart);
  const documents = JSON.parse(root.slice(documentStart, documentEnd));
  assert.ok(documents["商户充值订单统计栏位-demo"]);
  assert.match(documents["商户充值订单统计栏位-demo"], /成功订单总额/);
  assert.ok(documents["机器人分层播报与多人确认-demo"]);
  assert.match(documents["机器人分层播报与多人确认-demo"], /TG确认状态/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /商户下分/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /\["recharge", "商户充值订单"\]/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /成功订单总额/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /data-edit-index/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /修改商户/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /Telegram 通知配置/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /USDT 代付确认配置/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /USDT 余额提醒配置/);
  assert.match(
    documents["机器人分层播报与多人确认-demo"],
    /tier-rule-table[\s\S]*金额区间[\s\S]*TG 群 ID[\s\S]*确认人员[\s\S]*需确认人数[\s\S]*操作/
  );
  assert.match(documents["机器人分层播报与多人确认-demo"], /data-tier-action="add"/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /id="tierStartAmount"/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /merchant-config-shell/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /role="tablist" aria-label="商户配置分组"/);
  for (const section of ["basic", "withdraw-confirm", "telegram", "payout-confirm", "balance-alert", "advanced"]) {
    assert.match(documents["机器人分层播报与多人确认-demo"], new RegExp(`data-modal-section-target="${section}"`));
    assert.match(documents["机器人分层播报与多人确认-demo"], new RegExp(`data-modal-section-panel="${section}"`));
  }
  assert.match(documents["机器人分层播报与多人确认-demo"], /formatTierAmount\(rule\.start\)\} USDT 起/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /formatTierAmount\(nextRule\.start\)\} USDT 前/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /tier-range-end">无上限/);
  assert.doesNotMatch(documents["机器人分层播报与多人确认-demo"], /tierMaxAmount|结束金额（USDT）|data-tier-action="toggle"/);
  assert.match(documents["机器人分层播报与多人确认-demo"], /确认人员数量不能少于需确认人数/);
  assert.doesNotMatch(documents["机器人分层播报与多人确认-demo"], /data-config-toggle="tg-confirm"/);
  assert.ok(documents["商户增加资金划转-demo"]);
  assert.match(documents["商户增加资金划转-demo"], /资金调整/);
  assert.match(documents["商户增加资金划转-demo"], /代收商户管理/);
  assert.match(documents["商户增加资金划转-demo"], /\["recharge", "商户充值订单"\]/);
  assert.match(documents["商户增加资金划转-demo"], /成功订单总额/);
  assert.match(documents["商户增加资金划转-demo"], /data-edit-index/);
  assert.match(documents["商户增加资金划转-demo"], /修改商户/);
  assert.match(documents["商户增加资金划转-demo"], /data-config-toggle="tg-confirm"/);
  assert.doesNotMatch(documents["商户增加资金划转-demo"], /tier-rule-table/);
  const botDocument = documents["机器人分层播报与多人确认-demo"];
  assert.match(botDocument, /商户下分 TG 确认配置/);
  assert.match(botDocument, /审核风控群ID/);
  assert.match(botDocument, /TG username 白名单/);
  const botConfirmPanel = botDocument.slice(
    botDocument.indexOf('data-modal-section-panel="withdraw-confirm"'),
    botDocument.indexOf('data-modal-section-panel="telegram"')
  );
  assert.doesNotMatch(botConfirmPanel, /群与确认人|section-badge mod|原「机器人群组ID」|仅列表内的 TG 账号/);
  const fundsDocument = documents["商户增加资金划转-demo"];
  assert.match(
    fundsDocument,
    /商户下分TG确认配置[\s\S]*审核风控群ID[\s\S]*TG username 白名单[\s\S]*Telegram 通知配置/
  );
  const fundsConfirmSection = fundsDocument.slice(
    fundsDocument.indexOf("<strong>商户下分TG确认配置</strong>"),
    fundsDocument.indexOf("<strong>Telegram 通知配置</strong>")
  );
  assert.doesNotMatch(fundsConfirmSection, /群与确认人|section-badge mod|原「机器人群组ID」|仅列表内的 TG 账号/);
  for (const document of [botDocument, fundsDocument]) {
    assert.doesNotMatch(document, /原 TG username 白名单/);
    assert.doesNotMatch(document, /section-badge|modal-help|>NEW<|含新增字段|独立配置/);
    assert.equal((document.match(/class="config-label">TG username 白名单/g) || []).length, 1);
  }
  assert.match(root, /BP-REQ-002/);
  assert.match(root, /BP-REQ-003/);
});

test("后台默认直接进入五页面复刻且不显示需求页签", async () => {
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
        classList: { add() {}, remove() {} },
        addEventListener(type, listener) {
          listeners.set(`${id}:${type}`, listener);
        }
      });
    }
    return elements.get(id);
  }

  const location = { hash: "" };
  vm.runInNewContext(script, {
    document: { getElementById: element },
    history: {
      replaceState(_state, _title, hash) {
        location.hash = hash;
      }
    },
    location,
    addEventListener() {},
    clearTimeout() {},
    setTimeout() {}
  });

  assert.doesNotMatch(root, /class="worktabs"|class="worktab/);
  assert.equal(location.hash, "");
  assert.match(element("demoFrame").srcdoc, /TG确认状态/);
  for (const page of ["商户下分", "代付商户管理", "代收商户管理", "商户管理", "商户充值订单"]) {
    assert.match(element("demoFrame").srcdoc, new RegExp(page));
  }
});
