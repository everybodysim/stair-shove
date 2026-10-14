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
g.S.st.reboots=2;g.S.lv={factory:3,charges:0};g.again();g.meter.v=.75;g.shove();
let frames=0,phase2=[],maxJump=0,prevX=g.cam.x;
while(g.mode=='run'&&frames<8000){
  g.step();frames++;
  maxJump=Math.max(maxJump,Math.abs(g.cam.x-prevX));prevX=g.cam.x;
  if(frames%60==0){
    const dn=g.R.dn,om=g.D.slice(0,dn).filter(d=>!d.done),fm=g.D.slice(dn).filter(d=>!d.done&&d.bs>2.2);
    if(!om.length&&fm.length){
      const near=fm.some(d=>Math.abs(d.pts[0].x+90-g.cam.tx)<700);
      phase2.push(near?'FAC':'offscreen!')}
  }
}
console.log('phase2 (originals done, factory still moving):',phase2.length?('cam on factory movers: '+phase2.join(',')):'(window never hit)','');
console.log('run ended:',g.mode=='result','| max cam jump/frame in factory run:',maxJump.toFixed(1)+'px','| dummies spawned:',g.D.length-g.R.dn);
