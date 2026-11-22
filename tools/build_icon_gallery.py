"""从已托管图标生成 QX 图标库；常用顺序保持稳定。"""
from pathlib import Path
import json, re, subprocess

ROOT = Path(__file__).resolve().parents[1]
RAW_BASE = "https://raw.githubusercontent.com/cnsiming/HappyRule/"
ORDER = [
    ("WgetCloud", "Icon/Lige/wgetcloud.png"),
    ("TikTok / PineDrama", "Icon/Lige/tiktok.png"),
    ("ChatGPT / OpenAI", "Icon/Lige/chatGPT-green.png"),
    ("Claude", "Icon/Lige/claude(1).png"),
    ("Muse / Meta", "Icon/Lige/Muse.png"),
    ("美国", "Icon/Qure/Color/United_States.png"),
    ("日本", "Icon/Qure/Color/Japan.png"),
    ("香港", "Icon/Qure/Color/Hong_Kong.png"),
    ("韩国", "Icon/Qure/Color/Korea.png"),
    ("台湾", "Icon/Qure/Color/TW.png"),
    ("新加坡", "Icon/Qure/Color/Singapore.png"),
    ("英国", "Icon/Qure/Color/United_Kingdom.png"),
    ("苹果服务", "Icon/Lige/apple.png"),
    ("Netflix", "Icon/Lige/netflix(red).png"),
    ("AI", "Icon/Qure/Color/AI.png"),
    ("全球加速", "Icon/Lige/quanqiu.png"),
    ("IPLC", "Icon/Qure/Color/IPLC.png"),
    ("游戏", "Icon/Lige/game.png"),
    ("港台番剧", "Icon/Qure/Color/HKMTMedia.png"),
    ("国际媒体", "Icon/Qure/mini/GlobalMedia.png"),
    ("Final", "Icon/Qure/Color/Final.png"),
    ("广告净化", "Icon/Lige/ad.png"),
    ("微信", "Icon/Lige/wechat.png"),
    ("百度网盘", "Icon/Lige/baidunetdisk.png"),
    ("彩云天气", "Icon/Lige/caiyuntianqi.png"),
    ("闲鱼", "Icon/Lige/xianyu.png"),
    ("小红书", "Icon/Lige/xiaohongshu.png"),
    ("知乎", "Icon/Lige/zhihu.png"),
    ("Quantumult X", "Icon/Lige/quanx.png"),
]

def main():
    manifest = json.loads((ROOT / "Icon/manifest.json").read_text("utf-8"))
    image_ref=manifest["image_ref"]
    if not re.fullmatch(r"[0-9a-f]{40}",image_ref):
        raise ValueError("图像引用必须为固定提交 SHA")
    entries={}
    for line in subprocess.check_output(["git","ls-tree","-rz",image_ref],cwd=ROOT).split(b"\0"):
        if line:
            meta,path=line.split(b"\t",1)
            entries[path.decode("utf-8")]=meta.decode().split()[2]
    for item in manifest["icons"]:
        if entries.get(item["path"])!=item["git_blob"]:
            raise ValueError("固定提交不包含当前图标："+item["path"])
    raw=RAW_BASE+image_ref+"/"
    expected = {entry["path"] for entry in manifest["icons"]}
    actual = {path for _, path in ORDER}
    if actual != expected:
        raise ValueError(f"图标库与清单不一致：缺少 {expected - actual}，多出 {actual - expected}")
    if any(not (ROOT / path).is_file() for path in actual):
        raise ValueError("图标文件缺失")
    gallery = {
        "name": "HappyRule Color（策略图标）",
        "description": "彩色策略专用；节点订阅请使用 Qure mini。更新：" + manifest["checked_at_beijing"] + " · " + manifest["gallery_version"],
        "icons": [{"name": f"{index:02d} {name}", "url": raw + path} for index, (name, path) in enumerate(ORDER, 1)],
    }
    (ROOT / "Icon/gallery.json").write_text(json.dumps(gallery, ensure_ascii=False, indent=2) + "\n", encoding="utf-8", newline="")
    print(f"HappyRule 图标库：{len(gallery['icons'])} 个选项，{len(actual)} 张图片")

if __name__ == "__main__":
    main()
