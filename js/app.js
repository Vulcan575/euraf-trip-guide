/* ===== 姐姐的亚欧非漫游指南 · 应用逻辑 ===== */
/* 依赖：data-cities.js（cities）、data-checklist.js（DEFAULT_CHECKLISTS）先加载 */

/* ---------- 状态 ---------- */
let currentTab = 'cities';
let currentFilter = 'all';
let selectedCities = JSON.parse(localStorage.getItem('selectedCities') || '[]');
let checklists = JSON.parse(localStorage.getItem('checklists') || JSON.stringify(DEFAULT_CHECKLISTS));

/* ---------- Tab 切换 ---------- */
function switchTab(tab){
  document.querySelectorAll('.section').forEach(s=>s.classList.remove('active'));
  document.getElementById(tab).classList.add('active');
  document.querySelectorAll('.tab-btn').forEach(b=>b.classList.remove('active'));
  const tb = document.querySelector('.tab-btn[data-tab="'+tab+'"]');
  if(tb) tb.classList.add('active');
  currentTab = tab;
  if(tab==='guide') renderGuide();
  if(tab==='visa') renderVisa();
  if(tab==='trip') renderTrip();
  if(tab==='checklist') renderChecklist();
  if(tab==='budget') updateBudget();
}

/* ---------- 工具 ---------- */
function getVisaClass(v){
  if(v.includes('免签')) return 'visa-free';
  if(v.includes('落地签')) return 'visa-landing';
  if(v.includes('电子签')) return 'visa-evisa';
  if(v.includes('申根')) return 'visa-schengen';
  return 'visa-hard';
}

/* ---------- 选城市 ---------- */
function renderCities(){
  const list = document.getElementById('cityList');
  list.innerHTML = '';
  const regions = {};
  for(let name in cities){
    const city = cities[name];
    if(currentFilter!=='all' && city.r!==currentFilter) continue;
    if(!regions[city.r]) regions[city.r] = [];
    regions[city.r].push(name);
  }
  for(let region in regions){
    list.innerHTML += '<div class="region-title" style="font-size:1.2rem;font-weight:700;margin:16px 0 8px;padding-left:8px;border-left:4px solid var(--primary);">'+region+'</div>';
    const grid = document.createElement('div'); grid.className = 'city-grid';
    regions[region].forEach(name=>{
      const chip = document.createElement('div');
      chip.className = 'city-chip'+(selectedCities.includes(name)?' selected':'');
      chip.innerHTML = '<div>'+name+'</div><div style="font-size:0.7rem;color:var(--text-light);">'+cities[name].c+'</div>';
      chip.onclick = ()=>toggleCity(name);
      grid.appendChild(chip);
    });
    list.appendChild(grid);
  }
}
function filterRegion(region,btn){
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = region;
  renderCities();
}
function toggleCity(name){
  const idx = selectedCities.indexOf(name);
  if(idx>-1) selectedCities.splice(idx,1); else selectedCities.push(name);
  localStorage.setItem('selectedCities', JSON.stringify(selectedCities));
  renderCities();
  document.getElementById('tripCount').textContent = selectedCities.length;
  renderTrip(); renderGuide(); renderVisa();
}

/* ---------- 城市攻略 ---------- */
function renderGuide(){
  const container = document.getElementById('guideContent');
  if(selectedCities.length===0){
    container.innerHTML = '<div class="empty-state" style="text-align:center;padding:40px;color:var(--text-light);"><div style="font-size:3rem;">🏙️</div><p>先添加城市</p></div>';
    return;
  }
  container.innerHTML = '';
  selectedCities.forEach(name=>{
    const city = cities[name];
    let html = '<div class="city-detail" style="background:var(--card);border-radius:16px;padding:20px;margin-bottom:16px;box-shadow:var(--shadow);"><h2 style="color:var(--primary);">'+name+' <span style="font-size:0.9rem;color:var(--text-light);">'+city.c+'</span></h2>';
    html += '<span class="tag '+getVisaClass(city.v)+'">'+city.v+'</span><span class="tag" style="background:#e8f4f8;color:#0c5460;">¥'+city.b+'/天</span><span class="tag" style="background:#fff3cd;color:#856404;">🌤️ '+city.best+'</span>';
    html += '<h3 style="margin-top:16px;">著名景点</h3><ul style="list-style:none;">';
    city.a.forEach(attr=>{
      const p = attr.split(':'); const n = p[0]; const d = p.slice(1).join(':');
      html += '<li style="padding:8px 0;border-bottom:1px dashed var(--border);"><strong style="color:var(--primary);">'+n+'</strong><br><span style="font-size:0.9rem;">'+d+'</span></li>';
    });
    html += '</ul>';
    if(city.t && city.t.length>0){
      html += '<h3>徒步路线</h3>';
      city.t.forEach(trek=>{
        const p = trek.split('|');
        html += '<div class="trek-box"><h4 style="color:var(--secondary);margin-bottom:4px;">'+p[0]+'</h4><p style="font-size:0.85rem;">'+p[1]+'</p><p style="font-size:0.85rem;margin-top:4px;">难度: '+p[2]+' · 时长: '+p[3]+'</p></div>';
      });
    }
    html += '<h3>青旅推荐</h3><div style="background:#fff8e1;border-radius:8px;padding:8px 12px;font-size:0.85rem;">'+city.h.join(' · ')+'</div>';
    html += '<h3>必吃美食</h3><div style="background:#fce4ec;border-radius:8px;padding:8px 12px;font-size:0.85rem;color:#880e4f;">'+city.f+'</div>';
    html += '<h3>姐姐贴士</h3><div style="background:#fff3e0;border-radius:8px;padding:10px 14px;font-size:0.85rem;border-left:4px solid #f39c12;">'+city.tip+'</div></div>';
    container.innerHTML += html;
  });
}

/* ---------- 签证助手 ---------- */
function renderVisa(){
  const timeline = document.getElementById('visaTimeline');
  const table = document.getElementById('visaTable');
  if(selectedCities.length===0){
    timeline.innerHTML = '<p style="color:var(--text-light);">选择城市后生成</p>';
    table.innerHTML = '<tr><th>国家</th><th>签证类型</th><th>办理方式</th><th>提前时间</th></tr>';
    return;
  }
  const countries = {};
  selectedCities.forEach(name=>{const c = cities[name]; if(c.c!=='中国' && !countries[c.c]) countries[c.c] = c.v;});
  let hasSchengen=false, hasHard=false, hasEvisa=false, hasLanding=false;
  for(let c in countries){
    const v = countries[c];
    if(v.includes('申根')) hasSchengen = true;
    if(v.includes('邀请函')||v.includes('需提前')) hasHard = true;
    if(v.includes('电子签')) hasEvisa = true;
    if(v.includes('落地签')) hasLanding = true;
  }
  let tl = '';
  if(hasSchengen) tl += '<div class="timeline-item"><div class="time" style="font-weight:700;color:var(--primary);">出发前3个月</div><div class="content">预约申根签面签+录指纹</div></div>';
  if(hasHard) tl += '<div class="timeline-item"><div class="time">出发前2个月</div><div class="content">办理复杂签证（邀请函等）</div></div>';
  if(hasEvisa) tl += '<div class="timeline-item"><div class="time">出发前1个月</div><div class="content">申请电子签（土耳其$60、乌兹别克$21.5等）</div></div>';
  if(hasLanding) tl += '<div class="timeline-item"><div class="time">出发前1周</div><div class="content">准备落地签现金（埃及$25、阿塞拜疆$30）</div></div>';
  tl += '<div class="timeline-item"><div class="time">随时</div><div class="content">免签国家直接出发</div></div>';
  timeline.innerHTML = tl;
  let tb = '<tr style="background:var(--primary);color:white;"><th>国家</th><th>签证类型</th><th>办理方式</th><th>提前时间</th></tr>';
  for(let c in countries){
    const v = countries[c];
    let type='免签', time='随时';
    if(v.includes('申根')){type='申根签';time='提前3个月';}
    else if(v.includes('邀请函')||v.includes('需提前')){type='复杂签证';time='提前2个月';}
    else if(v.includes('电子签')){type='电子签';time='提前1-2周';}
    else if(v.includes('落地签')){type='落地签';time='到达办理';}
    tb += '<tr style="border-bottom:1px solid var(--border);"><td style="padding:10px;">'+c+'</td><td style="padding:10px;"><span class="tag '+getVisaClass(v)+'">'+type+'</span></td><td style="padding:10px;">'+v+'</td><td style="padding:10px;">'+time+'</td></tr>';
  }
  table.innerHTML = tb;
}

/* ---------- 我的行程 ---------- */
function renderTrip(){
  const summary = document.getElementById('tripSummary');
  const list = document.getElementById('tripList');
  document.getElementById('tripCount').textContent = selectedCities.length;
  if(selectedCities.length===0){
    summary.innerHTML = '<h2>我的亚欧非环线</h2><p>还没有选择任何城市</p>';
    list.innerHTML = '';
    return;
  }
  let totalBudget = 0;
  selectedCities.forEach(name=>totalBudget += cities[name].b);
  const days = selectedCities.length*3;
  const countries = new Set(selectedCities.map(n=>cities[n].c).filter(c=>c!=='中国')).size;
  summary.innerHTML = '<h2>我的亚欧非环线</h2><div style="display:flex;justify-content:center;gap:24px;margin-top:12px;flex-wrap:wrap;">'
    +'<div style="text-align:center;"><div style="font-size:2rem;font-weight:700;">'+selectedCities.length+'</div><div style="font-size:0.85rem;opacity:0.9;">城市</div></div>'
    +'<div style="text-align:center;"><div style="font-size:2rem;font-weight:700;">'+countries+'</div><div style="font-size:0.85rem;opacity:0.9;">国家</div></div>'
    +'<div style="text-align:center;"><div style="font-size:2rem;font-weight:700;">~'+days+'</div><div style="font-size:0.85rem;opacity:0.9;">预估天数</div></div>'
    +'<div style="text-align:center;"><div style="font-size:2rem;font-weight:700;">¥'+totalBudget+'</div><div style="font-size:0.85rem;opacity:0.9;">日均总预算</div></div></div>';
  list.innerHTML = '';
  selectedCities.forEach((name,i)=>{
    const city = cities[name];
    list.innerHTML += '<div style="display:flex;align-items:center;padding:12px;background:var(--card);border-radius:12px;margin-bottom:8px;border:1px solid var(--border);">'
      +'<div style="background:var(--primary);color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;margin-right:12px;">'+(i+1)+'</div>'
      +'<div style="flex:1;"><div style="font-weight:700;">'+name+'</div><div style="font-size:0.8rem;color:var(--text-light);">'+city.c+' · '+city.r+'</div></div>'
      +'<div style="font-size:0.85rem;color:var(--secondary);font-weight:600;">¥'+city.b+'/天</div>'
      +'<button style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:1.2rem;" onclick="removeCity(\''+name+'\')">×</button></div>';
  });
}
function removeCity(name){
  const idx = selectedCities.indexOf(name);
  if(idx>-1){
    selectedCities.splice(idx,1);
    localStorage.setItem('selectedCities', JSON.stringify(selectedCities));
    renderTrip(); renderCities();
    document.getElementById('tripCount').textContent = selectedCities.length;
    renderGuide(); renderVisa();
  }
}

/* ---------- 清单栏 ---------- */
function renderChecklist(){
  const container = document.getElementById('checklistContent');
  container.innerHTML = '';
  const cats = {places:'想去的地方',food:'必吃美食',shopping:'购物清单',visa:'签证材料',gear:'装备清单',health:'健康/药品',safety:'安全备忘',misc:'其他'};
  const icons = {places:'📍',food:'🍜',shopping:'🛍️',visa:'🛂',gear:'🎒',health:'💊',safety:'🛡️',misc:'📌'};
  for(let cat in cats){
    const items = checklists[cat] || [];
    const doneCount = items.filter(i=>i.done).length;
    let html = '<div style="margin-bottom:20px;"><h4 style="color:var(--primary);margin-bottom:10px;">'+icons[cat]+' '+cats[cat]+' <span style="color:var(--text-light);font-size:0.8rem;">('+doneCount+'/'+items.length+')</span></h4>';
    items.forEach((item,idx)=>{
      html += '<div class="check-item '+(item.done?'checked':'')+'" onclick="toggleCheck(\''+cat+'\','+idx+')">'
        +'<input type="checkbox" '+(item.done?'checked':'')+' style="margin-right:10px;width:18px;height:18px;accent-color:var(--primary);" onclick="event.stopPropagation();toggleCheck(\''+cat+'\','+idx+')">'
        +'<span style="flex:1;font-size:0.9rem;">'+item.text+'</span>'
        +'<span style="font-size:0.75rem;color:var(--text-light);">'+(item.note||'')+'</span>'
        +'<button style="background:none;border:none;color:var(--danger);cursor:pointer;margin-left:8px;" onclick="event.stopPropagation();deleteCheck(\''+cat+'\','+idx+')">×</button></div>';
    });
    html += '</div>';
    container.innerHTML += html;
  }
}
function toggleCheck(cat,idx){
  checklists[cat][idx].done = !checklists[cat][idx].done;
  localStorage.setItem('checklists', JSON.stringify(checklists));
  renderChecklist();
}
function deleteCheck(cat,idx){
  checklists[cat].splice(idx,1);
  localStorage.setItem('checklists', JSON.stringify(checklists));
  renderChecklist();
}
function addCheckItem(){
  const text = document.getElementById('newItemText').value.trim();
  const cat = document.getElementById('newItemCat').value;
  if(!text) return;
  if(!checklists[cat]) checklists[cat] = [];
  checklists[cat].push({text, done:false, note:''});
  localStorage.setItem('checklists', JSON.stringify(checklists));
  document.getElementById('newItemText').value = '';
  renderChecklist();
}

/* ---------- 预算规划 ---------- */
function updateBudget(){
  const val = parseInt(document.getElementById('budgetSlider').value);
  document.getElementById('budgetValue').textContent = val;
  if(selectedCities.length===0){
    document.getElementById('budgetBreakdown').innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light);"><p>选择城市后查看预算明细</p></div>';
    return;
  }
  let total = 0, byRegion = {};
  selectedCities.forEach(name=>{
    const c = cities[name];
    total += val;
    if(!byRegion[c.r]) byRegion[c.r] = {cities:0, budget:0};
    byRegion[c.r].cities++;
    byRegion[c.r].budget += val;
  });
  let html = '<div class="card"><h3>预算明细</h3><p style="font-size:1.1rem;margin-bottom:12px;">总预算: <strong style="color:var(--primary);">¥'+(total*3)+'</strong> (按'+selectedCities.length+'个城市×3天×¥'+val+'/天估算)</p>'
    +'<table style="width:100%;border-collapse:collapse;"><tr style="background:var(--primary);color:white;"><th style="padding:10px;text-align:left;">区域</th><th style="padding:10px;text-align:left;">城市数</th><th style="padding:10px;text-align:left;">区域预算</th></tr>';
  for(let r in byRegion){
    html += '<tr style="border-bottom:1px solid var(--border);"><td style="padding:10px;">'+r+'</td><td style="padding:10px;">'+byRegion[r].cities+'</td><td style="padding:10px;">¥'+(byRegion[r].budget*3)+'</td></tr>';
  }
  html += '</table></div>';
  document.getElementById('budgetBreakdown').innerHTML = html;
}

/* ---------- 数据导出 ---------- */
function exportData(){
  const data = {selectedCities, checklists, exportDate:new Date().toISOString()};
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = '姐姐亚欧非行程_'+new Date().toISOString().slice(0,10)+'.json';
  a.click();
  URL.revokeObjectURL(url);
  alert('行程数据已保存！');
}

/* ---------- 初始化 ---------- */
renderCities();
renderChecklist();
document.getElementById('tripCount').textContent = selectedCities.length;
