# Dashboard Icons 完整库

优先使用 [按需分组入口](parts/README.md)：每组最多 200 项，按首字母和名称范围选择。原完整订阅保留作备用，含 4,894 项，首次打开可能加载较慢。

Dashboard Icons 原生 PNG 全集，包含明暗变体；本次固定版本共 4,894 项，全部按比例适配为 144×144 透明 PNG。常用库中已有的八张图片直接复用，其余在本目录托管。

[直接添加完整库](https://quantumult.app/x/open-app/ui?module=gallery&type=icon&action=add&content=%5B%22https%3A%2F%2Fraw.githubusercontent.com%2Fcnsiming%2FHappyRule%2Frules%2FIcon%2FDashboardIcons%2Fgallery.json%22%5D) · [订阅地址](https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Icon/DashboardIcons/gallery.json) · [官方图标查询与预览](https://dashboardicons.com/icons)

当前按用户要求默认使用 Qure，见 [图标说明](../README.md)；此完整库保留备用。官网还索引其他供应方的图标，本库仅涵盖 Dashboard Icons 仓库本身的全部 PNG，不将整站搜索结果混入此许可范围。

来源固定版本与逐图校验见 `manifest.json`，遵循 [Apache-2.0](../LICENSES/Dashboard-Icons-Apache-2.0.txt)，品牌商标归原权利人。上游有十个 `.png` 条目实际为 SVG，另有十八张 PNG 完全透明；本库已将前者转换为真实 PNG，并用后者的同名上游 SVG 校正，来源记录保留在清单中。后续更新可在上游检出目标版本后运行 `python tools/build_dashboard_gallery.py --upstream <上游目录>`，需要 Pillow 与 resvg_py，随后自动重新生成按需分组；仅重建分组可执行 `python tools/build_dashboard_parts.py`。核对更新和来源后提交推送。

图片更新后如仍显示旧图，可清除图片缓存；首次加载完成后保留缓存，日常不要反复清空。订阅无法强制跨库置顶；iPhone 实际添加和显示仍需设备验证。
