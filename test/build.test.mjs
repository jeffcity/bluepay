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
  assert.match(root, /LS-HOME-001/);
  assert.match(root, /蓝盛代付需求 Demo/);
  assert.doesNotMatch(root, /\/Users\/|file:\/\//);

  const documentStart =
    root.indexOf("const DOCUMENTS=") + "const DOCUMENTS=".length;
  const documentEnd = root.indexOf(";\n    const mainNav=", documentStart);
  const documents = JSON.parse(root.slice(documentStart, documentEnd));
  assert.deepEqual(Object.keys(documents), ["doc-guide"]);

  for (const document of Object.values(documents)) {
    for (const script of document.matchAll(
      /<script[^>]*>([\s\S]*?)<\/script>/gi
    )) {
      assert.doesNotThrow(() => new Function(script[1]));
    }
  }
});
