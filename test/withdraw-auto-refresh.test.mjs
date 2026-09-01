import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const adminPath = "src/pages/机器人分层播报与多人确认/机器人分层播报与多人确认-demo.html";

test("商户下分支持按当前筛选条件自动刷新", async () => {
  const admin = await readFile(adminPath, "utf8");

  assert.match(admin, /data-withdraw-auto-refresh/);
  assert.match(admin, /role="switch" aria-checked="\$\{withdrawAutoRefresh\}"/);
  assert.match(admin, /WITHDRAW_AUTO_REFRESH_MS = 10000/);
  assert.match(admin, /setInterval\(refreshWithdrawData, WITHDRAW_AUTO_REFRESH_MS\)/);
  assert.match(admin, /上次刷新/);
  assert.match(admin, /data-tooltip="每 10 秒自动刷新，保留当前筛选条件。"/);
});
