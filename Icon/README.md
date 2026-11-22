# 图标

当前 QX 配置使用的图标副本；外链统一指向本项目 `rules/Icon/`。

## HappyRule 图标库

[直接添加到 Quantumult X](https://quantumult.app/x/open-app/ui?module=gallery&type=icon&action=add&content=%5B%22https%3A%2F%2Fraw.githubusercontent.com%2Fcnsiming%2FHappyRule%2Frules%2FIcon%2Fgallery.json%22%5D) · [订阅地址](https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Icon/gallery.json)

手工添加：长按任一策略组 → 图标 → `＋` → 粘贴订阅地址。添加后选择 HappyRule；库内常用图标优先，WgetCloud、PineDrama、TikTok 排在最前，编号保持选项顺序。跨库置顶由 QX 界面控制，订阅本身不能强制。

所有图片为 144×144 PNG；新图按比例居中适配透明画布，保留原有图形。图片未刷新时，清除 QX 图片缓存并重启应用。订阅链接和格式已检查，iPhone 实际添加与显示待验证。

更新图标或清单后运行 `python tools/build_icon_gallery.py`，同时维护常用顺序。格式与直接添加方式依据 [QX 官方说明](https://github.com/crossutility/Quantumult-X/blob/master/url-scheme.md)。

## Dashboard Icons 按需分组（优先）

[按首字母添加分组](DashboardIcons/parts/README.md) · [官方查询页面](https://dashboardicons.com/icons)

每组最多 200 项，按需添加一个组；日常优先使用上方 30 项常用库。不要同时加载全部分组；完整 4,894 项图库仅作备用。首次下载后保留图片缓存，不必为日常选图反复清空。

## Dashboard Icons 完整库（备用）

[添加完整库](https://quantumult.app/x/open-app/ui?module=gallery&type=icon&action=add&content=%5B%22https%3A%2F%2Fraw.githubusercontent.com%2Fcnsiming%2FHappyRule%2Frules%2FIcon%2FDashboardIcons%2Fgallery.json%22%5D) · [订阅地址](https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Icon/DashboardIcons/gallery.json) · [官方查询页面](https://dashboardicons.com/icons)

完整库为上游实际 4,894 张原生 PNG（含明暗变体），全部自托管并适配为 144×144；与上方 HappyRule 常用库分别订阅，详见 [完整库说明](DashboardIcons/README.md)。

图标库建议只添加常用库和当前需要的一个分组，完整库首次加载可能较慢。

## 来源与许可

- [Dashboard Icons](https://github.com/homarr-labs/dashboard-icons)：新图源，最近核对提交为 2026-11-16；Apache-2.0，许可原文见 `LICENSES/`。
- [Koolson/Qure](https://github.com/Koolson/Qure)：地区和通用图标保留原图，按上游要求署名、仅个人非商用；原文声明见 `LICENSES/`。
- [ddgksf2013/Icon](https://github.com/ddgksf2013/Icon)：五项 App 原图留存，保留作者来源；上游未声明统一开源许可证，不纳入 Apache-2.0 授权范围。
- `Custom/WgetCloud.png`：用户指定的机场头像，解码后按比例适配为 144×144 PNG；来源见清单，品牌图形不纳入 Apache-2.0 授权范围。

本次 10 项换新或补齐、19 项原图迁移；Muse 使用 Meta 标识。新图库缺少对应的地区旗帜和部分国内 App，仅保留当前配置实际需要的原图，不收录已替换的旧图。商标与品牌图形归各权利人。对应路径、上游固定版本和校验值见 `manifest.json`。后续更新核对来源与差异，不以仓库活跃等同于每张图都已更新。
