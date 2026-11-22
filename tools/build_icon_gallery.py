"""从已托管图标生成 QX 图标库；常用顺序保持稳定。"""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parents[1]
RAW = "https://raw.githubusercontent.com/cnsiming/HappyRule/rules/"
ORDER = [
    ("WgetCloud", "Icon/Custom/WgetCloud.png"),
    ("PineDrama", "Icon/Dashboard/tiktok.png"),
    ("TikTok", "Icon/Dashboard/tiktok.png"),
    ("ChatGPT", "Icon/Dashboard/chatgpt.png"),
    ("Claude", "Icon/Dashboard/anthropic.png"),
    ("Muse / Meta", "Icon/Dashboard/meta.png"),
    ("美国", "Icon/Qure/Color/United_States.png"),
    ("日本", "Icon/Qure/Color/Japan.png"),
    ("香港", "Icon/Qure/Color/Hong_Kong.png"),
    ("韩国", "Icon/Qure/Color/Korea.png"),
    ("台湾", "Icon/Qure/Color/TW.png"),
    ("新加坡", "Icon/Qure/Color/Singapore.png"),
    ("英国", "Icon/Qure/Color/United_Kingdom.png"),
    ("苹果服务", "Icon/Dashboard/apple.png"),
    ("Netflix", "Icon/Dashboard/netflix.png"),
    ("AI", "Icon/Qure/Color/AI.png"),
    ("全球加速", "Icon/Qure/Color/Global.png"),
    ("IPLC", "Icon/Qure/Color/IPLC.png"),
    ("游戏", "Icon/Qure/Color/Game.png"),
    ("港台番剧", "Icon/Qure/Color/HKMTMedia.png"),
    ("国际媒体", "Icon/Qure/mini/GlobalMedia.png"),
    ("Final", "Icon/Qure/Color/Final.png"),
    ("广告净化", "Icon/Dashboard/adblock.png"),
    ("微信", "Icon/Dashboard/wechat.png"),
    ("百度网盘", "Icon/Legacy/ddgksf2013/baiduwangpan.png"),
    ("彩云天气", "Icon/Legacy/ddgksf2013/caiyuntianqi.png"),
    ("闲鱼", "Icon/Legacy/ddgksf2013/xianyu.png"),
    ("小红书", "Icon/Legacy/ddgksf2013/xiaohongshu.png"),
    ("知乎", "Icon/Legacy/ddgksf2013/zhihu.png"),
    ("Quantumult X", "Icon/Qure/Color/Quantumult_X.png"),
]

def main():
    manifest = json.loads((ROOT / "Icon/manifest.json").read_text("utf-8"))
    expected = {entry["path"] for entry in manifest["icons"]}
    actual = {path for _, path in ORDER}
    if actual != expected:
        raise ValueError(f"图标库与清单不一致：缺少 {expected - actual}，多出 {actual - expected}")
    if any(not (ROOT / path).is_file() for path in actual):
        raise ValueError("图标文件缺失")
    gallery = {
        "name": "HappyRule",
        "description": "常用图标优先 · 更新：" + manifest["checked_at_beijing"] + " · " + manifest["gallery_version"],
        "icons": [{"name": f"{index:02d} {name}", "url": RAW + path} for index, (name, path) in enumerate(ORDER, 1)],
    }
    (ROOT / "Icon/gallery.json").write_text(json.dumps(gallery, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"HappyRule 图标库：{len(gallery['icons'])} 个选项，{len(actual)} 张图片")

if __name__ == "__main__":
    main()
