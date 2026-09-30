#!/usr/bin/env bash
# ============================================================
# update.sh — 拉取 HappyRule 最新 SmartDNS 格式列表到本地
# 用法：
#   bash scripts/update.sh [目标目录]        默认 ~/HappyRule
# 环境变量：
#   HAPPYRULE_BASE  覆盖仓库 raw 地址（fork 后改成自己的）
# 注：旁路由(ImmortalWrt)由 /etc/smartdns/update-adblock.sh 内置拉取，
#    本脚本面向其他 Linux 设备或手动更新场景。
# ============================================================
set -euo pipefail

BASE="${HAPPYRULE_BASE:-https://raw.githubusercontent.com/cnsiming/HappyRule/rules/dist/smartdns}"
DEST="${1:-$HOME/HappyRule}"
FILES=(ads.conf antitracking.conf)

mkdir -p "$DEST"

for f in "${FILES[@]}"; do
  echo "→ 下载 $f"
  curl -fsSL --retry 3 "$BASE/$f" -o "$DEST/$f"
done

echo "✔ 完成，共 ${#FILES[@]} 个列表，保存在：$DEST"
