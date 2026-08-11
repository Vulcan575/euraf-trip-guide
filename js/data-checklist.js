/* ===== 默认清单数据（首次打开时写入 localStorage）===== */
const DEFAULT_CHECKLISTS = {
  places:[{text:"伊犁草原看日落",done:false,note:"新疆"},{text:"雷吉斯坦广场拍日出",done:false,note:"撒马尔罕"},{text:"圣三一教堂看日照金山",done:false,note:"卡兹别克"},{text:"卡帕多奇亚坐热气球",done:false,note:"土耳其"},{text:"撒哈拉沙漠露营",done:false,note:"摩洛哥"}],
  food:[{text:"吃正宗撒马尔罕抓饭",done:false,note:"乌兹别克"},{text:"喝格鲁吉亚红酒",done:false,note:"西格纳吉"},{text:"吃khinkali汤包",done:false,note:"第比利斯"},{text:"吃塔吉锅",done:false,note:"摩洛哥"},{text:"吃葡式蛋挞",done:false,note:"里斯本"}],
  shopping:[{text:"乌兹别克刺绣",done:false,note:"中亚"},{text:"土耳其地毯",done:false,note:"土耳其"},{text:"摩洛哥阿甘油",done:false,note:"马拉喀什"}],
  visa:[{text:"护照有效期>6个月",done:false,note:"必备"},{text:"土耳其电子签$60",done:false,note:"提前1周"},{text:"埃及落地签现金$25",done:false,note:"出发前"}],
  gear:[{text:"65L背包+防雨罩",done:false,note:"必备"},{text:"头巾/围巾",done:false,note:"清真寺+防晒"},{text:"卫生巾/棉条",done:false,note:"偏远地区难买"}],
  health:[{text:"肠胃药",done:false,note:"必备"},{text:"防晒霜SPF50+",done:false,note:"沙漠/高原"},{text:"高原反应药",done:false,note:"帕米尔/卡兹别克"}],
  safety:[{text:"购买紧急救援保险",done:false,note:"含医疗转运"},{text:"天黑后乖乖回住处",done:false,note:"姐姐保命法则"},{text:"穿着端庄",done:false,note:"摩洛哥和埃及"}],
  misc:[{text:"学几句俄语/土耳其语",done:false,note:"你好/谢谢/多少钱"},{text:"准备小额美元现金",done:false,note:"应急用"}]
};
