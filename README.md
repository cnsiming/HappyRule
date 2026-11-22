# HappyRule

个人自用规则集，内容在本分支维护。

## 配置与规则

- `Profile/QuantumultX.conf`：用户最新在用 QX 配置的脱敏副本。
- `Rules/`、`Filter/`：分流与过滤源；`dist/` 为自动生成结果。
- `Vendor/`、`Rewrite/`、`Scripts/`：引用资源及同步清单。
- 来源署名见 [ACKNOWLEDGEMENTS.md](ACKNOWLEDGEMENTS.md)。

## 版本维护

以用户提供的最新在用版为准更新云端。本地交付保留完整凭据，GitHub 仅保存脱敏副本；仓库模板不能直接覆盖在用配置。

配置头部保留项目主页和脱敏 `.conf` 下载直链，供应急恢复。下载后须在本地补回订阅、私有节点参数和 MITM 证书等信息，按需恢复个人固定 IP 规则。

每次配置修改更新头部北京时间（UTC+8）、同步版本、变更摘要与验证状态；检查相关说明，提交推送后重新读取云端核对。

本次同步新增 PineDrama 独立策略组（美国手选优先、美国优选手动备选）及精确域名规则。已做静态核对，App API/CDN 覆盖与 iPhone 播放效果待实测。

## 资源维护

源规则变更后执行 `python3 tools/dedupe.py`，由 Actions 按触发范围生成 `dist/`；QX 模板或说明变更不会自动重建 `dist/`。

上游同步按工作流每周运行，也可手动触发；配置中的资源按各自设置刷新。
