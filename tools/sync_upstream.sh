#!/usr/bin/env bash
# ============================================================
# sync_upstream.sh — 抓取上游外部资源到本仓库（Vendor/Rewrite/Scripts）
# 用法: bash scripts/sync_upstream.sh
# 退出码: 0=全部成功(可能有更新) 1=有失败项
# 机制: raw 直连 → 失败时 GitHub 文件改走 API(raw accept)兜底
#       （raw 被拦/仓库被标记时 API 通常仍可用）
# ============================================================
set -u
cd "$(dirname "$0")/.."

CHANGED=0
FAILED=0
TMP="/tmp/sync.$$"
trap 'rm -f "$TMP"' EXIT

fetch_one() {
    local url="$1" dest="$2"
    if curl -fsSL -m 60 "$url" -o "$TMP" 2>/dev/null; then
        :
    elif [[ "$url" == *raw.githubusercontent.com/* ]]; then
        # GitHub API 兜底：/owner/repo/branch/path → contents API
        local api
        api=$(echo "$url" | sed -E 's#https://raw.githubusercontent.com/([^/]+)/([^/]+)/([^/]+)/(.*)#https://api.github.com/repos/\1/\2/contents/\4?ref=\3#')
        if ! curl -fsSL -m 60 -H "Accept: application/vnd.github.raw" "$api" -o "$TMP" 2>/dev/null; then
            echo "FAILED  $dest  ($url)"
            FAILED=1
            return
        fi
        echo "API-FETCH $dest"
    else
        echo "FAILED  $dest  ($url)"
        FAILED=1
        return
    fi
    # 内容与大小写校验（至少要有实质内容）
    if [ ! -s "$TMP" ]; then
        echo "EMPTY   $dest  ($url)"
        FAILED=1
        return
    fi
    # 内容类型校验：上游可能把 302 后的首页 HTML 当文件返回（如 ddgksf2013.top 旧路径），拒绝落盘
    if head -c 200 "$TMP" | grep -qiE '<!doctype html|<html[ >]'; then
        echo "HTML    $dest  ($url)  上游返回了网页而非规则文件"
        FAILED=1
        return
    fi
    # 落盘前应用 URL 补丁（把上游文件里指向死链的脚本地址改指本仓库自托管副本）
    if [ -f tools/sync-patches.sed ]; then
        sed -i -f tools/sync-patches.sed "$TMP" 2>/dev/null || true
    fi
    if cmp -s "$TMP" "$dest" 2>/dev/null; then
        echo "same    $dest"
    else
        mv "$TMP" "$dest"
        echo "UPDATED $dest"
        CHANGED=1
    fi
}

while read -r dest url; do
    [ -z "${dest:-}" ] && continue
    case "$dest" in \#*) continue;; esac
    mkdir -p "$(dirname "$dest")"
    fetch_one "$url" "$dest"
done < <(grep -hEv '^[[:space:]]*(#|$)' Vendor/upstream.txt Rewrite/rewrite.txt Scripts/scripts.txt 2>/dev/null)

echo "----"
[ "$CHANGED" = 1 ] && echo "RESULT: changed" || echo "RESULT: unchanged"
[ "$FAILED" = 1 ] && echo "RESULT: has failures" && exit 1
exit 0
