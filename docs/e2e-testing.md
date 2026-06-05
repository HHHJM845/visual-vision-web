# E2E 测试说明

当前 E2E 使用 Playwright，覆盖演示级 Demo MVP 的关键入口：

- 未登录用户访问发布页会被要求登录。
- 甲方发布项目后进入创作者推荐页，并能邀约创作者。
- 项目详情能展示合作后的合同、托管、交付和纠纷面板。
- 消息中心能聚合项目消息和项目通知。

## 运行方式

优先使用 npm：

```bash
npm run test:e2e
```

如果当前机器没有可用 npm，但 `node_modules` 已存在，可以直接用本地 Playwright：

```bash
node ./node_modules/@playwright/test/cli.js test
```

首次运行如果提示浏览器缺失，安装 Chromium：

```bash
node ./node_modules/@playwright/test/cli.js install chromium
```

查看 HTML 报告：

```bash
npm run test:e2e:report
```

## 测试数据

E2E 不依赖真实 Supabase 登录。测试会在浏览器启动前写入 localStorage：

- `visionai.currentUser`
- `visionai.users`
- `visionai.applications`
- `visionai.projectMessages`
- `visionai.notifications`

这样可以稳定验证前端主流程，不被外部账号、网络或真实数据库状态影响。

## 后续建议

下一批 E2E 可以继续补：

- 双角色合同签署。
- 托管草稿创建与确认。
- 乙方提交交付、甲方要求修改。
- 纠纷发起、管理员裁决、项目详情回显裁决。
