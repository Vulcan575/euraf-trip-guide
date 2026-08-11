const fs = require('fs');
const vm = require('vm');

// ---- DOM stub ----
const byId = {};
function mkEl(id){
  const el = {
    id, value:'', style:{}, dataset:{}, innerHTML:'', textContent:'',
    className:'', checked:false, disabled:false,
    classList:{add(){},remove(){},contains(){return false;},toggle(){}}, children:[],
    addEventListener(){}, removeEventListener(){}, setAttribute(){}, appendChild(){}, removeChild(){},
    append(){}, querySelector(){return null;}, querySelectorAll(){return [];},
    getContext(){ return {fillRect(){},clearRect(){},getImageData(){return {data:[]};},putImageData(){},drawImage(){},save(){},restore(){},translate(){},scale(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},fill(){},arc(){},fillText(){},measureText(){return {width:0};},strokeRect(){}}; },
  };
  el.value = '';
  return el;
}
const doc = {
  getElementById(id){ if(!byId[id]) byId[id]=mkEl(id); return byId[id]; },
  createElement(tag){ return mkEl(tag); },
  createDocumentFragment(){ return {appendChild(){},children:[],querySelectorAll(){return[]},querySelector(){return null;}}; },
  querySelector(){ return mkEl('sel'); },
  querySelectorAll(){ return []; },
  addEventListener(){}, removeEventListener(){},
  body:{classList:{add(){},remove(){},contains(){return false;}}},
  documentElement:{classList:{add(){},remove(){},contains(){return false;}},style:{}},
  title:'',
  hidden:false,
};
const sandbox = {
  window:{}, document:doc, navigator:{clipboard:{writeText:()=>Promise.resolve()}},
  localStorage:{_d:{},getItem(k){return this._d[k]||null;},setItem(k,v){this._d[k]=String(v);},removeItem(k){delete this._d[k];},clear(){this._d={};}},
  sessionStorage:{_d:{},getItem(k){return this._d[k]||null;},setItem(k,v){this._d[k]=String(v);},removeItem(k){delete this._d[k];},clear(){this._d={};}},
  alert(){}, confirm(){return true;}, prompt(){return null;},
  console, setTimeout, clearTimeout, setInterval(){return 0;}, clearInterval,
  Date, Math, JSON, Promise, parseInt, parseFloat, isNaN, String, Number, Boolean, Array, Object, RegExp,
  requestAnimationFrame(){}, cancelAnimationFrame(){},
};
sandbox.window = sandbox;
vm.createContext(sandbox);

// ---- load scripts ----
for(const f of ['js/data-cities.js','js/data-meta.js','js/data-checklist.js','js/data-gear.js','js/data-route.js','js/app.js']){
  vm.runInContext(fs.readFileSync(f,'utf8'), sandbox, {filename:f});
}
vm.runInContext('window.onload && window.onload();', sandbox);

const c = vm.runInContext('cities', sandbox);
const keys = Object.keys(c);
console.log('城市总数:', keys.length);

// 15 新城市验证
const check = ['阿姆斯特丹','柏林','马德里','里斯本','威尼斯','河内','胡志明市','蒲甘','博卡拉','新德里','内罗毕','开普敦','阿布扎比','德黑兰','撒马尔罕'];
let allOk = true;
const wait = (ms)=>new Promise(r=>setTimeout(r,ms));
(async function main(){
for(const name of check){
  const d = c[name];
  if(!d){ console.log('❌ 缺失城市:', name); allOk=false; continue; }
  const errs = [];
  if(!d.i || d.i.length < 12) errs.push('介绍过短');
  if(!d.a || d.a.length < 3) errs.push('景点不足3个');
  else for(const a of d.a){ const desc = a.substring(a.indexOf(':')+1); if(desc.length < 12) errs.push('景点描述过短:'+a.slice(0,14)); }
  if(!d.tip || d.tip.length < 10) errs.push('贴士过短');
  if(!d.f) errs.push('缺美食');
  if(!d.best) errs.push('缺最佳季节');
  if(d.b === undefined) errs.push('缺预算');
  if(!d.h || !d.h.length) errs.push('缺青旅');
  const hasPrice = JSON.stringify(d).includes('€') || JSON.stringify(d).includes('$') || JSON.stringify(d).includes('¥') || JSON.stringify(d).includes('卢比') || JSON.stringify(d).includes('苏姆') || JSON.stringify(d).includes('迪拉姆') || JSON.stringify(d).includes('里亚尔') || JSON.stringify(d).includes('兰特') || JSON.stringify(d).includes('₹');
  if(!hasPrice) errs.push('无价格信息');
  if(errs.length) { console.log('❌', name+':', errs.join('; ')); allOk=false; }
  else console.log('✅', name);
}

// 全部 125 城结构抽查
let bad=0;
for(const k of keys){
  const d=c[k];
  if(!d.i||d.i.length<12){console.log('⚠️ 介绍过短:',k);bad++;}
  if(!d.a||d.a.length<3){console.log('⚠️ 景点不足:',k);bad++;}
}
console.log('全量结构问题:', bad);

// tab 交互验证
const fns = [
  ['cities tab','switchTab(\'cities\')'],
  ['checklist tab','switchTab(\'checklist\')'],
  ['visa tab','switchTab(\'visa\')'],
  ['trip tab','switchTab(\'trip\')'],
  ['budget tab','switchTab(\'budget\')'],
  ['tips tab','switchTab(\'tips\')'],
  ['gear tab','switchTab(\'gear\')'],
  ['map tab(无Leaflet降级)','switchTab(\'map\')'],
];
for(const [label,expr] of fns){
  try{ vm.runInContext(expr+';', sandbox); await wait(60); console.log('✅', label); }
  catch(e){ console.log('❌', label, e.message); allOk=false; }
}
// 攻略内容验证
try{
  vm.runInContext('switchTab(\'cities\'); toggleCity(\'撒马尔罕\'); switchTab(\'guide\');', sandbox);
  await wait(80);
  const g = sandbox.document.getElementById('guideContent').innerHTML;
  if(g.includes('雷吉斯坦') && g.includes('苏姆')) console.log('✅ 撒马尔罕攻略渲染（含门票信息）');
  else { console.log('❌ 攻略渲染缺失内容'); allOk=false; }
}catch(e){ console.log('❌ 攻略渲染异常:', e.message); allOk=false; }
// 行程添加验证
try{
  vm.runInContext('toggleCity(\'阿姆斯特丹\'); toggleCity(\'柏林\'); switchTab(\'trip\');', sandbox);
  const t = sandbox.document.getElementById('tripCount').textContent || sandbox.document.getElementById('tripCount').innerHTML;
  console.log('✅ 行程城市数:', t);
}catch(e){ console.log('❌ 行程异常:', e.message); allOk=false; }
// 地图容器降级提示
try{
  vm.runInContext('switchTab(\'map\');', sandbox);
  const mc = sandbox.document.getElementById('mapCanvas').innerHTML;
  if(mc.includes('地图组件加载失败')) console.log('✅ 地图降级提示正常');
  else console.log('⚠️ 地图容器:', String(mc).slice(0,60));
}catch(e){ console.log('❌ 地图tab异常:', e.message); allOk=false; }
// 坐标覆盖验证
try{
  const coords = vm.runInContext('CITY_COORDS', sandbox);
  const cData = vm.runInContext('cities', sandbox);
  const miss = Object.keys(cData).filter(n=>!coords[n]);
  console.log(miss.length===0 ? '✅ 坐标覆盖 125/125' : '❌ 缺坐标: '+miss.join('、'));
}catch(e){ console.log('❌ 坐标验证异常:', e.message); allOk=false; }

console.log(allOk ? '\n=== 全部通过 ===' : '\n=== 存在失败项 ===');
})().catch(e=>{ console.log('❌ 测试异常:', e); process.exit(1); });
