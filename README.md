# idea7_supplyline · 补给线

为前线战士做后勤补给。游戏定名 **补给线**（仓库名仍为 `idea7_supplyline`）。

当前可玩营地 ↔ 医院 / 餐厅闭环：造伤送医、占床回血；饿了送餐、占座点餐、货架上菜、吃完回营地。后厨 merge 尚未开放。主体说明见 [doc/main.md](doc/main.md)。

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

开发页默认 http://localhost:5173/idea7_supplyline/ 。存档写在 `localStorage`，键名 **`idea7Supplyline`**。
