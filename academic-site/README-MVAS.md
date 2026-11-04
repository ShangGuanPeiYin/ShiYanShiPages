# MVAS Academic 独立版本

基准 source@027c418d56dbdeb57f919ccd2bb7b549a8da2b90，保留上游 LICENSE、SASS 和布局体系。新增 mvas.css 仅中文字体回退、窄屏网格与双语导航宽度适配；默认浅色，可切换深色。

从工作树根运行 `python scripts/academic-migrate.py`，生成242论文、34成员、3项目、3新闻和双语页面。生成文件哈希记录在 migration-generated.json，已有编辑时拒绝覆盖；应先审阅差异，不能直接删清单强行覆盖。源数据在 ../src/content 和 ../src/data，旧站内容不发布。

构建：进入 academic-site，安装 Ruby 3.2+ 与开发头文件，安装 Bundler 2.7.2，运行 `bundle install`；`JEKYLL_ENV=production bundle exec jekyll build --source . --destination _site`。Gemfile.lock 保留原版，禁止自动升级。

本机缺开发头文件，已用 /tmp/mvas-ruby-dev 内解包头文件及临时链接库编译完成；系统 Ruby 未替换。依赖在忽略目录 vendor/bundle，运行构建不再依赖临时头文件。其他机器需安装标准开发环境。

预览：`python -m http.server 4000 --bind 127.0.0.1 --directory _site`。

检查（工作树根）：`python scripts/academic-unit.py`，`python scripts/academic-check.py`；浏览器使用 `PLAYWRIGHT_CHROMIUM_EXECUTABLE=/home/xxs/.cache/ms-playwright/chromium-1234/chrome-linux64/chrome node scripts/academic-qa.cjs`，当前复用原工作树 Playwright。验收脚本环境路径需在其他机器配置。

语言：中文根路径，英文 /en/，语言入口保存选择，直接访问明确语言的链接优先；正文与字段独立回退。论文两份 BibTeX 保留现有译名，未知类型使用 misc 存储，不标为期刊或会议。新闻日期明确显示为来源日期，不假定事件发生时间。

源码随独立分支 `feat/academic-template-mvas` 按用户授权提交并推送到同一 GitHub 仓库；未启用自动部署，不修改旧站发布设置。论文外链未逐一验证；系统中文字体依赖本机安装，跨平台字体外观仍需实际设备复核。
