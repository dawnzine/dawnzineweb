# 独箴文化 Dawn Zine Studio 官网

极简艺术风静态官网，7 个核心页面，纯 HTML / CSS / JavaScript，无需构建。

## 本地预览

在项目目录执行：

```bash
cd "/Users/DawnZineStudio/Desktop/Dawnzine Web"
python3 -m http.server 8080
```

浏览器打开：http://localhost:8080

> 案例页需通过本地服务器访问以加载 `data/works.json`。直接双击 `index.html` 可浏览首页与其余静态页。

## 页面结构

| 文件 | 说明 |
|------|------|
| `index.html` | 首页（全屏照片首屏、三箴、业务、案例横滑、数据、客户条） |
| `about.html` | 箴心初照 · 关于我们 |
| `services.html` | 箴行致远 · 业务服务 |
| `works.html` | 箴选案例（筛选 + 弹窗） |
| `clients.html` | 箴构万象 · 合作客户 |
| `team.html` | 箴材合曜 · 核心团队 |
| `contact.html` | 联系合作（mailto） |

## 替换素材

将成片与 Logo 放入 `assets/` 对应路径，保持文件名一致即可，无需改代码：

- `assets/images/hero-poster.png`（或 `hero.jpg`）— 首页全屏背景照片，替换此文件即可
- `assets/images/cases/*.jpg` — 案例封面（在 `data/works.json` 中更新路径）
- `assets/logos/*.png` — 客户 Logo
- `assets/images/team/*.jpg` — 团队成员肖像

旧版单页备份：`index.legacy.html`
