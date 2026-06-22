# 视觉大改设计 — "Race Bib / Run the World"

**日期**: 2026-06-22
**状态**: 待 review
**目标读者**: 实现这次改版的 Claude / Tianshu

---

## 1. 目标与约束

把 Tianshu's Runlog 从"干净现代"升级为"干净现代 + 运动感 + 视觉冲击力",在不引入框架、不改变部署方式的前提下完成。

**愿景对齐**: 标语 "RUN THE WORLD" —— 这是个记录在**全世界**跑过的美丽路线的日志,不局限墨尔本。首页的世界地图因此从"装饰"升级为叙事核心。

**硬约束**:
- 纯静态站点,HTML + CSS + 原生 JS,无框架、无构建步骤。沿用现有文件结构。
- 全程在 git 分支上开发,满意才合并。可逆性是一等公民(见 §7)。
- 保留菠萝 logo(开屏 `logo-bgremoved.png` + 页眉 `logo.jpg`),保留世界地图,保留速度配色轨迹线,保留双语内容、难度色规则、孤字规避等既有规范。
- 不加 `duration` 字段。章节标题保持蓝色 `#3B70D6`。

**视觉方向**: "Race Bib / 运动编辑部" —— 浅色基底为主,巨型字号 + 等宽字体数据标签,把距离/爬升/难度当英雄数字。详情页头部用深色当"海报封面",往下正文回到浅色。

---

## 2. 设计语言(design tokens)

新增 / 调整 `:root` 变量,集中在 `style.css` 顶部,改动可逆:

```css
:root {
  /* 既有色保留 */
  --accent:  #E85D3F;   /* 珊瑚红，交互/品牌 */
  --muted:   #8E8E93;   /* metadata 灰 */

  /* 新增：编辑部基底 */
  --ink:     #16140F;   /* 近黑，标题/边框/深色头部底 */
  --paper:   #F4F2EC;   /* 暖米白，替换原 --bg #F9F9F7（更有纸感）*/
  --paper-2: #EDEAE0;   /* 次级米白，hover/分隔 */
  --line:    #D6D0C2;   /* 米底上的细分隔线 */

  /* 字体：新增等宽栈用于数据/标签/序号 */
  --font:      -apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC",
               "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  --font-mono: ui-monospace, "SF Mono", "JetBrains Mono", "Roboto Mono", monospace;
}
```

**两类排版语言**:
- **Display / 数据** → 等宽 `--font-mono`,粗、紧字距、大字号。用于:标语、汇总数字、路线公里数、序号 `/01`、标签(KM / M GAIN / EASY)。这是"运动感"的主要来源。
- **正文 / 描述** → 系统 sans `--font`,保持现有可读性。路线描述、亮点、nearby 文案**不变**(仍是 `#3A3A3C` 深灰散文)。

**原则:数据当英雄。** 凡是数字(距离、爬升、计数)一律放大、等宽、紧字距。文字描述保持克制。

---

## 3. 首页重设计(index.html / main.js / style.css)

当前首页结构: `header` → `#map`(世界地图) → `carousel-section`(轮播)。
改版后: `header`(强化) → `hero`(新增) → `#map`(保留) → `carousel-section`(保留,重新套皮)。

### 3.1 页眉 `.header`
- 左:菠萝 logo + `TIANSHU'S RUNLOG`(等宽、字距收紧、大写)。logo 图标保留。
- 右:`Running the world · Est. 2026`(等宽小字,替换原 "N routes")。
- 底部保留 2px `--ink` 实线分隔,替换原半透明细线,增强编辑部硬朗感。

### 3.2 新增英雄区 `.hero`(位于页眉与地图之间)
- 左侧:小标 `↳ Beautiful routes, logged worldwide`(等宽,珊瑚红)+ 巨型标题 `RUN THE WORLD.`,其中一个字母用珊瑚红点睛(如 `W​O​RLD` 的 `O`)。
- 右侧:**四个**汇总数字(等宽、特大),靠右对齐:
  - **Routes** = `ROUTES.length`
  - **KM logged** = `ROUTES` 距离求和(`parseFloat` 各 `distance`,保留一位小数)
  - **Cities** = 去重城市数。从 `location` 派生:按逗号切分取**倒数第二段**(格式 `"Suburb, City, Country"` 或 `"City, Country"` 都取到 City),去重计数。无需新增数据字段。
  - **Countries** = 不同 `country_iso` 的去重数量 —— 复用世界地图高亮逻辑,无需新增字段。
  - 语义:Cities + Countries 与世界地图共同讲"跑遍世界"的故事;现在是 `01 / 01`,随足迹增长。
  - 健壮性注:Cities 派生依赖 `location` 以 `…, City, Country` 结尾。若未来某条 `location` 不符此格式,改为在 data schema 显式加 `city` 字段(本次不做)。

### 3.3 世界地图 `#map`(保留,微调外观)
- Leaflet 配置、CartoDB tiles、国家高亮、红点 hover 卡、点击跳转 —— **逻辑全部不变**。
- 仅外观:加 `--ink` 边框,使其融入编辑部语言。hover 预览卡(`.hover-card`)样式微调以匹配(等宽 metadata),但结构和 JS 不动。

### 3.4 路线轮播 `.carousel-section`(保留,重新套皮)
**决定:保留现有轮播,不换成榜单。** 理由:路线会越攒越多,榜单一长就不再"一眼看尽",反而轮播能在固定高度内承载任意数量;且大封面图是重要视觉资产。

- 结构与 JS 行为(横滑、箭头、进度点、`getVisibleCount`、`slideTo`、newest-first 的 `[...ROUTES].reverse()`)**全部保留**。
- 仅外观重新套新视觉语言:
  - 区头 `Routes` 标签 → 等宽大写、`--ink` 色。
  - 卡片:`--line` 边框、路名收紧字距、地点改等宽大写灰、距离改**等宽粗体**(数据当英雄)、难度徽章沿用 `data-difficulty` 配色。
  - 箭头按钮、进度点:沿用现有交互,配色对齐 `--coral` / `--line`。
- 封面图 `object-fit:cover; object-position:center` 规则不变。

> 即本次改版**不拿掉任何现有功能**,轮播逻辑零改动,仅 CSS 换皮 + 卡片内排版调整,稳定性与可逆性最高。

---

## 4. 路线详情页重设计(route.html / route.js / style.css)

当前结构: `route-header`(sticky) → `#route-map` → `route-meta`(标题) → `stats-bar` → 正文各区块。

改版后: `route-hero--dark`(新增,深色海报头) → `#route-map` → 正文各区块(浅色,**基本不变**)。

### 4.1 深色海报头 `.route-hero` + `.route-hero--dark`
自包含的深色区块,位于页面顶部:
- 返回链接 `← ALL ROUTES`(等宽灰)。
- 地点 `Albert Park · Melbourne · Australia`(等宽大写,珊瑚红暖调 `#FFB9A6`)—— 精确到国家,呼应"全世界"。
- 巨型路名(等宽或粗 sans,紧字距,可换行),一个字母珊瑚红点睛。
- **数据栏**(替换原 `stats-bar`):Distance / Elevation / Difficulty / Logged,等距分栏。难度值在深底上用亮绿 `#5BD18E`(Easy)/亮蓝 / 珊瑚红,保证对比度。
- **返回入口**:`← ALL ROUTES` 作为海报头左上角第一行小字(等宽灰)。**移除**现有独立 sticky `.route-header` 横条 —— 不再保留滚动浮现的精简条(已定方案 A,见 §10.3)。

### 4.2 深色变量(作用域隔离)
所有深色覆盖集中在一个 CSS 块,只作用于 `.route-hero--dark` 内部:

```css
.route-hero--dark {
  --hero-bg:    var(--ink);
  --hero-fg:    var(--paper);
  --hero-loc:   #FFB9A6;
  --hero-line:  #3A362C;
  --hero-easy:  #5BD18E;
  --hero-mod:   #5B9BFF;
  --hero-chal:  var(--accent);
}
```

回退到"全站统一浅色"= 删掉这个块 + 把 class 从 `route-hero--dark` 换成 `route-hero--light`(后者复用 §2 的浅色 token)。详见 §7。

### 4.3 正文(浅色,保留)
描述、vibe、Highlights、Photos、Nearby、速度图例、lightbox —— **结构与 JS 全部不变**,仅随基底色 token(`--bg`→`--paper`)自然微调。章节标题保持蓝色。

---

## 5. 不改动的部分(明确边界)

- 开屏动画 `intro.js` / `intro.css` / `#splash` —— 不动(等宽 + 点阵地球本就与新语言一致)。
- 世界地图 Leaflet 逻辑、国家高亮、红点 hover/click、continent labels —— 不动。
- 速度配色轨迹线、Canvas 渲染、速度图例 —— 不动。
- 详情页地图、start/finish pin、nearby 链接、lightbox、photo grid `:has()` 布局 —— 不动。
- `data.js` schema 与所有数据 —— 不动(本次零数据迁移)。
- `tools/gpx-to-route.js` 加路线工作流 —— 不动。

---

## 6. 维护与稳定性

- **零数据迁移**:不碰 data.js,加路线流程完全不变。
- **新计数自动生效**:Routes / KM / Cities / Countries 全部从 `ROUTES` 派生,加路线自动更新。
- **配色集中**:所有色在 `:root` + 一个深色块,改色只动 token。
- **唯一长期约定**:深色头部的难度色要与浅色版同步维护(改色号时记得两处)。这是接受深色头部的已知代价。

---

## 7. 可逆性保证(硬约束)

三层保险,确保"做完不满意可回到原先浅色统一方案":

1. **分支开发**:全程在 `feature/visual-overhaul` 分支,main 不动。不满意 → `git checkout main`,线上零影响。
2. **浅色基线优先**:先做通"全站浅色统一版"(详情页头部用 `route-hero--light`)并验收,再把深色头部作为**最后一层**叠加(切到 `route-hero--dark`)。浅色版始终是一个完整、可运行、可回退的基线 commit。
3. **深色自包含**:深色仅为一个独立 CSS 块 + 一个 class 名。回退 = 删块 + 换 class,数分钟,不牵动别处。

---

## 8. 改动文件清单

| 文件 | 改动 |
|------|------|
| `style.css` | 新增/调整 tokens;`.header`、新增 `.hero`、`.carousel-*` 重新套皮、`.route-hero` + 深色块;`stats-bar` 并入海报头;移动端适配 |
| `index.html` | 新增 `.hero` 标记;页眉文案;轮播标记保留 |
| `main.js` | 计算并注入 Routes/KM/Cities/Countries;**轮播逻辑零改动**,仅卡片渲染模板内的排版微调;地图逻辑不变 |
| `route.html` | 顶部加 `.route-hero`;`stats-bar` 内容并入海报头 |
| `route.js` | 把 title/location/stats 注入海报头(选择器调整);正文逻辑不变 |
| `CLAUDE.md` | 改版后更新"Homepage layout"段落,使文档与代码一致 |

---

## 9. 范围外(YAGNI)

- 不加 `city` 数据字段(Cities 计数从 `location` 派生,见 §3.2)。
- 不把轮播换成榜单(保留轮播,见 §3.4)。
- 不做暗色模式切换器(详情页头部固定深色,非用户可切)。
- 不引入自定义 display 字体文件(用系统等宽栈,零网络成本、零授权问题)。
- 不重做开屏动画(tbd.md 里"菠萝在地球上跑"是独立的后续项,与本次兼容但不在范围内)。
- 不动 data.js 任何数据。

---

## 10. 决定记录

1. **轮播 vs 榜单** → ✅ **保留轮播**(以后路线多,榜单会过长)。仅换皮,逻辑不动。见 §3.4。
2. **首页汇总数字** → ✅ **Cities + Countries 都要**(共四个:Routes / KM logged / Cities / Countries),均从现有数据派生。见 §3.2。
3. **详情页返回条** → ✅ **A · 并入海报头**。返回链接 `← ALL ROUTES` 作为深色海报头左上角一行小字,**不保留**独立 sticky 横条(移除现有 `.route-header`)。见 §4.1。
