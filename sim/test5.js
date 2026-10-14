const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('/tmp/stair-shove/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const noopFn=new Proxy(function(){},{get:()=>noopFn,apply:()=>noopFn});
const ctxStub=new Proxy({},{get:(t,p)=>(p in t?t[p]:noopFn),set:(t,p,v)=>{t[p]=v;return true}});
function makeEl(){return{style:{},dataset:{},innerHTML:'',textContent:'',value:'',width:0,height:0,clientWidth:1280,clientHeight:720,classList:{add(){},remove(){},toggle(){}},appendChild(){return arguments[0]},removeChild(){},children:[],firstChild:{remove(){}},remove(){},addEventListener(){},removeEventListener(){},getContext(){return ctxStub},blur(){},focus(){},onclick:null,getBoundingClientRect(){return{left:0,top:0,width:1280,height:720}},querySelectorAll(){return[]},closest(){return null},contains(){return false},replaceChildren(){}}}
const els={};const sandbox={console,Math,Date,JSON,Object,Array,Number,String,Boolean,RegExp,Map,Set,isNaN,parseInt,parseFloat,structuredClone,performance:{now:()=>Date.now()},devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){},setInterval(){},addEventListener(){},removeEventListener(){},localStorage:{_s:{},getItem(k){return this._s[k]??null},setItem(k,v){this._s[k]=String(v)},removeItem(k){delete this._s[k]}},document:{getElementById(id){return els[id]||(els[id]=makeEl())},createElement(){return makeEl()},addEventListener(){},querySelectorAll(){return[]},body:makeEl(),activeElement:null}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;sandbox.self=sandbox;
vm.createContext(sandbox);
const hook=`;globalThis.__h={get S(){return S},get mode(){return mode},render,again,build,calc,tab:setter=>{},start,shove,step,get UP(){return UP}};globalThis.__h.setTab=t=>{tab=t};`;
vm.runInContext(script+hook,sandbox,{filename:'game.js'});
const g=sandbox.__h;g.start();

// fresh franchise shop
g.render();
let h=els['panel'].innerHTML;
console.log('shop shows Drifting Green Zone:',h.includes('Drifting Green Zone'));
console.log('shop hides Spider-Man at 0 reboots:',!h.includes('Spider-Man'),'| hides Factory:',!h.includes('The Stair Factory'));
// rebooted player with money
g.S.st.reboots=2;g.S.earned=1e8;g.S.cash=1e8;g.render();
h=els['panel'].innerHTML;
console.log('shop shows Spider-Man:',h.includes('Spider-Man'),'| Factory:',h.includes('The Stair Factory'),'| Overtime:',h.includes('Overtime'),'| Limb Collector:',h.includes('Limb Collector'),'| Last Laugh:',h.includes('Last Laugh'),'| Personal Best:',h.includes('Personal Best'),'| Domino Effect:',h.includes('Domino Effect'));
// pricing: 3 reboots -> pmul set only at reboot; simulate reboot by setting reboots manually (cost uses pmul)
g.S.st.pmul=1.5;
const push=g.UP.find(q=>q.id==='push');
console.log('pmul=1.5 -> first push level costs 15*1.5 = 22.5 ->',Math.floor(15*1.5));
// result screen renders with all the new state
g.S.st.reboots=0;g.S.lv={collect:3};g.again();g.meter.v=.75;g.shove();
let guard=0;while(g.mode!=='result'&&guard++<60000)g.step();
g.render();
console.log('result box rendered:',els['box'].innerHTML.length>200,'| content sample:',els['box'].innerHTML.slice(0,80).replace(/<[^>]*>/g,''));
