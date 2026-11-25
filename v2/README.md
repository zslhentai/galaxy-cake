# 星河许愿 2.0 · 夜釉星河

[线上预览](https://zslhentai.github.io/galaxy-cake/v2/) · [作品手记](https://zslhentai.github.io/galaxy-cake/v2/notes.html)

根目录保留现有版本。可以在仓库根目录运行 `python3 -m http.server 8080`，再访问 `http://localhost:8080/v2/`。本地预览直接加载已提交的发布包。修改 `src/` 后，在本目录运行 `npm install` 和 `npm run build`。

交互包含点亮、360 度拖动、双指或滚轮缩放、复位、吹蜡烛、祝福与重新点亮。背景音乐从点击开始，沿用项目已有音频。

`?diag=1` 显示帧时间和渲染数据。`?quality=low` 固定低画质上限，`?quality=high` 固定较高画质上限。默认画质会根据持续卡帧调整。`?mode=canvas` 使用 16 个水平角度和两个俯仰层级的图集。

GLB 由 Blender 4.3 生成，经 glTF Transform Meshopt 中级压缩。原始 .blend、程序化绘制与建模脚本、三套样片和验证截图配套提供。网页画面使用原创模型、程序化贴图和开源字体。
