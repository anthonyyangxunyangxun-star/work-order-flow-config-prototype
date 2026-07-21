# work-order-flow-config-prototype

基于 Vue 3 + Vite + meri-plus 的原型项目，由 `产品转原型设计` Skill 模板生成。

## 启动

```bash
npm install
npm run dev
```

## 局域网共享配置服务

多人共享配置结果时使用后端服务启动：

```bash
npm run serve:lan
```

该命令会先执行 `npm run build`，再启动 Node 服务，同时提供静态页面与配置 API。

- 页面地址：`http://本机局域网IP:5177/`
- 健康检查：`http://本机局域网IP:5177/api/health`
- 共享配置数据目录：`server/data/`

当前共享存储只用于原型配置协作，不是正式业务工单执行后端。

## GitHub Pages 静态演示

仓库推送到 GitHub 的 `main` 分支后，`.github/workflows/deploy-pages.yml` 会自动构建并发布 GitHub Pages。

Pages 模式具有以下行为：

- 页面、路由和前端交互可以正常使用；
- 配置数据保存在当前浏览器的 `localStorage`；
- 刷新或关闭浏览器后数据仍保留；
- 不同浏览器、设备和用户之间不共享数据；
- 清除站点数据或使用无痕模式会导致本地配置丢失。

本地 `npm run dev` 和 `npm run serve:lan` 不受 Pages 模式影响，后者仍使用 `server/data/` 提供局域网共享配置。

`server/data/*.json` 是本机运行数据，默认不会提交到 Git 仓库。Pages 首次打开时使用代码内置样例，之后由每个浏览器独立保存。

## 目录约定

- `src/views/` — 业务页面（Skill 在此生成）
- `src/router/index.js` — 路由注册（Skill 在此追加）
- `src/components/` — 全局组件 `AppTopbar` / `SectionTitle`，**不要修改**
- `src/styles/` — 全局样式与 token，**不要修改**
- `src/assets/` — 公用资源（背景图等）
- `server/` — 局域网共享配置服务与 JSON 数据文件
