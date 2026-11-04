# MVAS 实现独立代码审查及修复

日期：2026-11-04。审查者：独立上下文子 agent `implementation_review`，只读审查，不参与实现。依据：根 AGENTS.md、PRD v1.0、SDS v1.2、既有 SDS 审查记录、全部新增源码与数据及本地维护说明。所有修改仍未提交；基线 HEAD 为 53e8923，分支 feat/spacelab-mvas。

审查结论为无 Critical、4 项 Important、2 项 Minor。以下保留发现时问题；修复与回归由主 agent 执行，修复后未再启动第二次独立复核，不把回归测试描述为审查者复核。

| 编号 | 级别 | 发现时行为 | 实际修复 | 回归证据 |
| --- | --- | --- | --- | --- |
| I-01 | Important | 摘要/挑战/方法/成果只按中文字段决定是否生成，英文独有内容被遗漏 | Text 与 ContentField 统一逐字段判断非空、分别选择语言；正文和字段保持独立回退，两语均空不生成空章节 | 隔离副本用审查前模板实际失败于 English-only description；修复后 mixed 浏览器夹具断言英文独有描述/挑战/方法/成果均可见 |
| I-02 | Important | pagehide 清理地图后 BFCache 返回不重建，state仍ready而地图和静态图均不见，星空监听也未恢复 | pagehide 失效并清理，pageshow.persisted 重建地球/恢复星空监听；可重复往返 | Chromium BFCache 回归先失败为地图实例数仍1，修复后实例2且ready，通过 |
| I-03 | Important | 成员 projectIds/publicationIds 未校验，非法ID可生成死链接 | 校验公开目标与草稿状态，错误包含成员slug/字段/ref | review-contracts 单测负例先失败，修复后未知关联被拒绝 |
| I-04 | Important | 产物脚本只枚举顶层 .zh.md，嵌套MD/MDX遗漏兼容白名单及release计数 | 共用递归内容读取，以locale=zh及draft状态确定公开对象 | review-contracts 嵌套MDX单测先失败为2≠3，修复后数量3且兼容页含原ID |
| M-01 | Minor | 任意协议或#可进入新编辑的业务外链 | schema和技术校验共用有效非占位HTTP(S)规则；保留原始HTTP来源，不擅改URL | javascript:负例先失败，修复后被技术校验拒绝；旧链接归一化单测仍通过 |
| M-02 | Minor | 部分无障碍标签固定中文 | nav/brand/静态地球/资源入口标签随界面语言切换 | 英文aria-label回归先失败，修复后通过 |

审查者独立核对 245→242、历史索引78/113中文及英文题名、作者、原新闻日期和既有项目英文内容；独立运行11项无写入单测及check-content通过，并在独立临时端口用地图模块模拟复现 I-02。未修改文件或占用主预览。

主 agent 后续验收另发现三个旧 COS 视频 HEAD/Range GET 均404；保留源URL，不猜测新路径。视频错误时原先只留文字、封面随video隐藏，补充独立封面回退并用失败回归验证。该项不归为审查者发现。

真实 Mapbox Token、目标域名、正式托管、模板复用授权仍未配置/确认。固定依赖安全审计告警未通过擅自升级处理。完整结果见 VALIDATION_spacelab_mvas.md。
