"""将 Dashboard Icons 的全部 PNG 条目转为 QX 图标库。需要 Pillow、resvg_py。"""
from pathlib import Path
from datetime import datetime, timezone, timedelta
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps
from urllib.parse import quote
import argparse, hashlib, io, json, subprocess

ROOT = Path(__file__).resolve().parents[1]
RAW = "https://raw.githubusercontent.com/cnsiming/HappyRule/rules/"

def render_svg(data):
    import re
    import xml.etree.ElementTree as ET
    import resvg_py
    root=ET.fromstring(data)
    namespace="http://www.w3.org/2000/svg"
    if any(node.tag.split("}")[-1]=="foreignObject" for node in root.iter()):
        nested=[node for node in root.iter() if node is not root and node.tag=="{"+namespace+"}svg"]
        if len(nested)!=1:
            raise ValueError("无法明确提取 foreignObject 中的矢量图")
        root=nested[0]
    for node in root.iter():
        if "href" in node.attrib:
            node.set("{http://www.w3.org/1999/xlink}href",node.attrib["href"])
    media_rules=[]
    for node in root.iter():
        if node.tag.split("}")[-1]=="style" and node.text:
            for minimum,maximum,rule in re.findall(r"@media\s*\(min-width:(\d+)px\)(?:\s*and\s*\(max-width:(\d+)px\))?\s*\{([^{}]+\{[^{}]+\})\}",node.text):
                if int(minimum)<=144 and (not maximum or 144<=int(maximum)):
                    media_rules.append(rule)
    if media_rules:
        ET.SubElement(root,"{"+namespace+"}style").text=" ".join(media_rules)
    return resvg_py.svg_to_bytes(svg_string=ET.tostring(root,encoding="unicode"),width=144,dpi=96)

def build(upstream):
    commit = subprocess.check_output(["git", "rev-parse", "HEAD"], cwd=upstream, text=True).strip()
    tree = subprocess.check_output(["git", "ls-tree", "-rz", "HEAD", "png"], cwd=upstream)
    sources = []
    for line in tree.split(b"\0"):
        if not line:
            continue
        meta, name = line.split(b"\t", 1)
        name = name.decode("utf-8")
        if name.endswith(".png"):
            sources.append((name, meta.decode().split()[2]))
    if not sources:
        raise ValueError("上游没有受 Git 跟踪的 PNG")
    def render(item):
        name, source_sha = item
        original = (upstream / name).read_bytes()
        if hashlib.sha1(f"blob {len(original)}\0".encode()+original).hexdigest() != source_sha:
            original=subprocess.check_output(["git","show","HEAD:"+name],cwd=upstream)
            if hashlib.sha1(f"blob {len(original)}\0".encode()+original).hexdigest()!=source_sha:
                raise ValueError("上游文件与固定提交不一致："+name)
        raster=original
        if not original.startswith(b"\x89PNG\r\n\x1a\n") and b"<svg" in original[:1024]:
            import resvg_py
            raster=render_svg(original)
        with Image.open(io.BytesIO(raster)) as image:
            rgba=image.convert("RGBA")
        corrected_svg=None
        if rgba.getbbox() is None:
            import resvg_py
            svg_path="svg/"+Path(name).stem+".svg"
            svg=subprocess.check_output(["git","show","HEAD:"+svg_path],cwd=upstream)
            corrected_svg={"path":svg_path,"blob":hashlib.sha1(f"blob {len(svg)}\0".encode()+svg).hexdigest()}
            rgba=Image.open(io.BytesIO(render_svg(svg))).convert("RGBA")
            if rgba.getbbox() is None:
                raise ValueError("上游 PNG 与同名 SVG 均无法生成有效图片："+name)
        fitted = ImageOps.contain(rgba,(144,144),Image.Resampling.LANCZOS)
        canvas = Image.new("RGBA",(144,144),(0,0,0,0))
        canvas.paste(fitted,((144-fitted.width)//2,(144-fitted.height)//2))
        buffer=io.BytesIO()
        canvas.save(buffer,format="PNG",optimize=True)
        data=buffer.getvalue()
        filename=Path(name).name
        existing=ROOT/"Icon/Dashboard"/filename
        if existing.is_file():
            if existing.read_bytes()!=data:
                raise ValueError("常用图与整套渲染不一致："+filename)
            target=existing
        else:
            target=ROOT/"Icon/DashboardIcons/png"/filename
            target.parent.mkdir(parents=True,exist_ok=True)
            target.write_bytes(data)
        path=target.relative_to(ROOT).as_posix()
        with Image.open(io.BytesIO(data)) as verify:
            if verify.size!=(144,144) or verify.format!="PNG":
                raise ValueError("适配图格式错误："+name)
            verify.verify()
        result={"name":Path(name).stem,"path":path,"source_blob":source_sha,"git_blob":hashlib.sha1(f"blob {len(data)}\0".encode()+data).hexdigest(),"sha256":hashlib.sha256(data).hexdigest()}
        if corrected_svg:
            result["corrected_from_same_name_svg"]=corrected_svg
        return result
    with ThreadPoolExecutor(max_workers=8) as pool:
        icons=list(pool.map(render,sources))
    icons.sort(key=lambda x:x["name"].casefold())
    checked=datetime.now(timezone(timedelta(hours=8))).strftime("%Y-%m-%d %H:%M:%S")+" (UTC+8，北京时间)"
    folder=ROOT/"Icon/DashboardIcons"
    gallery={"name":"Dashboard Icons · HappyRule","description":f"Dashboard Icons 原生 PNG 全集 · {len(icons)} 项（含明暗变体）· 144×144 · 更新：{checked}","icons":[{"name":x["name"],"url":RAW+quote(x["path"],safe="/")} for x in icons]}
    manifest={"upstream":"https://github.com/homarr-labs/dashboard-icons","upstream_commit":commit,"checked_at_beijing":checked,"count":len(icons),"format":"144x144 RGBA PNG; contain; transparent canvas","license":"../LICENSES/Dashboard-Icons-Apache-2.0.txt","query_url":"https://dashboardicons.com/icons","icons":icons}
    (folder/"gallery.json").write_text(json.dumps(gallery,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8",newline="")
    (folder/"manifest.json").write_text(json.dumps(manifest,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8",newline="")
    expected={x["path"] for x in icons if x["path"].startswith("Icon/DashboardIcons/png/")}
    actual={x.relative_to(ROOT).as_posix() for x in (folder/"png").glob("*.png")}
    if expected!=actual:
        raise ValueError("整套图标目录有缺失或额外文件，请核对，未自动删除")
    print(json.dumps({"count":len(icons),"new_pngs":len(actual),"reused_common_pngs":len(icons)-len(actual),"upstream_commit":commit},ensure_ascii=False))

if __name__=="__main__":
    parser=argparse.ArgumentParser()
    parser.add_argument("--upstream",type=Path,required=True)
    build(parser.parse_args().upstream.resolve())
