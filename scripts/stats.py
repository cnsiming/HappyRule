#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
stats.py — 统计 Rules/ 与 Filter/ 下各 .list 规则数量（按类型分组）
用法：在仓库根目录运行  python3 scripts/stats.py
兼容 Quantumult X 风格（DOMAIN-SUFFIX,example.com）与纯域名两种格式。
（2026-10-01 自旧仓库 ProxyRules 迁移并适配）
"""
import glob
from collections import Counter

COMMENT_PREFIXES = ("#", ";", "//", "!")


def main() -> int:
    files = sorted(glob.glob("Rules/**/*.list", recursive=True)
                   + glob.glob("Filter/*.list"))
    if not files:
        print("未找到任何 .list 文件，请在仓库根目录运行")
        return 1

    grand = 0
    for path in files:
        counter = Counter()
        with open(path, encoding="utf-8") as f:
            for raw in f:
                line = raw.strip()
                if not line or line.startswith(COMMENT_PREFIXES):
                    continue
                rtype = line.split(",", 1)[0].strip().upper() if "," in line else "DOMAIN-SUFFIX"
                counter[rtype] += 1
        total = sum(counter.values())
        grand += total
        detail = "，".join(f"{k} × {v}" for k, v in counter.most_common())
        print(f"{path:<30} 共 {total:>3} 条  |  {detail}")

    print("-" * 60)
    print(f"{'合计':<30} 共 {grand:>3} 条")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
