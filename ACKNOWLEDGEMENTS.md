# 致谢与参考（Acknowledgements）

HappyRule 的组织方式借鉴了以下优秀项目，规则内容通过 Vendor/Rewrite/Scripts 同步机制引用上游，版权归原作者所有：

## 规则组织灵感

| 项目 | 借鉴点 |
|---|---|
| [ConnersHua/RuleGo](https://github.com/ConnersHua/RuleGo) | 分类体系（Reject/Extra/Proxy/Direct 分层）、Reject 按厂商分节的注释风格、模块化 sgmodule |
| [ddgksf2013/ddgksf2013](https://github.com/ddgksf2013/ddgksf2013) · [Rewrite](https://github.com/ddgksf2013/Rewrite) | 重写按 App 一文件一清单的组织方式、`@作者` 标注习惯、开屏去广告体系 |
| [Semporia/TikTok-Unlock](https://github.com/Semporia/TikTok-Unlock) | TikTok/抖音改区的重写与分流配套维护方式 |
| [blackmatrix7/ios_rule_script](https://github.com/blackmatrix7/ios_rule_script) | 按服务拆规则清单（AI 按产品拆分的依据之一） |
| [Koolson/Qure](https://github.com/Koolson/Qure) · [Orz-3/Orz-3](https://github.com/Orz-3/Orz-3) | 策略组图标引用规范（img-url 直接用 raw） |
| [KOP-XIAO/QuantumultX](https://github.com/KOP-XIAO/QuantumultX) | resource-parser 资源解析器、流媒体检测脚本 |

## 上游同步来源（自动抓取，每周一同步）

见各清单文件：`Vendor/upstream.txt`、`Rewrite/rewrite.txt`、`Scripts/scripts.txt`。

## 维护原则（吸收各家之长后的本项目约定）

1. **一处维护，多端生成**：只改 `Rules/`（纯域名），`tools/generate.sh` 自动生成 QX/Clash/Surge/SmartDNS/dnsmasq/PassWall 六种格式。
2. **上游不直接引用**：外部列表先同步进 `Vendor/`（自有副本），各端订阅自己的 raw 链接；上游更新由 Actions 每周抓取。
3. **合集不静态维护**：需要合集时用 `tools/dedupe.py` 现场校验，避免快照过期。
4. **私密信息不入库**：订阅链接、私有节点凭据、MITM 证书、个人 IP 只存在本地完整配置（Profile 仓库版已脱敏）。
5. **重写保留来源并记录实际验证范围**；是否启用以最新在用配置为准，不能将历史说明当作当前验证结果。

## 图标副本

本项目图标来源、许可与固定版本见 [Icon/README.md](Icon/README.md) 和 `Icon/manifest.json`；保留 [lige47/lige_icon](https://github.com/lige47/lige_icon)、Dashboard Icons、Koolson/Qure、ddgksf2013/Icon 署名。
