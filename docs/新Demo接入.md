# 新 Demo 接入

## 1. 确认影响端

按实际改动选择一个或多个端：

- `后台`
- `商户`
- `地址池`

一个需求只保留一份正式 Demo。同时影响多个端时，在页面清单登记多个端，不建立“跨后台”分类，也不要复制多份互相漂移的 Demo。

## 2. 新增源文件

目录格式：

```text
src/pages/<需求名称>/<需求名称>-demo.html
```

Demo 使用模拟数据，不写入账号、密码、Token、密钥、真实商户资料或生产接口地址。

## 3. 登记清单

在 `src/catalog/project.json` 中：

1. 在 `documents` 增加 Demo 源文件。
2. 在 `pages` 增加页面名称、摘要、影响端和对应文档。
3. 页面 ID 使用 `BP-REQ-001` 格式并递增。
4. `moduleCodes` 按影响端填写：
   - 后台：`ADMIN`
   - 商户：`MERCHANT`
   - 地址池：`ADDRESS`

例如一个需求同时影响后台和商户：

```json
{
  "id": "BP-REQ-001",
  "moduleCodes": ["ADMIN", "MERCHANT"]
}
```

已经使用过的 ID 不复用。

## 4. 检查

```bash
npm run check
```

检查通过后打开 `index.html`，逐页确认导航、标题、交互和展示范围。

## 5. 提交

一次提交只接入一个需求或一组明确相关的修改。提交说明使用业务名称，例如：

```text
新增 USDT 代付余额提醒 Demo
```
