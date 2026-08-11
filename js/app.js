/* ===== 姐姐的亚欧非漫游指南 · 应用逻辑 ===== */
/* 依赖：data-cities.js（cities）、data-checklist.js（DEFAULT_CHECKLISTS）先加载 */

/* ---------- 工具 ---------- */
/* localStorage 安全封装：隐私模式/禁用存储时不崩溃 */
const ls = {
  get(k){ try{ return window.localStorage.getItem(k); }catch(e){ return null; } },
  set(k,v){ try{ window.localStorage.setItem(k,v); }catch(e){} },
  remove(k){ try{ window.localStorage.removeItem(k); }catch(e){} }
};
/* HTML 转义：所有用户可输入的文本（清单/导入数据）必须经过这里 */
function esc(s){
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

/* ---------- 状态 ---------- */
let currentTab = 'cities';
let currentFilter = 'all';
let currentSearch = '';
let selectedCities = JSON.parse(ls.get('selectedCities') || '[]').filter(n=>cities[n]);
/* 行程锁定：行程非空即锁定，点「修改路线」解锁 —— 防首页误触 */
let routeLocked = selectedCities.length>0;
/* 清单版本合并：默认清单扩充后，老用户自动补入新默认项（不覆盖已改动的数据） */
const CHECKLIST_VER = 2;
function mergeChecklists(saved){
  const merged = saved || {};
  for(let cat in DEFAULT_CHECKLISTS){
    if(!merged[cat]) merged[cat] = [];
    const have = new Set(merged[cat].map(i=>i.text));
    DEFAULT_CHECKLISTS[cat].forEach(d=>{
      if(!have.has(d.text)) merged[cat].push({text:d.text, done:false, note:d.note||''});
    });
  }
  return merged;
}
let checklists = (function(){
  try{
    const saved = JSON.parse(ls.get('checklists') || 'null');
    if(saved && ls.get('checklistVer')===String(CHECKLIST_VER)) return saved;
    const merged = mergeChecklists(saved);
    ls.set('checklistVer', String(CHECKLIST_VER));
    ls.set('checklists', JSON.stringify(merged));
    return merged;
  }catch(e){ return JSON.parse(JSON.stringify(DEFAULT_CHECKLISTS)); }
})();
let visitedCities = JSON.parse(ls.get('visitedCities') || '[]').filter(n=>cities[n]);
let journeyCity = ls.get('journeyCity') || '';
if(!selectedCities.includes(journeyCity)) journeyCity = '';
let tripDate = ls.get('tripDate') || '';
let daysPerCity = parseInt(ls.get('daysPerCity')) || 3;

/* ---------- 路线顺序（地理路线） ---------- */
const regionOrder = ['出发地','中亚','高加索','土耳其','巴尔干','欧洲','北非','中东','东北亚','东非','南非','南亚','东南亚'];
function byRoute(a,b){ return regionOrder.indexOf(cities[a].r) - regionOrder.indexOf(cities[b].r); }
function fmtDate(d){ return (d.getMonth()+1)+'月'+d.getDate()+'日'; }

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
  if(tab==='tips') renderTips();
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
function searchCities(){
  const q = document.getElementById('citySearch').value.trim();
  currentSearch = q;
  renderCities();
}
function renderLockBar(){
  const bar = document.getElementById('routeLockBar');
  if(!bar) return;
  if(selectedCities.length===0){
    bar.innerHTML = '<div style="background:var(--card);border:1px dashed var(--border);border-radius:14px;padding:10px 16px;font-size:0.85rem;color:var(--text-light);margin-bottom:12px;">🧭 从下面挑选想去的城市，选完后行程自动锁定，防止误触</div>';
    return;
  }
  if(routeLocked){
    bar.innerHTML = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:linear-gradient(135deg,#e8f4f8,#ffffff);border:1px solid #b8e0ef;border-radius:14px;padding:10px 16px;margin-bottom:12px;"><span style="font-size:1.2rem;">🔒</span><span style="flex:1;font-size:0.85rem;">行程已锁定（'+selectedCities.length+'城），城市不可误触</span><button class="btn" onclick="unlockRoute()">✏️ 修改路线</button></div>';
  }else{
    bar.innerHTML = '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff8e1;border:1px solid #f5d76e;border-radius:14px;padding:10px 16px;margin-bottom:12px;"><span style="font-size:1.2rem;">✏️</span><span style="flex:1;font-size:0.85rem;">编辑模式：点击城市可加入/移出，改完记得锁定</span><button class="btn btn-blue" onclick="lockRoute()">✅ 完成锁定</button></div>';
  }
}
function unlockRoute(){ routeLocked = false; renderLockBar(); renderCities(); }
function lockRoute(){ routeLocked = true; renderLockBar(); renderCities(); }

function renderCities(){
  renderLockBar();
  const list = document.getElementById('cityList');
  list.innerHTML = '';
  const regions = {};
  for(let name in cities){
    const city = cities[name];
    if(currentFilter!=='all' && city.r!==currentFilter) continue;
    if(currentSearch && name.indexOf(currentSearch)===-1 && city.c.indexOf(currentSearch)===-1) continue;
    if(!regions[city.r]) regions[city.r] = [];
    regions[city.r].push(name);
  }
  if(Object.keys(regions).length===0){
    list.innerHTML = '<div class="empty-state" style="text-align:center;padding:40px;color:var(--text-light);"><div style="font-size:3rem;">🔍</div><p>没有找到「'+currentSearch+'」相关城市</p></div>';
    return;
  }
  /* 注意：全程只用 appendChild，禁止 innerHTML 混用 —— innerHTML 重建会让 onclick 丢失 */
  const frag = document.createDocumentFragment();
  for(let region in regions){
    const title = document.createElement('div');
    title.className = 'region-title';
    title.setAttribute('data-region', region);
    const span = document.createElement('span');
    span.textContent = region;
    title.appendChild(span);
    frag.appendChild(title);
    const grid = document.createElement('div'); grid.className = 'city-grid';
    regions[region].forEach(name=>{
      const chip = document.createElement('div');
      chip.className = 'city-chip'+(selectedCities.includes(name)?' selected':'')+(routeLocked?' locked':'');
      const cn = document.createElement('div'); cn.textContent = name;
      const cc = document.createElement('div'); cc.textContent = cities[name].c;
      cc.style.cssText = 'font-size:0.7rem;color:var(--text-light);';
      chip.appendChild(cn); chip.appendChild(cc);
      chip.onclick = ()=>toggleCity(name);
      grid.appendChild(chip);
    });
    frag.appendChild(grid);
  }
  list.appendChild(frag);
}
function filterRegion(region,btn){
  document.querySelectorAll('.filter-btn').forEach(b=>b.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = region;
  renderCities();
}
function toggleCity(name){
  if(routeLocked) return;
  const idx = selectedCities.indexOf(name);
  if(idx>-1) selectedCities.splice(idx,1); else selectedCities.push(name);
  ls.set('selectedCities', JSON.stringify(selectedCities));
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
    html += '<p style="font-size:0.95rem;line-height:1.7;color:var(--text);margin:10px 0 0;padding:10px 14px;background:var(--bg);border-left:4px solid var(--primary);border-radius:0 10px 10px 0;">'+(city.i||'')+'</p>';
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
    if(city.x && city.x.length>0){
      html += '<h3>大额体验（另算预算）</h3>';
      city.x.forEach(x=>{
        html += '<div style="background:#fce4ec;border-radius:8px;padding:8px 12px;font-size:0.85rem;color:#880e4f;margin-bottom:6px;">🎈 '+x.n+': <strong>'+x.p+'</strong></div>';
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

/* ---------- 行程跟随 ---------- */
/* 下一站：journeyCity 之后的城市；没标记过就按打卡进度顺延 */
function nextStop(){
  if(selectedCities.length===0) return null;
  if(!journeyCity){
    const visited = selectedCities.filter(n=>visitedCities.includes(n));
    return selectedCities[visited.length] || null;
  }
  const idx = selectedCities.indexOf(journeyCity);
  if(idx<0) return selectedCities[0];
  return selectedCities[idx+1] || null;
}
function setJourney(name){
  if(!selectedCities.includes(name)) return;
  journeyCity = name;
  ls.set('journeyCity', name);
  renderTrip();
}
function renderJourney(){
  const el = document.getElementById('journeyBox');
  if(!el) return;
  if(selectedCities.length===0){ el.innerHTML = ''; return; }
  const next = nextStop();
  let html = '<div class="card" style="margin-bottom:16px;">'
    +'<h3 style="margin-bottom:10px;">🚩 行程跟随</h3>'
    +'<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px;">';
  selectedCities.forEach(n=>{
    const isCur = n===journeyCity;
    const isVis = visitedCities.includes(n);
    const cls = isCur?'journey-dot current':(isVis?'journey-dot visited':'journey-dot');
    html += '<span class="'+cls+'" onclick="setJourney(\''+n+'\')" title="标记我已到达'+n+'">'+(isCur?'🚩 ':'')+n+'</span>';
  });
  html += '</div><p style="font-size:0.8rem;color:var(--text-light);margin:0;">点城市标记「我已到达」，下一站攻略自动更新，进度自动保存</p></div>';
  if(next){
    const c = cities[next];
    html += '<div class="card" style="border:2px solid var(--primary);margin-bottom:16px;">'
      +'<h3 style="margin-bottom:8px;">🧭 下一站 · '+next+' <span style="font-size:0.85rem;color:var(--text-light);">'+c.c+'</span></h3>'
      +'<div style="margin-bottom:10px;">'
      +'<span class="tag '+getVisaClass(c.v)+'">'+c.v+'</span><span class="tag" style="background:#e8f4f8;color:#0c5460;">¥'+c.b+'/天</span><span class="tag" style="background:#fff3cd;color:#856404;">🌤️ '+c.best+'</span></div>';
    html += '<h4 style="color:var(--primary);margin:10px 0 6px;">📍 景点</h4><ul style="list-style:none;margin:0;padding:0;">';
    c.a.slice(0,3).forEach(attr=>{
      const p = attr.split(':'); const n = p[0]; const d = p.slice(1).join(':');
      html += '<li style="padding:6px 0;border-bottom:1px dashed var(--border);"><strong style="color:var(--primary);">'+n+'</strong><br><span style="font-size:0.85rem;">'+d+'</span></li>';
    });
    html += '</ul>';
    html += '<h4 style="color:var(--primary);margin:10px 0 6px;">🛏️ 青旅</h4><div style="background:#fff8e1;border-radius:8px;padding:8px 12px;font-size:0.85rem;">'+c.h.join(' · ')+'</div>';
    html += '<h4 style="color:var(--primary);margin:10px 0 6px;">🍜 必吃</h4><div style="background:#fce4ec;border-radius:8px;padding:8px 12px;font-size:0.85rem;color:#880e4f;">'+c.f+'</div>';
    html += '<h4 style="color:var(--primary);margin:10px 0 6px;">💡 贴士</h4><div style="background:#fff3e0;border-radius:8px;padding:8px 12px;font-size:0.85rem;border-left:4px solid #f39c12;">'+c.tip+'</div>';
    html += '<div style="margin-top:12px;"><button class="btn btn-blue" onclick="setJourney(\''+next+'\');toggleVisited(\''+next+'\')">🚩 我到 '+next+' 了</button></div></div>';
  }
  el.innerHTML = html;
}

/* ---------- 我的行程 ---------- */
function renderTrip(){
  renderJourney();
  const summary = document.getElementById('tripSummary');
  const list = document.getElementById('tripList');
  const dateInput = document.getElementById('tripDateInput');
  const daysSel = document.getElementById('daysPerCitySel');
  if(dateInput) dateInput.value = tripDate;
  if(daysSel) daysSel.value = daysPerCity;
  document.getElementById('tripCount').textContent = selectedCities.length;
  renderItinerary();
  if(selectedCities.length===0){
    summary.innerHTML = '<h2>我的亚欧非环线</h2><p>还没有选择任何城市</p>';
    list.innerHTML = '';
    return;
  }
  let totalBudget = 0;
  selectedCities.forEach(name=>totalBudget += cities[name].b);
  const days = selectedCities.length*daysPerCity;
  const countries = new Set(selectedCities.map(n=>cities[n].c).filter(c=>c!=='中国')).size;
  summary.innerHTML = '<h2>我的亚欧非环线</h2><div style="display:flex;justify-content:center;gap:24px;margin-top:12px;flex-wrap:wrap;">'
    +'<div style="text-align:center;"><div style="font-size:2rem;font-weight:700;">'+selectedCities.length+'</div><div style="font-size:0.85rem;opacity:0.9;">城市</div></div>'
    +'<div style="text-align:center;"><div style="font-size:2rem;font-weight:700;">'+countries+'</div><div style="font-size:0.85rem;opacity:0.9;">国家</div></div>'
    +'<div style="text-align:center;"><div style="font-size:2rem;font-weight:700;">~'+days+'</div><div style="font-size:0.85rem;opacity:0.9;">预估天数</div></div>'
    +'<div style="text-align:center;"><div style="font-size:2rem;font-weight:700;">¥'+totalBudget+'</div><div style="font-size:0.85rem;opacity:0.9;">日均总预算</div></div></div>';
  list.innerHTML = '';
  selectedCities.forEach((name,i)=>{
    const city = cities[name];
    const visited = visitedCities.indexOf(name)>-1;
    list.innerHTML += '<div style="display:flex;align-items:center;padding:12px;background:var(--card);border-radius:12px;margin-bottom:8px;border:1px solid var(--border);'+(visited?'opacity:0.85;border-color:var(--secondary);':'')+'">'
      +'<div style="background:'+(visited?'var(--secondary)':'var(--primary)')+';color:white;width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:0.85rem;margin-right:12px;flex-shrink:0;">'+(visited?'✓':(i+1))+'</div>'
      +'<div style="flex:1;min-width:0;"><div style="font-weight:700;">'+name+'</div><div style="font-size:0.8rem;color:var(--text-light);">'+city.c+' · '+city.r+'</div></div>'
      +'<button class="visit-btn'+(visited?' visited':'')+'" onclick="toggleVisited(\''+name+'\')">'+(visited?'✅ 已打卡':'📍 打卡')+'</button>'
      +'<button style="background:none;border:none;cursor:pointer;color:var(--text-light);font-size:1.1rem;padding:2px 4px;" onclick="moveCity('+i+',-1)" title="上移">↑</button>'
      +'<button style="background:none;border:none;cursor:pointer;color:var(--text-light);font-size:1.1rem;padding:2px 4px;" onclick="moveCity('+i+',1)" title="下移">↓</button>'
      +'<button style="background:none;border:none;color:var(--danger);cursor:pointer;font-size:1.2rem;" onclick="removeCity(\''+name+'\')">×</button></div>';
  });
}
function toggleVisited(name){
  const idx = visitedCities.indexOf(name);
  if(idx>-1) visitedCities.splice(idx,1); else visitedCities.push(name);
  ls.set('visitedCities', JSON.stringify(visitedCities));
  renderTrip();
}
function sortTrip(){
  selectedCities.sort(byRoute);
  ls.set('selectedCities', JSON.stringify(selectedCities));
  renderTrip();
}
function shareTrip(){
  if(selectedCities.length===0){ alert('还没有选择城市，先去选城市吧！'); return; }
  const countries = [...new Set(selectedCities.map(n=>cities[n].c).filter(c=>c!=='中国'))].join('、');
  let text = '🌸 姐姐的亚欧非漫游指南\n'
    +'路线：'+selectedCities.map((n,i)=>(i+1)+'. '+n+'（'+cities[n].c+'）').join(' → ')+'\n'
    +'共 '+selectedCities.length+' 城 · '+countries+' 国 · 每城约 '+daysPerCity+' 天';
  if(tripDate) text += '\n出发：'+tripDate;
  if(visitedCities.length) text += '\n已打卡：'+visitedCities.join('、');
  text += '\n—— 来自 姐姐的亚欧非漫游指南 🌍';
  if(navigator.clipboard && navigator.clipboard.writeText){
    navigator.clipboard.writeText(text).then(()=>alert('✅ 行程已复制到剪贴板，去粘贴给朋友吧！'),()=>fallbackCopy(text));
  }else{
    fallbackCopy(text);
  }
}
function fallbackCopy(text){
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.position = 'fixed'; ta.style.opacity = '0';
  document.body.appendChild(ta);
  ta.select();
  try{ document.execCommand('copy'); alert('✅ 行程已复制到剪贴板！'); }
  catch(e){ alert('复制失败，请手动复制以下内容：\n\n'+text); }
  document.body.removeChild(ta);
}
function moveCity(idx,dir){
  const j = idx+dir;
  if(j<0 || j>=selectedCities.length) return;
  const tmp = selectedCities[idx]; selectedCities[idx] = selectedCities[j]; selectedCities[j] = tmp;
  ls.set('selectedCities', JSON.stringify(selectedCities));
  renderTrip();
}
function setTripDate(){
  tripDate = document.getElementById('tripDateInput').value;
  ls.set('tripDate', tripDate);
  renderTrip();
}
function setDaysPerCity(){
  daysPerCity = parseInt(document.getElementById('daysPerCitySel').value) || 3;
  ls.set('daysPerCity', daysPerCity);
  renderTrip();
  updateBudget();
}
function renderItinerary(){
  const el = document.getElementById('itineraryList');
  if(!tripDate || selectedCities.length===0){
    el.innerHTML = '<p style="color:var(--text-light);font-size:0.85rem;">设置出发日期后自动生成每日行程</p>';
    return;
  }
  const start = new Date(tripDate + 'T12:00:00');
  el.innerHTML = selectedCities.map((name,i)=>{
    const d1 = new Date(start); d1.setDate(start.getDate()+i*daysPerCity);
    const d2 = new Date(start); d2.setDate(start.getDate()+(i+1)*daysPerCity-1);
    return '<div class="timeline-item"><div class="time" style="font-weight:700;color:var(--primary);">第'+(i*daysPerCity+1)+'-'+(i+1)*daysPerCity+'天 · '+fmtDate(d1)+' - '+fmtDate(d2)+'</div><div class="content"><strong>'+name+'</strong> <span style="color:var(--text-light);font-size:0.8rem;">'+cities[name].c+'</span></div></div>';
  }).join('');
}
function removeCity(name){
  const idx = selectedCities.indexOf(name);
  if(idx>-1){
    selectedCities.splice(idx,1);
    ls.set('selectedCities', JSON.stringify(selectedCities));
    renderTrip(); renderCities();
    document.getElementById('tripCount').textContent = selectedCities.length;
    renderGuide(); renderVisa();
  }
}

/* ---------- 清单栏 ---------- */
function renderChecklist(){
  const container = document.getElementById('checklistContent');
  const cats = {places:'想去的地方',food:'必吃美食',shopping:'购物清单',visa:'签证材料',gear:'装备清单',health:'健康/药品',safety:'安全备忘',misc:'其他'};
  const icons = {places:'📍',food:'🍜',shopping:'🛍️',visa:'🛂',gear:'🎒',health:'💊',safety:'🛡️',misc:'📌'};
  const blocks = [];
  for(let cat in cats){
    const items = checklists[cat] || [];
    const doneCount = items.filter(i=>i.done).length;
    let html = '<div style="margin-bottom:20px;"><h4 style="color:var(--primary);margin-bottom:10px;">'+icons[cat]+' '+cats[cat]+' <span style="color:var(--text-light);font-size:0.8rem;">('+doneCount+'/'+items.length+')</span></h4>';
    items.forEach((item,idx)=>{
      /* esc() 转义用户输入，防止 XSS */
      html += '<div class="check-item '+(item.done?'checked':'')+'" onclick="toggleCheck(\''+cat+'\','+idx+')">'
        +'<input type="checkbox" '+(item.done?'checked':'')+' style="margin-right:10px;width:18px;height:18px;accent-color:var(--primary);" onclick="event.stopPropagation();toggleCheck(\''+cat+'\','+idx+')">'
        +'<span style="flex:1;font-size:0.9rem;">'+esc(item.text)+'</span>'
        +'<span style="font-size:0.75rem;color:var(--text-light);">'+esc(item.note||'')+'</span>'
        +'<button style="background:none;border:none;color:var(--danger);cursor:pointer;margin-left:8px;" onclick="event.stopPropagation();deleteCheck(\''+cat+'\','+idx+')">×</button></div>';
    });
    blocks.push(html+'</div>');
  }
  container.innerHTML = blocks.join('');
}
function toggleCheck(cat,idx){
  if(!checklists[cat] || !checklists[cat][idx]) return;
  checklists[cat][idx].done = !checklists[cat][idx].done;
  ls.set('checklists', JSON.stringify(checklists));
  renderChecklist();
}
function deleteCheck(cat,idx){
  if(!checklists[cat] || !checklists[cat][idx]) return;
  checklists[cat].splice(idx,1);
  ls.set('checklists', JSON.stringify(checklists));
  renderChecklist();
}
function toggleCheck(cat,idx){
  checklists[cat][idx].done = !checklists[cat][idx].done;
  ls.set('checklists', JSON.stringify(checklists));
  renderChecklist();
}
function deleteCheck(cat,idx){
  checklists[cat].splice(idx,1);
  ls.set('checklists', JSON.stringify(checklists));
  renderChecklist();
}
function addCheckItem(){
  const text = document.getElementById('newItemText').value.trim();
  const cat = document.getElementById('newItemCat').value;
  if(!text) return;
  if(!checklists[cat]) checklists[cat] = [];
  checklists[cat].push({text, done:false, note:''});
  ls.set('checklists', JSON.stringify(checklists));
  document.getElementById('newItemText').value = '';
  renderChecklist();
}

/* ---------- 预算规划 ---------- */
function updateBudget(){
  const val = parseInt(document.getElementById('budgetSlider').value);
  document.getElementById('budgetValue').textContent = val;
  const el = document.getElementById('budgetBreakdown');
  if(selectedCities.length===0){
    el.innerHTML = '<div style="text-align:center;padding:40px;color:var(--text-light);"><p>选择城市后查看预算明细</p></div>';
    return;
  }
  /* 基础预算 = 城市数 × 每城天数 × 日预算 */
  const base = selectedCities.length*daysPerCity*val;
  /* 交通预算：按地理路线相邻段计算，最后一段回到出发地（环线） */
  const sorted = [...selectedCities].sort(byRoute);
  let transportTotal = 0;
  const transportRows = [];
  for(let i=0;i<sorted.length;i++){
    const from = cities[sorted[i]].r;
    const to = (i+1<sorted.length) ? cities[sorted[i+1]].r : '出发地';
    const cost = getTransportCost(from,to);
    transportTotal += cost;
    transportRows.push('<tr style="border-bottom:1px solid var(--border);"><td style="padding:8px;">'+from+' → '+to+'</td><td style="padding:8px;text-align:right;">¥'+cost+'</td></tr>');
  }
  /* 大额体验（货币单位混合，只列清单不求和） */
  const expCities = selectedCities.filter(n=>cities[n].x && cities[n].x.length);
  const expHTML = expCities.length ? expCities.map(n=>{
    return cities[n].x.map(x=>'<div style="padding:6px 0;border-bottom:1px dashed var(--border);font-size:0.9rem;"><span style="margin-right:6px;">🎈</span><b>'+n+' · '+x.n+'</b>：'+x.p+'</div>').join('');
  }).join('') : '<p style="color:var(--text-light);font-size:0.85rem;">行程中没有大额体验项目</p>';
  /* 区域分布 */
  const byRegion = {};
  selectedCities.forEach(name=>{
    const c = cities[name];
    if(!byRegion[c.r]) byRegion[c.r] = {cities:0};
    byRegion[c.r].cities++;
  });
  let regionHTML = '';
  for(let r in byRegion){
    regionHTML += '<tr style="border-bottom:1px solid var(--border);"><td style="padding:8px;">'+r+'</td><td style="padding:8px;">'+byRegion[r].cities+'城</td><td style="padding:8px;text-align:right;">¥'+(byRegion[r].cities*val*daysPerCity)+'</td></tr>';
  }
  el.innerHTML = '<div class="card"><h3>预算明细</h3>'
    +'<h4 style="margin:0 0 4px;">基础预算（食宿+市内交通）</h4>'
    +'<p style="font-size:1.2rem;margin:0 0 4px;">¥<strong style="color:var(--primary);">'+base+'</strong></p>'
    +'<p style="font-size:0.8rem;color:var(--text-light);margin:0 0 16px;">'+selectedCities.length+'城 × '+daysPerCity+'天 × ¥'+val+'/天</p>'
    +'<h4 style="margin:0 0 4px;">城际交通（按路线估算）</h4>'
    +'<table style="width:100%;border-collapse:collapse;margin-bottom:4px;">'+transportRows.join('')
    +'<tr><td style="padding:8px;"><b>交通合计</b></td><td style="padding:8px;text-align:right;"><b style="color:var(--primary);">¥'+transportTotal+'</b></td></tr></table>'
    +'<p style="font-size:0.8rem;color:var(--text-light);margin:0 0 16px;">区域间价格含巴士/火车/飞机的混合估算，实际以预订为准</p>'
    +'<h4 style="margin:0 0 8px;">大额体验（可选，另计）</h4>'+expHTML
    +'<h4 style="margin:16px 0 8px;">按区域分布（基础预算）</h4>'
    +'<table style="width:100%;border-collapse:collapse;">'+regionHTML+'</table>'
    +'<div style="margin-top:16px;background:linear-gradient(135deg,var(--primary),#f39c12);color:white;border-radius:12px;padding:16px;text-align:center;">'
    +'<div style="font-size:0.85rem;opacity:0.9;">预估总预算（基础+交通，不含大额体验）</div>'
    +'<div style="font-size:1.8rem;font-weight:700;">¥'+(base+transportTotal)+'</div></div></div>';
}

/* ---------- 数据重置 ---------- */
function resetData(){
  if(!confirm('确定要清空全部数据吗？\n（选中的城市、清单、打卡记录、行程进度都会删除，且无法恢复）')){
    return;
  }
  ls.remove('selectedCities');
  ls.remove('checklists');
  ls.remove('checklistVer');
  ls.remove('visitedCities');
  ls.remove('journeyCity');
  ls.remove('tripDate');
  ls.remove('daysPerCity');
  selectedCities = []; checklists = JSON.parse(JSON.stringify(DEFAULT_CHECKLISTS));
  visitedCities = []; journeyCity = ''; routeLocked = false; tripDate = ''; daysPerCity = 3;
  document.getElementById('tripDateInput').value = '';
  document.getElementById('daysPerCitySel').value = '3';
  renderCities(); renderTrip(); renderGuide(); renderVisa(); renderChecklist(); updateBudget();
  document.getElementById('tripCount').textContent = 0;
  alert('已重置，可以重新开始规划啦！');
}

/* ---------- 暗色模式 ---------- */
function toggleTheme(){
  const root = document.documentElement;
  const isDark = root.getAttribute('data-theme')==='dark';
  root.setAttribute('data-theme', isDark?'light':'dark');
  document.getElementById('themeToggle').textContent = isDark?'🌙':'☀️';
  ls.set('theme', isDark?'light':'dark');
}
function applyTheme(){
  const saved = ls.get('theme');
  const root = document.documentElement;
  if(saved==='dark'){
    root.setAttribute('data-theme','dark');
    document.getElementById('themeToggle').textContent = '☀️';
  }
}

/* ---------- 行前贴士 ---------- */
function renderTips(){
  const el = document.getElementById('tipsContent');
  let html = '<div class="card"><h3>🗣️ 日常用语速查</h3>'
    +'<table class="tips-table"><tr><th>区域</th><th>你好</th><th>谢谢</th></tr>';
  for(let r in TIPS.languages){
    html += '<tr><td>'+r+'</td><td>'+TIPS.languages[r].hi+'</td><td>'+TIPS.languages[r].th+'</td></tr>';
  }
  html += '</table></div>'
    +'<div class="card"><h3>🔌 电源插头</h3>'
    +'<table class="tips-table"><tr><th>区域</th><th>插头类型</th><th>说明</th></tr>';
  TIPS.plugs.forEach(p=>{
    html += '<tr><td>'+p.r+'</td><td><b>'+p.p+'</b></td><td>'+p.note+'</td></tr>';
  });
  html += '</table><p style="font-size:0.8rem;color:var(--text-light);margin-top:8px;">大多数国家为 220V，中国两脚插头基本通用；以色列为 230V H 型需转换头</p></div>'
    +'<div class="card"><h3>🕐 时区</h3>'
    +'<table class="tips-table"><tr><th>区域</th><th>时区</th><th>与北京时间差</th></tr>';
  TIPS.timezones.forEach(t=>{
    html += '<tr><td>'+t.r+'</td><td><b>'+t.tz+'</b></td><td>'+t.diff+'</td></tr>';
  });
  html += '</table></div>'
    +'<div class="card"><h3>💉 疫苗与健康</h3>'
    +'<table class="tips-table"><tr><th>区域</th><th>建议疫苗</th><th>说明</th></tr>';
  TIPS.vaccines.forEach(v=>{
    html += '<tr><td>'+v.r+'</td><td><b>'+v.v+'</b></td><td>'+v.n+'</td></tr>';
  });
  html += '</table></div>'
    +'<div class="card"><h3>📶 网络与通信</h3>';
  TIPS.connectivity.forEach(c=>{
    html += '<div style="padding:10px 0;border-bottom:1px dashed var(--border);display:flex;gap:10px;align-items:center;"><span style="font-size:1.2rem;">'+c.icon+'</span><div><b>'+c.k+'</b><br><span style="font-size:0.85rem;color:var(--text-light);">'+c.v+'</span></div></div>';
  });
  html += '</div>'
    +'<div class="card"><h3>🙏 习俗与礼仪</h3>'
    +'<table class="tips-table"><tr><th>区域</th><th>注意</th></tr>';
  TIPS.customs.forEach(c=>{
    html += '<tr><td>'+c.r+'</td><td>'+c.v+'</td></tr>';
  });
  html += '</table></div>'
    +'<div class="card"><h3>⚠️ 安全细节</h3>';
  TIPS.safetyTips.forEach(s=>{
    html += '<div style="padding:10px 0;border-bottom:1px dashed var(--border);display:flex;gap:10px;align-items:center;"><span style="font-size:1.2rem;">'+s.icon+'</span><div><b>'+s.k+'</b><br><span style="font-size:0.85rem;color:var(--text-light);">'+s.v+'</span></div></div>';
  });
  html += '</div>'
    +'<div class="card"><h3>🛟 安全与应急</h3>';
  TIPS.emergency.forEach(e=>{
    html += '<div style="padding:10px 0;border-bottom:1px dashed var(--border);display:flex;gap:10px;align-items:center;"><span style="font-size:1.2rem;">'+e.icon+'</span><div><b>'+e.k+'</b><br><span style="font-size:0.85rem;color:var(--text-light);">'+e.v+'</span></div></div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

/* ---------- Hero 背景轮播 ---------- */
let heroIdx = 0;
const heroLayers = document.querySelectorAll('.hero-bg');
if(heroLayers.length>1){
  setInterval(function(){
    heroLayers[heroIdx].classList.remove('show');
    heroIdx = (heroIdx+1)%heroLayers.length;
    heroLayers[heroIdx].classList.add('show');
  }, 5000);
}

/* ---------- 初始化 ---------- */
applyTheme();
document.getElementById('tripDateInput').value = tripDate;
document.getElementById('daysPerCitySel').value = daysPerCity;
renderCities();
renderChecklist();
document.getElementById('tripCount').textContent = selectedCities.length;
