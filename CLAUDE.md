# Project: next_music

B 站音乐收藏管理工具。收录 B 站视频音频，管理歌单/标签，提供流式播放。

## 技术栈

- Next.js 16 (App Router) + React 19 + TypeScript (strict)
- Prisma 7 + PostgreSQL (Supabase)，通过 `@prisma/adapter-pg` 适配器连接
- Ant Design 6 (SSR via `@ant-design/nextjs-registry`)
- Tailwind CSS v4 (PostCSS 插件模式)
- Zustand 5 (状态管理 + persist 中间件)
- jose (JWT) + bcryptjs (密码哈希) + zod (校验)
- pnpm 包管理

## 常用命令

- `pnpm dev` — 启动开发服务器
- `pnpm build` — 生产构建
- `pnpm start` — 启动生产服务器
- `pnpm lint` — ESLint 检查
- `npx prisma generate` — 重新生成 Prisma Client（改 schema 后必须执行）
- `npx prisma migrate dev` — 创建数据库迁移
- `npx prisma studio` — 数据库可视化管理

## 环境变量 (.env)

- `DATABASE_URL` — PostgreSQL 连接字符串（必填）
- `JWT_SECRET` — JWT 签名密钥（必填）
- `BILIBILI_SESSDATA` — B 站 SESSDATA Cookie（可选，用于获取高清封面/音频）

## 项目结构

```
app/
  (auth)/          — 登录/注册页面（公开路由组）
  (main)/          — 主业务页面（需登录）
  api/             — API 路由
    auth/          — 登录/注册/登出
    collect/       — 收录 B 站视频
    collections/   — 歌单 CRUD
    music/         — 音乐列表/导出/清缓存
    audio/[id]/    — 音频流代理（支持 Range）
  layout.tsx       — 根布局（AntdRegistry + 字体）
  globals.css      — 全局样式（Tailwind v4 import）
components/         — React 组件（Header, Player）
lib/
  prisma.ts        — Prisma Client 单例（开发环境防热重载泄漏）
  auth.ts          — JWT 签发/验证/cookie 工具
  bilibili.ts      — B 站 API 封装（视频信息获取）
  utils.ts         — 通用工具（BV号校验、格式化、防抖节流）
  store/
    player-store.ts — 播放器状态（含 audio 元素管理，活跃版本）
    auth-store.ts   — 前端登录状态
stores/
  playerStore.ts   — 旧版播放器 store（未使用，勿改）
types/
  music.ts         — 前端类型定义
prisma/
  schema.prisma    — 数据库 schema
  migrations/      — 迁移文件
generated/
  prisma/          — Prisma 自动生成（勿手动修改）
proxy.ts           — Next.js 中间件（JWT 鉴权，路由保护）
```

## 数据模型

| 模型 | 说明 | 关键字段 |
|------|------|----------|
| User | 用户 | username(唯一), password(bcrypt) |
| Music | 音乐 | bvid, cid, pageIndex, title, artist, audioUrl(缓存), audioExpire(2h) |
| Collection | 歌单 | name, isDefault, sortOrder |
| CollectionItem | 歌单-音乐关联 | collectionId, musicId, sortOrder |
| Tag | 标签 | name(唯一), color |
| MusicTag | 音乐-标签关联 | musicId, tagId |

- 主键为 `BigInt`，API 响应中转为 `Number` 或 `string`
- Music 唯一约束: `[bvid, pageIndex]`
- 音频 URL 缓存在 `Music.audioUrl`，2 小时过期

## 代码规范

- 导入别名 `@/*` 指向项目根目录
- API 路由统一加 `export const dynamic = "force-dynamic"`
- API 错误返回 `{ error: string }` + 对应 HTTP 状态码
- BigInt 在 API 响应中序列化为 Number（注意大数溢出风险，当前 ID 范围安全）
- Zustand store 用 `persist` 中间件 + `partialize` 只持久化必要字段
- 页面组件在 `app/` 下，路由组用括号: `(main)`, `(auth)`
- 中文注释

## 鉴权流程

1. 登录: `POST /api/auth/login` → bcrypt 校验 → 签发 JWT → 写入 httpOnly cookie `auth-token`（7 天）
2. 中间件 `proxy.ts`: 公开路径放行（login/register/api/auth/*/api/audio），其余校验 JWT，无效则 401 或重定向 /login
3. API 内可选调用 `getAuthFromCookies()` 获取当前用户

## 音频播放流程

1. 前端 `usePlayerStore.play()` → 设置 `<audio>` src 为 `/api/audio/{id}`
2. API 查 DB 缓存 → 无缓存或过期则调 B 站 `playurl` 接口获取 DASH 音频流 URL
3. 代理请求 B 站音频流，支持 Range 请求（进度跳转）
4. 音频质量优先级: 30250 > 30280 > 30232 > 30216

## 注意事项

- 不要手动修改 `generated/` 目录，由 `prisma generate` 自动生成
- schema 变更后必须执行 `npx prisma migrate dev` + `npx prisma generate`
- `stores/playerStore.ts` 是旧版，活跃版本在 `lib/store/player-store.ts`
- `proxy.ts` 是 Next.js 16 的中间件文件（原 `middleware.ts`）
- B 站 API 请求需带 Referer 和 User-Agent 头，否则可能被拒
- Prisma 7 使用 `prisma-client` generator，输出到 `generated/prisma/`
