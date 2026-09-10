# Siyuan 的个人空间

这是 `siyuanjiang.com` 的完整源代码。网站使用 Next.js/Vinext，并部署到你自己的 Cloudflare Workers 账户。待办、笔记和技能内容存储在 Cloudflare D1，上传的文件存储在 Cloudflare R2。

## 本地运行

需要 Node.js 22.13 或更高版本。

```bash
npm ci
npm run db:migrate:local
npm run dev
```

本地网站默认位于 `http://localhost:5173`。

## 部署到自己的 Cloudflare 账户

1. 安装依赖并登录 Cloudflare：

   ```bash
   npm ci
   npx wrangler login
   ```

2. 创建你自己的数据库和文件存储：

   ```bash
   npx wrangler d1 create siyuanjiang-db
   npx wrangler r2 bucket create siyuanjiang-files
   ```

3. 把第一条命令输出的 `database_id` 填入 `wrangler.jsonc`。

4. 初始化远程数据库并部署：

   ```bash
   npm run db:migrate:remote
   npm run deploy
   ```

5. 在 Cloudflare Zero Trust 中为 `siyuanjiang.com` 创建 Access 应用，只允许你的邮箱访问。完成后再把域名切换到这个 Worker，避免私人内容短暂公开。

## 域名

`wrangler.jsonc` 已把 `siyuanjiang.com` 配置为 Worker 的 Custom Domain。域名必须加入同一个 Cloudflare 账户，并由 Cloudflare 管理 DNS。部署成功后，Cloudflare 会自动创建 Worker 域名记录和 HTTPS 证书。

确认新网站、数据库、文件上传和访问保护都正常后，再从旧托管平台移除自定义域名。
