"""为完整图标库生成每组最多 200 项的独立 QX 订阅。"""
from pathlib import Path
from datetime import datetime, timezone, timedelta
from urllib.parse import quote, urlparse, parse_qs
from collections import defaultdict
import json

ROOT = Path(__file__).resolve().parents[1]
RAW = "https://raw.githubusercontent.com/cnsiming/HappyRule/rules/"
LIMIT = 200

def main():
    directory=ROOT/"Icon/DashboardIcons"
    gallery=json.loads((directory/"gallery.json").read_text("utf-8"))
    manifest=json.loads((directory/"manifest.json").read_text("utf-8"))
    groups=defaultdict(list)
    for icon in gallery["icons"]:
        first=icon["name"][0].upper()
        key="0-9" if first.isdigit() else first if "A"<=first<="Z" else "Other"
        groups[key].append(icon)
    folder=directory/"parts"
    folder.mkdir(exist_ok=True)
    records=[]
    all_items=[]
    for key in sorted(groups):
        items=sorted(groups[key],key=lambda x:x["name"].casefold())
        total=(len(items)+LIMIT-1)//LIMIT
        for number,start in enumerate(range(0,len(items),LIMIT),1):
            batch=items[start:start+LIMIT]
            slug=key.lower()+f"-{number:02d}"
            label=key+(f" {number}/{total}" if total>1 else "")
            path="Icon/DashboardIcons/parts/"+slug+".json"
            url=RAW+path
            add="https://quantumult.app/x/open-app/ui?module=gallery&type=icon&action=add&content="+quote(json.dumps([url],separators=(",",":")),safe="")
            query=parse_qs(urlparse(add).query)
            if json.loads(query["content"][0])!=[url] or query["type"]!=["icon"]:
                raise ValueError("添加链接无效")
            part={"name":"Dashboard "+label+" · HappyRule","description":f"按需分组 · {len(batch)} 项 · {batch[0]['name']} 至 {batch[-1]['name']} · 源版本 {manifest['upstream_commit'][:12]}","icons":batch}
            (ROOT/path).write_text(json.dumps(part,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8",newline="")
            records.append({"label":label,"path":path,"url":url,"add_url":add,"count":len(batch),"first":batch[0]["name"],"last":batch[-1]["name"]})
            all_items.extend((x["name"],x["url"]) for x in batch)
    expected={(x["name"],x["url"]) for x in gallery["icons"]}
    if set(all_items)!=expected or len(all_items)!=len(expected):
        raise ValueError("分组覆盖不完整或发生重复")
    expected_paths={Path(record["path"]).name for record in records}|{"index.json"}
    actual_paths={path.name for path in folder.glob("*.json")}
    if actual_paths-expected_paths:
        raise ValueError("存在旧分组文件，请核对后清理："+str(actual_paths-expected_paths))
    index={"name":"Dashboard Icons 按需分组","generated_at_beijing":datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d %H:%M:%S")+" (UTC+8，北京时间)","upstream_commit":manifest["upstream_commit"],"max_items":LIMIT,"total_icons":len(expected),"groups":records}
    (folder/"index.json").write_text(json.dumps(index,ensure_ascii=False,indent=2)+"\n",encoding="utf-8",newline="")
    lines=["# Dashboard Icons 按需分组", "", "当前按用户要求默认使用 Qure；本分组库保留备用，入口见 [图标说明](../../README.md)。需要其他图标时，先在 [官方查询页面](https://dashboardicons.com/icons) 找到名称，再按首字母与名称范围，只添加需要的一个分组。", "", f"共 {len(records)} 组，覆盖全部 {len(expected):,} 项，每组最多 {LIMIT} 项。不必同时添加所有组；原完整库继续保留作备用。分组降低单次列表与图片加载量，手机实际速度仍取决于网络与 QX。", "", "在 QX 中将已添加的完整图库条目移出图标库列表后，改用下列分组；操作对象是图标库列表，不是分流策略或配置文件。首次加载后保留图片缓存，日常无需反复清空缓存。", "", "| 分组 | 名称范围 | 项数 | 添加 / 订阅 |", "|---|---|---:|---|"]
    for record in records:
        lines.append(f"| {record['label']} | {record['first']} — {record['last']} | {record['count']} | [添加]({record['add_url']}) · [订阅]({record['url']}) |")
    (folder/"README.md").write_text("\n".join(lines)+"\n",encoding="utf-8",newline="")
    print(json.dumps({"parts":len(records),"items":len(expected),"max_items":max(r["count"] for r in records)},ensure_ascii=False))

if __name__=="__main__":
    main()
