const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('/tmp/stair-shove/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const noopFn=new Proxy(function(){},{get:()=>noopFn,apply:()=>noopFn});
const ctxStub=new Proxy({},{get:(t,p)=>(p in t?t[p]:noopFn),set:(t,p,v)=>{t[p]=v;return true}});
function makeEl(){return{style:{},dataset:{},innerHTML:'',textContent:'',value:'',width:0,height:0,clientWidth:1280,clientHeight:720,classList:{add(){},remove(){},toggle(){}},appendChild(){return arguments[0]},removeChild(){},children:[],firstChild:{remove(){}},remove(){},addEventListener(){},removeEventListener(){},getContext(){return ctxStub},blur(){},focus(){},onclick:null,getBoundingClientRect(){return{left:0,top:0,width:1280,height:720}},querySelectorAll(){return[]},closest(){return null},contains(){return false},replaceChildren(){}}}
const els={};const sandbox={console,Math,Date,JSON,Object,Array,Number,String,Boolean,RegExp,Map,Set,isNaN,parseInt,parseFloat,structuredClone,performance:{now:()=>Date.now()},devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){},setInterval(){},addEventListener(){},removeEventListener(){},localStorage:{_s:{},getItem(k){return this._s[k]??null},setItem(k,v){this._s[k]=String(v)},removeItem(k){delete this._s[k]}},document:{getElementById(id){return els[id]||(els[id]=makeEl())},createElement(){return makeEl()},addEventListener(){},querySelectorAll(){return[]},body:makeEl(),activeElement:null}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;sandbox.self=sandbox;
vm.createContext(sandbox);
const hook=`;globalThis.__h={get S(){return S},get R(){return R},get mode(){return mode},get D(){return D},get meter(){return meter},get ZC(){return ZC},get cam(){return cam},get ST(){return ST},get LM(){return LM},get pts(){return pts},cur,start,shove,step,again,build,calc,dmgLimb,breakLimb};`;
vm.runInContext(script+hook,sandbox,{filename:'game.js'});
const g=sandbox.__h;g.start();

// own collector + last laugh + domino, then break everything on dummy 0
g.S.st.reboots=0;g.S.lv={collect:3,last:3,domino:3};g.again();g.meter.v=.75;g.shove();
g.cur(g.D[0]);
for(let i=1;i<=9;i++){g.LM[i].hp=1;g.breakLimb(i)}
console.log('after 9 limb breaks: lastLaugh fired =',g.R.lasted===1,'| domino window =',g.R.dom);
// break the torso -> total teardown -> all 10 parts -> collector jackpot
g.breakLimb(0);
console.log('after torso break: unique parts broken =',Object.keys(g.R.br).length);
let guard=0;while(g.mode!=='result'&&guard++<60000)g.step();
console.log('run ended. collected jackpot =',g.R.collected,'| R.cash $'+g.R.cash.toFixed(1),'| hpA now',g.S.st.hpA.toFixed(3),'(rose from 1 after 10 parts broke)');

// adaptive: fully-intact run now weakens (nothing broke)
g.S.lv={};const before=g.S.st.hpA;
g.again();g.meter.v=.75;g.shove();guard=0;while(g.mode!=='result'&&guard++<60000)g.step();
console.log('intact run: hpA',before.toFixed(3),'->',g.S.st.hpA.toFixed(3),'(weakened, no time-cancel)');
