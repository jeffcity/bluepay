# 蓝盛代付需求 Demo

蓝盛代付新需求 HTML Demo 的统一维护仓库。

本仓库只收纳已经确认需要进入统一展示入口的 Demo，不直接纳入上级产品资料库、PRD、截图、Graphify 产物或历史归档。

## 本地使用

```bash
npm run build
npm run check
```

构建后打开根目录 `index.html`，即可查看统一 Demo 入口。

## 目录

- `src/pages/`：各需求的正式 Demo 源文件
- `src/catalog/project.json`：页面、后台归属和源文件清单
- `src/shell/index.template.html`：统一 Demo 入口母板
- `scripts/`：构建与完整性检查
- `test/`：项目结构和构建测试
- `docs/新Demo接入.md`：新需求 Demo 的接入步骤

## 后台归属

- 蓝盛后台
- 蓝盛商户端后台
- 地址池后台
- 跨后台

新需求仍在上级产品资料库中按完整需求包维护；只有确认用于评审或展示的 Demo 文件复制到本仓库。

## 接入新 Demo

1. 在 `src/pages/<后台归属>/<需求名称>/` 新增确认后的 Demo。
2. 在 `src/catalog/project.json` 登记页面和源文件。
3. 运行 `npm run check`。
4. 本地确认展示正常后再提交和推送。

不要直接修改 `index.html` 或 `dist/`，它们是构建产物。
