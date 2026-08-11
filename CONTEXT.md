# 项目上下文

- 统一入口：顶栏三端（后台 / 商户 / 地址池）+ **产品左侧导航**（不是需求列表）。
- 导航真相源：`src/catalog/project.json` → `nav`。每个叶子是一页：`id/title/doc/boot/req`。
- 更新 Demo = 更新某业务页对应的源文件 + 必要时改 `nav` 挂载；禁止再把整包需求挂成外层卡片。
- 壳加载页时注入 `__BP_SURFACE__` / `__BP_BOOT__` / embed 去内页重复侧栏；后台页不得出现在商户端。
- 需求 ID（`BP-REQ-*`）仍在 `pages` 里做追溯，通过 `nav[].req` 反查。
- `index.html` / `dist/` 构建生成，禁手改。页面变更后 `npm run check`。
