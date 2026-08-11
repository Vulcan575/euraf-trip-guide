/* ===== 元数据：区域间交通费用 =====
 * 相邻区域单程交通估算（¥，巴士/火车/飞机的混合中位数）
 * 未列出的跨区域组合默认 ¥500，同区域内默认 ¥150
 */
const transportCost = {
  "出发地|中亚":350, "中亚|高加索":500, "高加索|土耳其":400, "土耳其|巴尔干":400,
  "巴尔干|欧洲":300, "欧洲|北非":350, "北非|中东":700, "中东|出发地":600
};
function getTransportCost(a,b){
  if(a===b) return 150;
  const k = a+'|'+b;
  if(transportCost[k]!==undefined) return transportCost[k];
  if(transportCost[b+'|'+a]!==undefined) return transportCost[b+'|'+a];
  return 500;
}
