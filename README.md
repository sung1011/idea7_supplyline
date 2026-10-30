# idea7_supplyline · 补给线

为前线战士做后勤补给。游戏定名 **补给线**（仓库名仍为 `idea7_supplyline`）。

当前可玩营地 ↔ 医院 / 餐厅闭环：造伤送医、占床回血；饿了送餐、占座点餐、货架上菜、吃完回营地。餐厅页内后厨可两两 merge、做成菜进货架、按厨师偏好加权。界面为皇室战争极卡通：纯 CSS + 内联 SVG，无外链立绘。主体说明见 [doc/main.md](doc/main.md)。

## 在线预览（GitHub Pages）

地址：https://sung1011.github.io/idea7_supplyline/

推到 `main` 后，GitHub Actions 会自动构建并发布。

## 安装

```bash
npm install
```

## 命令

```bash
npm run dev
npm run build
npm test
```

开发页默认 http://localhost:5173/idea7_supplyline/ 。存档写在 `localStorage`，键名 **`idea7Supplyline`**。右上角齿轮打开设置（统计 / 常规 / 版本 / GM）。音乐音效 prefs 键 **`idea7SupplylineSettings`**，初始化存档不会删它。
