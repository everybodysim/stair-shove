const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('/tmp/stair-shove/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const noopFn=new Proxy(function(){},{get:()=>noopFn,apply:()=>noopFn});
const ctxStub=new Proxy({},{get:(t,p)=>(p in t?t[p]:noopFn),set:(t,p,v)=>{t[p]=v;return true}});
function makeEl(){return{style:{},dataset:{},innerHTML:'',textContent:'',value:'',width:0,height:0,clientWidth:1280,clientHeight:720,classList:{add(){},remove(){},toggle(){}},appendChild(){return arguments[0]},removeChild(){},children:[],firstChild:{remove(){}},remove(){},addEventListener(){},removeEventListener(){},getContext(){return ctxStub},blur(){},focus(){},onclick:null,getBoundingClientRect(){return{left:0,top:0,width:1280,height:720}},querySelectorAll(){return[]},closest(){return null},contains(){return false},replaceChildren(){}}}
const els={};const sandbox={console,Math,Date,JSON,Object,Array,Number,String,Boolean,RegExp,Map,Set,isNaN,parseInt,parseFloat,structuredClone,performance:{now:()=>Date.now()},devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){},setInterval(){},addEventListener(){},removeEventListener(){},localStorage:{_s:{},getItem(k){return this._s[k]??null},setItem(k,v){this._s[k]=String(v)},removeItem(k){delete this._s[k]}},document:{getElementById(id){return els[id]||(els[id]=makeEl())},createElement(){return makeEl()},addEventListener(){},querySelectorAll(){return[]},body:makeEl(),activeElement:null}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;sandbox.self=sandbox;
vm.createContext(sandbox);
const hook=`;globalThis.__h={get S(){return S},get R(){return R},get mode(){return mode},get D(){return D},get meter(){return meter},get ZC(){return ZC},get cam(){return cam},get ST(){return ST},set STv(v){},start,shove,step,again,build,calc,get UP(){return UP},get cost(){return cost},get lv(){return lv},get unlocked(){return unlocked},spawnDummy,nDummies};`;
vm.runInContext(script+hook,sandbox,{filename:'game.js'});
const g=sandbox.__h;g.start();

function run(k,mv=0.75){
  g.S.st.reboots=k-1;g.again();g.meter.v=mv;const before=g.S.cash;g.shove();
  let guard=0;while(g.mode!=='result'&&guard++<60000)g.step();
  return{earned:g.S.cash-before,frames:g.R.f,cash:g.R.cash,dummies:g.D.length,hpA:g.S.st.hpA,lastLost:g.S.st.lastLost};
}

console.log('== 1) regression: plain runs still work ==');
for(let k=1;k<=3;k++){const r=run(k);console.log(`k=${k}: earned $${r.earned.toFixed(1)} frames=${r.frames} endDummies=${r.dummies} hpA=${r.hpA.toFixed(3)} lastLost=${r.lastLost}`);}

console.log('\n== 2) camera zooms out when dummies spread ==');
g.S.st.reboots=4;g.again();g.meter.v=0.75;g.shove();
let zmMin=1,zmSamples=[];
for(let f=0;f<2500;f++){g.step();if(f%200==0&&g.mode=='run')zmSamples.push(g.cam.zm.toFixed(3));if(g.mode!=='run')break}
console.log('zoom samples (5 dummies):',zmSamples.join(' '),'| min zoom seen:',Math.min(...zmSamples));

console.log('\n== 3) new upgrades show in shop with reboot gates ==');
g.S.st.reboots=0;
const spid=g.UP.find(q=>q.id=='spidey'),fac=g.UP.find(q=>q.id=='factory'),drift=g.UP.find(q=>q.id=='drift');
console.log('spidey at 0 reboots unlocked:',g.unlocked(spid));
g.S.st.reboots=1;g.S.earned=5e7;
console.log('spidey at 1 reboot + earned:',g.unlocked(spid),'| factory at 1 reboot:',g.unlocked(fac));
g.S.st.reboots=2;
console.log('factory at 2 reboots:',g.unlocked(fac),'| drift:',g.unlocked(drift));

console.log('\n== 4) drift zone moves in ready mode ==');
g.S.st.reboots=0;g.S.lv={};g.lv.__proto__=null;delete g.S.lv;g.S.lv={drift:3};g.again();g.calc(false);
let zcs=[];for(let i=0;i<240;i++){g.step();if(i%40==0)zcs.push(g.ZC.toFixed(3))}
console.log('ZC samples with drift lvl3:',zcs.join(' '));

console.log('\n== 5) factory spawns dummies + freecam + run ends ==');
g.S.st.reboots=2;g.S.lv={factory:3};g.again();g.meter.v=0.75;g.shove();
let maxD=0,guard=0;while(g.mode!=='result'&&guard++<60000){g.step();maxD=Math.max(maxD,g.D.length)}
console.log('run finished, max live dummies:',maxD,'(started',g.R.dn,') frames:',g.R.f,'result cash:',g.R.cash.toFixed(1));

console.log('\n== 6) adaptive strength reacts to limb outcomes ==');
g.S.lv={};g.S.st.reboots=0;g.S.st.hpA=1;
const r1=run(1);console.log(`after run1: lastLost=${r1.lastLost} hpA=${r1.hpA.toFixed(3)} (should rise if >=9, drop if <=5)`);
const r2=run(1);console.log(`after run2: lastLost=${r2.lastLost} hpA=${r2.hpA.toFixed(3)}`);

console.log('\n== 7) combo run: many new upgrades owned at once ==');
g.S.st.reboots=3;g.S.lv={ot:4,hitrec:5,domino:3,collect:3,last:3,drift:5,spidey:1,factory:1};g.S.st.hpA=1.2;
g.again();g.meter.v=0.85;g.shove(); // near-perfect
let guard2=0;while(g.mode!=='result'&&guard2++<60000)g.step();
console.log('combo run ok: cash=$'+g.R.cash.toFixed(1),'newBest hits:',g.R.newBest,'collected:',g.R.collected,'lastLaugh:',g.R.lasted,'overtime:',g.R.otOn,'end hpA:',g.S.st.hpA.toFixed(3));
