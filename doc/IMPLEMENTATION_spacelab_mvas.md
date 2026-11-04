# MVAS SpaceLab 实施与本地维护

实现依据为 PRD v1.0、SDS v1.2；仅在 `feat/spacelab-mvas` 构建。2026-11-04 用户已授权提交和推送该独立分支，正式部署仍未执行。原始 `data/`、`htmls/` 和根 HTML 仍作为迁移依据保留，实际发布对象只能是 `dist/`，不能把仓库根目录直接当新版站点。

## 工程与内容

- Node.js **22.23.2**、npm **10.9.8**；Astro **6.1.9**、MDX **5.0.4**、Mapbox GL **3.23.0** 精确锁定。新增检查工具见锁文件，不运行 `npm update` 或 `npm audit fix`。
- `src/content/<集合>/<id>.zh.md` 为主记录，`.en.md` 为可选译文。frontmatter 可用 YAML 或 JSON，正文为 Markdown/MDX。字段独立选择语言，英文只有标题不代表正文已翻译；缺译正文保留中文并说明。
- 中文主记录 `draft: true` 排除整个对象，英文草稿仅排除译文。旧资料均公开迁入，无整批审核前置条件。
- `src/data/team.json`、`site.json`、`join.json`、`tags.json` 分别维护成员、品牌、招募和稳定标签。FAQ 暂由 join.json 的 faqs 维护。方向可在 directions 中补充 question/projectIds/suggestedBackgrounds/materials，未知 direction 不进入邮件主题。
- 3 项目、34 成员、3 新闻、242 论文；来源清单 `migration-manifest.json` 覆盖全部 245 论文输入，3 条合并可追溯。244 条历史记录缺类型，保持未分类；只保留真实年份；新闻旧日期显示“日期”，不冒称发布日期。
- 一次性迁移命令默认 dry-run；显式写入 `node scripts/migrate.mjs --write`。重复执行仅允许内容完全一致，发现目标已编辑即拒绝覆盖。后续日常维护直接编辑新内容，不重新迁移覆盖。
- 博客、资源、FAQ、研究方向专项说明和地球活动足迹目前为空，未导入示例内容。独立论文项目展示能力由 paperSites 集合和 `/paper-sites/<id>/` 提供，当前没有虚构对象。
- 2026-11-04 用户决定目前不用 COS 视频：新版三个项目只展示已有封面和研究文字，迁移器不输出项目 video 字段，页面不发起这些 COS 视频请求。原始 data/ 中的旧链接保留作为历史来源；未将本地视频改存到仓库。小图仍迁入 public/assets/legacy，单图 ≥5 MB 的既有 COS 规则保持。

## 本地运行

```bash
nvm use 22.23.2
npm ci
npx playwright install chromium
npm run check
npm run test:unit
npm run test:fixtures
PUBLIC_SITE_URL=http://127.0.0.1:4321 PUBLIC_BASE_PATH=/ PUBLIC_RELEASE_SHA=local npm run build
npm run check:dist
npm run preview -- --host 127.0.0.1 --port 4321
```

预览地址 `http://127.0.0.1:4321/`。开发时可替换最后一步为 `npm run dev -- --host 127.0.0.1 --port 4321`，不要同时占用相同端口。项目使用 Playwright Chromium 验收；常规环境先执行 `npx playwright install chromium`，再执行 `npm run test:e2e -- --project chromium`。本机使用已有浏览器时显式设置：

```bash
PLAYWRIGHT_CHROMIUM_EXECUTABLE=/home/xxs/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome npm run test:e2e -- --project chromium
```

playwright.config.ts 不固定本机路径，只有显式环境变量才覆盖默认浏览器。

## 地球与配置

`PUBLIC_MAPBOX_TOKEN` 为空时立即显示品牌静态地球与降级说明，其他内容可浏览。有公开受限 Token 才按需加载地图。初始 `[0,20]`、zoom 1.5、globe 投影、官方 satellite-streets-v12 样式。初始化超时 **12 秒**，地点搜索超时 **8 秒**；世代标识使旧回调无效，手动重试重建实例。缩放档位 **10/12/13/16/19**，显示名称不承诺真实距离。系统减少动态效果或手机时停止自动旋转，后台与离开释放资源。

`PUBLIC_SITE_URL` 为 origin，`PUBLIC_BASE_PATH` 为真实子路径，所有规范路径与静态资产按此构建；`release.json` 保存源、模板与内容计数。当前 sourceSHA=local 表示未提交的本地实现，不能当正式提交 SHA。不填写假域名或 Token，不创建第二个 GitHub Pages 站点、不修改旧站配置。正式发布必须选择隔离承载目标，并确认模板及附带资源复用授权。

## 验证边界

实际测试结果、独立审查与未验证事项记录于 `doc/VALIDATION_spacelab_mvas.md` 和 `logs/codex_changes.md`。空集合与混合译文夹具在 `/tmp` 的隔离副本构建，不会公开到正式内容。固定依赖的 npm audit 告警如实保留，升级需要单独授权，不因本地构建成功宣称已解决。
