const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('/tmp/stair-shove/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const noopFn=new Proxy(function(){},{get:()=>noopFn,apply:()=>noopFn});
const ctxStub=new Proxy({},{get:(t,p)=>(p in t?t[p]:noopFn),set:(t,p,v)=>{t[p]=v;return true}});
function makeEl(){return{style:{},dataset:{},innerHTML:'',textContent:'',value:'',width:0,height:0,clientWidth:1280,clientHeight:720,classList:{add(){},remove(){},toggle(){}},appendChild(){return arguments[0]},removeChild(){},children:[],firstChild:{remove(){}},remove(){},addEventListener(){},removeEventListener(){},getContext(){return ctxStub},blur(){},focus(){},onclick:null,getBoundingClientRect(){return{left:0,top:0,width:1280,height:720}},querySelectorAll(){return[]},closest(){return null},contains(){return false},replaceChildren(){}}}
const els={};const sandbox={console,Math,Date,JSON,Object,Array,Number,String,Boolean,RegExp,Map,Set,isNaN,parseInt,parseFloat,structuredClone,performance:{now:()=>Date.now()},devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){},setInterval(){},addEventListener(){},removeEventListener(){},localStorage:{_s:{},getItem(k){return this._s[k]??null},setItem(k,v){this._s[k]=String(v)},removeItem(k){delete this._s[k]}},document:{getElementById(id){return els[id]||(els[id]=makeEl())},createElement(){return makeEl()},addEventListener(){},querySelectorAll(){return[]},body:makeEl(),activeElement:null}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;sandbox.self=sandbox;
vm.createContext(sandbox);
const hook=`;globalThis.__h={get S(){return S},get R(){return R},get mode(){return mode},get D(){return D},get meter(){return meter},get cam(){return cam},get ST(){return ST},get LM(){return LM},get pts(){return pts},get gone(){return gone},cur,start,shove,step,again,build,calc,breakLimb,draw,dmgLimb};`;
vm.runInContext(script+hook,sandbox,{filename:'game.js'});
const g=sandbox.__h;g.start();

// 1) spider dummy built with real extra limbs
g.S.st.reboots=1;g.S.lv={spidey:1};g.again();
const d0=g.D[0],d1=g.D[1];
console.log('dummy 0:',d0.pts.length,'pts,',d0.LM.length,'limbs,',d0.JT.length,'joints | dummy 1:',d1.pts.length,'pts');
g.cur(d0);
const sp=[10,11,12,13].map(i=>({i,len:g.LM[i].len,brk:g.LM[i].broken}));
console.log('spider limbs built:',JSON.stringify(sp));

// 2) physics: spider limbs move with the body
g.meter.v=.75;g.shove();
for(let f=0;f<90;f++)g.step();
g.cur(d0);
const moving=[10,11,12,13].every(i=>{const a=g.pts[2*i],b=g.pts[2*i+1];return Math.abs(a.x-a.px)+Math.abs(a.y-a.py)>0||Math.abs(b.x-b.px)+Math.abs(b.y-b.py)>0});
console.log('spider limbs physically moving:',moving,'| still attached (gone=0):',[10,11,12,13].map(i=>g.gone(i)).join(','));

// 3) break a spider limb: it detaches like any other
g.cur(d0);g.LM[12].hp=1;g.breakLimb(12);
console.log('after break: gone(12)=',g.gone(12),'| name:',g.LM[12].n,'| domino window:',g.R.dom);
let guard=0;while(g.mode!=='result'&&guard++<60000)g.step();
console.log('run ended fine, cash $'+g.R.cash.toFixed(1),'| limbs lost counted (core only):',g.R.lost);

// 4) teardown cascade covers spider limbs + no crash
g.S.lv={spidey:1};g.again();g.meter.v=.75;g.shove();
g.cur(g.D[0]);g.LM[0].hp=1;g.breakLimb(0);
console.log('teardown: all 14 broken =',g.D[0].LM.every(l=>l.broken));
guard=0;while(g.mode!=='result'&&guard++<60000)g.step();
console.log('teardown run ended, cam sane:',Number.isFinite(g.cam.x),'| result rendered ok');

// 5) regression: no spidey = normal 10 limbs
g.S.lv={};g.again();
console.log('plain dummy limbs:',g.D[0].LM.length,'pts:',g.D[0].pts.length,'| draw OK:',(()=>{try{g.draw();return true}catch(e){return e.message}})());

// 6) collector counts only core parts even with spider breaks
g.S.lv={spidey:1,collect:2};g.again();g.meter.v=.75;g.shove();
g.cur(g.D[0]);for(const i of [10,11,12,13]){g.LM[i].hp=1;g.breakLimb(i)}
const nb=[0,1,2,3,4,5,6,7,8,9].filter(ix=>g.R.br[ix]).length;
console.log('collector count with 4 spider limbs broken:',nb,'(0 core parts -> no payout inflation)');
guard=0;while(g.mode!=='result'&&guard++<60000)g.step();
console.log('final run ok');
