// ==UserScript==
// @name         糖心Vlog 会员视频解锁小助手
// @namespace    txscript.unlock
// @version      2.5.5
// @author       ayase+baby
// @description  免费脚本，禁止贩卖 解锁糖心视频的vip会员视频以及金币付费视频的完整播放，去除广告，优化pc下的浏览体验，并支持视频嗅探下载 视频解析服务来自 baby佬 t.me/jsforbaby 下载功能和油猴脚本移植来自 新垣绫濑的荷包蛋 t.me/ayase520
// @icon         https://txscript.pages.dev/tx/icon.png
// @include      /^https?:\/\/([a-z0-9-]+\.)*txh[0-9]+\.com\/.*/
// @grant        GM_xmlhttpRequest
// @connect      txscript.pages.dev
// @connect      tx-unlock.6ayase.workers.dev
// @connect      127.0.0.1
// @connect      cdn.jsdelivr.net
// @connect      fastly.jsdelivr.net
// @connect      npm.elemecdn.com
// @connect      cdn.staticfile.org
// @connect      lib.baomitu.com
// @connect      unpkg.com
// @require      https://cdn.jsdelivr.net/npm/mux.js@7.1.0/dist/mux.min.js
// @updateURL    https://pub-cd7fd25c0c574567947336d8bf838b62.r2.dev/%E7%B3%96%E5%BF%83Vlog%20%E4%BC%9A%E5%91%98%E8%A7%86%E9%A2%91%E8%A7%A3%E9%94%81%E5%B0%8F%E5%8A%A9%E6%89%8B.js
// @downloadURL  https://pub-cd7fd25c0c574567947336d8bf838b62.r2.dev/%E7%B3%96%E5%BF%83Vlog%20%E4%BC%9A%E5%91%98%E8%A7%86%E9%A2%91%E8%A7%A3%E9%94%81%E5%B0%8F%E5%8A%A9%E6%89%8B.js
// @run-at       document-start
// @noframes
// ==/UserScript==

(function () {
    "use strict";

    const W = (typeof unsafeWindow !== "undefined") ? unsafeWindow : window;
    const isMobileDevice = /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile/i.test(navigator.userAgent || "");

    let debugOn = false;
    if (location.search.indexOf("txdebug=1") >= 0) debugOn = true;


    console.log("[TX] 糖心Vlog 解锁油猴脚本已注入:", W.location.href);
    if (!isMobileDevice) {
        console.log("[TX] 沙箱检查: unsafeWindow=" + (typeof unsafeWindow !== "undefined") +
            ", XHR已替换=" + (W.XMLHttpRequest && W.XMLHttpRequest.__txPatched === true) +
            ", fetch已替换=" + (W.fetch && W.fetch.__txPatched === true));
    }

    function log() {
        if (debugOn) console.log("[TX]", ...arguments);
    }

    function normPath(p) {
        return String(p || "").replace(/\/+$/, "") || "/";
    }


    const TX_LOGO = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/4gHYSUNDX1BST0ZJTEUAAQEAAAHIAAAAAAQwAABtbnRyUkdCIFhZWiAH4AABAAEAAAAAAABhY3NwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAQAA9tYAAQAAAADTLQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAlkZXNjAAAA8AAAACRyWFlaAAABFAAAABRnWFlaAAABKAAAABRiWFlaAAABPAAAABR3dHB0AAABUAAAABRyVFJDAAABZAAAAChnVFJDAAABZAAAAChiVFJDAAABZAAAAChjcHJ0AAABjAAAADxtbHVjAAAAAAAAAAEAAAAMZW5VUwAAAAgAAAAcAHMAUgBHAEJYWVogAAAAAAAAb6IAADj1AAADkFhZWiAAAAAAAABimQAAt4UAABjaWFlaIAAAAAAAACSgAAAPhAAAts9YWVogAAAAAAAA9tYAAQAAAADTLXBhcmEAAAAAAAQAAAACZmYAAPKnAAANWQAAE9AAAApbAAAAAAAAAABtbHVjAAAAAAAAAAEAAAAMZW5VUwAAACAAAAAcAEcAbwBvAGcAbABlACAASQBuAGMALgAgADIAMAAxADb/2wBDAAQDAwQDAwQEBAQFBQQFBwsHBwYGBw4KCggLEA4RERAOEA8SFBoWEhMYEw8QFh8XGBsbHR0dERYgIh8cIhocHRz/2wBDAQUFBQcGBw0HBw0cEhASHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBwcHBz/wAARCACgAKADASIAAhEBAxEB/8QAHQAAAAcBAQEAAAAAAAAAAAAAAAMEBQYHCAECCf/EAEwQAAECBAQBCAUJBQYDCQAAAAECAwAEBREGBxIhMQgTIkFRYXGBFBVCkaEycoKSk6KxwdEWI1JVYiQzNENTwkWy4SU1RGNzo7PS8P/EABoBAAEFAQAAAAAAAAAAAAAAAAQAAQIDBQb/xAAqEQACAgEDAwQBBAMAAAAAAAAAAQIDEQQhMQUSQRMiMlFhFCNxoZGx0f/aAAwDAQACEQMRAD8A176jpf8ALZP7BP6QPUdM/l0n9gn9IXXgXjmcs0cIQ+o6Z/LpP7BP6Rz1HTP5dJ/YJ/SF94F4WRYQg9R0u3/d0n9gn9IgOP8AMDBmAEqZmpKUmqmU6kSTDKCvuKjayR479gMMGdGc37KsO0ehOoVV19ByYFlCX7QBwK/wjJk1OPTkw7MTDq3n3VFbjjiipSlHiSTxMbOg6XK5epbtH/YLdqFD2x5JtjjNGp4yU6yJeUp1NVsJWUaSnUP6l2ur4DuivzLy4H9w0O7QI9FXZA6o6SuqFUe2CwgFzcnmTPHo8v8A6Df1BA9HYP8AkND6IjpIEd1CLCJ49Gl/9Fv6ojvo8vx5hv6oj1qEDYwsIRwS0v8A6Lf1BEpwjjWqYLdSacWFS17qlZhlLjKvon5PikgxF947qt1xGdUZrtksodScXlGxMt81MI44LUjNU2Sp1aULcw42godP/lqtv802Pjxi1BRKWf8Ahsn9gn9I+djTqm1pWlRStJuCDYgjgQY1RkhnOa+GcO4gfHrRI0y00s/4gD2VH+P8fHjzfUOmOpO2njyvoOo1Hf7Z8l1+o6X/AC6T+wT+kD1HS/5dJ/YJ/SFo3jsYmWF4Qh9SUs/8Ok/sE/pHfUdL/l0n9in9IWwOEPliwjzaBAgRAkCIHmjjc4Ro4alVD1rOgoY6+bA+U4fC+3eR3xOybCMl5lYrarmLqlMrmE+jS7norNzsEpNvibnzjS6XpVqLsS4W7B9Tb6cNuSrsVa/TUrWtS1LBVqUb9f43uSe+GDxib1Sks1RAcCtLgHRWNwfGItOUWdlSSWytH8SN47LGNkZKeRCVWjyVXjyq6bhQ3HUYR+l86/zTQuE/KV1CGJJC3UY5feCee/e6BvYXJ7I96u4wwsBl7QNRgvV3QL9phCwGX7949atoTsupeTqTum5AMd526rJSpQ3uQLhPj2bkDzhZFhigeMGsPuS7zbrS1IcbUFJWk2KSNwQe28JwqF0pTpqeI5lolP8AErYe+HxnYbONzaeT2Yox3hxsTS0+uJNIRMDhznY4B3237CD3RY/GMbYFrL2CapIT7N1cx0X20/5rZtrT8LjvAjYMjOsVGTYm5ZwOS76EuNrTwUki4Mch1PR/prcx+L4NXTXepHflCiBAgRlhALjtgXjxeBeHwIacWVZNCwzV6mSB6HKuvDxSkkfGPndMVB6ZN3XCo3KvMxt3P2e9BynxCsGxdQ2z9ZxIPwJjBvOXjo+iRxCUvsA1by0h3lq1MyK0pZeUNW+niPdD7K4wvZM0zf8Aqb/SILzuqaP9KPxP/SDw4RG6pgbiTubqtIqAaZW40FPKsS50SBxO/wAPOC38O0xtu0oClx1VkBC7gnt3vsBvFZzD3pFUS3fotgD8z+UOUq+sul8LUkcEWNtu3z/SEp5YuzHBN/2OS2mzc2SeJKk8TBKsKzQPRfaPjcflDG3U5xIFpp4fTMenMRTMsOnOOA9QvcmJ5Q2JDwcLzn8bP1j+kL6TgCbqrrr804lukSaS5NvIJuQBfQk2+Ufh7ryPLnLzFONJhmbnXJqTpROpLYTZ6YHcLdFPf7u2LDzulm8BYIp9MZUiXmqg6EtsNH5DaLKUSe0q0jvuYz7tUpSVVXL8h1WlcYu27jwvsod3DC5OVcWHGkJSOi2gEi/UB57Rb+U2WiHcO1Rc2x6YmotlB6O4aB3UOy6tx80GKewZQqxmljKToEo9MLlUK52bcSo2QgHf9B3x9CsNYclcOUxqUl0JGhASSBtYCwA7hFWvu4rgWaKHbm2Rh6p0im4TqT8jN82Jhg3Cl7laT8lQHePjcdUNDmNZNIcTLsrWptRRY9EbRfHKgy1K6KnFdMZuumkmYQkb8yo9LyB6Xdv2xj9qZBn5hIOziErH4fpBWm1PqQWeQXUUKE9uGTN3F884+laShCEm+hI2PiY1Xyccc/tFh2ZpTqxz9OVqQkm55tRO3gFX8lARipxwhCiDuBtFq8nPEq6RmXSUFZSxUkKlli+xKk3T94JgfqMPWokvK3Fp32TRu2BHgG8C47Y4/Bp5OXgRwERzUIcWSoOU08WsqJ8X+VMy6fvg/lGGw6Y3LymGudykqqgL828wv/3Ej84wfqjo+kP9l/z/AMAdT8g1p7VMP9wSPz/ODw94w0yrl3pr5/5CFSl2F41cg+BBKOc/PP2Py1EeAv8AoIe3JxiVQOcWlPYOv3QxYWo1ZxLVU06iSi5ibe26PsjrJPADvMbAyt5JaKelmqYknGX54gKS2tjWhtXcCd/FQ8oonqY1fyXV0Ss38FDYOy9xhmG823RaY4xJr4zkykpTbtSOJ8r+Uany25LVEwyWp6vOKqdTHSKnBdKT3J4D4nvEWzJ4VqFNYDMpXSy2BboSTVz7wYb2Wa1UZoyzWIay0gE3e9XMNp8itG/kIAs1E7OXsG11QhvFb/ZMpKQlac0G5dlDaf6RuYwRnzi+fzQzadouHmlzq2FimyTbW+ognWrzVq34WAMaizfxK7lvgN5MpNz1UxPVF+h04OqC3VvKBGpKEgAaQSdk8bQx8nXIZOXEkqv11KXsVz6LLudQlEHcoB61H2j5DbiqpKtOfnwRtTsfb/kkmT+WdKyUwWhE69LipzGlyoTyjYKcPBIJ4ITwHmeuJU1mTQp13maQuZrDvC1Nl1OoHi7bmx5qES1SQRuL2in8U8oPCOE8QT1LmKk28unnTMMycs/MOtqAuQdKNAt87aKt5PJZtFY4J6p2rVqXmJecoEu1IvoKFNTU2CtxJFiClCFJG39Rj5v5i4PmsvcxajQ5hpTbTSlGX1G+plXSQb9e23iDGrprllYd9ZSLEph2smQffQ29PTaEtJZQT0l6AVKUAAT1cIq/lmT8tMZhYUSwEKX6uLhdRvrSpa9O/WNjbxgmjvrnhrGQe9xnHKfBRZdBFosSpYYfy2xrhR5srEtMJkqhLqUbkBWkqST3KCh4Wit5VpUzMNMIBLjqwhI7STYRsTlH4QSvBGH6oyj9/Q3mmVED/LXZPwUERPVX+nZGD4eUUVwzFv6NCosQCI7eCGFEsoPXpEGXMcuH5POqBqt1wVr7o7q7oYkVxygGTMZR4kA3KG23PquIP5RjvJXCLOO8x6JS5lAXIlwvzCT7TaAVEedgPONs5sy3p2WuK2bXJpz6gO9KCr8oy/yQW0HMt9KwNXqt4Jv26m7/AAja6bNqiYNbFOyIzcp12nDHkg/SpFuTkFSbbaUttpQlYStwagB1HbyioDuADFy8rCSblcWS7TB/cS0uGUi3Wkgk/e+EUbJzCZlkBdipOxEaunea1ko1CUbGkavoU3h7I/JalVSlSzNRxliVttuSlkqu64+4NibHUAm+wHcOJvE5wxkbj97D8vOYozUxTLTimudmW2J0NtM9ZFyCbAdfdEZydw0zmBgPBlbp6mRiHAlQc5uXdA5qYSTqKFdhUlQAVvYoHfGocc05zEeBsSUqUctNztNfYbCTuFLbUB8TA0Uk2nyW2Sk0muDCWcGHcQ4IxpN0JzMXE9VYQ2h0LVUHElIWL6FAHcgW32vcbCLU5IeGqiw5iCvGrzUxJuvGSdl5twuHUlDa0LSo3PtrBHeD1RWkpldP4mFEn1PvofU4hxznnek6SLAEk3HHrjV2SmCprA+En5KeSkTkxPPzC9JvcFWlB80oSfOC9ZXGulLbJXp25TySn9kae9ib9oZpBmak23zMsp2xEqj2ggdRUdyridhwFof7WgQIych5wi4Iims1KzJ5LYTlDRqTLzdTrU28p1+ZTqWpxSFLU8rbdQVosOFtttouaIHmngoY1k6S6i6n6WtxaWQQnnQpNiATsDsIJ0rj6i73sUXxlKPtRi7LKmprWJJGZXKKnGEMTTplijd08yptCd9uk44hP0oh+cElOUjH0nQZ6ccnJih06UkVOOEHdDAJAt1BSyB4RvLAuA5DCbiZ9EuGZ12X5l1tZC9HT1bEbDgL/NEYHzhnxO5v4zmySQmfdaHeQrSB92DZ2xsubjwiiVMq605eSUZBYTVi7M2lIU1qk6ar06YJGwCD0AfFen4xtvMCiKxJg6r0xtGpyYZsgf1AhQ+IEV7ydst14BwcJuos6K3WLPzAUN2kW6DfkDc96j2RcWsRzeu1Pq3d0eFwEVV9sMMMbslCU9gtHrVBXOCBzggEuwFXMC5gq5gaoWREQzdqvqfLTE80TZXoTjSfnLGgfFUYYy4x3N5c4vka/JtpdVLkpcZUbB1tQspN+rbge0CNUcqOsmQy5RJJVZdQnG2zv7KQVn4pEYoXsgns3joelV/syb8sC1EsTWPBffKFqdEx3QaNi7Ds61MSU8641MMr/wARKvFIVzax2bKI87XFrZkZeXKva0i44KT2wfJPqRMtp1KCFK3TfY7G3/7vjxNt83MrHUTeNGEOxYRTZNzeWaK5LuZzOFMYGnzTwRS64EsrKjs28CebUfMlP0h2RthVWQJgqS10rfLtY/8AQeMZiwVydaJmLkrhaqSKxS8Slhw+mNpul/8AersHU9fZqG47+EWzlvN4jlkIwzjeRdarUonRL1FAK5efbA2UF8A4ANwqxtvbjAVzjJ5Rq6PEV22LbwWAxSaNO1BFRXS5Jc+2RpmFsJLiT3KIvEobNxeGqUkEsr1b36r9UOje1hA7bfJbaoL4hsCBAhigTqm2xNJlt+dUgucNgAQNz5/Ax4mNWk6eNuuFVh2bx5UgEQ5KLwRGotvModmHHQlttBWtd7WA3PgI+ZVVmzijMmemkBXN1CrLdSlQsbLdJG3VsY+leaeM5HLvBNVrs4tAWy0Uy7ZO7rxFkJHbvx7gTHzkyxlV1jMShLd/eLfqTOo9pLoKj+ME0rEZT/BVrLu/tgfS5FkpA7I7qHbBSTtxj1eOZyTDNYgau6C7wLwhBOsxwrMeCoxwq2hCMucrWs85UMPUlKtmmnJlY+cQlP8AyqjM04rTLOHutFr8oStCs5n1ZKFam5IIlU92lPSH1iqKfqiyGko61GOs0UOyiKM215mxoLnNlLg4pIIh0qTWtpLyd7fhDS57I7TD7JEPyaEqF9tJ8toIW5A0xyUc+5eiNNYHxJNJZkluH1dNumyWlKNy0o9QJNweokjrFtqsS4RrPOKcCzqBUb27h3R848jsj1ZgVF+pVRZbw9JPaFpQqy5hdgdA7BYi579u0TXDueuYuRtZnaNX6LPVzBcpNOsy0wtKi400lZSnQ9uCAB8lfvEBX1YeUFUX59n0btDYEMmIsW0rCyGjUH1JW8SG2m0Fbi7cbJHV38IiGXWfeBMzWm00atNIn1DeQmyGpgHs0n5XikkQ94kwc5V6yzVZVxgPpYDCkPgkaQoqBSRwN1G+2+3ZuNj7DYOMn7nsPFNxdRaqyHJepS9yLltxYQtPihViPMQVN42w9IpUp6syXR4pbdC1e5NzEbVgSpTH99MU4EcLsqct8RCyXwAoC01U1aOGiVZS0D79XwtC2LHGvxL+h6wpi+k41piqlRZhUxJJdUyHS0pAUpPG2oAkA7X8Y7i3F1IwTQputVqbRKyEsm6lK4qPUlI61HgAIYavXKVlvh6ZlKPTXp6YlG1vppsmdTiiSVEqJO1ySbnc9QPCPnbmtnHiTNesqdrD3MyLCiZentEhpn/7K7VH4cIsrpc3+AOy6MNlyK87c56rm/iRL7muXo0qopkpK+yAfaV2rPWergIVZJBEnmZhNCwCDOBO/aUqsffaKslQFTbIO41RN8GVVNHxrhydUbJl51p1R7gtN/heDZwXoyivoCUm5ps+kIO0dvaCUquOMdvHIGmG3jl+yC7x28OI5CaoTjdPkZmbeIDUu2p1Z7AkXP4QdqEclqS3iOYclX+lT2bekIts8SLhs91tyOsEDgTE64OclFCMkYI5PmKM2J2YxHUnRSKXPvLmA8+gqde1KJuhG22/Ekd14uyl8kfBFKQHZtiZrrwG7c4+Wkn5vN6bHx1Dw4xoNDaW0hKUgJSLAAWAEeo3nfN7LgqVMVyU3Lcl/KGsyoeZw2tuxKVJE4+lbahxSRr2IjNPKVyhpeVtepJoMqWKPPy50pKlKs6hVlXJJ3IUmNyzqvVE0KojZkWTNpHBTf8AH4p4/Nv3RUnKows9jHAs05JjUvDqBUFaQCVBXRUnyRqUfAQTTbncEtr7WVJyUalrpuIacVbtutPgfOCkk/dEWVTCpybrjLytfN1B5Ivv0VWUB96KL5K04E5gzVLLmldQknEtJPBTiCFgfVC40G7KCRr9abKdK33W5hQ8W0o/FsxDWr2lvTttQ/yiP1TLzCtZVrnaBTnXb350MJSu/bqFj8YklDdqGGWUMUyqTglkbJZm3VTKAOzpkqA8FCPUCMzuf2brri+USWWzDqTNhNUxiYHWuXeKD9VQI+9CSu4xqdYZcl5AuUphYsXwUqmD4cUp8dz4Qywjq0wqVps06j5aWzo+cdh8bRLvfBD0ILcXZfUKWo1FfUwp9wz0y5NLdmXlOuOEnSFKUokm4SD5xAsW8mfB+JcQv1NS56Scnv36kSq0pbKr2WACk23sr6cTPA6lSc7O0krJalGGktAn2brP4KA8omk6dMrKP/6UzzSj/S4k/wC9CPfGtB+1YOVtUo2zT5Mu5t5I4Py+wE7UKZKzCqiJhptMw++pSgCTfYWTw7oV8mTKLDuYFHr89iKnelNMvtMyyg6tsoUEqKrFJB4KTEq5UU0GsCSTF93p9G3bZCzFh8lqhmkZSU99SdLlRfdmj4atCfgge+GvlivYI0a7nlk7VhGZkGUop1QW6hACUtTo1bDqC0gEeJCoQNPKLjjDramZlqwcaXxTfge8HqIifRH8U0/nJUVBkf2mTBUbcVt+0n3bjvAjFu08ZLMeTTGeBBaXApIINweBEd1xmD4Cy5YQ/wCC27UCXfULLmyqZUfnklPuTpHlEbd/u1W422iVYPv+ydDvx9BYvft5tMG6JbtkR6gQIEaA4VMltMu6XtPNBJK9XC1t7+UIMM0VH7NFidSp5M+hRcQ9ueaUNKG1eDYSk+BPXHms/wBrck6YP/GLPO/+indfkdk/ThLXcZql1MsUtrnQ6pTfpihdlCgCSE9azYHhttxvtBFKxuC6iX9GC5+nzORueDSV6wzSagh5tX+rLKNx72yQe+8bQxrTEzmJ6ZMyQQo1OUUAoHZZQoKTv3hwxSHKXwbU8SUSRxKhhUzNyDV3XtAQ4qWI1XIAAUEk3FtwFHj1TnKXEysb5YYLmvTHGqhQ50U2ZcRpKgnQUIJ1AjcFrq7Yvvj3QKtLYlYpIcpiWelHS0+2ptwdShaC4sioUaoTjJbW/JTaOoPsKQsfTSr/AGxD5nDFSYmQ0uXQCu5b5t3WlVhci5A367EdXXGW4PwbkNRF87DPBUxLtzLYbdTqRqSq3eCCPiBCuakpuUCwuTmCpPsIbJUfAQbTsHYhq5Cnyimy6uq2pwDxO1/LzhlFlspxXLGqhoLWNnFhQ0vU43T3ocG/3/hE8dYVNUirNIGpxLHpCEjrW2oLA94hjRRaPQ67LS1OcS9NplnjMu6ta1ErbtqPlw6ofpatMUN8PvpU4FgtpaQLqcURskDy69gNztGpRtWkcxrJJ6lyXBm7lRzSpyVwnIS/TVMuuOISPaNkJT/zRq/CNERhzC9HpDYATIyjTG3WUpAJ94jNlRoicYZ34FpBaX6LR2XZx1CuKENuq0A2720A+MasAsIr1Ms4QTo4Yjk7HlxIWhSVC6SLEHrj1HDwgUMK3kU80yWL39HWti/zFFP5QoghBAmJ/s9Lf/8AkVBuqMSxYmxHgmJDgGoIqWFpJaDfmC5LHuLTim/9sR08Iccvf7LLTMr7DqjNI81rQofWbJ+lBmiW8hm90ibQIECDxxonKAxP1H0uYdfWjmQyZfXZsjUSbgbm+1wTY2G0NGLlCmzOHppNksInUyxT7I51JQk28SAPnRLoY8YSPp2HZ1IRqcZCZhsDjrbUHE/eSIlF7ohKOU8CqiSUrXMHUpubaS625JtghQv7ABjNYwnPZNZgVKgSksxN4TxXpMo1MjoJmkHW01fcAkiwuLHYbWJjR+XEymbwRQ3UG6VSzZB7ikH84KzFwjL4ww3NyTrRW4E629CtKwoHUClQ3CgQCCOBg7PgzPyKJOjy81KNTNIn5mUbUNmgrnEJI4pKF30kG4IBFoMXLVqVSpZMnOJSL6UJU0tXcLlQv42HhDNRZl6Rp6Z8TiZhxlDapvUNJmWiBpeKfZcA4kbEpI6hpncVuEX4L1ZJcMi8xV0Lk2FSY52Zml80y2oEdPr1DiNNiVdmk9cK28MMup/7RmpieJ4ocVpbP0EWBHjeFTNBk2Kw9VEIUJh1GkjV0AdrqCepRASCevSIc4aNaiPZc5cFbYwck6XWGEpbbYl5OQKtLabBIUvYBI+ZwERhhx9FTlpqoNhPpSVNsJJ/uDxCT/UoAknut4zqryrFZncSczzbkxLSjDQIIJSpJcc09x3T74Zcx5G+HnpunENlUtz7Cwm4StA1JNvIRdF+AK2D+RGMpqCl7HmPcRuHWTMt0yXJHyUIbStwDxWv7sXLFd5VzkvNs1dUuAlK3kuuJBvpdIKXB9ZChFiQFb82aunx6awCOHhHYb67PGm0edmgLraaUUDtVbYeZtFT2LiBSx1pcdvfnnHHb/OWVfnB8ES6Syw22N9CQm/hBmo9kYkp5bYj/9k=";
    const RX_MATCH = /^https?:\/\/((?:[a-z]+\.)?txh\d+\.com)\/(h5\/(?:user\/info|system\/info|movie\/(?:detail|block|search)))/;
    const RX_DETAIL = /\/h5\/movie\/detail/;
    const RX_STRIP = /\/h5\/(movie\/(?:detail|block|search)|user\/info|system\/info)/;
    const TIMEOUT = isMobileDevice ? 20000 : 15000;
    const CACHE_TTL = 3000;
    const ROUTE_CHECK_THROTTLE = isMobileDevice ? 800 : 300;

    const SCRIPT_VERSION = "2.5.5";
    const API_DEFAULT = "https://tx-unlock.6ayase.workers.dev";
    const API_TIMEOUT = isMobileDevice ? 20000 : 15000;
    const API_RETRY = 3;
    const API_RETRY_GAP = 900;
    (function txDropLegacyBodyCache() {
        try {
            ["txUnlockBody", "txUnlockGood"].forEach(function (k) { localStorage.removeItem(k); });
        } catch (e) {}
    })();
    const K_STAT = "txUnlockStat";

    let API_BASE = API_DEFAULT;
    (function resolveApiBase() {
        const pick = function (v) {
            const s = String(v || "").trim().replace(/\/+$/, "");
            return /^https?:\/\//i.test(s) ? s : "";
        };
        try {
            const q = new URL(location.href).searchParams.get("txapi");
            const forced = pick(W.__TX_API) || pick(q);
            if (forced) {
                API_BASE = forced;
                try { localStorage.setItem("txApiBase", forced); } catch (e) {}
                return;
            }
            const saved = pick(localStorage.getItem("txApiBase"));
            if (saved) API_BASE = saved;
        } catch (e) {}
    })();

    const TX_RELAY = {
        failUntil: 0,
        fails: 0,
        loopLoads: 0,
        reason: "",
        notified: false
    };
    const RELAY_FAIL_COOLDOWN = 60000;
    const RELAY_LOOP_WINDOW = 30000;
    const RELAY_LOOP_LIMIT = 3;

    (function txNavGuard() {
        const countKey = "txRelayNavGuard";
        const atKey = "txRelayNavGuardAt";
        let count = 0;
        let started = 0;
        try {
            count = parseInt(sessionStorage.getItem(countKey) || "0", 10) || 0;
            started = parseInt(sessionStorage.getItem(atKey) || "0", 10) || 0;
        } catch (e) {}
        const now = Date.now();
        if (!started || now - started > RELAY_LOOP_WINDOW) {
            count = 0;
            started = now;
        }
        count += 1;
        try {
            sessionStorage.setItem(countKey, String(count));
            sessionStorage.setItem(atKey, String(started));
        } catch (e) {}
        TX_RELAY.loopLoads = count;
        if (count >= RELAY_LOOP_LIMIT) {
            TX_RELAY.failUntil = now + RELAY_FAIL_COOLDOWN;
            TX_RELAY.reason = "页面循环刷新";
        }
        setTimeout(function () {
            try {
                sessionStorage.removeItem(countKey);
                sessionStorage.removeItem(atKey);
            } catch (e) {}
        }, RELAY_LOOP_WINDOW + 500);
    })();

    let isFirstLoad = true;



    const TX_AES_KEY = "fd14f9f8e38808fa";
    const AES_SBOX = new Uint8Array(256), AES_ISBOX = new Uint8Array(256), AES_MUL = {};
    (function buildAes() {
        const exp = new Uint8Array(256), lg = new Uint8Array(256);
        let x = 1;
        for (let i = 0; i < 255; i++) { exp[i] = x; lg[x] = i; x ^= (x << 1) ^ ((x & 0x80) ? 0x11b : 0); x &= 0xff; }
        const rotl = (b, n) => ((b << n) | (b >>> (8 - n))) & 0xff;
        for (let a = 0; a < 256; a++) {
            const inv = a === 0 ? 0 : exp[(255 - lg[a]) % 255];
            const s = inv ^ rotl(inv, 1) ^ rotl(inv, 2) ^ rotl(inv, 3) ^ rotl(inv, 4) ^ 0x63;
            AES_SBOX[a] = s; AES_ISBOX[s] = a;
        }
        const gmul = (a, b) => (a && b) ? exp[(lg[a] + lg[b]) % 255] : 0;
        for (const n of [2, 3, 9, 11, 13, 14]) {
            const t = new Uint8Array(256);
            for (let a = 0; a < 256; a++) t[a] = gmul(a, n);
            AES_MUL[n] = t;
        }
    })();

    const AES_W = (function () {
        const key = new Uint8Array(16);
        for (let i = 0; i < 16; i++) key[i] = TX_AES_KEY.charCodeAt(i) & 0xff;
        const w = new Uint8Array(176);
        w.set(key, 0);
        const RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36];
        for (let i = 4; i < 44; i++) {
            let t0 = w[(i - 1) * 4], t1 = w[(i - 1) * 4 + 1], t2 = w[(i - 1) * 4 + 2], t3 = w[(i - 1) * 4 + 3];
            if (i % 4 === 0) {
                const r = t0;
                t0 = AES_SBOX[t1] ^ RCON[i / 4 - 1]; t1 = AES_SBOX[t2]; t2 = AES_SBOX[t3]; t3 = AES_SBOX[r];
            }
            w[i * 4] = w[(i - 4) * 4] ^ t0;
            w[i * 4 + 1] = w[(i - 4) * 4 + 1] ^ t1;
            w[i * 4 + 2] = w[(i - 4) * 4 + 2] ^ t2;
            w[i * 4 + 3] = w[(i - 4) * 4 + 3] ^ t3;
        }
        return w;
    })();

    function aesEncBlock(s) {
        const addRK = (r) => { for (let i = 0; i < 16; i++) s[i] ^= AES_W[r * 16 + i]; };
        const shift = () => {
            for (let r = 1; r < 4; r++) {
                const row = [s[r], s[r + 4], s[r + 8], s[r + 12]];
                for (let c = 0; c < 4; c++) s[r + 4 * ((c - r + 4) % 4)] = row[c];
            }
        };
        const sub = () => { for (let i = 0; i < 16; i++) s[i] = AES_SBOX[s[i]]; };
        const mix = () => {
            for (let c = 0; c < 4; c++) {
                const o = 4 * c, a0 = s[o], a1 = s[o + 1], a2 = s[o + 2], a3 = s[o + 3];
                s[o] = AES_MUL[2][a0] ^ AES_MUL[3][a1] ^ a2 ^ a3;
                s[o + 1] = a0 ^ AES_MUL[2][a1] ^ AES_MUL[3][a2] ^ a3;
                s[o + 2] = a0 ^ a1 ^ AES_MUL[2][a2] ^ AES_MUL[3][a3];
                s[o + 3] = AES_MUL[3][a0] ^ a1 ^ a2 ^ AES_MUL[2][a3];
            }
        };
        addRK(0);
        for (let r = 1; r <= 10; r++) { sub(); shift(); if (r < 10) mix(); addRK(r); }
    }

    function aesDecBlock(s) {
        const addRK = (r) => { for (let i = 0; i < 16; i++) s[i] ^= AES_W[r * 16 + i]; };
        const invShift = () => {
            for (let r = 1; r < 4; r++) {
                const row = [s[r], s[r + 4], s[r + 8], s[r + 12]];
                for (let c = 0; c < 4; c++) s[r + 4 * ((c + r) % 4)] = row[c];
            }
        };
        const invSub = () => { for (let i = 0; i < 16; i++) s[i] = AES_ISBOX[s[i]]; };
        const invMix = () => {
            for (let c = 0; c < 4; c++) {
                const o = 4 * c, a0 = s[o], a1 = s[o + 1], a2 = s[o + 2], a3 = s[o + 3];
                s[o] = AES_MUL[14][a0] ^ AES_MUL[11][a1] ^ AES_MUL[13][a2] ^ AES_MUL[9][a3];
                s[o + 1] = AES_MUL[9][a0] ^ AES_MUL[14][a1] ^ AES_MUL[11][a2] ^ AES_MUL[13][a3];
                s[o + 2] = AES_MUL[13][a0] ^ AES_MUL[9][a1] ^ AES_MUL[14][a2] ^ AES_MUL[11][a3];
                s[o + 3] = AES_MUL[11][a0] ^ AES_MUL[13][a1] ^ AES_MUL[9][a2] ^ AES_MUL[14][a3];
            }
        };
        addRK(10);
        for (let r = 9; r >= 0; r--) { invShift(); invSub(); addRK(r); if (r > 0) invMix(); }
    }

    function aesEncECB(data) {
        const pad = 16 - (data.length % 16);
        const buf = new Uint8Array(data.length + pad);
        buf.set(data, 0); buf.fill(pad, data.length);
        const out = new Uint8Array(buf.length);
        for (let o = 0; o < buf.length; o += 16) { const s = buf.slice(o, o + 16); aesEncBlock(s); out.set(s, o); }
        return out;
    }

    function aesDecECB(data) {
        const out = new Uint8Array(data.length);
        for (let o = 0; o < data.length; o += 16) { const s = data.slice(o, o + 16); aesDecBlock(s); out.set(s, o); }
        const pad = out[out.length - 1];
        const n = (pad > 0 && pad <= 16) ? out.length - pad : out.length;
        return out.slice(0, n);
    }

    function txB64Enc(u8) {
        let s = "";
        for (let i = 0; i < u8.length; i += 8192) s += String.fromCharCode.apply(null, u8.subarray(i, i + 8192));
        return btoa(s);
    }

    function txB64Dec(str) {
        const bin = atob(String(str).trim());
        const a = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
        return a;
    }

    function encPayload(obj) { return txB64Enc(aesEncECB(new TextEncoder().encode(JSON.stringify(obj)))); }

    function decPayload(text) {
        try { return JSON.parse(new TextDecoder().decode(aesDecECB(txB64Dec(text)))); } catch (e) { return null; }
    }

    function payloadOuter(text) {
        const s = String(text || "").trim();
        if (s.charAt(0) !== "{") return { wrapped: false, cipher: s };
        try {
            const o = JSON.parse(s);
            if (o && typeof o.data === "string") return { wrapped: true, outer: o, cipher: o.data };
        } catch (e) {}
        return { wrapped: false, cipher: s };
    }

    function decBody(text) {
        const u = payloadOuter(text);
        return u.cipher ? decPayload(u.cipher) : null;
    }

    function wrapBody(text, obj) {
        const u = payloadOuter(text);
        const cipher = encPayload(obj);
        if (u.wrapped && u.outer) {
            const out = Object.assign({}, u.outer);
            out.data = cipher;
            return JSON.stringify(out);
        }
        return cipher;
    }

 
    /* ===== 解锁：只向解析服务索取现成结果，客户端永不登录 ===== */

    const UNLOCK = { ok: 0, fail: 0, wait: 0, lastMs: 0, lastId: "", lastNote: "", lastAt: 0 };
    const UNLOCK_UI = { dirty: false };

    function apiPost(path, data, timeoutMs) {
        return new Promise(function (resolve, reject) {
            if (typeof GM_xmlhttpRequest === "undefined") { reject(new Error("跨域权限未授予")); return; }
            GM_xmlhttpRequest({
                url: API_BASE + path,
                method: "POST",
                headers: { "content-type": "application/json" },
                data: JSON.stringify(data),
                timeout: timeoutMs || API_TIMEOUT,
                onload: function (res) { resolve({ status: res.status, text: res.responseText || "" }); },
                onerror: function () { reject(new Error("网络错误")); },
                ontimeout: function () { reject(new Error("超时")); }
            });
        });
    }

    function apiGet(path, timeoutMs) {
        return new Promise(function (resolve, reject) {
            if (typeof GM_xmlhttpRequest === "undefined") { reject(new Error("跨域权限未授予")); return; }
            GM_xmlhttpRequest({
                url: API_BASE + path,
                method: "GET",
                timeout: timeoutMs || 8000,
                onload: function (res) { resolve({ status: res.status, text: res.responseText || "" }); },
                onerror: function () { reject(new Error("网络错误")); },
                ontimeout: function () { reject(new Error("超时")); }
            });
        });
    }

    function unlockIds(ids, force) {
        return apiPost("/v1/unlock", { ids: ids, force: !!force, v: SCRIPT_VERSION }).then(function (r) {
            if (r.status < 200 || r.status >= 300) throw new Error("HTTP " + r.status);
            let j = null;
            try { j = JSON.parse(r.text); } catch (e) { throw new Error("响应异常"); }
            if (!j || !j.ok) throw new Error((j && j.error) || "服务端异常");
            return { items: j.items || {}, server: j.server || {} };
        });
    }

    function unlockOne(id, attempt) {
        const tries = attempt || 1;
        return unlockIds([id], false).then(function (res) {
            const body = res.items[id];
            if (body) return body;
            if (tries >= API_RETRY) return null;
            UNLOCK.wait++;
            const wait = Math.max(API_RETRY_GAP, Math.min(res.server.retryAfter || 0, 3000));
            return new Promise(function (r) { setTimeout(r, wait); }).then(function () { return unlockOne(id, tries + 1); });
        });
    }

    function detailIdOf(bodyText) {
        const obj = decBody(bodyText);
        if (!obj || !obj.data || !obj.data.id) return null;
        return String(obj.data.id);
    }

    function rememberShape(raw) {
        try { localStorage.setItem("txUnlockShape", payloadOuter(raw).wrapped ? "wrapped" : "bare"); } catch (e) {}
    }

    function benignDetail() {
        const cipher = encPayload({ status: "n", error: "解锁中，请稍候点击重试", errorCode: 9001 });
        let wrapped = false;
        try { wrapped = localStorage.getItem("txUnlockShape") === "wrapped"; } catch (e) {}
        if (!wrapped) return cipher;
        return JSON.stringify({ data: cipher, errcode: 0, timestamp: Math.floor(Date.now() / 1000) });
    }

    function unlockedDetail(bodyText) {
        const t0 = Date.now();
        const id = detailIdOf(bodyText);
        if (!id) return Promise.resolve(null);
        UNLOCK.lastId = id;
        UNLOCK.lastAt = t0;
        return unlockOne(id).then(function (body) {
            UNLOCK.lastMs = Date.now() - t0;
            if (body) {
                rememberShape(body);
                UNLOCK.ok++;
                UNLOCK.lastNote = "服务端解锁";
                log("解锁成功 id=" + id + " " + body.length + "B " + UNLOCK.lastMs + "ms");
                return body;
            }
            UNLOCK.fail++;
            UNLOCK.lastNote = "服务端失败";
            log("解锁失败 id=" + id + "，返回占位避免页面刷新");
            return benignDetail();
        }).catch(function (err) {
            UNLOCK.fail++;
            UNLOCK.lastMs = Date.now() - t0;
            UNLOCK.lastNote = "网络异常";
            log("解锁异常 id=" + id + " " + (err && err.message));
            return benignDetail();
        });
    }

    function shouldIntercept(url) {

        if (/\.(jpg|jpeg|png|gif|webp|svg|ico|mp4|webm|ts|m3u8|css|js|woff|woff2|ttf|eot)/i.test(url)) {
            return false;
        }

        return RX_MATCH.test(url);
    }


    function buildTarget(originalUrl) {
        if (!originalUrl) return originalUrl;
        return API_BASE + "/v1/proxy?u=" + encodeURIComponent(String(originalUrl));
    }

    const AD_KEYS = ["ad", "ads", "play_ads", "ad_apps", "ad_videos", "ad_banner", "ad_box", "ad_spot",
        "layer_ad", "layer_ads", "layer_app", "bottom_ad", "bottom_ads", "post_banner",
        "ad_auto_jump", "ad_show_time", "ad_rotation_time",
        "detail_page_ad_show_method", "play_ad_show_time", "play_ad_auto_jump"];

    const PASSTHROUGH_DROP = ["host", "content-length", "connection", "cookie", "origin", "referer",
        "user-agent", "accept-encoding", "accept-charset", "expect", "te", "trailer", "upgrade", "via"];

    
    // 前端用「真值」当开关的广告键（ads 决定开屏是否出现）：空数组仍是真值，必须整个删掉
    // 其余数组型广告键只清空内容、保留数组类型，避免页面裸读 .length 时 undefined 崩溃
    const AD_FLAG_KEYS = ["ads"];

    function passthroughInit(method, headers, body) {
        const h = {};
        Object.keys(headers || {}).forEach(function (k) {
            const lk = String(k).toLowerCase();
            if (PASSTHROUGH_DROP.indexOf(lk) > -1) return;
            if (lk.indexOf("sec-") === 0 || lk.indexOf("proxy-") === 0) return;
            h[k] = headers[k];
        });
        const m = String(method || "GET").toUpperCase();
        const opts = { method: m, headers: h, credentials: "include", cache: "no-store", redirect: "follow" };
        if (body !== undefined && body !== null && m !== "GET" && m !== "HEAD") opts.body = body;
        return opts;
    }

    function adsStrip(path, obj) {
        if (!obj || !obj.data || typeof obj.data !== "object") return false;
        const data = obj.data;
        let changed = false;
        const kill = function (target) {
            if (!target || typeof target !== "object") return;
            AD_KEYS.forEach(function (k) {
                if (!(k in target)) return;
                // 数组只清空内容，非数组才删除；AD_FLAG_KEYS 例外，必须删除
                if (Array.isArray(target[k]) && AD_FLAG_KEYS.indexOf(k) < 0) {
                    if (target[k].length) { target[k] = []; changed = true; }
                } else {
                    delete target[k];
                    changed = true;
                }
            });
        };
        const killList = function (list) {
            if (!Array.isArray(list)) return;
            for (let i = list.length - 1; i >= 0; i--) {
                const it = list[i];
                if (it && (it.type === "ad" || it.is_ad === "y" || (it.id && String(it.id).indexOf("_ad") > -1))) {
                    list.splice(i, 1);
                    changed = true;
                }
            }
            list.forEach(kill);
        };
        if (/user\/info/.test(path)) {
            kill(data);
            Object.assign(data, {
                is_vip: "y", is_dark_vip: "y", is_up: "y", is_mer: "y",
                phone: "13800138000", balance: "999999", balance_income: "0", balance_freeze: "0",
                group_end_time: "2099-09-09", group_name: "TG频道@ayase520", exp_level: 99
            });
            changed = true;
        } else if (/system\/info/.test(path)) {
            kill(data);
            if (data.notice) { data.notice = ""; changed = true; }
        } else if (/movie\/(?:block|search)/.test(path)) {
            if (Array.isArray(data)) killList(data);
            else if (Array.isArray(data.items)) killList(data.items);
            kill(data);
        } else if (/movie\/detail/.test(path)) {
            kill(data);
        }
        return changed;
    }

    function rewriteLocal(path, text) {
        if (!text || !RX_STRIP.test(path)) return text;
        const obj = decBody(text);
        if (!obj) return text;
        if (!adsStrip(path, obj)) return text;
        try { return wrapBody(text, obj); } catch (e) { return text; }
    }

    function passthrough(url, method, headers, body, isBinary) {
        return nativeFetch(url, passthroughInit(method, headers, body)).then(function (res) {
            if (isBinary) {
                return res.arrayBuffer().then(function (ab) {
                    return { status: res.status, body: ab, arrayBuffer: ab, rawHeaders: [] };
                });
            }
            return res.text().then(function (text) {
                const out = rewriteLocal(url, text);
                sniffMedia(out, "接口响应");
                return { status: res.status, body: out, arrayBuffer: undefined, rawHeaders: [] };
            });
        });
    }

    function bodyToText(body) {
        if (typeof body === "string") return body;
        if (body instanceof ArrayBuffer) { try { return new TextDecoder().decode(body); } catch (e) { return ""; } }
        if (body && typeof body === "object" && typeof body.byteLength === "number") {
            try { return new TextDecoder().decode(body); } catch (e) { return ""; }
        }
        return "";
    }

    function proxyRequest(url, method, headers, body, isBinary, attempt) {
        const m = String(method || "GET").toUpperCase();
        if (RX_DETAIL.test(url) && m === "POST") {
            const bodyText = bodyToText(body);
            const run = bodyText ? unlockedDetail(bodyText).catch(function (err) {
                log("解锁流程异常:", err && err.message);
                return null;
            }) : Promise.resolve(null);
            return run.then(function (out) {
                const text = out || benignDetail();
                sniffMedia(text, "接口响应");
                return { status: 200, body: text, arrayBuffer: undefined, rawHeaders: [] };
            });
        }
        return passthrough(url, method, headers, body, isBinary);
    }
    const NativeXHR = W.XMLHttpRequest;
    const PatchedXHR = function () {
        const xhr = new NativeXHR();
        const origOpen = xhr.open.bind(xhr);
        const origSetRH = xhr.setRequestHeader.bind(xhr);
        const origSend = xhr.send.bind(xhr);
        let capturedUrl = "";
        let capturedMethod = "GET";
        const sentHeaders = {};
        let bodyData = null;
        let isIntercepted = false;

        xhr.open = function (method, url, async, user, pass) {
            capturedUrl = String(url);
            capturedMethod = String(method || "GET");
            if (!isMobileDevice) {
                log("XHR.open", method, url);
            }
            try { 
                origOpen(method, url, typeof async === "boolean" ? async : true, user, pass); 
            } catch (e) { 
                origOpen(method, url, true, user, pass); 
            }
        };

        xhr.setRequestHeader = function (k, v) {
            sentHeaders[k] = v;
            try { origSetRH(k, v); } catch (e) {}
        };

        xhr.send = function (body) {
            bodyData = body;
            let absUrl;
            try { 
                absUrl = new URL(capturedUrl, location.href).href; 
            } catch (e) { 
                absUrl = capturedUrl; 
            }

            if (absUrl) { sniffMedia(absUrl, "请求嗅探"); recordRequest(absUrl, "请求嗅探"); }

           
            if (!shouldIntercept(absUrl)) {
                try { return origSend(body); } catch (e) { return undefined; }
            }

            isIntercepted = true;
            if (!isMobileDevice) {
                log("XHR 拦截", capturedMethod, absUrl);
            }

            proxyRequest(absUrl, capturedMethod, sentHeaders, bodyData, false)
                .then(function (r) {
                    try { 
                        Object.defineProperty(xhr, "responseText", { 
                            writable: true, 
                            configurable: true, 
                            value: r.body || "" 
                        }); 
                    } catch (e) {}
                    try { 
                        Object.defineProperty(xhr, "response", { 
                            writable: true, 
                            configurable: true, 
                            value: r.arrayBuffer || r.body || "" 
                        }); 
                    } catch (e) {}
                    try { 
                        Object.defineProperty(xhr, "status", { 
                            writable: true, 
                            configurable: true, 
                            value: r.status || 200 
                        }); 
                    } catch (e) {}
                    try { 
                        Object.defineProperty(xhr, "readyState", { 
                            writable: true, 
                            configurable: true, 
                            value: 4 
                        }); 
                    } catch (e) {}

                    queueMicrotask(function () {
                        try { if (xhr.onreadystatechange) xhr.onreadystatechange.call(xhr); } catch (e) {}
                        try { if (xhr.onload) xhr.onload.call(xhr); } catch (e) {}
                        try { if (xhr.onloadend) xhr.onloadend.call(xhr); } catch (e) {}
                    });
                })
                .catch(function (err) {
                    if (!isMobileDevice) {
                        console.warn("[TX] XHR 代理失败，回退原生:", err);
                    }
                    try { origSend(body); } catch (e) {}
                });
            return undefined;
        };
        return xhr;
    };

    try { 
        PatchedXHR.prototype = NativeXHR.prototype; 
    } catch (e) {}
    PatchedXHR.__txPatched = true;
    try { 
        Object.defineProperty(W, "XMLHttpRequest", { 
            writable: true, 
            configurable: true, 
            value: PatchedXHR 
        }); 
    } catch (e) {}

    
    const nativeFetch = W.fetch.bind(W);
    W.fetch = function (input, init) {
        let url = "";
        let method = (init && init.method) || "GET";
        let headers = {};
        let isBinary = false;

        if (typeof input === "string") { 
            url = input; 
            if (init && init.headers) {
                headers = (init.headers instanceof Headers) ? 
                    Object.fromEntries(init.headers.entries()) : 
                    init.headers;
            }
        } else if (input instanceof Request) { 
            url = input.url; 
            method = input.method || method; 
            headers = Object.fromEntries((input.headers || new Headers()).entries());
        }

        let absUrl; 
        try { 
            absUrl = new URL(url, location.href).href; 
        } catch (e) { 
            absUrl = url; 
        }
        if (absUrl) { sniffMedia(absUrl, "请求嗅探"); recordRequest(absUrl, "请求嗅探"); }

        
        if (!shouldIntercept(absUrl)) {
            return nativeFetch(input, init);
        }

       
        if (/(image|video|octet-stream|\/mp4|\/jpg|\/png|\.m3u8|\.ts)/i.test(absUrl + " " + (headers["Accept"] || "") + " " + (headers["accept"] || ""))) {
            isBinary = true;
        }

        if (!isMobileDevice) {
            log("fetch 拦截", method, absUrl);
        }

        const body = (init && init.body) || (input instanceof Request ? input.body : undefined);

        return proxyRequest(absUrl, method, headers, body, isBinary)
            .then(function (r) {
                const hdr = new Headers();
                hdr.set("content-type", "application/json; charset=utf-8");
                return new Response(r.body, { 
                    status: r.status || 200, 
                    statusText: "", 
                    headers: hdr 
                });
            })
            .catch(function (err) {
                if (!isMobileDevice) {
                    console.warn("[TX] fetch 转发失败，回退原生", err);
                }
                return nativeFetch(input, init);
            });
    };
    W.fetch.__txPatched = true;


    const TX_AP_MUTED = new WeakSet();

    function txApVisible(el) {
        try {
            if (!el || el.tagName !== "VIDEO") return false;
            const r = el.getBoundingClientRect();
            if (r.width < 80 || r.height < 80) return false;
            const vw = window.innerWidth || 0, vh = window.innerHeight || 0;
            const w = Math.min(r.right, vw) - Math.max(r.left, 0);
            const h = Math.min(r.bottom, vh) - Math.max(r.top, 0);
            if (w <= 0 || h <= 0) return false;
            return (w * h) / (r.width * r.height) > 0.4;
        } catch (e) { return false; }
    }

    function txAutoplayRescue() {
        if (!isMobileDevice) return;
        const proto = W.HTMLMediaElement && W.HTMLMediaElement.prototype;
        if (!proto || proto.__txPlayPatched) return;
        const nativePlay = proto.play;
        const retry = function (el, left) {
            if (TX_AP_MUTED.has(el) || !el.isConnected) return;
            if (!txApVisible(el)) {
                if (left > 0) setTimeout(function () { retry(el, left - 1); }, 700);
                return;
            }
            TX_AP_MUTED.add(el);
            try { el.muted = true; } catch (e) {}
            log("自动播放被拦截，已静音重试:", String(el.currentSrc || "").slice(0, 60));
            Promise.resolve(nativePlay.apply(el)).then(function () {
                showToast("已静音自动播放，点画面里的喇叭可开声音");
            }).catch(function () {
                TX_AP_MUTED.delete(el);
            });
        };
        proto.play = function () {
            const el = this;
            const ret = nativePlay.apply(el, arguments);
            if (ret && typeof ret.then === "function") {
                ret.then(null, function (err) {
                    const name = (err && err.name) || "";
                    if (name !== "NotAllowedError" && name !== "AbortError") return;
                    if (name === "AbortError") return;
                    if (TX_AP_MUTED.has(el)) return;
                    retry(el, 3);
                });
            }
            return ret;
        };
        try { Object.defineProperty(proto, "__txPlayPatched", { value: true, writable: true, configurable: true }); } catch (e) {}
    }
    txAutoplayRescue();


    let isPcCached = null;

    function detectPC() {
        if (isPcCached !== null) return isPcCached;
        const ua = navigator.userAgent || "";
        const mobileUA = /Mobi|Android|iPhone|iPad|iPod|Windows Phone|IEMobile/i.test(ua);
        const wide = (window.innerWidth || document.documentElement.clientWidth || 0) > 768;
        const pcUA = /Windows NT|Macintosh|X11|Linux x86_64|CrOS/i.test(ua);
        isPcCached = !mobileUA && (wide || pcUA);
        return isPcCached;
    }

    
    function injectPcCss() {
        if (document.getElementById("tx-pc-optimize")) return;
        const css = [
            "html.tx-pc body { background-color: #0d0608 !important; }",
            "html.tx-pc .app-container {",
            "  max-width: 1200px !important;",
            "  margin-left: auto !important;",
            "  margin-right: auto !important;",
            "  box-shadow: 0 0 40px rgba(0,0,0,0.55);",
            "}",
            "html.tx-pc .video-item-combination .van-row,",
            "html.tx-pc .filter-list .van-row {",
            "  display: grid !important;",
            "  grid-template-columns: repeat(auto-fill, minmax(185px, 1fr)) !important;",
            "  gap: 14px 12px !important;",
            "}",
            "html.tx-pc .video-item-combination .van-col,",
            "html.tx-pc .filter-list .van-col {",
            "  width: auto !important;",
            "  max-width: none !important;",
            "  flex: 0 0 auto !important;",
            "  padding: 0 !important;",
            "}",
            "html.tx-pc .van-tabs__nav--scrollable {",
            "  overflow-x: visible !important;",
            "  flex-wrap: wrap !important;",
            "}",
            "html.tx-pc .bg-page .van-sticky .aspect-ratio {",
            "  max-width: 960px !important;",
            "  max-height: 62vh !important;",
            "  margin-left: auto !important;",
            "  margin-right: auto !important;",
            "  overflow: hidden !important;",
            "}",
            "html.tx-pc .bg-page .van-sticky .video-player-container {",
            "  max-height: 62vh !important;",
            "}",
            "html.tx-pc .van-sticky.van-sticky--fixed:has(.video-player-container),",
            "html.tx-pc .van-sticky.van-sticky--fixed:has(.aspect-ratio) {",
            "  position: static !important;",
            "  z-index: auto !important;",
            "}",
            "html.tx-pc .bg-page > div[style*=\"100vh\"] {",
            "  height: 70vh !important;",
            "  max-height: 70vh !important;",
            "}",
            "html.tx-pc .vlog-list {",
            "  width: 100% !important;",
            "  max-width: min(58vh, 50vw, 640px) !important;",
            "  margin-left: auto !important;",
            "  margin-right: auto !important;",
            "}",
            "html.tx-pc .bg-page:has(.vlog-list) .van-nav-bar--fixed {",
            "  max-width: min(58vh, 50vw, 640px) !important;",
            "  left: 50% !important;",
            "  right: auto !important;",
            "  transform: translateX(-50%) !important;",
            "}",
            "html.tx-pc .van-tabbar {",
            "  max-width: 1200px !important;",
            "  left: 50% !important;",
            "  right: auto !important;",
            "  transform: translateX(-50%) !important;",
            "}"
        ].join("\n");
        const style = document.createElement("style");
        style.id = "tx-pc-optimize";
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }

    
    function injectUiCss() {
        if (document.getElementById("tx-ui-style")) return;
        const isPc = detectPC();
        const css = [
            ".tx-fab{position:fixed;",
            isPc ? "left:16px;width:68px;height:68px;" : "left:8px;width:48px;height:48px;",
            "bottom:96px;z-index:2147483647;user-select:none;-webkit-user-select:none;",
            "touch-action:manipulation;}", 
            ".tx-fab-logo{width:100%;height:100%;border-radius:50%;object-fit:cover;",
            "border:2px solid #ffd54a;box-shadow:0 4px 16px rgba(0,0,0,.55);cursor:pointer;",
            "background:#1a1214;display:block;pointer-events:auto;}", 
            ".tx-fab-dot{position:absolute;top:-2px;right:-2px;",
            isPc ? "width:18px;height:18px;border:2px solid #0d0608;" : "width:12px;height:12px;border:1.5px solid #0d0608;",
            "border-radius:50%;background:#777;transition:background .3s,box-shadow .3s;pointer-events:none;}",
            ".tx-fab-dot.ok{background:#2ecc40;box-shadow:0 0 10px #2ecc40}",
            ".tx-fab-dot.err{background:#ff4136;box-shadow:0 0 10px #ff4136}",
            ".tx-fab-dot.wait{background:#f0ad4e;box-shadow:0 0 10px #f0ad4e}",
            ".tx-fab-panel{position:absolute;bottom:66px;left:0;",
            isPc ? "width:268px;padding:12px 14px;" : "width:200px;padding:10px 12px;",
            "background:rgba(22,15,17,.97);border:1px solid rgba(255,213,74,.35);",
            "border-radius:14px;color:#fff;font-size:12px;line-height:1.7;",
            "box-shadow:0 10px 34px rgba(0,0,0,.65);",
            "-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);",
            "z-index:2147483647;display:none;pointer-events:auto;}",
            ".tx-fab-title{font-size:13px;font-weight:600;color:#ffd54a;margin-bottom:6px;text-align:center}",
            ".tx-fab-row{display:flex;align-items:center;gap:6px;font-size:12px}",
            ".tx-fab-row b{margin-left:auto;font-weight:600;color:#ffd54a}",
            ".tx-dot{width:8px;height:8px;border-radius:50%;flex:none}",
            ".tx-dot.ok{background:#2ecc40}.tx-dot.err{background:#ff4136}.tx-dot.wait{background:#f0ad4e}",
            ".tx-fab-divider{height:1px;background:rgba(255,255,255,.12);margin:8px 0}",
            ".tx-fab-note{text-align:center;color:#ffd54a;font-weight:600;margin-bottom:4px;font-size:11px}",
            ".tx-fab-credit{font-size:10px;color:#cfc4c6}",
            ".tx-fab-credit a{color:#ffd54a;text-decoration:none}",
            ".tx-toast{position:fixed;top:16%;left:50%;transform:translateX(-50%);",
            "background:rgba(22,15,17,.96);color:#ffd54a;padding:11px 20px;border-radius:12px;",
            "font-size:13px;border:1px solid rgba(255,213,74,.45);box-shadow:0 8px 28px rgba(0,0,0,.55);",
            "z-index:2147483647;pointer-events:none;text-align:center;animation:txToastIn .25s ease-out}",
            "@keyframes txToastIn{from{opacity:0;transform:translate(-50%,-10px)}to{opacity:1;transform:translate(-50%,0)}}",
            ".tx-toast.tx-toast-hide{opacity:0;transition:opacity .45s}",
            ".tx-fab-dl{position:absolute;right:-6px;bottom:-6px;width:30px;height:30px;border-radius:50%;",
            "border:2px solid #0d0608;background:#2ecc40;color:#08210c;font-size:15px;font-weight:700;line-height:1;",
            "display:none;align-items:center;justify-content:center;padding:0;z-index:2;",
            "pointer-events:none;-webkit-tap-highlight-color:transparent}",
            ".tx-fab-dl.on{display:flex;animation:txDlPulse 1.8s ease-in-out infinite}",
            ".tx-fab-dl.busy{background:#f0ad4e;animation:none;font-size:12px;letter-spacing:-.5px}",
            "@keyframes txDlPulse{0%,100%{box-shadow:0 0 0 0 rgba(46,204,64,.7)}50%{box-shadow:0 0 0 7px rgba(46,204,64,0)}}",
            ".tx-dl-box{margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.12);display:none}",
            ".tx-dl-box.on{display:block}",
            ".tx-dl-head{font-size:12px;color:#fff;margin-bottom:4px}",
            ".tx-dl-kind{color:#ffd54a;font-weight:600}",
            ".tx-dl-info{font-size:10px;color:#9a8f90;line-height:1.6;word-break:break-all}",
            ".tx-dl-sel{width:100%;margin-top:6px;background:#231a1c;color:#fff;border:1px solid rgba(255,213,74,.35);",
            "border-radius:8px;padding:5px;font-size:11px}",
            ".tx-dl-bar{height:6px;border-radius:3px;background:rgba(255,255,255,.14);overflow:hidden;margin:8px 0 6px}",
            ".tx-dl-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#ffd54a,#f5b301);transition:width .25s}",
            ".tx-dl-status{font-size:10px;color:#cfc4c6;line-height:1.6;min-height:14px;word-break:break-all}",
            ".tx-dl-btns{display:flex;gap:6px;margin-top:8px}",
            ".tx-dl-btns button{flex:1;border:none;border-radius:8px;padding:7px 0;font-size:12px;",
            "font-weight:600;cursor:pointer;-webkit-tap-highlight-color:transparent}",
            ".tx-dl-go{background:linear-gradient(135deg,#ffd54a,#f5b301);color:#1a1214}",
            ".tx-dl-stop{background:rgba(255,255,255,.14);color:#fff}",
            ".tx-dl-alt{margin-top:8px;font-size:11px}",
            ".tx-dl-alt-title{color:#9a8f90;font-size:10px;margin-bottom:4px}",
            ".tx-dl-alt-row{display:flex;flex-wrap:wrap;gap:10px}",
            ".tx-dl-alt a{color:#9fd0ff;cursor:pointer;text-decoration:none}",
            ".tx-dl-alt a.off{color:#6b6167;cursor:not-allowed}",
            ".tx-dl-tip{margin-top:8px;font-size:10px;color:#9a8f90;line-height:1.65}"
        ].join("");
        const style = document.createElement("style");
        style.id = "tx-ui-style";
        style.textContent = css;
        (document.head || document.documentElement).appendChild(style);
    }

    
    function showToast(msg) {
        const t = document.createElement("div");
        t.className = "tx-toast";
        t.textContent = msg;
        document.body.appendChild(t);
        setTimeout(function () { 
            t.classList.add("tx-toast-hide"); 
            setTimeout(function () { t.remove(); }, 500); 
        }, 2600);
    }

    
    let serverStatusCache = { status: false, time: 0 };
    const SERVER_CHECK_INTERVAL = 60000;

    function checkServerOk() {
        const now = Date.now();
        if (now - serverStatusCache.time < SERVER_CHECK_INTERVAL) {
            return Promise.resolve(serverStatusCache.status);
        }

        return new Promise(function (resolve) {
            try {
                if (typeof GM_xmlhttpRequest === "undefined") { 
                    serverStatusCache = { status: false, time: now };
                    resolve(false); 
                    return; 
                }
                GM_xmlhttpRequest({
                    url: API_BASE + "/v1/health",
                    method: "GET",
                    timeout: 6000,
                    onload: function (res) {
                        let ok = false;
                        try {
                            const j = JSON.parse(res.responseText || "{}");
                            ok = res.status >= 200 && res.status < 300 && !!j.ok;
                            TX_RELAY.state = j.state || "";
                            TX_RELAY.contended = !!j.contended;
                        } catch (e) {}
                        serverStatusCache = { status: ok, time: now };
                        resolve(ok);
                    },
                    onerror: function () { 
                        serverStatusCache = { status: false, time: now };
                        resolve(false); 
                    },
                    ontimeout: function () { 
                        serverStatusCache = { status: false, time: now };
                        resolve(false); 
                    }
                });
            } catch (e) { 
                serverStatusCache = { status: false, time: now };
                resolve(false); 
            }
        });
    }

    
    let txFab = null;
    let refreshTimeout = null;

    function refreshFabStatus() {
        if (!txFab) return;
        if (refreshTimeout) {
            clearTimeout(refreshTimeout);
            refreshTimeout = null;
        }
        
        const dot = txFab.querySelector(".tx-fab-dot");
        const setRow = function (id, text, ok) {
            const b = txFab.querySelector(id);
            if (!b) return;
            b.textContent = text;
            const row = b.closest(".tx-fab-row");
            if (row) {
                const d = row.querySelector(".tx-dot");
                if (d) d.className = "tx-dot " + (ok ? "ok" : "err");
            }
        };

        if (dot) dot.className = "tx-fab-dot wait";
        const inj = true;
        const perm = typeof GM_xmlhttpRequest !== "undefined";
        setRow("#tx-st-inj", inj ? "已注入" : "未注入", inj);
        setRow("#tx-st-perm", perm ? "已授权" : "未授权", perm);

        checkServerOk().then(function (srv) {
            if (!txFab) return;
            const degraded = Date.now() < TX_RELAY.failUntil;
            const ok = srv && !degraded;
            const st = TX_RELAY.state === "cooling" ? "重试中" : (TX_RELAY.state === "stale" ? "待重连" : "正常");
            setRow("#tx-st-srv", ok ? st : (degraded ? "页面循环" : "异常"), ok);
            const dotEl = txFab.querySelector(".tx-fab-dot");
            if (dotEl) {
                dotEl.className = "tx-fab-dot " + (inj && perm && ok ? "ok" : "err");
            }
        });
    }

    
    function makeDraggable(el) {
        let dragging = false, moved = false, startX = 0, startY = 0;
        let origLeft = 0, origTop = 0;
        let lastMoveTime = 0;

        const moveTo = function (cx, cy) {
            if (!dragging) return;
            const now = Date.now();
            
            if (isMobileDevice && now - lastMoveTime < 50) return;
            lastMoveTime = now;

            const dx = cx - startX, dy = cy - startY;
            if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
            const size = isMobileDevice ? 48 : 68;
            const x = Math.min(window.innerWidth - size, Math.max(4, origLeft + dx));
            const y = Math.min(window.innerHeight - size - 50, Math.max(4, origTop + dy));
            el.style.left = x + "px";
            el.style.top = y + "px";
            el.style.bottom = "auto";
        };

        const onDown = function (e, cx, cy) {
            
            if (e.target && e.target.closest && e.target.closest(".tx-fab-panel")) {
                return;
            }
            
            if (e.type === 'click') return;
            
            dragging = true; 
            moved = false;
            startX = cx; 
            startY = cy;
            const r = el.getBoundingClientRect();
            origLeft = r.left; 
            origTop = r.top;
            el.style.transition = "none";
            
            
        };

        const stop = function () { 
            dragging = false; 
            el.style.transition = "";
            if (txPanelIsOpen()) txFitPanel();
        };

        
        el.addEventListener("mousedown", function (e) { 
            onDown(e, e.clientX, e.clientY); 
        });
        window.addEventListener("mousemove", function (e) { 
            moveTo(e.clientX, e.clientY); 
        });
        window.addEventListener("mouseup", stop);

       
        el.addEventListener("touchstart", function (e) { 
            if (e.touches[0]) {
                onDown(e, e.touches[0].clientX, e.touches[0].clientY);
            }
        }, { passive: true });

        window.addEventListener("touchmove", function (e) { 
            if (e.touches[0]) {
                moveTo(e.touches[0].clientX, e.touches[0].clientY);
                
                if (dragging && moved) {
                    e.preventDefault();
                }
            }
        }, { passive: false });

        window.addEventListener("touchend", stop);

        
        el.addEventListener("click", function (e) {
            
            if (moved) { 
                moved = false; 
                return; 
            }
            
            if (e.target && e.target.closest && e.target.closest(".tx-fab-panel")) {
                return;
            }
            
            const panel = el.querySelector(".tx-fab-panel");
            if (!panel) return;
            
            const show = panel.style.display !== "block";
            setPanel(show);
            if (show) {
                refreshFabStatus();
            }
        });
    }

    
    function createFab() {
        const wrap = document.createElement("div");
        wrap.className = "tx-fab";
        const isPc = detectPC();
        
        
        if (isMobileDevice) {
            wrap.innerHTML = `
                <img class="tx-fab-logo" src="${TX_LOGO}" alt="" referrerpolicy="no-referrer">
                <span class="tx-fab-dot wait"></span>
                <div class="tx-fab-panel" style="display:none">
                    <div class="tx-fab-title">糖心Vlog 解锁助手</div>
                    <div class="tx-fab-row"><span class="tx-dot wait"></span>脚本状态<b id="tx-st-inj">已注入</b></div>
                    <div class="tx-fab-row"><span class="tx-dot wait"></span>权限状态<b id="tx-st-perm">检测中</b></div>
                    <div class="tx-fab-row"><span class="tx-dot wait"></span>服务器<b id="tx-st-srv">检测中</b></div>
                    <div class="tx-fab-divider"></div>
                    <div class="tx-fab-note">免费脚本，禁止贩卖</div>
                    <div class="tx-fab-credit">解析服务: <a href="https://t.me/jsforbaby" target="_blank">baby佬（点我联系baby大大）</a></div>
                    <div class="tx-fab-credit">移植: <a href="https://t.me/ayase520" target="_blank">新垣绫濑的荷包蛋（点我跳转查看更多插件和反馈问题）</a></div>
                </div>
            `;
        } else {
            wrap.innerHTML = `
                <img class="tx-fab-logo" src="${TX_LOGO}" alt="" referrerpolicy="no-referrer">
                <span class="tx-fab-dot wait"></span>
                <div class="tx-fab-panel" style="display:block">
                    <div class="tx-fab-title">糖心Vlog 解锁助手</div>
                    <div class="tx-fab-row"><span class="tx-dot wait"></span>油猴脚本<b id="tx-st-inj">检测中</b></div>
                    <div class="tx-fab-row"><span class="tx-dot wait"></span>跨域权限<b id="tx-st-perm">检测中</b></div>
                    <div class="tx-fab-row"><span class="tx-dot wait"></span>服务器<b id="tx-st-srv">检测中</b></div>
                    <div class="tx-fab-divider"></div>
                    <div class="tx-fab-note">免费脚本，禁止贩卖</div>
                    <div class="tx-fab-credit">解锁功能来自 <a href="https://t.me/jsforbaby" target="_blank" rel="noopener">baby佬（点我联系baby大大）</a></div>
                    <div class="tx-fab-credit">下载功能和油猴移植来自 <a href="https://t.me/ayase520" target="_blank" rel="noopener">新垣绫濑的荷包蛋（点我跳转查看更多插件和反馈问题）</a></div>
                </div>
            `;
        }

        document.body.appendChild(wrap);
        txFab = wrap;
        makeDraggable(wrap);
        buildDownloadUi();
        
       
        setTimeout(refreshFabStatus, 1000);
        return wrap;
    }

    
    let routeCheckTimer = null;
    let lastToastPath = "";
    let lastVideoPath = "";


    function txOnDocClickGuard(e) {
        if (!TX_DL.busy) return;
        const a = e.target && e.target.closest ? e.target.closest("a[href]") : null;
        if (!a) return;
        if (a.closest(".tx-fab")) return;                 
        if (a.hasAttribute("download")) return;            
        const href = a.getAttribute("href") || "";
        if (!href || href.charAt(0) === "#" || /^(blob|data|javascript|mailto|tel):/i.test(href)) return;
        if (a.target && a.target !== "_self") return;
        try {
            if (new URL(a.href, location.href).origin !== location.origin) return;
        } catch (err) { return; }
        if (!confirmDownloadLeave()) {
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        
        TX_DL.leaving = true;
        stopDownload(true);
        showToast("已离开视频页，下载已中断");
    }

   
    function txPlayerSurfaceHit(t) {
        if (!t || !t.closest) return false;
        try {
            return !!(t.closest("video") || t.closest(".art-video-player") ||
                t.closest(".video-player-container") || t.closest(".player-pool") ||
                t.closest(".player-vertical") || t.closest(".van-sticky"));
        } catch (e) { return false; }
    }

    function txOnDocClickClosePanel(e) {
        if (!txFab || !e.target || (e.target.closest && e.target.closest(".tx-fab"))) return;
        const panel = txFab.querySelector(".tx-fab-panel");
        if (!panel || panel.style.display !== "block") return;
        
        if (isMobileDevice && txPlayerSurfaceHit(e.target)) return;
        setPanel(false);
    }

    function txBindDocListeners() {
        try {
            document.addEventListener("click", txOnDocClickGuard, true);
            document.addEventListener("click", txOnDocClickClosePanel);
        } catch (e) {}
    }


    function txDropPrevPageState() {
        const path = location.pathname;

        if (normPath(path) === normPath(lastVideoPath)) return;
        lastVideoPath = path;
        if (TX_DL.busy) { TX_DL.leaving = true; stopDownload(true); showToast("已切换页面，下载已中断"); }
        TX_DL.leaving = false;
        TX_DL.videos = [];
        TX_DL.current = "";
        TX_DL.source = "";
        TX_DL.kind = "";
        TX_DL.variants = [];
        TX_DL.chosen = "";
        TX_DL.duration = 0;
        TX_DL.probedFor = "";
        TX_DL.linkMaster = "";
        TX_DL.pct = 0;
        TX_DL.got = 0;
        TX_DL.total = 0;
        TX_DL.speed = 0;
        TX_DL.status = "";
        for (let i = 0; i < txPlayerRecs.length; i++) txPlayerRecs[i].dead = true;
        txBadCandidates.clear();
        txLineReset();
        txWeakSince = 0;
        if (!TX_DL.busy) { TX_DL.lastBlob = null; TX_DL.lastName = ""; }
        txRouteAt = performance.now();
        updateDownloadUi();
        setTimeout(scanPerformanceMedia, 1200);
        setTimeout(scanPerformanceMedia, 3500);
        setTimeout(scanPerformanceMedia, 8000);
    }

    function initUi() {
        injectUiCss();
        
        
        if (document.readyState === "complete") {
            setTimeout(createFab, 500);
        } else {
            window.addEventListener("load", function() {
                setTimeout(createFab, 500);
            });
        }

        function onRoute() {
            txDropPrevPageState();
            if (routeCheckTimer) {
                clearTimeout(routeCheckTimer);
                routeCheckTimer = null;
            }
            
            routeCheckTimer = setTimeout(function() {
                const path = location.pathname;
                
                
                if (txFab) {
                    txFab.style.display = "";
                }

                
                if (/\/detail\//.test(path) && path !== lastToastPath) {
                    lastToastPath = path;
                    if (isFirstLoad || !isMobileDevice) {
                        showToast("免费脚本，禁止贩卖，正在解锁中");
                        isFirstLoad = false;
                    }
                }

                
                if (detectPC() && !document.documentElement.classList.contains("tx-pc")) {
                    document.documentElement.classList.add("tx-pc");
                    injectPcCss();
                }

                routeCheckTimer = null;
            }, ROUTE_CHECK_THROTTLE);
        }

        
        onRoute();

        
        const origPush = history.pushState;
        history.pushState = function () {
            const r = origPush.apply(this, arguments);
            onRoute();
            return r;
        };

        const origReplace = history.replaceState;
        history.replaceState = function () {
            const r = origReplace.apply(this, arguments);
            onRoute();
            return r;
        };

        window.addEventListener("popstate", function () {
            if (TX_DL.busy) { TX_DL.leaving = true; stopDownload(true); showToast("已返回上一页，下载已中断"); }
            onRoute();
        });


        window.addEventListener("beforeunload", function (e) {
            if (!TX_DL.busy || TX_DL.leaving) return;
            e.preventDefault();
            e.returnValue = "视频正在下载中，离开会中断下载";
            return e.returnValue;
        });


        txBindDocListeners();

        if (!isMobileDevice) {
            console.log("[TX] 糖心Vlog 解锁油猴脚本已加载");
        }
        log("UI 已就绪");
    }

   
    function onDomReady(fn) {
        if (document.body) { 
            fn(); 
        } else { 
            document.addEventListener("DOMContentLoaded", fn); 
        }
    }


    const RX_MEDIA_URL = /https?:\/\/[^\s"'<>()\\]+?\.(?:m3u8|mp4|m4v|mov|webm)(?:\?[^\s"'<>()\\]*)?/i;
    const RX_MEDIA_URL_G = /https?:\/\/[^\s"'<>()\\]+?\.(?:m3u8|mp4|m4v|mov|webm)(?:\?[^\s"'<>()\\]*)?/ig;
    const RX_M3U8_URL = /\.m3u8(\?|#|$)/i;
    const RX_TS_URL = /\.(?:ts|m4s)(\?|#|$)/i;
    const RX_FILE_URL = /\.(?:mp4|m4v|mov|webm)(\?|#|$)/i;
    const DL_CONCURRENCY = isMobileDevice ? 4 : 6;

    const TX_DL = {
        videos: [],
        current: "",
        source: "",
        kind: "",
        variants: [],
        chosen: "",
        duration: 0,
        probedFor: "",
        linkMaster: "",
        leaving: false,
        busy: false,
        cancel: false,
        abort: null,
        pct: 0,
        got: 0,
        total: 0,
        speed: 0,
        startedAt: 0,
        lastBlob: null,
        lastName: "",
        status: ""
    };
    let txDlEls = null;
    let txMuxPromise = null;
    let txProbeTimer = null;
    let txRouteAt = 0;


    const MUX_CDNS = [
        "https://cdn.jsdelivr.net/npm/mux.js@7.1.0/dist/mux.min.js",
        "https://fastly.jsdelivr.net/npm/mux.js@7.1.0/dist/mux.min.js",
        "https://npm.elemecdn.com/mux.js@7.1.0/dist/mux.min.js",
        "https://cdn.staticfile.org/mux.js/7.1.0/mux.min.js",
        "https://lib.baomitu.com/mux.js/7.1.0/mux.min.js",
        "https://unpkg.com/mux.js@7.1.0/dist/mux.min.js"
    ];

    function isDownloadableVideo(u) {
        if (!u || typeof u !== "string") return false;
        if (!/^https?:\/\//i.test(u)) return false;
        if (!RX_MEDIA_URL.test(u)) return false;
        if (RX_TS_URL.test(u) && !RX_M3U8_URL.test(u)) return false;
        return true;
    }

    function segBase(u) {
        try {
            const x = new URL(u);
            return x.origin + x.pathname.replace(/[^/]*$/, "");
        } catch (e) {
            return String(u).replace(/[^/]*$/, "");
        }
    }


    const txPlayerRecs = [];
    const txBadCandidates = new Map();
    let txWeakSince = 0;

    function txMediaOf(rec) {
        try {
            if (!rec) return null;
            return (rec.hls && rec.hls.media) || rec.media || null;
        } catch (e) { return null; }
    }

    function txMediaVisible(m) {
        try {
            if (!m || m.isConnected === false) return false;
            const r = m.getBoundingClientRect();
            if (!r || r.width < 2 || r.height < 2) return false;
            const vw = window.innerWidth || 0;
            const vh = window.innerHeight || 0;
            const ix = Math.min(r.right, vw) - Math.max(r.left, 0);
            const iy = Math.min(r.bottom, vh) - Math.max(r.top, 0);
            if (ix <= 0 || iy <= 0) return false;
            return (ix / Math.min(r.width, vw)) >= 0.5 && (iy / Math.min(r.height, vh)) >= 0.5;
        } catch (e) { return false; }
    }

    function txRecordPlayerUrl(url, hls, media) {
        try {
            if (!url || typeof url !== "string") return;
            try { url = new URL(url, location.href).href; } catch (e) {}
            if (!/^https?:\/\//i.test(url)) return;
            if (!RX_M3U8_URL.test(url) && !RX_FILE_URL.test(url)) return;
            let rec = null;
            for (let i = 0; i < txPlayerRecs.length; i++) {
                const r = txPlayerRecs[i];
                if (hls && r.hls === hls) { rec = r; break; }
                if (!hls && !r.hls && r.url === url && r.media === media) { rec = r; break; }
            }
            if (!rec) {
                rec = { url: url, at: 0, hls: hls || null, media: media || null, dead: false };
                txPlayerRecs.push(rec);
                if (txPlayerRecs.length > 12) txPlayerRecs.shift();
            }
            rec.url = url;
            rec.at = Date.now();
            rec.dead = false;
            if (media) rec.media = media;
            log("播放器来源:", url);
            recordRequest(url, "播放器");
        } catch (e) {}
    }


    function txCenterDist(m) {
        try {
            const r = m.getBoundingClientRect();
            const vw = window.innerWidth || 1;
            const vh = window.innerHeight || 1;
            const dx = Math.abs((r.left + r.right) / 2 - vw / 2) / vw;
            const dy = Math.abs((r.top + r.bottom) / 2 - vh / 2) / vh;
            return dx + dy;
        } catch (e) { return 9; }
    }


    function pickPlayerRec() {
        const now = Date.now();
        let playing = null;
        let playingAny = null;
        let visible = null;
        let latest = null;
        let playingKey = -1;
        let anyKey = -1;
        let visibleKey = -1;
        let latestKey = -1;
        let playingCenter = 9;
        let visibleCenter = 9;
        for (let i = 0; i < txPlayerRecs.length; i++) {
            const r = txPlayerRecs[i];
            if (r.dead) continue;
            if (now - r.at > 12 * 3600 * 1000) continue;
            const m = txMediaOf(r);
            if (!m || m.isConnected === false) continue;
            const live = !m.paused && !m.ended;
            if (live) r.playAt = now;

            const key = r.playAt || r.at;
            if (key > latestKey) { latestKey = key; latest = r; }

            if (live && r.at > anyKey) { anyKey = r.at; playingAny = r; }
            if (!txMediaVisible(m)) continue;

            const c = txCenterDist(m);
            if (visible === null || c < visibleCenter - 0.01 || (Math.abs(c - visibleCenter) <= 0.01 && key > visibleKey)) {
                visibleCenter = c; visibleKey = key; visible = r;
            }
            if (live && (playing === null || c < playingCenter - 0.01 || (Math.abs(c - playingCenter) <= 0.01 && r.at > playingKey))) {
                playingCenter = c; playingKey = r.at; playing = r;
            }
        }
        return playing || playingAny || visible || latest;
    }


    function txLiveDuration() {
        const m = txMediaOf(pickPlayerRec());
        if (m && isFinite(m.duration) && m.duration > 0) return m.duration;
        try {
            const vs = document.querySelectorAll("video");
            for (let i = 0; i < vs.length; i++) {
                const v = vs[i];
                if (!v.paused && !v.ended && isFinite(v.duration) && v.duration > 0) return v.duration;
            }
        } catch (e) {}
        return 0;
    }

    function txDurMatch(a, b) {
        if (!a || !b) return true;
        return Math.abs(a - b) <= Math.max(3, Math.max(a, b) * 0.06);
    }


    function txPickKind(r) {
        try {
            const m = txMediaOf(r);
            if (!m || m.isConnected === false) return "latest";
            if (!m.paused && !m.ended) return "playing";
            if (txMediaVisible(m)) return "visible";
            return "latest";
        } catch (e) { return "latest"; }
    }

    function txGrabHlsModule(mod) {
        try {
            const C = mod && (mod.a || mod.default);
            if (!C || typeof C !== "function" || !C.prototype || typeof C.prototype.loadSource !== "function") return false;
            if (C.prototype.loadSource.__txHooked) return true;
            const origLoad = C.prototype.loadSource;
            const wLoad = function (url) {
                try { txRecordPlayerUrl(String(url), this, null); } catch (e) {}
                return origLoad.apply(this, arguments);
            };
            wLoad.__txHooked = true;
            C.prototype.loadSource = wLoad;
            const origAttach = C.prototype.attachMedia;
            if (typeof origAttach === "function" && !origAttach.__txHooked) {
                const wAttach = function (media) {
                    try { if (this.url) txRecordPlayerUrl(String(this.url), this, media); } catch (e) {}
                    return origAttach.apply(this, arguments);
                };
                wAttach.__txHooked = true;
                C.prototype.attachMedia = wAttach;
            }
            const origDestroy = C.prototype.destroy;
            if (typeof origDestroy === "function" && !origDestroy.__txHooked) {
                const wDestroy = function () {
                    try {
                        for (let i = 0; i < txPlayerRecs.length; i++) {
                            if (txPlayerRecs[i].hls === this) txPlayerRecs[i].dead = true;
                        }
                    } catch (e) {}
                    return origDestroy.apply(this, arguments);
                };
                wDestroy.__txHooked = true;
                C.prototype.destroy = wDestroy;
            }
            log("已挂接 hls.js：可精确识别当前播放的视频");
            return true;
        } catch (e) { return false; }
    }

    function txTapModules(chunk) {
        try {
            const mods = chunk && chunk[1];
            if (!mods || typeof mods !== "object") return;
            for (const id in mods) {
                if (!Object.prototype.hasOwnProperty.call(mods, id)) continue;
                const orig = mods[id];
                if (typeof orig !== "function" || orig.__txTap) continue;
                const tap = function (mod, exp) {
                    const r = orig.apply(this, arguments);
                    try { txGrabHlsModule(mod); txGrabHlsModule(exp); } catch (e) {}
                    return r;
                };
                tap.__txTap = true;
                mods[id] = tap;
            }
        } catch (e) {}
    }


    let txWpBound = false;
    let txPushDepth = 0;
    let txPushBails = 0;

    function txWrapPush(arr) {
        if (!arr || arr.__txPushWrapped) return arr;
        let base = Array.prototype.push;
        try {
            const d = Object.getOwnPropertyDescriptor(arr, "push");
            if (d && typeof d.value === "function") base = d.value;
            else if (d && typeof d.get === "function" && typeof arr.push === "function") base = arr.push;
        } catch (e) {}
        const wrap = function (fn) {
            const w = function (chunk) {

                if (txPushDepth > 16) { txPushBails++; return; }
                txPushDepth++;
                try {
                    try { txTapModules(chunk); } catch (e) {}
                    return fn.apply(this, arguments);
                } finally { txPushDepth--; }
            };
            w.__txWrapped = true;
            return w;
        };
        let real = base;
        if (base !== Array.prototype.push && !base.__txWrapped) real = wrap(base);
        Object.defineProperty(arr, "push", {
            configurable: true,
            get: function () { return real; },
            set: function (fn) {
                if (typeof fn !== "function") { real = fn; return; }
                if (fn === real || fn.__txWrapped) return;
                real = wrap(fn);
            }
        });
        try { Object.defineProperty(arr, "__txPushWrapped", { value: true, configurable: true }); }
        catch (e) { arr.__txPushWrapped = true; }
        return arr;
    }

    function txHookWebpack() {
        try {
            let store = W.webpackJsonp;
            if (txWpBound) { txWrapPush(store); return true; }

            Object.defineProperty(W, "webpackJsonp", {
                configurable: true,
                enumerable: true,
                get: function () { return store; },
                set: function (v) { store = v; try { txWrapPush(v); } catch (e) {} }
            });
            txWpBound = true;
            if (store) txWrapPush(store);
            return true;
        } catch (e) { return false; }
    }


    function txHookMediaSrc() {
        try {
            const proto = W.HTMLMediaElement && W.HTMLMediaElement.prototype;
            if (!proto) return;
            const resolveUrl = function (v) {
                const raw = String(v == null ? "" : v).trim();
                if (!raw || /^(blob|data|about|javascript):/i.test(raw)) return "";
                try { return new URL(raw, location.href).href; } catch (e) { return ""; }
            };
            const pick = function (el, v) {
                try {
                    if (!el || el.__txSelf) return;
                    const s = resolveUrl(v);
                    if (s && (RX_M3U8_URL.test(s) || RX_FILE_URL.test(s))) txRecordPlayerUrl(s, null, el);
                } catch (e) {}
            };
            const d = Object.getOwnPropertyDescriptor(proto, "src");
            if (d && d.set && !d.set.__txHooked) {
                const oset = d.set;
                const setter = function (v) { pick(this, v); return oset.call(this, v); };
                setter.__txHooked = true;
                Object.defineProperty(proto, "src", { configurable: true, enumerable: d.enumerable, get: d.get, set: setter });
            }
            const oSetAttr = proto.setAttribute;
            if (typeof oSetAttr === "function" && !oSetAttr.__txHooked) {
                const setAttr = function (name, value) {
                    try {
                        if (String(name).toLowerCase() === "src" && this.tagName === "VIDEO") pick(this, value);
                    } catch (e) {}
                    return oSetAttr.apply(this, arguments);
                };
                setAttr.__txHooked = true;
                proto.setAttribute = setAttr;
            }
        } catch (e) {}
    }

    txHookWebpack();
    txHookMediaSrc();

    function recordRequest(url, source) {
        try {
            const u = String(url || "").replace(/\\\//g, "/");
            if (!/^https?:\/\//i.test(u)) return;
            const isHls = RX_M3U8_URL.test(u);
            const isFile = RX_FILE_URL.test(u);
            const isSeg = !isHls && !isFile && RX_TS_URL.test(u);
            if (!isHls && !isFile && !isSeg) return;
            const now = Date.now();
            const list = TX_DL.videos;
            let sameDir = false;
            for (let i = 0; i < list.length; i++) {
                if (RX_M3U8_URL.test(list[i].url) && segBase(list[i].url) === segBase(u)) { sameDir = true; break; }
            }
            if (isHls || (isFile && !sameDir)) {
                let cd = list.find(function (v) { return v.url === u; });
                if (!cd) {
                    cd = { url: u, source: source || "嗅探", at: now, segAt: 0, segCount: 0 };
                    list.unshift(cd);
                } else {
                    cd.at = now;
                    if (source) cd.source = source;
                }
                if (list.length > 6) list.length = 6;
                log("嗅探到播放列表:", u, source || "");
            } else {
                let cd = null;
                for (let i = 0; i < list.length; i++) {
                    if (RX_M3U8_URL.test(list[i].url) && segBase(list[i].url) === segBase(u)) { cd = list[i]; break; }
                }

                if (!cd) {
                    const head = list[0];
                    if (head && now - head.at < 8000) cd = head;
                }
                if (!cd) return;
                cd.segAt = now;
                cd.segCount = (cd.segCount || 0) + 1;
            }
            refreshPick();
        } catch (e) {}
    }

    function pickBestCandidate() {
        const list = TX_DL.videos;
        const now = Date.now();
        let best = null;
        let bestScore = -1;
        let fallback = null;
        let fallbackScore = -1;
        for (let i = 0; i < list.length; i++) {
            const v = list[i];
            const playing = v.segAt && (now - v.segAt < 90000);
            const score = playing ? (1e13 + v.segAt) : v.at;
            if (score > fallbackScore) { fallbackScore = score; fallback = v; }
            if (txBadCandidates.has(v.url) && now - txBadCandidates.get(v.url) < 120000) continue;
            if (score > bestScore) { bestScore = score; best = v; }
        }
        return best || fallback;
    }
    function switchTo(url, source) {
        TX_DL.current = url;
        TX_DL.source = source || "嗅探";
        TX_DL.kind = RX_M3U8_URL.test(url) ? "hls" : "file";
        TX_DL.variants = [];
        TX_DL.chosen = "";
        TX_DL.status = "";
        TX_DL.duration = 0;
        TX_DL.probedFor = "";
        log("发现视频地址:", TX_DL.kind, url);
        updateDownloadUi();
        scheduleProbe();
    }

    function rememberMaster(url) {
        try {
            const list = TX_DL.videos;
            let selfAt = Date.now();
            for (let i = 0; i < list.length; i++) {
                if (list[i].url === url) { selfAt = list[i].at; break; }
            }

            const cands = list.filter(function (v) {
                return v.url !== url && RX_M3U8_URL.test(v.url) && v.at <= selfAt + 1000 && Date.now() - v.at < 10 * 60000;
            });
            if (cands.length) TX_DL.linkMaster = cands[0].url;
        } catch (e) {}
    }

    function refreshPick() {
        const rec = pickPlayerRec();
        if (rec && rec.url) {
            if (TX_DL.busy && TX_DL.current) { updateDownloadUi(); return; }
            if (TX_DL.current === rec.url) {
                TX_DL.source = "播放器";
                const m = txMediaOf(rec);
                if (m && isFinite(m.duration) && m.duration > 0) TX_DL.duration = m.duration;
                updateDownloadUi();
                return;
            }

            if (txPickKind(rec) === "latest" && TX_DL.current) {
                if (!txWeakSince) txWeakSince = Date.now();
                if (Date.now() - txWeakSince < 6000) { updateDownloadUi(); return; }
            } else {
                txWeakSince = 0;
            }
            rememberMaster(rec.url);
            switchTo(rec.url, "播放器");
            return;
        }


        const best = pickBestCandidate();
        if (!best) return;
        const known = TX_DL.current === best.url || TX_DL.variants.some(function (v) { return v.url === best.url; });
        if (known) { if (best.source) TX_DL.source = best.source; updateDownloadUi(); return; }
        if (TX_DL.busy && TX_DL.current) { log("下载中，暂不切换解析目标:", best.url); updateDownloadUi(); return; }
        rememberMaster(best.url);
        switchTo(best.url, best.source);
    }

    function noteVideoUrl(url, source) {
        recordRequest(url, source);
    }


    function scheduleProbe() {
        if (txProbeTimer) { clearTimeout(txProbeTimer); txProbeTimer = null; }
        txProbeTimer = setTimeout(function () {
            txProbeTimer = null;
            runProbe();
        }, 1200);
    }

    async function runProbe() {
        const target = TX_DL.current;
        if (!target || TX_DL.busy || TX_DL.probedFor === target) return;
        TX_DL.probedFor = target;
        try {
            let dur = 0;
            if (TX_DL.kind === "hls") {
                const pl = await resolveMediaPlaylist(target);
                if (TX_DL.current !== target) return;
                if (pl && pl.duration) dur = pl.duration;
            } else {
                dur = await probeFileDuration(target);
                if (TX_DL.current !== target) return;
            }

            const live = txLiveDuration();
            if (live > 0 && dur > 0 && !txDurMatch(live, dur)) {
                log("时长对不上:", target, "在播=" + Math.round(live) + "s", "解析到=" + Math.round(dur) + "s");
                if (TX_DL.source === "播放器") {

                    TX_DL.duration = live;
                    if (!TX_DL.busy) setDlStatus("已就绪，点击「开始下载」保存到本机", 0);
                    return;
                }
                txBadCandidates.set(target, Date.now());
                if (!TX_DL.busy) {
                    const rec = pickPlayerRec();
                    if (rec && rec.url && rec.url !== target) { switchTo(rec.url, "播放器"); return; }
                    const next = pickBestCandidate();
                    if (next && next.url !== target) { switchTo(next.url, next.source); return; }
                    setDlStatus("时长和正在播放的对不上，请确认画面一致再下载", 0);
                    return;
                }
            }
            if (dur) TX_DL.duration = dur;
            else if (live > 0) TX_DL.duration = live;
            if (!TX_DL.busy) setDlStatus("已就绪，点击「开始下载」保存到本机", 0);
        } catch (e) {
            log("预解析失败（不影响下载）:", e && e.message);
        }
    }

    function probeFileDuration(url) {
        return new Promise(function (resolve) {
            let done = false;
            let v = null;
            const fin = function (sec) {
                if (done) return;
                done = true;
                try { if (v) { v.removeAttribute("src"); v.load(); v.remove(); } } catch (e) {}
                resolve(sec || 0);
            };
            try {
                v = document.createElement("video");
                v.preload = "metadata";
                v.muted = true;
                v.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0;pointer-events:none";
                v.addEventListener("loadedmetadata", function () {
                    fin(isFinite(v.duration) && v.duration > 0 ? v.duration : 0);
                });
                v.addEventListener("error", function () { fin(0); });
                (document.body || document.documentElement).appendChild(v);
                v.__txSelf = true;
                v.src = url;
                setTimeout(function () { fin(0); }, 8000);
            } catch (e) { fin(0); }
        });
    }

    function sniffMedia(text, source) {
        try {
            if (!text || typeof text !== "string") return;
            if (text.length < 8 || text.length > 4 * 1024 * 1024) return;
            if (text.indexOf("m3u8") < 0 && text.indexOf(".mp4") < 0) return;
            const t = text.replace(/\\\//g, "/");
            const m = t.match(RX_MEDIA_URL_G);
            if (!m) return;
            for (let i = 0; i < m.length && i < 6; i++) noteVideoUrl(m[i], source);
        } catch (e) {}
    }

    function scanPerformanceMedia() {
        try {
            if (!performance.getEntriesByType) return;
            const es = performance.getEntriesByType("resource") || [];
            const from = Math.max(0, es.length - 120);
            for (let i = es.length - 1; i >= from; i--) {
                const e = es[i];
                const n = e && e.name;
                if (!n) continue;

                if (txRouteAt && e.startTime < txRouteAt) continue;
                if (RX_M3U8_URL.test(n)) recordRequest(n, "资源记录");
            }
        } catch (e) {}
    }

    function resolveUrl(u, base) {
        try { return new URL(u, base).href; } catch (e) { return u; }
    }

    function isSameOrigin(u) {
        try { return new URL(u, location.href).origin === location.origin; } catch (e) { return false; }
    }

    function fmtBytes(n) {
        if (!n || n < 0) return "0 B";
        if (n < 1024) return n + " B";
        if (n < 1048576) return (n / 1024).toFixed(1) + " KB";
        if (n < 1073741824) return (n / 1048576).toFixed(1) + " MB";
        return (n / 1073741824).toFixed(2) + " GB";
    }

    function fmtDur(s) {
        if (!s || s < 0) return "";
        s = Math.round(s);
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const ss = s % 60;
        const pad = function (n) { return (n < 10 ? "0" : "") + n; };
        return h ? (h + ":" + pad(m) + ":" + pad(ss)) : (m + ":" + pad(ss));
    }

    function gmGet(url, asText, timeoutMs) {
        return new Promise(function (resolve, reject) {
            try {
                GM_xmlhttpRequest({
                    url: url,
                    method: "GET",
                    timeout: timeoutMs || 30000,
                    responseType: asText ? "text" : "arraybuffer",
                    onload: function (res) {
                        if (res.status >= 200 && res.status < 300) {
                            resolve(asText ? (res.responseText || "") : res.response);
                        } else {
                            reject(new Error("HTTP " + res.status));
                        }
                    },
                    onerror: function () { reject(new Error("网络错误")); },
                    ontimeout: function () { reject(new Error("超时")); }
                });
            } catch (e) { reject(e); }
        });
    }

    const DL_REQ_TIMEOUT = 45000;

    function dlGet(url, asText) {
        const ac = (typeof AbortController !== "undefined") ? new AbortController() : null;
        const cancel = function () { if (ac) { try { ac.abort(); } catch (e) {} } };
        const relay = function () { cancel(); };
        if (ac && TX_DL.abort) {
            try {
                if (TX_DL.abort.signal.aborted) cancel();
                else TX_DL.abort.signal.addEventListener("abort", relay);
            } catch (e) {}
        }
        const timer = ac ? setTimeout(cancel, DL_REQ_TIMEOUT) : null;
        const done = function () {
            if (timer) clearTimeout(timer);
            if (ac && TX_DL.abort) { try { TX_DL.abort.signal.removeEventListener("abort", relay); } catch (e) {} }
        };
        const tryDirect = nativeFetch(url, {
            credentials: isSameOrigin(url) ? "include" : "omit",
            cache: "no-store",
            mode: "cors",
            signal: ac ? ac.signal : (TX_DL.abort ? TX_DL.abort.signal : undefined)
        }).then(function (r) {
            if (!r.ok) throw new Error("HTTP " + r.status);
            return asText ? r.text() : r.arrayBuffer();
        });
        return tryDirect.catch(function (err) {
            if (TX_DL.cancel) throw err;
            log("直连失败，改用解析服务器备用线路:", url, err && err.message);
            return gmGet(buildTarget(url), asText);
        }).then(function (v) {
            done();
            if (!asText && (!v || !v.byteLength)) throw new Error("空响应");
            if (asText && typeof v !== "string") throw new Error("响应异常");
            return v;
        }, function (err) {
            done();
            throw err;
        });
    }

    function parsePlaylist(text, baseUrl) {
        const lines = String(text).split(/\r?\n/);
        const out = { master: false, variants: [], segments: [], key: null, map: null, duration: 0, mediaSeq: 0 };

        if (/#EXT-X-STREAM-INF/i.test(text)) {
            out.master = true;
            for (let i = 0; i < lines.length; i++) {
                const ln = lines[i].trim();
                if (!/^#EXT-X-STREAM-INF/i.test(ln)) continue;
                const bw = (ln.match(/BANDWIDTH=(\d+)/i) || [])[1];
                const rs = (ln.match(/RESOLUTION=([0-9]+x[0-9]+)/i) || [])[1] || "";
                for (let j = i + 1; j < lines.length; j++) {
                    const nx = lines[j].trim();
                    if (!nx) continue;
                    if (nx.charAt(0) === "#") break;
                    out.variants.push({
                        url: resolveUrl(nx, baseUrl),
                        bandwidth: Number(bw) || 0,
                        resolution: rs
                    });
                    break;
                }
            }
            out.variants.sort(function (a, b) { return b.bandwidth - a.bandwidth; });
            return out;
        }

        let dur = 0;
        for (let i = 0; i < lines.length; i++) {
            const ln = lines[i].trim();
            if (!ln) continue;
            if (/^#EXT-X-MEDIA-SEQUENCE/i.test(ln)) {
                out.mediaSeq = parseInt((ln.match(/:\s*(\d+)/) || [])[1] || "0", 10) || 0;
            } else if (/^#EXT-X-KEY/i.test(ln)) {
                const method = (ln.match(/METHOD=([^,]+)/i) || [])[1] || "";
                if (!method || /NONE/i.test(method)) {
                    out.key = null;
                } else {
                    const uri = (ln.match(/URI="([^"]+)"/i) || [])[1] || "";
                    out.key = {
                        method: method.toUpperCase(),
                        uri: uri ? resolveUrl(uri, baseUrl) : "",
                        iv: (ln.match(/IV=0x([0-9A-Fa-f]+)/i) || [])[1] || ""
                    };
                }
            } else if (/^#EXT-X-MAP/i.test(ln)) {
                const u = (ln.match(/URI="([^"]+)"/i) || [])[1] || "";
                if (u) out.map = resolveUrl(u, baseUrl);
            } else if (/^#EXTINF/i.test(ln)) {
                dur = parseFloat((ln.match(/^#EXTINF:\s*([0-9.]+)/i) || [])[1] || "0") || 0;
            } else if (/^#EXT-X-BYTERANGE/i.test(ln)) {
                out.byteRange = true;
            } else if (ln.charAt(0) === "#") {
                continue;
            } else {
                out.segments.push({ url: resolveUrl(ln, baseUrl), dur: dur });
                dur = 0;
            }
        }
        for (let i = 0; i < out.segments.length; i++) out.duration += out.segments[i].dur || 0;
        return out;
    }

    const TX_LN = {
        sig: "",
        videoId: "",
        lines: [],
        cur: -1,
        best: -1,
        bestLine: null,
        score: {},
        racedSig: "",
        pending: null,
        retryAt: 0,
        applied: false,
        userTouched: false,
        vlog: false,
        stallMs: 0,
        vlogRetry: 0,
        lastCur: 0,
        at: 0
    };
    const TX_LN_PROBE_MS = 8000;
    const TX_LN_FAST_MS = 1500;
    const TX_LN_RETRY_MS = 15000;

    function txLineReset() {
        TX_LN.sig = "";
        TX_LN.videoId = "";
        TX_LN.lines = [];
        TX_LN.cur = -1;
        TX_LN.best = -1;
        TX_LN.bestLine = null;
        TX_LN.score = {};
        TX_LN.racedSig = "";
        TX_LN.pending = null;
        TX_LN.retryAt = 0;
        TX_LN.applied = false;
        TX_LN.userTouched = false;
        TX_LN.vlog = false;
        TX_LN.stallMs = 0;
        TX_LN.vlogRetry = 0;
        TX_LN.lastCur = 0;
    }

    function txHostOf(u) {
        try { return new URL(u).host; } catch (e) { return ""; }
    }


    function txVueRoot() {
        try {
            const sel = ["#app", "#__nuxt", "#__layout", "#nuxt"];
            for (let i = 0; i < sel.length; i++) {
                const el = document.querySelector(sel[i]);
                if (el && el.__vue__) return el.__vue__;
            }
            const body = document.body;
            if (body) {
                const kids = body.children;
                for (let i = 0; i < kids.length && i < 12; i++) {
                    if (kids[i] && kids[i].__vue__) return kids[i].__vue__;
                }
            }
            const all = document.querySelectorAll("body *");
            for (let i = 0; i < all.length && i < 200; i++) {
                if (all[i].__vue__) return all[i].__vue__;
            }
        } catch (e) {}
        return null;
    }


    function txFindDetailVm() {
        try {
            const start = txVueRoot();
            if (!start) return null;
            const queue = [start];
            const seen = new Set();
            let n = 0;
            while (queue.length && n < 400) {
                const vm = queue.shift();
                if (!vm || seen.has(vm)) continue;
                seen.add(vm);
                n++;
                try {
                    if (vm.r && Array.isArray(vm.r.lines)) return vm;
                } catch (e) {}
                const kids = vm.$children;
                if (kids && kids.length) for (let i = 0; i < kids.length; i++) queue.push(kids[i]);
            }
        } catch (e) {}
        return null;
    }


    function txProbeFetch(url, ms, wantText) {
        return new Promise(function (resolve) {
            let done = false;
            let ac = null;
            try { ac = (typeof AbortController !== "undefined") ? new AbortController() : null; } catch (e) {}
            const t0 = performance.now();
            const timer = setTimeout(function () {
                if (done) return;
                done = true;
                try { if (ac) ac.abort(); } catch (e) {}
                resolve({ ok: false, ms: performance.now() - t0, err: "超时" });
            }, ms);
            const fin = function (v) {
                if (done) return;
                done = true;
                clearTimeout(timer);
                resolve(v);
                try { if (ac) ac.abort(); } catch (e) {}
            };
            const opts = { cache: "no-store", mode: "cors", credentials: isSameOrigin(url) ? "include" : "omit" };
            if (ac) opts.signal = ac.signal;
            nativeFetch(url, opts).then(function (res) {
                if (done) { try { if (ac) ac.abort(); } catch (e) {} return; }
                if (!res.ok && res.status !== 206) {
                    fin({ ok: false, ms: performance.now() - t0, err: "HTTP " + res.status });
                    return;
                }
                const ok = function (text) {
                    fin({ ok: true, ms: performance.now() - t0, text: text || "" });
                };
                if (wantText) { res.text().then(ok, function () { ok(""); }); return; }
                let reader = null;
                try { reader = (res.body && res.body.getReader) ? res.body.getReader() : null; } catch (e) {}
                if (!reader) { ok(""); return; }
                reader.read().then(function () { ok(""); }, function () { ok(""); });
            }, function (e) {
                fin({ ok: false, ms: performance.now() - t0, err: String((e && e.message) || e) });
            });
        });
    }


    function txProbeLine(line) {
        const r = { index: line.index, name: line.name, ok: false, ms: Infinity, err: "", plMs: 0, segMs: 0, keyMs: 0, host: "" };
        return txProbeFetch(line.url, TX_LN_PROBE_MS, true).then(function (p0) {
            r.plMs = p0.ms;
            if (!p0.ok) { r.err = p0.err || "线路无响应"; r.ms = p0.ms; return r; }
            let pl = null;
            try { pl = parsePlaylist(p0.text || "", line.url); } catch (e) {}
            if (!pl) { r.err = "列表解析失败"; r.ms = p0.ms; return r; }
            const next = (pl.master && pl.variants.length) ? pl.variants[0].url : "";
            const p1 = next ? txProbeFetch(next, TX_LN_PROBE_MS, true).then(function (q) {
                if (q.ok) {
                    try { pl = parsePlaylist(q.text || "", next); r.plMs += q.ms; } catch (e) {}
                }
                return q;
            }) : Promise.resolve({ ok: true, ms: 0 });
            return p1.then(function () {
                const seg = (pl.segments && pl.segments[0]) ? pl.segments[0].url : "";
                const keyUri = (pl.key && pl.key.uri) ? pl.key.uri : "";
                if (!seg) { r.err = "没有分片"; r.ms = r.plMs; return r; }
                r.host = txHostOf(seg);
                const jSeg = txProbeFetch(seg, TX_LN_PROBE_MS, false);
                const jKey = keyUri ? txProbeFetch(keyUri, TX_LN_PROBE_MS, false) : Promise.resolve({ ok: true, ms: 0 });
                return Promise.all([jSeg, jKey]).then(function (a) {
                    const s = a[0];
                    const k = a[1];
                    r.segMs = s.ms;
                    r.keyMs = k.ms;
                    r.ok = !!s.ok && !!k.ok;
                    r.ms = r.plMs + (s.ok ? s.ms : TX_LN_PROBE_MS) + (k.ok ? k.ms : 0);
                    if (!s.ok) r.err = "分片" + (s.err || "失败");
                    else if (!k.ok) r.err = "密钥" + (k.err || "失败");
                    return r;
                });
            });
        }, function (e) {
            r.err = String((e && e.message) || e);
            return r;
        });
    }


function txFindVlogVm() {
    try {
        const start = txVueRoot();
        if (!start) return null;
        const queue = [start];
        const seen = new Set();
        let n = 0;
        while (queue.length && n < 400) {
            const vm = queue.shift();
            if (!vm || seen.has(vm)) continue;
            seen.add(vm);
            n++;
            try {
                const pi = vm.playerInfo;
                if (pi && Array.isArray(pi.lines) && pi.lines.length) return vm;
            } catch (e) {}
            const kids = vm.$children;
            if (kids && kids.length) for (let i = 0; i < kids.length; i++) queue.push(kids[i]);
        }
    } catch (e) {}
    return null;
}


function txLineSoon() {
    if (txLineSoon.timer) return;
    txLineSoon.timer = setTimeout(function () {
        txLineSoon.timer = 0;
        try { txLineTick(); } catch (e) {}
    }, 60);
}


function txVlogWatch(vm) {
    if (!vm || vm.__txLineHooked) return;
    try {
        vm.__txLineHooked = true;
        vm.$watch("playerInfo", function () { txLineSoon(); });
    } catch (e) {}
}


function txSwitchVlogLine(vm, idx) {
    try {
        const pi = vm && vm.playerInfo;
        const lines = (pi && Array.isArray(pi.lines)) ? pi.lines : null;
        if (!lines || !lines[idx] || !lines[idx].link) return false;
        const players = (vm.$refs && vm.$refs.poolPlayers) || [];
        const cur = (typeof vm.activePoolIndex === "number" && vm.activePoolIndex >= 0) ? vm.activePoolIndex : 0;
        const p = players[cur];
        if (!p || typeof p.changeSources !== "function") return false;
        if (!Array.isArray(vm.triedLineIndexes)) vm.triedLineIndexes = [];
        if (vm.triedLineIndexes.indexOf(idx) < 0) vm.triedLineIndexes.push(idx);
        vm.lineIndex = idx;
        pi.play_link = lines[idx].link;
        p.changeSources(pi);
        return true;
    } catch (e) { return false; }
}


function txSyncLines() {
    let vm = txFindDetailVm();
    let rawList = (vm && vm.r && Array.isArray(vm.r.lines)) ? vm.r.lines : [];
    let vid = String((vm && vm.r && vm.r.id) || "");
    let cur = (vm && typeof vm.lineIndex === "number") ? vm.lineIndex : -1;
    let isVlog = false;
    if (!rawList.length) {
        const vv = txFindVlogVm();
        if (!vv) return null;
        txVlogWatch(vv);
        vm = vv;
        rawList = vv.playerInfo.lines;
        vid = String(vv.playerInfo.id || "");
        const pl = String(vv.playerInfo.play_link || "");
        let idx = -1;
        for (let i = 0; i < rawList.length; i++) {
            if (rawList[i] && String(rawList[i].link || "") === pl) { idx = i; break; }
        }
        if (idx < 0) idx = (typeof vv.lineIndex === "number") ? vv.lineIndex : -1;
        cur = idx;
        isVlog = true;
    }
    const lines = [];
    for (let i = 0; i < rawList.length; i++) {
        const it = rawList[i] || {};
        const link = it.link ? String(it.link) : "";
        if (!link) continue;
        let url = "";
        try { url = new URL(link, location.origin).href; } catch (e) { url = ""; }
        if (!url) continue;
        lines.push({
            index: i,
            id: String(it.id == null ? "" : it.id),
            name: String(it.name || ("线路" + (i + 1))),
            vip: String(it.is_vip || "n") === "y",
            url: url
        });
    }
    const sig = lines.map(function (l) { return l.url; }).join("|") + "#" + vid;
    if (sig !== TX_LN.sig) {
        txLineReset();
        TX_LN.sig = sig;
        TX_LN.videoId = vid;
        TX_LN.cur = cur;
    }
    TX_LN.vlog = isVlog;
    TX_LN.lines = lines;
    if (cur !== TX_LN.cur) {
        if (TX_LN.best >= 0 && cur >= 0 && cur !== TX_LN.best) TX_LN.userTouched = true;
        TX_LN.cur = cur;
    }
    return vm;
}


    function txRaceLines(vmIn) {
        const vm = vmIn || txSyncLines();
        if (!vm || TX_LN.lines.length < 2) return Promise.resolve(null);
        if (TX_LN.racedSig === TX_LN.sig) return TX_LN.pending || Promise.resolve(TX_LN.bestLine);
        if (TX_LN.retryAt && Date.now() < TX_LN.retryAt) return Promise.resolve(TX_LN.bestLine);
        TX_LN.racedSig = TX_LN.sig;
        const sig = TX_LN.sig;
        const lines = TX_LN.lines.slice();
        const t0 = Date.now();
        const p = new Promise(function (resolve) {
            let left = lines.length;
            let best = null;
            let fired = false;
            const guard = setTimeout(function () { finish("收尾"); }, TX_LN_PROBE_MS + 1200);
            const finish = function (why) {
                if (fired) return;
                fired = true;
                clearTimeout(guard);
                if (sig !== TX_LN.sig) { resolve(null); return; }
                log("线路竞速(" + (Date.now() - t0) + "ms," + why + "):", lines.map(function (l) {
                    const sc = TX_LN.score[l.index];
                    return l.name + "=" + (sc > 0 ? sc + "ms" : "失败");
                }).join(" / "));
                if (!best) {
                    TX_LN.best = -1;
                    TX_LN.bestLine = null;
                    TX_LN.racedSig = "";
                    TX_LN.pending = null;
                    TX_LN.retryAt = Date.now() + TX_LN_RETRY_MS;
                    log("线路竞速：所有线路都不可用，稍后重试");
                    resolve(null);
                    return;
                }
                TX_LN.best = best.index;
                TX_LN.bestLine = lines.filter(function (l) { return l.index === best.index; })[0] || null;
                TX_LN.at = Date.now();
                TX_LN.retryAt = 0;
                log("最快线路:", TX_LN.bestLine && TX_LN.bestLine.name, Math.round(best.ms) + "ms");
                try { updateDownloadUi(); } catch (e) {}
                txApplyBestLine(true, vm);
                resolve(TX_LN.bestLine);
            };
            lines.forEach(function (line) {
                txProbeLine(line).then(function (r) {
                    if (r.ok && r.host) log("线路测速:", r.name, r.host, Math.round(r.ms) + "ms");
                    if (!fired) {
                        TX_LN.score[r.index] = r.ok ? Math.round(r.ms) : -1;
                        if (r.ok && (!best || r.ms < best.ms)) best = r;
                    }
                    if (r.ok && r.ms <= TX_LN_FAST_MS) { finish("已够快"); return; }
                }, function () {}).then(function () {
                    left--;
                    if (left <= 0) finish("全部完成");
                });
            });
        });
        TX_LN.pending = p;
        return p;
    }


    function txApplyBestLine(force, vmIn) {
        try {
            if (TX_LN.applied || TX_LN.userTouched) return;
            if (TX_LN.lines.length < 2) return;
            if (TX_LN.best < 0 || TX_LN.cur < 0 || TX_LN.best === TX_LN.cur) return;
            const curMs = TX_LN.score[TX_LN.cur];
            const bestMs = TX_LN.score[TX_LN.best];
            if (!(bestMs > 0)) return;
            if (!(curMs > 0) || curMs > bestMs * 1.6) {
                const media = txMediaOf(pickPlayerRec());
                if (media && isFinite(media.currentTime) && media.currentTime > 2) return;
                const vm = vmIn || txFindDetailVm();
                const nm = (TX_LN.bestLine && TX_LN.bestLine.name) || "更快的线路";
                if (vm && typeof vm.setActiveLine === "function") {
                    TX_LN.applied = true;
                    const ret = vm.setActiveLine(TX_LN.best, { notifySuccess: false, resetTried: true });
                    if (ret === false) { TX_LN.applied = false; return; }
                    TX_LN.cur = TX_LN.best;
                    log("已自动切到最快线路:", nm, TX_LN.best);
                    showToast("当前线路较慢，已自动切到「" + nm + "」");
                    return;
                }
                const vv = (vm && vm.playerInfo) ? vm : txFindVlogVm();
                const am = txVlogMedia(vv);
                if (am && !am.paused && am.readyState >= 3 && am.currentTime > 2) return;
                if (!txSwitchVlogLine(vv, TX_LN.best)) return;
                TX_LN.applied = true;
                TX_LN.cur = TX_LN.best;
                log("vlog 已自动切到最快线路:", nm, TX_LN.best);
            }
        } catch (e) { log("自动切换线路失败:", e && e.message); }
    }


    function txLineIndexOfUrl(url) {
        if (!url) return -1;
        let a = String(url);
        try { a = new URL(url, location.href).href; } catch (e) {}
        for (let i = 0; i < TX_LN.lines.length; i++) {
            if (TX_LN.lines[i].url === a) return TX_LN.lines[i].index;
        }
        return -1;
    }


    function txPreferredUrl(url) {
        if (!url || TX_LN.best < 0 || !TX_LN.lines.length) return url;
        const idx = txLineIndexOfUrl(url);
        if (idx < 0 || idx === TX_LN.best) return url;
        for (let i = 0; i < TX_LN.lines.length; i++) {
            if (TX_LN.lines[i].index === TX_LN.best) {
                return TX_LN.lines[i].url;
            }
        }
        return url;
    }


    function txLineLabel(url) {
        if (!TX_LN.lines.length) return "";
        const idx = txLineIndexOfUrl(url);
        for (let i = 0; i < TX_LN.lines.length; i++) {
            if (TX_LN.lines[i].index === idx) {
                return TX_LN.lines[i].name + ((TX_LN.best === idx && TX_LN.lines.length > 1) ? "（最快）" : "");
            }
        }
        return "";
    }


function txVlogPlayer(vmIn) {
    try {
        const vm = (vmIn && vmIn.playerInfo) ? vmIn : txFindVlogVm();
        if (!vm) return null;
        const players = (vm.$refs && vm.$refs.poolPlayers) || [];
        const i = (typeof vm.activePoolIndex === "number" && vm.activePoolIndex >= 0) ? vm.activePoolIndex : 0;
        return players[i] || null;
    } catch (e) { return null; }
}


function txVlogMedia(vmIn) {
    try {
        const p = txVlogPlayer(vmIn);
        return (p && p.player && p.player.video) || null;
    } catch (e) { return null; }
}


function txVlogStallRetry(vm) {
    if ((TX_LN.vlogRetry || 0) >= 3) return;
    const v = txVlogMedia(vm);
    if (!v) { TX_LN.stallMs = 0; return; }
    if (v.paused) { TX_LN.stallMs = 0; TX_LN.lastCur = v.currentTime || 0; return; }
    const cur = v.currentTime || 0;
    if (cur > (TX_LN.lastCur || 0) + 0.08) TX_LN.stallMs = 0;
    else TX_LN.stallMs = (TX_LN.stallMs || 0) + 2000;
    TX_LN.lastCur = cur;
    if (TX_LN.stallMs < 4000) return;
    TX_LN.stallMs = 0;
    const vv = txSyncLines();
    if (!vv || TX_LN.lines.length < 2) return;
    let next = -1;
    if (typeof vv.getNextLineIndex === "function") {
        try { next = vv.getNextLineIndex(); } catch (e) { next = -1; }
    }
    if (next < 0) {
        for (let i = 0; i < TX_LN.lines.length; i++) {
            if (TX_LN.lines[i].index !== TX_LN.cur) { next = TX_LN.lines[i].index; break; }
        }
    }
    if (next < 0 || !txSwitchVlogLine(vv, next)) return;
    TX_LN.vlogRetry = (TX_LN.vlogRetry || 0) + 1;
    TX_LN.best = next;
    TX_LN.cur = next;
    TX_LN.applied = true;
    TX_LN.lastCur = 0;
    log("vlog 播放停滞，切到线路", next, TX_LN.vlogRetry);
}


function txLineTick() {
    try {
        const p = location.pathname;
        const isVlog = p.indexOf("/vlog") >= 0;
        if (p.indexOf("/detail/") < 0 && p.indexOf("/block/") < 0 && !isVlog) return;
        const vm = txSyncLines();
        if (!vm) return;
        if (isVlog) txVlogStallRetry(vm);
        if (TX_LN.lines.length >= 2 && TX_LN.racedSig !== TX_LN.sig) { txRaceLines(vm); return; }
        txApplyBestLine(false, vm);
    } catch (e) {}
}

    function hexToBytes(h) {
        const n = Math.floor(h.length / 2);
        const a = new Uint8Array(n);
        for (let i = 0; i < n; i++) a[i] = parseInt(h.substr(i * 2, 2), 16);
        return a;
    }

    function seqToIv(seq) {
        const iv = new Uint8Array(16);
        const dv = new DataView(iv.buffer);
        dv.setUint32(12, seq >>> 0);
        return iv;
    }

    function txAesCore() {
        const SBOX = new Uint8Array(256), INV = new Uint8Array(256);
        (function () {
            let p = 1, q = 1;
            do {
                p = (p ^ (p << 1) ^ ((p & 0x80) ? 0x1B : 0)) & 0xFF;
                q = (q ^ (q << 1)) & 0xFF;
                q = (q ^ (q << 2)) & 0xFF;
                q = (q ^ (q << 4)) & 0xFF;
                if (q & 0x80) q = (q ^ 0x09) & 0xFF;
                const x = q ^ ((q << 1) | (q >> 7)) ^ ((q << 2) | (q >> 6)) ^ ((q << 3) | (q >> 5)) ^ ((q << 4) | (q >> 4));
                SBOX[p] = (x ^ 0x63) & 0xFF;
            } while (p !== 1);
            SBOX[0] = 0x63;
            for (let i = 0; i < 256; i++) INV[SBOX[i]] = i;
        })();
        const mul = function (b) {
            const t = new Uint8Array(256);
            for (let i = 0; i < 256; i++) {
                let a = i, k = b, r = 0;
                while (k) {
                    if (k & 1) r ^= a;
                    a = ((a << 1) ^ ((a & 0x80) ? 0x1B : 0)) & 0xFF;
                    k >>= 1;
                }
                t[i] = r & 0xFF;
            }
            return t;
        };
        const M9 = mul(9), M11 = mul(11), M13 = mul(13), M14 = mul(14);
        const expandKey = function (key) {
            const Nk = key.length >> 2, Nr = Nk + 6;
            const w = new Uint8Array(16 * (Nr + 1));
            w.set(key, 0);
            let rcon = 1;
            for (let i = Nk; i < 4 * (Nr + 1); i++) {
                const p = (i - 1) * 4;
                let t0 = w[p], t1 = w[p + 1], t2 = w[p + 2], t3 = w[p + 3];
                if (i % Nk === 0) {
                    const tmp = t0;
                    t0 = SBOX[t1] ^ rcon; t1 = SBOX[t2]; t2 = SBOX[t3]; t3 = SBOX[tmp];
                    rcon = (rcon << 1) ^ ((rcon & 0x80) ? 0x1B : 0); rcon &= 0xFF;
                } else if (Nk > 6 && i % Nk === 4) {
                    t0 = SBOX[t0]; t1 = SBOX[t1]; t2 = SBOX[t2]; t3 = SBOX[t3];
                }
                const o = i * 4, s = (i - Nk) * 4;
                w[o] = w[s] ^ t0; w[o + 1] = w[s + 1] ^ t1; w[o + 2] = w[s + 2] ^ t2; w[o + 3] = w[s + 3] ^ t3;
            }
            return { w: w, Nr: Nr };
        };
        const invShiftRowsSub = function (a) {
            let x = a[13];
            a[13] = a[9]; a[9] = a[5]; a[5] = a[1]; a[1] = x;
            x = a[2]; a[2] = a[10]; a[10] = x;
            x = a[6]; a[6] = a[14]; a[14] = x;
            x = a[3]; a[3] = a[7]; a[7] = a[11]; a[11] = a[15]; a[15] = x;
            a[0] = INV[a[0]]; a[1] = INV[a[1]]; a[2] = INV[a[2]]; a[3] = INV[a[3]];
            a[4] = INV[a[4]]; a[5] = INV[a[5]]; a[6] = INV[a[6]]; a[7] = INV[a[7]];
            a[8] = INV[a[8]]; a[9] = INV[a[9]]; a[10] = INV[a[10]]; a[11] = INV[a[11]];
            a[12] = INV[a[12]]; a[13] = INV[a[13]]; a[14] = INV[a[14]]; a[15] = INV[a[15]];
        };
        const invMixColumns = function (a) {
            for (let c = 0; c < 16; c += 4) {
                const a0 = a[c], a1 = a[c + 1], a2 = a[c + 2], a3 = a[c + 3];
                a[c] = M14[a0] ^ M11[a1] ^ M13[a2] ^ M9[a3];
                a[c + 1] = M9[a0] ^ M14[a1] ^ M11[a2] ^ M13[a3];
                a[c + 2] = M13[a0] ^ M9[a1] ^ M14[a2] ^ M11[a3];
                a[c + 3] = M11[a0] ^ M13[a1] ^ M9[a2] ^ M14[a3];
            }
        };
        return function (data, key, iv, out) {
            const ks = expandKey(key), w = ks.w, Nr = ks.Nr, lo = Nr * 16;
            const n = data.length, nb = Math.floor(n / 16);
            if (!out || out.length !== n) out = new Uint8Array(n);
            const a = new Uint8Array(16);
            let prev = iv;
            for (let b = 0; b < nb; b++) {
                const off = b * 16;
                for (let i = 0; i < 16; i++) a[i] = data[off + i] ^ w[lo + i];
                for (let r = Nr - 1; r >= 1; r--) {
                    invShiftRowsSub(a);
                    const o = r * 16;
                    for (let i = 0; i < 16; i++) a[i] ^= w[o + i];
                    invMixColumns(a);
                }
                invShiftRowsSub(a);
                for (let i = 0; i < 16; i++) out[off + i] = a[i] ^ w[i] ^ prev[i];
                prev = data.subarray(off, off + 16);
            }
            for (let i = nb * 16; i < n; i++) out[i] = data[i];
            return out;
        };
    }

    let txAesCbc = null;

    function txStripPad(u8) {
        const n = u8.length;
        if (!n) return u8;
        const p = u8[n - 1];
        if (p < 1 || p > 16 || p > n) return u8;
        for (let i = n - p; i < n; i++) if (u8[i] !== p) return u8;
        return u8.subarray(0, n - p);
    }

    function txAesFallback(buf, keyBytes, ivBytes) {
        if (!txAesCbc) txAesCbc = txAesCore();
        const data = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
        const key = keyBytes instanceof Uint8Array ? keyBytes : new Uint8Array(keyBytes);
        const iv = ivBytes instanceof Uint8Array ? ivBytes : new Uint8Array(ivBytes);
        const nb = Math.floor(data.length / 16);
        const out = new Uint8Array(data.length);
        const STEP = 4096;
        let b = 0;
        return new Promise(function (resolve, reject) {
            const step = function () {
                try {
                    const end = Math.min(nb, b + STEP);
                    if (b < end) {
                        const from = b * 16, to = end * 16;
                        txAesCbc(data.subarray(from, to), key, b === 0 ? iv : data.subarray(from - 16, from), out.subarray(from, to));
                        b = end;
                    }
                    if (b < nb) { setTimeout(step, 0); return; }
                    for (let i = nb * 16; i < data.length; i++) out[i] = data[i];
                    resolve(txStripPad(out));
                } catch (e) { reject(e); }
            };
            step();
        });
    }

    function aesDecrypt(buf, keyBytes, ivBytes) {
        const st = (typeof crypto !== "undefined" && crypto.subtle) ? crypto.subtle : null;
        if (!st) return txAesFallback(buf, keyBytes, ivBytes);
        return st.importKey("raw", keyBytes, { name: "AES-CBC" }, false, ["decrypt"])
            .then(function (key) {
                return st.decrypt({ name: "AES-CBC", iv: ivBytes }, key, buf);
            })
            .then(function (out) { return new Uint8Array(out); })
            .catch(function (e) {
                log("系统解密不可用，改用内置 AES:", e && e.message);
                return txAesFallback(buf, keyBytes, ivBytes).catch(function () { throw e; });
            });
    }

    function loadMuxJs() {
        if (txMuxPromise) return txMuxPromise;
        const finish = function (m) {
            if (m && m.mp4 && m.mp4.Transmuxer) return m;
            try {
                if (typeof muxjs !== "undefined" && muxjs && muxjs.mp4) return muxjs;
            } catch (e) {}
            try {
                if (W.muxjs && W.muxjs.mp4) return W.muxjs;
            } catch (e) {}
            return null;
        };
        const tryOne = function (i) {
            return new Promise(function (resolve, reject) {
                const pre = finish(null);
                if (pre) return resolve(pre);
                if (i >= MUX_CDNS.length) return reject(new Error("mux.js 所有来源均加载失败"));
                const next = function (why) {
                    log("mux.js 来源失败(" + why + ")，尝试下一个:", MUX_CDNS[i]);
                    tryOne(i + 1).then(resolve, reject);
                };
                try {
                    GM_xmlhttpRequest({
                        url: MUX_CDNS[i],
                        method: "GET",
                        timeout: 15000,
                        onload: function (res) {
                            try {
                                if (res.status < 200 || res.status >= 300 || !res.responseText) {
                                    return next("HTTP " + res.status);
                                }
                                (0, eval)(res.responseText);
                                const m = finish(null);
                                if (m) resolve(m);
                                else next("加载后未就绪");
                            } catch (e) { next(e && e.message); }
                        },
                        onerror: function () { next("网络错误"); },
                        ontimeout: function () { next("超时"); }
                    });
                } catch (e) { next(e && e.message); }
            });
        };
        txMuxPromise = tryOne(0);
        txMuxPromise = txMuxPromise.catch(function (e) { txMuxPromise = null; throw e; });
        return txMuxPromise;
    }


    function patchInitDuration(u8, durationSec) {
        try {
            if (!u8 || !durationSec || durationSec <= 0) return u8;
            const dv = new DataView(u8.buffer, u8.byteOffset, u8.byteLength);
            const walk = function (start, end) {
                let off = start;
                while (off + 8 <= end) {
                    let size = dv.getUint32(off);
                    const type = String.fromCharCode(u8[off + 4], u8[off + 5], u8[off + 6], u8[off + 7]);
                    let hdr = 8;
                    if (size === 1) {
                        if (off + 16 > end) return;
                        size = Number(dv.getBigUint64(off + 8));
                        hdr = 16;
                    }
                    if (size === 0) size = end - off;
                    if (size < hdr || off + size > end) return;
                    if (type === "moov" || type === "trak" || type === "mdia") {
                        walk(off + hdr, off + size);
                    } else if (type === "mvhd" || type === "mdhd") {
                        const ver = u8[off + hdr];
                        const tsOff = off + hdr + (ver ? 20 : 12);
                        const durOff = off + hdr + (ver ? 24 : 16);
                        if (durOff + (ver ? 8 : 4) <= off + size) {
                            const ts = dv.getUint32(tsOff) || 0;
                            if (ts) dv.setUint32(durOff, Math.min(0xFFFFFFFE, Math.round(durationSec * ts)));
                        }
                    } else if (type === "mehd") {
                        const ver = u8[off + hdr];
                        const durOff = off + hdr + (ver ? 8 : 4);
                        if (durOff + 8 <= off + size) dv.setUint32(durOff + 4, Math.min(0xFFFFFFFE, Math.round(durationSec * 1000)));
                    }
                    off += size;
                }
            };
            walk(0, u8.byteLength);
        } catch (e) {
            log("回填时长失败（不影响播放）:", e && e.message);
        }
        return u8;
    }

    function transmuxTsToMp4(parts, durationSec) {
        return loadMuxJs().then(function (muxjs) {
            return new Promise(function (resolve) {
                const chunks = [];
                const transmuxer = new muxjs.mp4.Transmuxer();
                let initDone = false;
                transmuxer.on("data", function (seg) {
                    if (seg.initSegment) {
                        if (!initDone) {
                            initDone = true;
                            chunks.push(patchInitDuration(new Uint8Array(seg.initSegment), durationSec));
                        } else {
                            chunks.push(seg.initSegment);
                        }
                    }
                    if (seg.data) chunks.push(seg.data);
                });
                transmuxer.on("done", function () {});
                for (let i = 0; i < parts.length; i++) transmuxer.push(parts[i]);
                transmuxer.flush();
                if (!chunks.length) throw new Error("转封装未产出数据");
                resolve(new Blob(chunks, { type: "video/mp4" }));
            });
        });
    }

    function runPool(items, limit, worker) {
        let idx = 0;
        const runners = [];
        const n = Math.min(Math.max(1, limit), items.length);
        for (let k = 0; k < n; k++) {
            runners.push((async function () {
                for (;;) {
                    if (TX_DL.cancel) return;
                    const i = idx++;
                    if (i >= items.length) return;
                    await worker(items[i], i);
                }
            })());
        }
        return Promise.all(runners);
    }

    function withTimeout(promise, ms) {
        return new Promise(function (resolve, reject) {
            let done = false;
            const timer = setTimeout(function () {
                if (done) return;
                done = true;
                reject(new Error("操作超时"));
            }, ms);
            Promise.resolve(promise).then(function (v) {
                if (done) return;
                done = true;
                clearTimeout(timer);
                resolve(v);
            }, function (e) {
                if (done) return;
                done = true;
                clearTimeout(timer);
                reject(e);
            });
        });
    }


    async function saveWithFallback(blob, name) {
        const sizeText = fmtBytes(blob.size);
        setDlStatus("已下载 " + sizeText + "，正在保存…", 99);
        try {
            await withTimeout(saveBlob(blob, name), 20000);
            setDlStatus("已完成：" + name + "（" + sizeText + "）", 100);
            showToast("下载完成：" + name);
        } catch (e) {

            log("自动保存未完成，改用浏览器直接保存:", e && e.message);
            try {
                anchorDownload(blob, name);
                setDlStatus("已完成：" + name + "（" + sizeText + "）；若没有弹出保存，请用下方「保存文件 / 分享 / 复制直链」", 100);
                showToast("下载完成，若未保存请用面板备用方式");
            } catch (e2) {
                setDlStatus("已下载完成（" + sizeText + "），但自动保存未成功，请用下方「保存文件 / 分享 / 复制直链」手动保存", 100);
                showToast("已下载完成，请用面板里的备用方式保存");
            }
        }
    }
    async function withRetry(fn, times) {
        let lastErr = null;
        const total = times || 3;
        for (let i = 0; i < total; i++) {
            if (TX_DL.cancel) throw new Error("已取消");
            try { return await fn(); }
            catch (e) {
                lastErr = e;
                await new Promise(function (r) { setTimeout(r, 300 * (i + 1)); });
            }
        }
        throw lastErr || new Error("下载失败");
    }

    function sanitizeName(s) {
        return String(s || "").replace(/[\\/:*?"<>|\r\n\t]+/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
    }

    function buildFileName(ext) {
        let title = "";
        try { title = document.title || ""; } catch (e) {}
        title = sanitizeName(title.replace(/^\s*糖心\s*[-—|]?\s*/i, ""));
        if (!title) title = "tx-video";
        let tail = "";
        if (TX_DL.chosen && TX_DL.variants && TX_DL.variants.length) {
            for (let i = 0; i < TX_DL.variants.length; i++) {
                if (TX_DL.variants[i].url === TX_DL.chosen && TX_DL.variants[i].resolution) {
                    tail = TX_DL.variants[i].resolution;
                    break;
                }
            }
        }
        return title + (tail ? "-" + tail : "") + "-" + Date.now().toString().slice(-6) + ext;
    }

    function anchorDownload(blob, name) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.rel = "noopener";
        a.style.display = "none";
        document.body.appendChild(a);
        a.click();
        setTimeout(function () {
            try { a.remove(); } catch (e) {}
            try { URL.revokeObjectURL(url); } catch (e) {}
        }, 60000);
    }

    async function saveBlob(blob, name) {
        if (!blob) throw new Error("没有可保存的文件");
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
        if (isIOS && navigator.canShare) {
            try {
                const file = new File([blob], name, { type: blob.type || "video/mp4" });
                if (navigator.canShare({ files: [file] })) {
                    await navigator.share({ files: [file], title: name });
                    return "已通过系统分享保存";
                }
            } catch (e) {
                if (e && e.name === "AbortError") return "已取消保存";
                log("iOS 分享失败，回退直接保存:", e && e.message);
            }
        }
        anchorDownload(blob, name);
        return "已开始保存";
    }

    async function shareBlob(blob, name) {
        if (!blob) throw new Error("没有可分享的文件");
        const file = new File([blob], name, { type: blob.type || "video/mp4" });
        if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
            await navigator.share({ files: [file], title: name });
            return "已通过系统分享";
        }
        throw new Error("当前浏览器不支持文件分享");
    }

    function copyText(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        }
        return new Promise(function (resolve, reject) {
            try {
                const ta = document.createElement("textarea");
                ta.value = text;
                ta.style.cssText = "position:fixed;left:-9999px;top:0";
                document.body.appendChild(ta);
                ta.select();
                const ok = document.execCommand("copy");
                ta.remove();
                ok ? resolve() : reject(new Error("复制失败"));
            } catch (e) { reject(e); }
        });
    }

    function setDlStatus(text, pct) {
        TX_DL.status = text || "";
        if (typeof pct === "number") TX_DL.pct = Math.max(0, Math.min(100, pct));
        updateDownloadUi();
    }

    function updateDownloadUi() {
        const e = txDlEls;
        if (!e || !txFab) return;
        const has = !!TX_DL.current;
        e.box.className = "tx-dl-box" + (has ? " on" : "");
        e.quick.className = "tx-fab-dl" + (has ? " on" : "") + (TX_DL.busy ? " busy" : "");
        e.quick.textContent = TX_DL.busy ? (Math.round(TX_DL.pct || 0) + "%") : "⤓";
        if (!has) return;

        e.kind.textContent = TX_DL.kind === "hls" ? "HLS(m3u8)" : "直链视频";
        const bits = [];
        if (TX_DL.source) bits.push(TX_DL.source);
        if (TX_DL.duration) bits.push("时长 " + fmtDur(TX_DL.duration));
        if (TX_DL.variants.length) bits.push(TX_DL.variants.length + " 个清晰度可选");
        const lineName = txLineLabel(txPreferredUrl(TX_DL.current));
        if (lineName) bits.push("线路 " + lineName);
        e.info.textContent = bits.join(" · ") || "已解析到视频地址";
        e.fill.style.width = (TX_DL.pct || 0) + "%";
        if (TX_DL.status) e.status.textContent = TX_DL.status;
        else if (TX_DL.busy) e.status.textContent = "下载中…";
        else e.status.textContent = "点击「开始下载」保存到本机";

        e.go.textContent = TX_DL.busy ? "下载中…" : "开始下载";
        e.go.disabled = TX_DL.busy;
        e.go.style.opacity = TX_DL.busy ? "0.6" : "1";
        e.stop.style.display = TX_DL.busy ? "" : "none";


        const hasBlob = !!TX_DL.lastBlob;
        e.alt.style.display = has ? "" : "none";
        e.save.className = "tx-dl-save" + (hasBlob ? "" : " off");
        e.share.className = "tx-dl-share" + (hasBlob ? "" : " off");

        if (TX_DL.variants.length > 1) {
            e.quality.style.display = "";
            if (e.quality.options.length !== TX_DL.variants.length) {
                e.quality.innerHTML = "";
                for (let i = 0; i < TX_DL.variants.length; i++) {
                    const v = TX_DL.variants[i];
                    const o = document.createElement("option");
                    o.value = v.url;
                    o.textContent = (v.resolution || "未知清晰度") + (i === 0 ? "（最高）" : "") +
                        (v.bandwidth ? " · " + Math.round(v.bandwidth / 1000) + "kbps" : "");
                    e.quality.appendChild(o);
                }
                e.quality.value = TX_DL.chosen || TX_DL.variants[0].url;
            }
        } else {
            e.quality.style.display = "none";
        }
    }

    async function resolveMediaPlaylist(startUrl) {
        let listUrl = startUrl;
        let txt = await dlGet(listUrl, true);
        let pl = parsePlaylist(txt, listUrl);

        if (!pl.master) {
            const self = TX_DL.videos.find(function (v) { return v.url === listUrl; });
            const selfAt = self ? self.at : Date.now();
            const cands = [];
            if (TX_DL.linkMaster && TX_DL.linkMaster !== listUrl) cands.push(TX_DL.linkMaster);
            TX_DL.videos.forEach(function (v) {
                if (v.url === listUrl || !RX_M3U8_URL.test(v.url)) return;
                if (v.at > selfAt + 1000) return;
                if (cands.indexOf(v.url) < 0) cands.push(v.url);
            });
            for (let i = 0; i < cands.length && i < 2; i++) {
                try {
                    const mtxt = await dlGet(cands[i], true);
                    const mpl = parsePlaylist(mtxt, cands[i]);
                    if (mpl.master && mpl.variants.some(function (v) { return v.url === listUrl; })) {
                        TX_DL.linkMaster = cands[i];
                        TX_DL.variants = mpl.variants.slice(0, 8);
                        TX_DL.chosen = listUrl;
                        if (pl.duration) TX_DL.duration = pl.duration;
                        pl.url = listUrl;
                        log("已回链到父列表:", cands[i]);
                        return pl;
                    }
                } catch (e) { log("父列表探测失败（忽略）:", e && e.message); }
            }
        }
        if (pl.master) {
            if (!pl.variants.length) throw new Error("播放列表为空");
            TX_DL.variants = pl.variants.slice(0, 8);
            if (!TX_DL.chosen) TX_DL.chosen = TX_DL.variants[0].url;
            listUrl = TX_DL.chosen;
            if (!/^https?:/i.test(listUrl)) listUrl = resolveUrl(listUrl, startUrl);
            setDlStatus("已选择清晰度，正在读取分片列表…", 2);
            updateDownloadUi();
            txt = await dlGet(listUrl, true);
            pl = parsePlaylist(txt, listUrl);
        }
        if (pl.duration) TX_DL.duration = pl.duration;
        if (pl.duration > 600 && isMobileDevice) {
            showToast("该视频较长（" + fmtDur(pl.duration) + "），建议 Wi-Fi 下选择较低清晰度下载");
        }
        if (pl.byteRange) throw new Error("该视频使用分片范围请求，暂不支持，请用备用方式下载");
        if (!pl.segments.length) throw new Error("未解析到视频分片");
        if (pl.key && /SAMPLE-AES/i.test(pl.key.method)) throw new Error("该视频使用 SAMPLE-AES 加密，暂不支持，请用备用方式下载");
        pl.url = listUrl;
        return pl;
    }

    async function runDownload() {
        if (TX_DL.busy) return;
        if (!TX_DL.current) { showToast("还没解析到视频地址，请先在页面里播放一下视频"); return; }
        TX_DL.busy = true;
        TX_DL.cancel = false;
        TX_DL.abort = (typeof AbortController !== "undefined") ? new AbortController() : null;
        TX_DL.pct = 0;
        TX_DL.got = 0;
        TX_DL.total = 0;
        TX_DL.speed = 0;
        TX_DL.startedAt = Date.now();
        updateDownloadUi();

        if (TX_LN.lines.length > 1 && TX_LN.best < 0) {
            setDlStatus("正在挑选最快线路…", 1);
            try {
                await Promise.race([txRaceLines(), new Promise(function (r) { setTimeout(r, 5000); })]);
            } catch (e) {}
        }

        const dlTarget = txPreferredUrl(TX_DL.current);
        if (dlTarget !== TX_DL.current) log("下载改用更快线路:", txLineLabel(dlTarget), dlTarget);

        try {
            if (TX_DL.kind === "file") {
                setDlStatus("正在下载视频文件…", 5);
                const buf = await withRetry(function () { return dlGet(dlTarget, false); }, 2);
                const blob = new Blob([buf], { type: "video/mp4" });
                TX_DL.lastBlob = blob;
                TX_DL.lastName = buildFileName(".mp4");
                await saveWithFallback(blob, TX_DL.lastName);
                setDlStatus("已完成，可点击下方按钮重新保存或分享", 100);
                return;
            }

            setDlStatus("正在解析播放列表…", 2);
            const pl = await resolveMediaPlaylist(dlTarget);
            const segs = pl.segments;
            const isFmp4 = !!pl.map || (segs[0] && /\.(m4s|mp4|m4v)(\?|#|$)/i.test(segs[0].url));
            setDlStatus("共 " + segs.length + " 个分片" + (pl.duration ? " · 时长 " + fmtDur(pl.duration) : "") + "，开始下载…", 4);

            let keyBytes = null;
            if (pl.key && pl.key.uri) {
                setDlStatus("正在获取解密密钥…", 3);
                keyBytes = new Uint8Array(await withRetry(function () { return dlGet(pl.key.uri, false); }, 2));
                if (keyBytes.length !== 16) throw new Error("密钥长度异常，可能是 SAMPLE-AES 加密");
            }

            const parts = new Array(segs.length);
            let done = 0;
            let bytes = 0;
            const t0 = Date.now();
            await runPool(segs, DL_CONCURRENCY, async function (seg, i) {
                let buf = await withRetry(function () { return dlGet(seg.url, false); }, 3);
                if (keyBytes) {
                    const iv = pl.key.iv ? hexToBytes(pl.key.iv) : seqToIv((pl.mediaSeq || 0) + i);
                    buf = await aesDecrypt(buf, keyBytes, iv);
                }
                const u8 = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
                parts[i] = u8;
                done++;
                bytes += u8.byteLength;
                const el = (Date.now() - t0) / 1000;
                TX_DL.speed = el > 0 ? bytes / el : 0;
                const pct = 5 + (done / segs.length) * 85;
                setDlStatus("已下载 " + done + "/" + segs.length + " 片 · " + fmtBytes(bytes) +
                    (TX_DL.speed ? " · " + fmtBytes(TX_DL.speed) + "/s" : ""), pct);
            });

            if (TX_DL.cancel) throw new Error("已取消");

            setDlStatus("正在合并分片…", 92);
            let blob = null;
            let ext = ".mp4";
            if (isFmp4) {
                const list = [];
                if (pl.map) list.push(new Uint8Array(await dlGet(pl.map, false)));
                for (let i = 0; i < parts.length; i++) if (parts[i]) list.push(parts[i]);
                blob = new Blob(list, { type: "video/mp4" });
            } else {
                const list = parts.filter(Boolean);
                setDlStatus("正在尝试转封装为 MP4（失败会自动保留 .ts 格式）…", 95);
                try {
                    blob = await transmuxTsToMp4(list, pl.duration);
                } catch (e) {
                    log("转封装失败，回退 .ts:", e && e.message);
                    blob = new Blob(list, { type: "video/mp2t" });
                    ext = ".ts";
                }
            }

            TX_DL.lastBlob = blob;
            TX_DL.lastName = buildFileName(ext);
            await saveWithFallback(blob, TX_DL.lastName);
        } catch (e) {
            const msg = (e && e.message) ? e.message : String(e);
            TX_DL.pct = 0;
            setDlStatus("失败：" + msg + "；可点击「复制直链」用其他工具下载", 0);
            showToast("下载失败：" + msg);
        } finally {
            TX_DL.busy = false;
            TX_DL.abort = null;
            updateDownloadUi();
        }
    }

    function stopDownload(silent) {
        TX_DL.cancel = true;
        if (TX_DL.abort) { try { TX_DL.abort.abort(); } catch (e) {} }
        setDlStatus("已取消", 0);
        if (!silent) showToast("已取消下载");
    }


    function confirmDownloadLeave() {
        if (!TX_DL.busy) return true;
        try {
            return window.confirm("视频正在下载中，离开本页会中断下载。\n\n确定：中断下载并离开\n取消：留在此页继续下载");
        } catch (e) { return true; }
    }

    function setPanel(show) {
        try {
            const p = txFab ? txFab.querySelector(".tx-fab-panel") : null;
            if (!p) return;
            p.style.display = show ? "block" : "none";
            if (show) txFitPanel();
        } catch (e) {}
    }

    function txPanelIsOpen() {
        const p = txFab ? txFab.querySelector(".tx-fab-panel") : null;
        return !!(p && p.style.display === "block");
    }


    function txFitPanel() {
        try {
            const p = txFab ? txFab.querySelector(".tx-fab-panel") : null;
            if (!p || p.style.display !== "block") return;
            const fr = txFab.getBoundingClientRect();
            const pr = p.getBoundingClientRect();
            const vw = window.innerWidth || 0;
            const vh = window.innerHeight || 0;
            const pad = 6;
            p.style.maxWidth = Math.max(120, vw - pad * 2) + "px";
            const w = Math.min(pr.width, vw - pad * 2);

            if (fr.left + w > vw - pad && fr.right - w >= pad) {
                p.style.left = "auto";
                p.style.right = "0";
            } else {
                p.style.left = "0";
                p.style.right = "auto";
            }

            const gap = 66;
            const h = pr.height;
            const above = fr.top - gap - h;
            const below = vh - fr.bottom - gap - h;
            if (above < pad && below > above) {
                p.style.bottom = "auto";
                p.style.top = "58px";
            } else {
                p.style.bottom = gap + "px";
                p.style.top = "auto";
            }
        } catch (e) {}
    }

    function buildDownloadUi() {
        if (!txFab || txDlEls) return;
        const panel = txFab.querySelector(".tx-fab-panel");
        if (!panel) return;


        const quick = document.createElement("button");
        quick.className = "tx-fab-dl";
        quick.type = "button";
        quick.tabIndex = -1;
        quick.setAttribute("aria-hidden", "true");
        quick.textContent = "⤓";
        txFab.appendChild(quick);

        const box = document.createElement("div");
        box.className = "tx-dl-box";
        box.innerHTML =
            '<div class="tx-dl-head">视频下载 <b class="tx-dl-kind"></b></div>' +
            '<div class="tx-dl-info"></div>' +
            '<select class="tx-dl-sel" style="display:none"></select>' +
            '<div class="tx-dl-bar"><i></i></div>' +
            '<div class="tx-dl-status"></div>' +
            '<div class="tx-dl-btns">' +
            '  <button class="tx-dl-go" type="button">开始下载</button>' +
            '  <button class="tx-dl-stop" type="button" style="display:none">取消</button>' +
            '</div>' +
            '<div class="tx-dl-alt" style="display:none">' +
            '  <div class="tx-dl-alt-title">备用方式（可与下载同时使用）</div>' +
            '  <div class="tx-dl-alt-row">' +
            '    <a class="tx-dl-save">保存文件</a>' +
            '    <a class="tx-dl-share">分享</a>' +
            '    <a class="tx-dl-copy">复制直链</a>' +
            '    <a class="tx-dl-open">新窗口打开</a>' +
            '  </div>' +
            '</div>' +
            '<div class="tx-dl-tip"></div>';
        panel.appendChild(box);

        txDlEls = {
            box: box,
            quick: quick,
            kind: box.querySelector(".tx-dl-kind"),
            info: box.querySelector(".tx-dl-info"),
            quality: box.querySelector(".tx-dl-sel"),
            fill: box.querySelector(".tx-dl-bar i"),
            status: box.querySelector(".tx-dl-status"),
            go: box.querySelector(".tx-dl-go"),
            stop: box.querySelector(".tx-dl-stop"),
            alt: box.querySelector(".tx-dl-alt"),
            save: box.querySelector(".tx-dl-save"),
            share: box.querySelector(".tx-dl-share"),
            tip: box.querySelector(".tx-dl-tip")
        };

        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent || "");
        txDlEls.tip.textContent = isIOS
            ? "免费脚本，禁止贩卖。iOS 保存：点「分享」选择「存储到文件」；也可复制直链用其他工具下载。"
            : (isMobileDevice
                ? "免费脚本，禁止贩卖。安卓可直接保存到「下载」；若失败请用「复制直链」配合下载器。"
                : "免费脚本，禁止贩卖。PC 直接保存到下载目录；若失败可用「复制直链」配合下载工具（IDM/VLC 等）。");

        txDlEls.go.addEventListener("click", function () { runDownload(); });
        txDlEls.stop.addEventListener("click", function () { stopDownload(); });
        txDlEls.quality.addEventListener("change", function () {
            TX_DL.chosen = txDlEls.quality.value;
            setDlStatus("已切换清晰度，点击「开始下载」生效", 0);
        });

        box.querySelector(".tx-dl-save").addEventListener("click", function () {
            if (!TX_DL.lastBlob) { showToast("还没下载完，可先用「复制直链」或「新窗口打开」"); return; }
            saveBlob(TX_DL.lastBlob, TX_DL.lastName || buildFileName(".mp4"))
                .then(function () { showToast("已重新保存"); })
                .catch(function (e) { showToast("保存失败：" + (e && e.message)); });
        });
        box.querySelector(".tx-dl-share").addEventListener("click", function () {
            if (!TX_DL.lastBlob) { showToast("还没下载完，可先用「复制直链」或「新窗口打开」"); return; }
            shareBlob(TX_DL.lastBlob, TX_DL.lastName || buildFileName(".mp4"))
                .then(function (m) { showToast(m); })
                .catch(function (e) { showToast("分享失败：" + (e && e.message)); });
        });
        box.querySelector(".tx-dl-copy").addEventListener("click", function () {
            if (!TX_DL.current) { showToast("还没解析到视频地址"); return; }
            copyText(TX_DL.chosen || TX_DL.current)
                .then(function () { showToast("直链已复制，可粘贴到下载工具"); })
                .catch(function () { showToast("复制失败，请手动长按选择"); });
        });
        box.querySelector(".tx-dl-open").addEventListener("click", function () {
            if (!TX_DL.current) { showToast("还没解析到视频地址"); return; }
            try { window.open(TX_DL.chosen || TX_DL.current, "_blank", "noopener"); }
            catch (e) { showToast("打开失败：" + (e && e.message)); }
        });

        updateDownloadUi();
    }


    function txKeepAliveUi() {
        try {
            if (!txFab) return;
            const body = document.body || document.documentElement;
            if (!txFab.isConnected) {
                body.appendChild(txFab);
                log("浮窗被页面清掉了，已重新挂回");
            } else if (txFabCovered()) {

                body.appendChild(txFab);
                log("浮窗被覆盖层压住了，已移到最上层");
            }
            if (!document.getElementById("tx-ui-style")) injectUiCss();
            txBindDocListeners();
            if (document.hidden) return;
            if (txDlEls && !txDlEls.box.isConnected) {
                txDlEls = null;
                buildDownloadUi();
                updateDownloadUi();
                log("下载面板被页面清掉了，已重建");
            }
        } catch (e) {}
    }


    function txFabCovered() {
        try {
            const r = txFab.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) return false;
            const el = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
            if (!el) return false;
            return !(el.closest && el.closest(".tx-fab"));
        } catch (e) { return false; }
    }

    setInterval(txKeepAliveUi, isMobileDevice ? 600 : 2000);


    window.addEventListener("resize", function () { if (txPanelIsOpen()) txFitPanel(); });
    window.addEventListener("orientationchange", function () {
        setTimeout(function () { if (txPanelIsOpen()) txFitPanel(); }, 300);
    });


    setInterval(function () {
        try { if (txPlayerRecs.length || TX_DL.videos.length) refreshPick(); } catch (e) {}
    }, 2500);

    setInterval(function () { try { if (!document.hidden) txLineTick(); } catch (e) {} }, 2000);

    onDomReady(initUi);

})();
