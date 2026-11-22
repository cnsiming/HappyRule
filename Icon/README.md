# 图标

HappyRule 常用库合并离歌 17 项图标，保留 12 项现有图片，共 29 项。当前配置与图库使用同一批固定版本图片。

## 添加到 Quantumult X

- [HappyRule 常用策略图标库 JSON](https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Icon/gallery.json)
- [Qure Color JSON](https://raw.githubusercontent.com/Koolson/Qure/master/Other/QureColor.json)：保留的地区及通用图标。
- [Qure mini JSON](https://raw.githubusercontent.com/Koolson/Qure/master/Other/Quremini.json)：节点订阅使用，WgetCloud 订阅保持此来源。

长按策略或订阅 → 图标 → `＋` → 粘贴对应 JSON 地址。HappyRule 用于彩色策略图标；带实底的图片不要用于 PROXY 单色槽。常用项目排在本库前面，订阅不能强制跨库置顶。

## 本次合并

| 处理 | 图标 |
| --- | --- |
| 离歌替换 17 项 | WgetCloud、TikTok/PineDrama、ChatGPT、Claude、Muse、Apple、Netflix、全球加速、游戏、广告净化、微信、百度网盘、彩云天气、闲鱼、小红书、知乎、Quantumult X |
| 保留 12 项 | 美/日/港/韩/台/新/英地区图标，以及 AI、IPLC、港台番剧、国际媒体、Final |

按实际外观与用途匹配，不只按文件名匹配。地区图标保留用户已可用的 Qure；没有准确替代项时保留原图。AI-Claude、AI-Muse 不再共用通用 AI 图标。

新收录图片为 144×144 RGBA PNG，按比例适配；图库图片地址固定到本项目图像提交，避免旧地址缓存。已检查下载、格式、非空透明通道、清单与配置的一致性；iPhone 图库预览、策略显示仍待用户确认，不能以静态检查代替实机验收。

更新时先提交图片，设置 `Icon/manifest.json` 的 `image_ref`，再运行 `python tools/build_icon_gallery.py`。生成器核对固定提交内图片与清单一致。图标库格式参考 [QX 官方示例](https://github.com/crossutility/Quantumult-X/blob/master/icon-gallery.json)。

## Dashboard Icons（独立备用）

- [按需分组](DashboardIcons/parts/README.md)：每组最多 200 项，按需添加一个组。
- [完整库 JSON](https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Icon/DashboardIcons/gallery.json)：4,894 项，首次加载较慢，不建议日常打开整套。
- [官方查询页面](https://dashboardicons.com/icons) · [完整库说明](DashboardIcons/README.md)

## 来源与许可

- [lige47/lige_icon](https://github.com/lige47/lige_icon)：本次引用 17 张图片，固定版本及校验值见 `Lige/manifest.json`；按作者要求署名，上游未声明统一开源许可证，见 `LICENSES/Lige-NOTICE.md`。
- [Koolson/Qure](https://github.com/Koolson/Qure)：保留地区与通用图标，按作者要求署名、仅个人非商用；声明见 `LICENSES/Qure-NOTICE.md`。
- [Dashboard Icons](https://github.com/homarr-labs/dashboard-icons)：完整备用库，Apache-2.0，许可见 `LICENSES/`。
- [ddgksf2013/Icon](https://github.com/ddgksf2013/Icon)：旧 App 图标留作历史副本；未声明统一开源许可证。
- `Custom/WgetCloud.png`：用户指定的旧机场头像留档；当前常用库和策略改用离歌副本。

品牌图形归各权利人，不统一套用 Dashboard Icons 的 Apache-2.0 许可。本次不复制整套离歌图库，也不改变分流、节点筛选和重写开关。
