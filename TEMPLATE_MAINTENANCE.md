# meri-plus-starter 模板维护说明

本目录是 `产品转原型设计` Skill 的脚手架模板。Skill 每次新建项目时执行：

```bash
cp -R ~/.claude/templates/meri-plus-starter <project-dir>
cd <project-dir>
sed -i '' "s/__APP_NAME__/<project-name>/g" package.json index.html README.md
npm install
npm run dev
```

## 何时需要更新模板

- meri-plus / meri-icon 发布新版本，需要升级
- AppTopbar 或 SectionTitle 全局组件有改动
- 全局样式（reset.css / global.css）需要调整

## 升级步骤

1. 修改 `package.json` 中的版本号
2. 在本目录执行 `rm -rf node_modules package-lock.json && npm install`
3. 提交新的 `package-lock.json`
4. 验证：`npm run dev`，确认首页 Home.vue 正常渲染、AppTopbar 显示正确

## 占位符约定

- `__APP_NAME__` — 在 `package.json` / `index.html` / `README.md` 中出现，由 Skill 用 `sed` 替换为实际项目名

## 不要做的事

- 不要把 `node_modules` 提交到模板
- 不要在模板里写业务代码（业务代码属于使用模板的项目，不属于模板本身）
- 不要让 LLM 通过 Read 读取 `AppTopbar.vue`——它就是用来 cp 的，不是用来理解的
