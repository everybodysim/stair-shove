const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('/tmp/stair-shove/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const noopFn=new Proxy(function(){},{get:()=>noopFn,apply:()=>noopFn});
const ctxStub=new Proxy({},{get:(t,p)=>(p in t?t[p]:noopFn),set:(t,p,v)=>{t[p]=v;return true}});
function makeEl(){return{style:{},dataset:{},innerHTML:'',textContent:'',value:'',width:0,height:0,clientWidth:1280,clientHeight:720,classList:{add(){},remove(){},toggle(){}},appendChild(){return arguments[0]},removeChild(){},children:[],firstChild:{remove(){}},remove(){},addEventListener(){},removeEventListener(){},getContext(){return ctxStub},blur(){},focus(){},onclick:null,getBoundingClientRect(){return{left:0,top:0,width:1280,height:720}},querySelectorAll(){return[]},closest(){return null},contains(){return false},replaceChildren(){}}}
const els={};const sandbox={console,Math,Date,JSON,Object,Array,Number,String,Boolean,RegExp,Map,Set,isNaN,parseInt,parseFloat,structuredClone,performance:{now:()=>Date.now()},devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){},setInterval(){},addEventListener(){},removeEventListener(){},localStorage:{_s:{},getItem(k){return this._s[k]??null},setItem(k,v){this._s[k]=String(v)},removeItem(k){delete this._s[k]}},document:{getElementById(id){return els[id]||(els[id]=makeEl())},createElement(){return makeEl()},addEventListener(){},querySelectorAll(){return[]},body:makeEl(),activeElement:null}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;sandbox.self=sandbox;
vm.createContext(sandbox);
const hook=`;globalThis.__h={get S(){return S},get R(){return R},get mode(){return mode},get D(){return D},get meter(){return meter},get cam(){return cam},get ST(){return ST},cur,start,shove,step,again,build,calc};`;
vm.runInContext(script+hook,sandbox,{filename:'game.js'});
const g=sandbox.__h;g.start();
for(const k of [1,3,5]){
  g.S.st.reboots=k-1;g.again();g.meter.v=.75;g.shove();
  let f=0,bad=0;
  while(g.mode=='run'&&f++<4000){g.step();
    if(f%30==0){const o=g.D.slice(0,g.R.dn),minx=Math.min(...o.map(d=>d.pts[0].x)),maxx=Math.max(...o.map(d=>d.pts[0].x));
      if(g.cam.x<minx-350||g.cam.x>maxx+350)bad++}}
  console.log(`k=${k}: camera out-of-bounds samples: ${bad} | end zoom ${g.cam.zm.toFixed(2)}`);
}
g.S.st.reboots=2;g.S.lv={factory:3};g.again();g.meter.v=.75;g.shove();
let f2=0,camAtOrigDone=null,drift=0,spawns=0;
while(g.mode=='run'&&f2++<8000){const before=g.D.length;g.step();
  if(g.D.length>before)spawns++;
  if(g.D.slice(0,g.R.dn).every(d=>d.done)&&g.D.length>g.R.dn){
    if(camAtOrigDone==null)camAtOrigDone=g.cam.x;
    drift=Math.max(drift,Math.abs(g.cam.x-camAtOrigDone))}}
console.log('factory: spawns='+spawns+' | camera drift after originals done: '+drift.toFixed(1)+'px (0-2 = parked, factory ignored) | run ended:',g.mode=='result');
