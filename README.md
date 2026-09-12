# Siyuan · 个人工作台

个人目标、每周任务、体重趋势、随笔、课程截止日和文件收藏。部署于自己的 Cloudflare Workers，结构化内容保存在 D1，文件保存在 R2。

## 使用

- 在总览按日期选择任务，完成后打勾；点击任务可修改日期、时长和成果反馈。
- 目标路线按主线和周显示任务；旅行日期会在日历中标记。
- 体重页面只使用实际输入的数据，计算近 7 天均值。
- 作业可标记提交并导出 `.ics`，包含截止前 1 天与 2 小时的日历提醒。网页关闭后的通知由日历应用负责，本站没有后台推送服务。
- 设置中可导入或导出工作台 JSON。导入会替换工作台记录，请先备份；旧版笔记、技能、待办和 R2 文件不受影响。
- 新安装默认为空；私人计划通过网页导入，不写入公开源码。

## 本地验证

需要 Node.js 22.13 或更高版本：

```bash
npm ci
npm run db:migrate:local
npm run dev
```

开发端口为 5173。构建和检查：

```bash
npx tsc --noEmit
npm run lint
npm run build
npm start
```

如果本机 workerd 版本不支持配置的 compatibility date，升级本地 Wrangler，或仅对本地测试传入该运行时支持的日期：`npm start -- --compatibility-date YYYY-MM-DD`。这不会改动线上配置。

## 更新现有 Cloudflare 部署

已有 D1、R2、域名和 Access 配置继续使用，不需要重建资源。Cloudflare 的构建命令为 `npm run build`，部署命令为：

```bash
npx wrangler d1 migrations apply siyuanjiang-db --remote && npx wrangler deploy --config dist/server/wrangler.json
```

新增迁移 `0001_workbench.sql` 只创建工作台表，不修改旧 `items` 表。工作台采用 revision 检查，多个页面同时保存时拒绝过期写入，避免静默覆盖。

这是供账户所有者使用的单人工作台。现有 Cloudflare Access 应继续保护自定义域名、生产及预览入口；访问者应仅为账户所有者。应用没有独立用户系统，也不会隔离多个获准访客的数据。不要为了省去登录而公开私人工作台。

新账户部署时，先创建 D1/R2、填写自己的绑定，并在导入私人内容前配置 Access。不要将私人计划、体重记录、随笔或备份提交至公开仓库。
