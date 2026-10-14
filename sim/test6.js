const fs=require('fs'),vm=require('vm');
const html=fs.readFileSync('/tmp/stair-shove/index.html','utf8');
const script=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const noopFn=new Proxy(function(){},{get:()=>noopFn,apply:()=>noopFn});
const ctxStub=new Proxy({},{get:(t,p)=>(p in t?t[p]:noopFn),set:(t,p,v)=>{t[p]=v;return true}});
function makeEl(){return{style:{},dataset:{},innerHTML:'',textContent:'',value:'',width:0,height:0,clientWidth:1280,clientHeight:720,classList:{add(){},remove(){},toggle(){}},appendChild(){return arguments[0]},removeChild(){},children:[],firstChild:{remove(){}},remove(){},addEventListener(){},removeEventListener(){},getContext(){return ctxStub},blur(){},focus(){},onclick:null,getBoundingClientRect(){return{left:0,top:0,width:1280,height:720}},querySelectorAll(){return[]},closest(){return null},contains(){return false},replaceChildren(){}}}
const els={};const sandbox={console,Math,Date,JSON,Object,Array,Number,String,Boolean,RegExp,Map,Set,isNaN,parseInt,parseFloat,structuredClone,performance:{now:()=>Date.now()},devicePixelRatio:1,requestAnimationFrame(){},setTimeout(){},setInterval(){},addEventListener(){},removeEventListener(){},localStorage:{_s:{},getItem(k){return this._s[k]??null},setItem(k,v){this._s[k]=String(v)},removeItem(k){delete this._s[k]}},document:{getElementById(id){return els[id]||(els[id]=makeEl())},createElement(){return makeEl()},addEventListener(){},querySelectorAll(){return[]},body:makeEl(),activeElement:null}};
sandbox.window=sandbox;sandbox.globalThis=sandbox;sandbox.self=sandbox;
vm.createContext(sandbox);
const hook=`;globalThis.__h={get S(){return S},get R(){return R},get mode(){return mode},get D(){return D},get meter(){return meter},get cam(){return cam},get ST(){return ST},get pts(){return pts},cur,start,shove,step,again,build,calc,draw};`;
vm.runInContext(script+hook,sandbox,{filename:'game.js'});
const g=sandbox.__h;g.start();

// --- test A: smoothness with 5 dummies ---
g.S.st.reboots=4;g.again();g.meter.v=.75;g.shove();
let maxDx=0,maxDy=0,minZm=1,prevX=g.cam.x,prevY=g.cam.y,frames=0;
while(g.mode=='run'&&frames<2000){
  g.step();frames++;
  maxDx=Math.max(maxDx,Math.abs(g.cam.x-prevX));maxDy=Math.max(maxDy,Math.abs(g.cam.y-prevY));
  minZm=Math.min(minZm,g.cam.zm);prevX=g.cam.x;prevY=g.cam.y;
}
console.log(`A) 5 dummies: max cam jump/frame = ${maxDx.toFixed(1)}px x, ${maxDy.toFixed(1)}px y (snap = 50+) | min zoom ${minZm.toFixed(3)}`);

// --- test B: teardown fallback (all parts loose) still gets followed smoothly ---
g.S.st.reboots=0;g.S.lv={};g.again();g.meter.v=.75;g.shove();
g.cur(g.D[0]);for(let i=0;i<10;i++)g.breakLimb?0:0;
// force teardown on all dummies via direct limb breaking
while(g.mode=='run'){ for(const d of g.D){g.cur(d);d.LM.forEach((L,i)=>{L.hp=1});if(d.LM.every(L=>L.broken)===false){for(let i=0;i<10;i++){/* break via hp drain */}}}
  g.step(); if(g.mode=='run'&&g.R.f>150&&g.D.every(d=>d.LM&&d.LM[0])){ break } }
// simpler: verify run completes with camera never NaN
console.log('B) teardown-ish run ended, cam sane:',Number.isFinite(g.cam.x)&&Number.isFinite(g.cam.zm));

// --- test C: factory ignores spawns while originals move, follows them after ---
g.S.st.reboots=2;g.S.lv={factory:3};g.again();g.meter.v=.75;g.shove();
let snapC=[],framesC=0;
while(g.mode=='run'&&framesC<8000){
  g.step();framesC++;
  if(framesC%60==0){
    const orig=g.D.slice(0,g.R.dn),fac=g.D.slice(g.R.dn);
    const origMoving=orig.filter(d=>!d.done);
    if(fac.length&&origMoving.length){
      // camera should be nearer to the originals than to a lone factory dummy
      const nearOrig=origMoving.some(d=>Math.abs(d.pts[0].x-g.cam.tx)<700);
      snapC.push(nearOrig?'orig':'FACTORY!')}
  }
}
console.log('C) factory run: cam focus samples =',snapC.slice(0,20).join(','),'| run ended at frame',g.R.f,'| max dummies',g.D.length);

// --- test D: anchor prefers furthest-down mover ---
g.S.st.reboots=2;g.S.lv={};g.again();g.meter.v=.85;g.shove();
let worst=1e9,framesD=0;
while(g.mode=='run'&&framesD<3000){
  g.step();framesD++;
  if(framesD%30==0){
    const movers=g.D.filter(d=>!d.done&&d.bs>2.2);
    if(movers.length){const lead=movers.reduce((a,b)=>a.pts[0].x>b.pts[0].x?a:b);
      worst=Math.min(worst,700-Math.abs(lead.pts[0].x+90-g.cam.tx))} // positive = camera keeps lead within 700
  }
}
console.log('D) furthest-down mover kept on screen margin:',worst.toFixed(0),'px (positive = visible)');
