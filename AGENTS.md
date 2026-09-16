# AGENTS.md

## 大文件存放约定

大文件（大视频、大图片等）一律放腾讯云 COS，页面用外链引用，**不要提交到 Git、不要推送到 GitHub**。

### 判定标准

- 视频：一律放 COS
- 图片：单个文件 **≥ 5 MB** 放 COS；logo、小图标、封面 poster、团队头像等小图继续放仓库

### COS 信息

- 存储桶：`ieeemvasl-1484396763`，地域 `ap-shanghai`
- 访问前缀：`https://ieeemvasl-1484396763.cos.ap-shanghai.myqcloud.com/`
- 权限：对象公有读
- 引用方式：HTTPS 绝对地址，例如
  `https://ieeemvasl-1484396763.cos.ap-shanghai.myqcloud.com/auto_sweeper.mp4`
- 必须用 HTTPS，否则在 Makers 的 HTTPS 页面上会被判为混合内容
- 不要用带签名的临时链接（会过期）

### 新增大文件流程

1. 上传到 COS（按类型放目录，如 `videos/`、`images/`）
2. 设为公有读
3. 页面里用 COS 绝对地址引用
4. 不要 `git add` 大文件

### 当前状态

- 三个视频已迁到 COS：`auto_sweeper.mp4`、`bipedal_robot.mp4`、`marine_navigation.mp4`
- `.gitignore` 已忽略 `videos/`
- `videos/` 本地保留文件，仅作备份

### 为什么

- EdgeOne Makers 单文件上限 25 MB，GitHub 单文件上限 100 MiB
- 大文件进仓库会拖慢 clone 和部署，也容易撞平台限制
- 视频流量走 COS，不占用 Makers / GitHub Pages 的带宽额度
