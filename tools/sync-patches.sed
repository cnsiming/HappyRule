# sync-patches.sed — 同步落盘前的 URL 重写（fetch_one 在比对前对本文件应用）
# 背景：ddgksf2013.top 的 /scripts/ 路径已下线，镜像规则文件内嵌的脚本 URL 指向死链，
# 统一改指本仓库自托管副本（raw 地址随 rules 分支）。
s|https://ddgksf2013\.top/scripts/luckincoffee\.ads\.js|https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx/luckincoffee.ads.js|g
s|https://ddgksf2013\.top/scripts/redbook\.ads\.js|https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx/redbook.ads.js|g
s|https://ddgksf2013\.top/scripts/zhihu\.ads\.js|https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx/zhihu.ads.js|g
s|https://ddgksf2013\.top/scripts/bdpan\.ads\.js|https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Rewrite/qx/bdpan.ads.js|g
# 保留 TikTok 重写图标的本项目地址，避免上游同步后恢复外部图标引用。
s|https://raw\.githubusercontent\.com/Semporia/Hand-Painted-icon/master/Social_Media/TikTok\.png|https://raw.githubusercontent.com/cnsiming/HappyRule/rules/Icon/Dashboard/tiktok.png|g
