import { readFile } from "node:fs/promises";
import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";

const source = await readFile(
  "src/pages/机器人分层播报与多人确认/机器人分层播报与多人确认-demo.html", "utf8"
);
const stepSource = source.slice(
  source.indexOf("    function stepCryptoRepairAmount("),
  source.indexOf("    function openCryptoRechargeRepair(")
);
const stepAmount = vm.runInNewContext(stepSource + "\nstepCryptoRepairAmount");

test("补单金额步进保留小数和精度，不能减为负数或超过最大金额", () => {
  assert.equal(stepAmount("2.12345678", 1), "3.12345678");
  assert.equal(stepAmount("3.12345678", -1), "2.12345678");
  assert.equal(stepAmount("0.25000000", -1), "0.00000000");
  assert.equal(stepAmount("", 1), "1.00");
  assert.equal(stepAmount("9007199254740990.01", 1), "9007199254740991.00");
});
