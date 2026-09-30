#!/usr/bin/env bash
# ============================================================
# generate.sh — 以 Rules/ + Filter/（纯域名源）与 Vendor/（上游副本）为源，
# 自动生成多平台格式的 dist/：
#   dist/qx/       Quantumult X  (Filter→reject; Rules→DIRECT占位; Vendor→原文)
#   dist/clash/    Clash Verge   (payload yaml)
#   dist/surge/    Surge         (RULE-SET 格式)
#   dist/smartdns/ OpenWrt SmartDNS (仅 Filter)
#   dist/dnsmasq/  OpenWrt dnsmasq (仅 Filter)
#   dist/passwall/ PassWall 分流域名列表 (仅 Rules, domain: 格式)
# 用法: bash scripts/generate.sh
# ============================================================
set -euo pipefail
cd "$(dirname "$0")/.."

RAW="https://raw.githubusercontent.com/cnsiming/HappyRule/rules"
D=dist
rm -rf "$D"
mkdir -p "$D/qx/Vendor" "$D/clash/Vendor" "$D/surge/Vendor" \
         "$D/smartdns" "$D/dnsmasq" "$D/passwall"

domains_of() {  # 提取纯域名清单（去注释空行、去首尾空白）
    grep -vE '^[[:space:]]*(#|$)' "$1" | sed 's/^[[:space:]]*//;s/[[:space:]]*$//'
}

echo "== Filter（拦截类） =="
for f in Filter/*.list; do
    name=$(basename "$f" .list)
    lower=$(echo "$name" | tr 'A-Z' 'a-z')
    tmp=$(mktemp); domains_of "$f" > "$tmp"
    [ -s "$tmp" ] || { rm -f "$tmp"; continue; }
    { echo "# $RAW/$D/qx/$name.list  (自动生成, 源: $f)"; sed 's|^\(.*\)$|HOST-SUFFIX,\1,reject|' "$tmp"; } > "$D/qx/$name.list"
    { echo "# $RAW/$D/clash/$name.yaml  (自动生成, 源: $f)"; echo "payload:"; sed 's|^\(.*\)$|  - DOMAIN-SUFFIX,\1|' "$tmp"; } > "$D/clash/$name.yaml"
    { echo "# $RAW/$D/surge/$name.list  (自动生成, 源: $f)"; sed 's|^\(.*\)$|DOMAIN-SUFFIX,\1|' "$tmp"; } > "$D/surge/$name.list"
    { sed 's|^\(.*\)$|address /\1/#|' "$tmp"; } > "$D/smartdns/$lower.conf"
    { sed 's|^\(.*\)$|address=/\1/#|' "$tmp"; } > "$D/dnsmasq/$lower.conf"
    rm -f "$tmp"
    echo "  $name"
done

echo "== Rules（分流类） =="
for f in Rules/*.list Rules/*/*.list; do
    [ -f "$f" ] || continue
    rel=${f#Rules/}; name=$(basename "$f" .list); sub=$(dirname "$rel")
    tmp=$(mktemp); domains_of "$f" > "$tmp"
    [ -s "$tmp" ] || { rm -f "$tmp"; continue; }
    mkdir -p "$D/qx/$sub" "$D/clash/$sub" "$D/surge/$sub" "$D/passwall/$sub"
    { echo "# $RAW/$D/qx/$rel  (自动生成, 源: $f)"
      echo "# 行尾 DIRECT 为占位策略，替换为你的策略组名"
      sed 's|^\(.*\)$|HOST-SUFFIX,\1,DIRECT|' "$tmp"; } > "$D/qx/$rel"
    { echo "# $RAW/$D/clash/$sub/$name.yaml  (自动生成, 源: $f)"; echo "payload:"; sed 's|^\(.*\)$|  - DOMAIN-SUFFIX,\1|' "$tmp"; } > "$D/clash/$sub/$name.yaml"
    { echo "# $RAW/$D/surge/$sub/$name.list  (自动生成, 源: $f)"; sed 's|^\(.*\)$|DOMAIN-SUFFIX,\1|' "$tmp"; } > "$D/surge/$sub/$name.list"
    { echo "# $RAW/$D/passwall/$sub/$name.txt  (自动生成, 源: $f; 粘到 PassWall 分流规则域名列表)"
      sed 's|^\(.*\)$|domain:\1|' "$tmp"; } > "$D/passwall/$sub/$name.txt"
    rm -f "$tmp"
    echo "  $rel"
done

echo "== Vendor（上游副本转换） =="
# 上游格式不一：Surge 系(DOMAIN-*) 与 QX 系(HOST-*)，统一互转；
# QX 系上游列表行尾常带策略名第三字段（如 ,TikTok），一律剥掉——策略在引用处(force-policy/RULE-SET)指定
strip_policy() {
    awk -F, '{ if ($1 ~ /^(HOST|HOST-SUFFIX|HOST-KEYWORD|DOMAIN|DOMAIN-SUFFIX|DOMAIN-KEYWORD)$/) print $1","$2; else print }'
}
conv_qx() {    # 任意 → QX 风格
    strip_policy | sed -E 's/^DOMAIN-SUFFIX,/HOST-SUFFIX,/; s/^DOMAIN,/HOST,/; s/^DOMAIN-KEYWORD,/HOST-KEYWORD,/'
}
conv_surge() { # 任意 → Surge/Clash 风格
    strip_policy | sed -E 's/^HOST-SUFFIX,/DOMAIN-SUFFIX,/; s/^HOST,/DOMAIN,/; s/^HOST-KEYWORD,/DOMAIN-KEYWORD,/'
}
for f in Vendor/*.list; do
    name=$(basename "$f" .list)
    { echo "# $RAW/$D/qx/Vendor/$name.list  (自动生成, 源: Vendor/$name.list)"
      conv_qx < "$f"; } > "$D/qx/Vendor/$name.list"
    { echo "# $RAW/$D/surge/Vendor/$name.list  (自动生成, 源: Vendor/$name.list)"
      conv_surge < "$f"; } > "$D/surge/Vendor/$name.list"
    { echo "# $RAW/$D/clash/Vendor/$name.yaml  (自动生成, 源: Vendor/$name.list; 仅域名/IP类规则)"
      echo "payload:"
      ( conv_surge < "$f" | grep -E '^(DOMAIN|DOMAIN-SUFFIX|DOMAIN-KEYWORD|IP-CIDR),' | sed 's|^|  - |' ) || true
    } > "$D/clash/Vendor/$name.yaml"
    echo "  $name"
done

echo "== 完成 =="
