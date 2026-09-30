#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
dedupe.py — 检查 Rules/ 与 Filter/ 下各 .list 规则文件的重复项
用法：在仓库根目录运行  python3 scripts/dedupe.py
- 文件内重复：同一文件里同一域名出现多次
- 跨文件重复：同一域名出现在多个列表中
兼容两种格式：
  - Quantumult X 风格:  DOMAIN-SUFFIX,example.com
  - HappyRule 纯域名:   example.com（视为 DOMAIN-SUFFIX）
发现任何问题退出码为 1，可用于提交前检查 / CI。
（2026-10-01 自旧仓库 ProxyRules 迁移并适配）
"""
import glob
import sys
from collections import defaultdict

COMMENT_PREFIXES = ("#", ";", "//", "!")


def parse_line(line: str):
    """返回 (类型, 域名)；纯域名行视为 DOMAIN-SUFFIX。"""
    line = line.strip()
    if "," in line:
        rtype, domain = line.split(",", 1)
        return rtype.strip().upper(), domain.strip().lower()
    return "DOMAIN-SUFFIX", line.lower()


def read_rules(path: str):
    rules = []
    with open(path, encoding="utf-8") as f:
        for lineno, raw in enumerate(f, 1):
            line = raw.strip()
            if not line or line.startswith(COMMENT_PREFIXES):
                continue
            rules.append((lineno, parse_line(line)))
    return rules


def main() -> int:
    files = sorted(glob.glob("Rules/**/*.list", recursive=True)
                   + glob.glob("Filter/*.list"))
    if not files:
        print("未找到任何 .list 文件，请在仓库根目录运行")
        return 1

    problems = 0
    domain_map = defaultdict(list)

    for path in files:
        seen = {}
        for lineno, (rtype, domain) in read_rules(path):
            if domain in seen:
                print(f"[文件内重复] {path}:{lineno} 与 {path}:{seen[domain]} → {domain}")
                problems += 1
            else:
                seen[domain] = lineno
            domain_map[domain].append((path, lineno))

    for domain, where in sorted(domain_map.items()):
        files_hit = {p for p, _ in where}
        if len(files_hit) > 1:
            locs = ", ".join(f"{p}:{n}" for p, n in where)
            print(f"[跨文件重复] {domain} 出现在多处 → {locs}")
            problems += 1

    if problems:
        print(f"\n共发现 {problems} 个问题，请修复后再提交。")
        return 1
    total = sum(len(read_rules(f)) for f in files)
    print(f"✔ 检查通过：{len(files)} 个文件，共 {total} 条规则，无重复。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
