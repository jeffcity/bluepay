import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { readFile } from "node:fs/promises";
import { promisify } from "node:util";
import test from "node:test";

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
});
