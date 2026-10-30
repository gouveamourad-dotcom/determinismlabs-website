(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DLProcess=api;})(globalThis,()=>{
  'use strict';
  const minimum=[.65,-.85];
  // Interlocking summits and foothills leave a winding downhill pass into a
  // distinct terminal bowl. Every term is nonnegative and vanishes at its floor.
  const peaks=[
    [-.85,.8,1.20,.30],[.4,.9,.85,.27],[-.5,-.15,.70,.25],[.75,.05,.85,.25],
    [-1.32,1.22,.65,.19],[-.25,1.25,.68,.20],[.95,1.25,.60,.21],[1.34,.70,.72,.20],
    [-1.30,.24,.72,.21],[-1.32,-.38,.82,.22],[-1.12,-1.04,.92,.23],[-.64,-1.28,.90,.20],
    [-.14,-.92,.80,.21],[-.23,-.40,.26,.15],[.04,.55,.30,.17],[1.30,.02,.86,.19],
    [1.28,-.55,1.15,.20],[1.10,-1.30,1.5,.19],[.20,-1.38,1.25,.20],[1.37,-1.15,.70,.18]
  ];
  function evaluate(u,v){const du=u-minimum[0],dv=v-minimum[1],r=du*du+dv*dv;
    const bowl=Math.exp(-r/.14);let b=.17,gu=.34*du+2*2.2/.14*bowl*du,gv=.34*dv+2*2.2/.14*bowl*dv;
    for(const [x,z,a,s] of peaks){const e=a*Math.exp(-((u-x)**2+(v-z)**2)/(2*s*s));b+=e;
      gu+=e*(2*du-r*(u-x)/(s*s));gv+=e*(2*dv-r*(v-z)/(s*s));}
    return {loss:r*b+2.2*(1-bowl),gradient:[gu,gv]};}
  const loss=(u,v)=>evaluate(u,v).loss,gradient=(u,v)=>evaluate(u,v).gradient;
  const path=[];let u=-.85,v=.72,distance=0;
  for(let i=0;i<1000;i++){
    const state=evaluate(u,v),g=state.gradient,n=Math.hypot(...g);
    if(state.loss<1e-8){path.push({u,v,...state,alpha:0,distance});break;}
    let alpha=Math.min(.18,.045/n,.8*Math.hypot(u-minimum[0],v-minimum[1])/n);
    for(let attempt=0;attempt<50;attempt++){
      let previous=state.loss,ok=true;
      for(let j=1;j<=16;j++){const value=loss(u-alpha*g[0]*j/16,v-alpha*g[1]*j/16);
        if(value>previous+1e-12){ok=false;break;}previous=value;}
      if(ok&&previous<=state.loss-.04*alpha*n*n)break;alpha*=.5;
    }
    path.push({u,v,...state,alpha,distance});
    u-=alpha*g[0];v-=alpha*g[1];distance+=alpha*n;
  }
  const clamp=t=>Math.max(0,Math.min(1,t));
  function descent(progress){const target=path.at(-1).distance*clamp(progress);
    let i=0;while(i<path.length-2&&path[i+1].distance<target)i++;
    const a=path[i],b=path[i+1],f=clamp((target-a.distance)/(b.distance-a.distance));
    const u=a.u+(b.u-a.u)*f,v=a.v+(b.v-a.v)*f;
    return {u,v,loss:loss(u,v),step:i,fraction:f};}
  function phase(p){return p<.38?'inputs':p<.65?'processing':p<.94?'output':'complete';}
  return {loss,gradient,path,minimum,peaks,descent,clamp,phase};
});
