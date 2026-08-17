# Bluepay 需求 Demo

蓝盛代付新需求 HTML Demo 的统一维护仓库。

本仓库只收纳已经确认需要进入统一展示入口的 Demo，不直接纳入上级产品资料库、PRD、截图、Graphify 产物或历史归档。

## 本地使用

```bash
npm run build
npm run check
```

构建后打开根目录 `index.html`，即可查看统一 Demo 入口。

## 评审与交付

- 唯一评审入口：仓库根目录 `index.html`。
- `src/pages/` 只用于内部编辑，不作为交付给用户的查看链接。
- 每次改动完成后运行构建与检查，从统一入口确认页面可达。
- 对用户只提供统一入口，并按产品菜单名称列出本次修改页面；不得提供独立需求 Demo 或源码页面作为替代入口。

## 目录

- `src/pages/`：按业务页面维护的正式 Demo 源文件；后续需求优先更新既有页面，不按需求复制同一页面
- `src/catalog/project.json`：页面、后台归属和源文件清单
- `src/shell/index.template.html`：统一 Demo 入口母板
- `scripts/`：构建与完整性检查
- `test/`：项目结构和构建测试
- `docs/新Demo接入.md`：新需求 Demo 的接入步骤

## 展示分类

- 后台
- 商户
- 地址池

新需求仍在上级产品资料库中按完整需求包维护；只有确认用于评审或展示的 Demo 文件复制到本仓库。

## 新需求接入与页面迭代

1. 先从 `src/catalog/project.json` 定位受影响业务页的 `doc` 和 `boot`，并更新该业务页的既有源文件。
2. 新增字段、状态、币种或交互时，保留该页面原有能力；同一页面不得复制出第二份 Demo。
3. 只有新增真实产品页面或独立端时，才在 `src/pages/` 新增源文件，并在 `src/catalog/project.json` 登记。
4. 同时影响多个端时只保留一份 Demo，并在 `moduleCodes` 登记多个端。
5. 运行 `npm run check`，确认统一入口和既有页面正常后再提交和推送。

不要直接修改 `index.html` 或 `dist/`，它们是构建产物。
