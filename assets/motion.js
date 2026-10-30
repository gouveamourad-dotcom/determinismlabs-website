(()=>{
  'use strict';
  const canvas=document.getElementById('system');if(!canvas)return;
  let gpu=globalThis.DLRenderer?.create(canvas);
  const ctx=gpu?null:canvas.getContext('2d');if(!gpu&&!ctx)return;
  canvas.dataset.renderer=gpu?'webgl':'canvas';
  canvas.addEventListener('webglcontextrestored',()=>{gpu=globalThis.DLRenderer.create(canvas);resize();});
  canvas.style.background='radial-gradient(ellipse at 51% 49%,rgba(91,120,99,.10),transparent 65%)';
  const T=globalThis.DLTimeline,P=globalThis.DLProcess,TAU=Math.PI*2;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const C={rail:'#788680',edge:'#b2bcae',dim:'#52615e',dark:'#263134',sage:'#afbcaa',white:'#efeee2'};
  let paused=reduced.matches,time=0,last=null,visible=true,w=0,h=0,dpr=1;
  let camera=T.sample(0),scene=-2;
  let queue=[],phase=0,angle=.6,scale=1,focus=[0,0,0],worldOpacity=1;
  let ca=1,sa=0,cp=1,sp=0;
  const orbit=(v,n=1,offset=0)=>Math.sin(v*n+offset);
  function project(p){const c=ca,s=sa;
    const x=p[0]-focus[0],y=p[1]-focus[1],z=p[2]-focus[2];
    const rz=x*s+z*c;
    return [w*.5+(x*c-z*s)*scale,h*.46+(y*cp+rz*sp)*scale,rz*cp-y*sp];}
  function add(points,fill,stroke,width=1,alpha=1,closed=false){
    if(alpha*worldOpacity<.001)return;const ps=points.map(project);queue.push({ps,fill,stroke,width,alpha:alpha*worldOpacity,closed,
      depth:ps.reduce((v,p)=>v+p[2],0)/ps.length});}
  const line=(p,color=C.edge,width=1,alpha=1)=>add(p,null,color,width,alpha);
  const face=(p,fill=C.dark,stroke=C.dim,alpha=1)=>add(p,fill,stroke,.7,alpha,true);
  function point(p,r,color=C.white,alpha=1){if(alpha*worldOpacity<.001)return;const q=project(p);queue.push({dot:q,r,color,alpha:alpha*worldOpacity,depth:q[2]+.2});}
  function render(){if(gpu){gpu.draw(queue,w,h);return;}queue.sort((a,b)=>a.depth-b.depth);for(const o of queue){ctx.globalAlpha=o.alpha;
    if(o.dot){ctx.beginPath();ctx.arc(o.dot[0],o.dot[1],o.r,0,TAU);ctx.fillStyle=o.color;ctx.fill();continue;}
    ctx.beginPath();o.ps.forEach((p,i)=>i?ctx.lineTo(p[0],p[1]):ctx.moveTo(p[0],p[1]));
    if(o.closed)ctx.closePath();if(o.fill){ctx.fillStyle=o.fill;ctx.fill();}
    if(o.stroke){ctx.strokeStyle=o.stroke;ctx.lineWidth=o.width;ctx.stroke();}}
    ctx.globalAlpha=1;
  }
  function circle(x,y,z,r,plane='xz',start=0,end=TAU,n=48){return Array.from({length:n+1},(_,i)=>{
    const t=start+(end-start)*i/n,c=Math.cos(t)*r,s=Math.sin(t)*r;
    return plane==='xz'?[x+c,y,z+s]:plane==='xy'?[x+c,y+s,z]:[x,y+c,z+s];});}
  function ring(x,y,z,r,color=C.edge,width=1,plane='xz',alpha=1){line(circle(x,y,z,r,plane),color,width,alpha);}
  function box(x,y,z,dx,dy,dz,alpha=1,fins=true){
    const p=[[x-dx,y-dy,z-dz],[x+dx,y-dy,z-dz],[x+dx,y-dy,z+dz],[x-dx,y-dy,z+dz],
      [x-dx,y+dy,z-dz],[x+dx,y+dy,z-dz],[x+dx,y+dy,z+dz],[x-dx,y+dy,z+dz]];
    face([p[1],p[2],p[6],p[5]],'#354142',C.dim,alpha);face([p[2],p[3],p[7],p[6]],'#293438',C.dim,alpha);
    face(p.slice(0,4),'#64706b',C.edge,alpha);
    if(fins)for(let j=-dx+4;j<dx;j+=4)line([[x+j,y-dy-.3,z-dz+2],[x+j,y-dy-.3,z+dz-2]],'#243932',.75,alpha);
  }
  function cylinder(x,y,z,r,height,alpha=1){
    for(let i=0;i<20;i++){const a=i*TAU/20,b=(i+1)*TAU/20;
      face([[x+r*Math.cos(a),y-height/2,z+r*Math.sin(a)],[x+r*Math.cos(b),y-height/2,z+r*Math.sin(b)],
        [x+r*Math.cos(b),y+height/2,z+r*Math.sin(b)],[x+r*Math.cos(a),y+height/2,z+r*Math.sin(a)]],
        i<10?'#3b4848':'#2c383b',null,alpha);}
    face(circle(x,y-height/2,z,r),'#7b8781',C.edge,alpha);
    for(let j=-height/2;j<=height/2;j+=height)ring(x,y+j,z,r,C.edge,.7,'xz',alpha);
  }
  function rounded(a,r,t,y){let u=((t%1+1)%1)*(8*(a-r)+TAU*r),side=0;
    const lens=Array.from({length:8},(_,i)=>i%2?Math.PI*r/2:2*(a-r));
    while(side<7&&u>lens[side])u-=lens[side++];
    if(side===0)return[-a+r+u,y,-a];if(side===2)return[a,y,-a+r+u];
    if(side===4)return[a-r-u,y,a];if(side===6)return[-a,y,a-r-u];
    const q=[0,-Math.PI/2,0,0,0,Math.PI/2,0,Math.PI][side]+u/r;
    return[(side<4?1:-1)*(a-r)+r*Math.cos(q),y,(side===1||side===7?-1:1)*(a-r)+r*Math.sin(q)];}
  // Two structural rims carry the processing bays. Tracks are inset into the
  // rims, so the silhouette reads as one machine rather than floating devices.
  function frameBand(a,inner,y,thickness){
    const count=80;
    for(let i=0;i<count;i++){
      const p=rounded(a,32,i/count,y),q=rounded(a,32,(i+1)/count,y);
      const r=rounded(inner,24,(i+1)/count,y),s=rounded(inner,24,i/count,y);
      face([p,q,[q[0],y+thickness,q[2]],[p[0],y+thickness,p[2]]],'#303a3c',null);
      face([s,r,[r[0],y+thickness,r[2]],[s[0],y+thickness,s[2]]],'#222d30',null);
      face([p,q,r,s],'#596661',null);
      line([p,q],'#8b9991',.7,.8);
    }
  }
  function infrastructure(){
    frameBand(155,138,45,12);frameBand(143,130,21,9);
    // Solid transverse ribs and the shared U-shaped manifold bind the bays.
    for(const x of [-107,107])box(x,36,0,7,10,119,1,false);
    box(-12,6,-59,81,7,12,1,false);
    box(-88,13,13,12,7,79,1,false);
    box(65,23,22,12,7,78,1,false);
    box(-88,-4,-65,23,10,29,1,false);
    cylinder(65,7,-54,20,18);
    box(64,29,98,24,8,23,1,false);
    // An aligned bank of heat fins supplies depth without a web of lines.
    for(let j=0;j<7;j++)box(-34+j*11,34,-60,3,12,21,1,false);
    for(let j=0;j<5;j++)box(-89,26,47+j*11,21,5,2,1,false);
    // Recessed signal channels stay parallel to their supporting frame.
    for(let rail=0;rail<3;rail++){
      const a=151-rail*5,y=44.5;
      const pts=Array.from({length:97},(_,i)=>rounded(a,30,i/96,y));
      for(let i=1;i<pts.length;i++)line([pts[i-1],pts[i]],'#243235',1.5);
      for(let j=0;j<2;j++){const t=time/(T.duration/2)+j/2+rail*.025;
        line(Array.from({length:7},(_,i)=>rounded(a,30,t-i*.002,y-.6)),C.white,1.8);}}
    // Three radial intake chambers share one distribution plenum.
    for(let j=0;j<3;j++){cylinder(17+j*13,-2,-61,4.5,12);ring(17+j*13,-8.5,-61,2,C.edge,.7);}
    cylinder(-88,13,88,22,10);ring(-88,7.7,88,14,C.edge,.9);
    const a=phase*2;point([-88+Math.cos(a)*14,7,88+Math.sin(a)*14],1.7,C.white);
    // Front connector rail and restrained repeated fasteners.
    box(0,36,136,49,5,6,1,false);
    for(let j=0;j<5;j++)box(-30+j*15,35.6,142.2,3,2,1,1,false);
    for(const x of [-117,117])for(const z of [-117,117]){
      cylinder(x,36,z,5,18);ring(x,26.5,z,2,C.edge,.7);}
  }
  function plate(x,y,z,dx,dz,alpha=1){
    const b=7,p=[[x-dx+b,y,z-dz],[x+dx-b,y,z-dz],[x+dx,y,z-dz+b],[x+dx,y,z+dz-b],
      [x+dx-b,y,z+dz],[x-dx+b,y,z+dz],[x-dx,y,z+dz-b],[x-dx,y,z-dz+b]];
    for(let i=0;i<8;i++){const j=(i+1)%8;face([p[i],p[j],[p[j][0],y+9,p[j][2]],[p[i][0],y+9,p[i][2]]],'#303b3c',null,alpha);}
    face(p,'#6d7875','#a7b4a4',alpha);
  }
  function processProgress(id){
    const t=T.wrap(time),starts=[3.9,16.35,27.2],lengths=[5.4,4.1,4.4];
    return P.clamp((t-starts[id])/lengths[id]);
  }
  function terrainPoint(u,v,lift=0){return[-88+u*28,10-P.loss(u,v)*8-lift,-65+v*28];}
  const terrain=[];const n=64,extent=1.6,step=extent*2/n;
  function terrainColor(a,b,c){
    const ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]);
    let normal=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]];
    if(normal[1]>0)normal=normal.map(v=>-v);const len=Math.hypot(...normal);
    const light=Math.max(0,(normal[0]*-.35+normal[1]*-.78+normal[2]*-.52)/len);
    const height=Math.max(0,10-(a[1]+b[1]+c[1])/3);
    const value=Math.round(49+light*63+Math.min(1,height/62)*20);
    return `rgb(${value-2},${value+6},${value+1})`;
  }
  for(let i=0;i<n;i++)for(let j=0;j<n;j++){
    const u=-extent+i*step,v=-extent+j*step;
    const a=terrainPoint(u,v),b=terrainPoint(u+step,v),c=terrainPoint(u+step,v+step),d=terrainPoint(u,v+step);
    const triangles=(i+j)%2?[[a,b,d],[b,c,d]]:[[a,b,c],[a,c,d]];
    for(const triangle of triangles)terrain.push({p:triangle,color:terrainColor(...triangle)});
  }
  function surfacePoint(u,v,lift=.16){
    const fi=P.clamp((u+extent)/(2*extent))*n,fj=P.clamp((v+extent)/(2*extent))*n;
    const i=Math.min(n-1,Math.floor(fi)),j=Math.min(n-1,Math.floor(fj)),x=fi-i,z=fj-j;
    const uu=-extent+i*step,vv=-extent+j*step;
    const a=P.loss(uu,vv),b=P.loss(uu+step,vv),c=P.loss(uu+step,vv+step),d=P.loss(uu,vv+step);
    let height;
    if((i+j)%2)height=x+z<=1?a*(1-x-z)+b*x+d*z:b*(1-z)+c*(x+z-1)+d*(1-x);
    else height=x>=z?a*(1-x)+b*(x-z)+c*z:a*(1-z)+c*x+d*(z-x);
    return [-88+u*28,10-height*8-lift,-65+v*28];
  }
  // Dense samples follow every facet. Arc length is measured in 3D so a steep
  // descent cannot rush down the face while appearing to teleport in screen space.
  const surfacePath=[];let surfaceDistance=0;
  for(let i=0;i<P.path.length-1;i++){
    const a=P.path[i],b=P.path[i+1],parts=Math.max(1,Math.ceil(Math.hypot(b.u-a.u,b.v-a.v)/.006));
    for(let j=0;j<parts;j++){
      const p=surfacePoint(a.u+(b.u-a.u)*j/parts,a.v+(b.v-a.v)*j/parts);
      if(surfacePath.length){const prev=surfacePath.at(-1).p;surfaceDistance+=Math.hypot(...p.map((v,k)=>v-prev[k]));}
      surfacePath.push({p,distance:surfaceDistance});
    }
  }
  {const p=surfacePoint(P.path.at(-1).u,P.path.at(-1).v),prev=surfacePath.at(-1).p;
    surfaceDistance+=Math.hypot(...p.map((v,k)=>v-prev[k]));surfacePath.push({p,distance:surfaceDistance});}
  function knowledge(reveal){
    plate(-88,-19,-65,34,40,1-reveal);
    // The shell is keyed into the common manifold; only the inset opens.
    for(let i=0;i<3;i++)line([[-105,-19.3,-78+i*12],[-71,-19.3,-78+i*12]],'#9da8a0',.8,1-reveal);
    if(reveal<=.001)return;
    const old=worldOpacity;worldOpacity*=reveal;
    plate(-88,12,-65,46,46,.9);
    // Mountain-range cut edges turn the landscape into a solid relief, rather
    // than an open mathematical sheet. No contour grid or annotation overlays.
    for(let side=0;side<4;side++)for(let i=0;i<n;i++){
      const t=-extent+i*step,t2=t+step;
      const uv=side===0?[[t,-extent],[t2,-extent]]:side===1?[[extent,t],[extent,t2]]:
        side===2?[[t,extent],[t2,extent]]:[[-extent,t],[-extent,t2]];
      const a=terrainPoint(...uv[0]),b=terrainPoint(...uv[1]);
      face([a,b,[b[0],12,b[2]],[a[0],12,a[2]]],'#35423e',null);
    }
    for(const cell of terrain)face(cell.p,cell.color,null);
    const progress=P.clamp((processProgress(0)-.03)/.90),distance=progress*surfaceDistance;
    let head=surfacePath[0].p;
    for(let i=1;i<surfacePath.length;i++){
      const a=surfacePath[i-1],b=surfacePath[i];if(a.distance>distance)break;
      const fraction=P.clamp((distance-a.distance)/(b.distance-a.distance));
      head=a.p.map((v,k)=>v+(b.p[k]-v)*fraction);
      line([a.p,head],C.white,1.8);
    }
    point(head,3.6,C.white);
    // Two quiet contour rings mark the terminal bowl before the point arrives.
    // Both hug the same terrain, so the destination is a place in the landscape.
    const settled=T.smooth(P.clamp((progress-.91)/.09));
    for(const radius of [.15,.29]){
      const contour=Array.from({length:65},(_,i)=>surfacePoint(P.minimum[0]+Math.cos(i*TAU/64)*radius,P.minimum[1]+Math.sin(i*TAU/64)*radius,.22));
      line(contour,C.sage,.85,.38+settled*.28);
    }
    const floor=surfacePoint(...P.minimum,.24);
    for(let i=0;i<32;i++){
      const a=i*TAU/32,b=(i+1)*TAU/32,r=.065;
      face([floor,surfacePoint(P.minimum[0]+Math.cos(a)*r,P.minimum[1]+Math.sin(a)*r,.24),
        surfacePoint(P.minimum[0]+Math.cos(b)*r,P.minimum[1]+Math.sin(b)*r,.24)],C.sage,null,.32+settled*.32);
    }
    point(floor,2.6+settled*.7,C.white,.65+settled*.35);
    worldOpacity=old;
  }
  function packet(x,y,z,kind,size=4,alpha=1,approved=false){
    if(kind==='circle'){face(circle(x,y,z,size),'#e0e1d6',null,alpha);return;}
    if(kind==='triangle'){face([[x-size,y,z+size],[x,y,z-size],[x+size,y,z+size]],'#adb9a9',null,alpha);return;}
    if(kind==='hex'){const pts=Array.from({length:7},(_,i)=>[x+Math.cos(i*TAU/6)*size,y,z+Math.sin(i*TAU/6)*size]);
      face(pts,'#a7b4a4',C.white,alpha);for(let j=-1;j<=1;j++)line([[x-size*.4,y-.4,z+j*size*.3],[x+size*.4,y-.4,z+j*size*.3]],'#293537',.9,alpha);return;}
    face([[x-size,y,z-size*.75],[x+size,y,z-size*.75],[x+size,y,z+size*.75],[x-size,y,z+size*.75]],approved?'#b7c2b1':'#d3d6cb',null,alpha);
    if(approved)line([[x-size*.5,y-.5,z],[x-size*.1,y-.5,z+size*.3],[x+size*.55,y-.5,z-size*.35]],'#33473b',1.3,alpha);
    else for(let i=0;i<3;i++)line([[x-size*.65,y-.5,z+(i-1)*size*.35],[x+size*(i===1?.25:.65),y-.5,z+(i-1)*size*.35]],'#697575',.7,alpha);
  }
  function decision(reveal){const x=65,y=-12,z=-54;
    // A calm cylindrical shell replaces the orbital tangle entirely.
    cylinder(x,y,z,27,24,1-reveal);ring(x,y-12.5,z,15,C.edge,.9,'xz',1-reveal);
    if(reveal<=.001)return;
    const old=worldOpacity;worldOpacity*=reveal;
    plate(x,3,z,54,36,.75);cylinder(x,-3,z,13,9,.95);
    ring(x,-8,z,8,C.edge,1);
    const p=processProgress(1),kinds=['circle','triangle','card'];
    for(let j=0;j<3;j++){
      const zz=z+(j-1)*24;
      box(x-47,-4,zz,6,2,6,1,false);
      for(let q=0;q<3;q++)point([x-36+q*5,-7,zz],1.2,p>.1+j*.06?C.sage:C.dim);
      line([[x-40,-8,zz],[x-25,-8,zz],[x-13,-8,z]],C.edge,1.1);

      const t=P.clamp((p-.035*j)/(.34-.035*j));
      const px=x-47+t*47,pz=zz+(z-zz)*T.smooth(t);
      const alpha=P.clamp(p/.045)*(1-P.clamp((p-.34)/.07));
      packet(px,-11,pz,kinds[j],4*(1-.6*P.clamp((p-.31)/.09)),alpha);
    }
    // The three input types are consolidated into a single structured object.
    const merge=P.clamp((p-.38)/.26);
    if(p>=.38&&p<.65){ring(x,-9,z,8+Math.sin(merge*Math.PI)*5,C.white,1.6);
      for(let k=0;k<8;k++)line(circle(x,-8.5,z,16,'xz',k*TAU/8+.05,(k+1)*TAU/8-.05,6),k/8<merge?C.white:C.dim,2.4);

      packet(x,-11,z,'hex',2+merge*6,merge);}
    line([[x+13,-8,z],[x+48,-8,z]],C.edge,1.1);
    ring(x+48,-6,z,10,C.edge,.9);for(let j=0;j<3;j++)line([[x+43,-5,z+(j-1)*3],[x+53,-5,z+(j-1)*3]],C.dim,.7);

    const out=P.clamp((p-.65)/.28),alpha=P.clamp((p-.62)/.06);
    if(p>=.62)packet(x+out*48,-11,z,'hex',8,alpha);
    worldOpacity=old;
  }
  function workflow(reveal){const x=64,z=98;
    box(x,5,z,31,16,30,1-reveal,false);
    line([[x-19,-11.4,z],[x+19,-11.4,z]],C.edge,1,1-reveal);
    if(reveal<=.001)return;
    const old=worldOpacity;worldOpacity*=reveal;
    plate(x,15,z,47,48,.8);
    const p=processProgress(2),input=P.clamp(p/.38),process=P.clamp((p-.38)/.27),out=P.clamp((p-.65)/.28);
    // Four distinct records enter together. A visible scan checks the batch.
    for(let j=0;j<4;j++){
      const xx=x-24+j*16;
      line([[xx,4,z-39],[xx,4,z-3]],C.edge,1.0);
      if(p<.65)packet(xx,1,z-39+input*36,'card',5,Math.min(1,p/.06));
    }
    for(const xx of [x-34,x+34])for(const zz of [z-13,z+7])line([[xx,6,zz],[xx,-8,zz]],C.edge,1.1);
    line([[x-34,-8,z-13],[x+34,-8,z-13],[x+34,-8,z+7],[x-34,-8,z+7],[x-34,-8,z-13]],C.edge,1.3);
    for(let j=0;j<4;j++)point([x-24+j*16,-8,z+7],2,p>.38+(j+1)*.06?C.sage:C.dim);

    if(p>=.38&&p<.65){const xx=x-32+process*64;
      line([[xx,-8,z-13],[xx,-8,z+7]],C.white,2);}
    // After validation, three checked records leave through one channel;
    // the exception becomes a triangular review token on a separate branch.
    line([[x-8,5,z+8],[x-8,5,z+39]],C.edge,1.1);
    line([[x+24,5,z+8],[x+40,5,z+22],[x+40,5,z+39]],C.edge,1.1);
    if(p>=.65){for(let j=0;j<3;j++){
        const startX=x-24+j*16,endX=x-19+j*11;
        packet(startX+(endX-startX)*out,1,z-3+out*40,'card',4.5,1,true);}
      packet(x+24+out*16,1,z-3+out*40,'triangle',5.5,1);}
    worldOpacity=old;
  }
  function updateState(){const max=Math.max(...camera.reveal),active=max>.45?camera.reveal.indexOf(max):-1;
    if(active!==scene){scene=active;canvas.dataset.scene=active<0?'overview':['optimization','synthesis','validation'][active];}
    canvas.dataset.process=active<0?'overview':active===0?(processProgress(0)>.93?'converged':'descending'):P.phase(processProgress(active));
  }
  let drawCost=0,drawMax=0,drawCount=0;
  function draw(){if(!w||!h)return;const started=performance.now();if(ctx)ctx.clearRect(0,0,w,h);queue.length=0;
    phase=T.wrap(time)/T.duration*TAU;const reveal=Math.max(...camera.reveal);
    angle=camera.angle+Math.sin(phase)*.055*(1-reveal);focus=camera.focus;
    scale=Math.min(w/510,h/510)*camera.scale;ca=Math.cos(angle);sa=Math.sin(angle);cp=Math.cos(camera.pitch);sp=Math.sin(camera.pitch);
    if(ctx){ctx.lineCap='round';ctx.lineJoin='round';
    const glow=ctx.createRadialGradient(w*.51,h*.49,0,w*.51,h*.49,w*.44);
    glow.addColorStop(0,'rgba(91,120,99,.10)');glow.addColorStop(1,'rgba(24,29,32,0)');ctx.fillStyle=glow;ctx.fillRect(0,0,w,h);}
    worldOpacity=1-reveal;infrastructure();
    worldOpacity=1-reveal+camera.reveal[0];knowledge(camera.reveal[0]);
    worldOpacity=1-reveal+camera.reveal[1];decision(camera.reveal[1]);
    worldOpacity=1-reveal+camera.reveal[2];workflow(camera.reveal[2]);worldOpacity=1;
    render();updateState();
    // Soft edge falloff keeps large close-ups inside the hero composition.
    if(ctx){const edge=ctx.createLinearGradient(0,0,0,h);edge.addColorStop(0,'#181d20');edge.addColorStop(.13,'rgba(24,29,32,0)');
    edge.addColorStop(.78,'rgba(24,29,32,0)');edge.addColorStop(1,'#181d20');ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);}
    const elapsed=performance.now()-started;drawCost+=elapsed;drawMax=Math.max(drawMax,elapsed);
    if(++drawCount===60){canvas.dataset.renderMs=(drawCost/60).toFixed(2);canvas.dataset.renderMaxMs=drawMax.toFixed(2);drawCost=0;drawMax=0;drawCount=0;}


  }
  function resize(){const rect=canvas.getBoundingClientRect();w=rect.width;h=rect.height;dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);if(ctx)ctx.setTransform(dpr,0,0,dpr,0,0);draw();}
  // The automatic tour is the only page mode. Respect the system's motion preference.
  reduced.addEventListener('change',e=>{paused=e.matches;last=null;lastDraw=null;frameTime=0;frameCount=0;
    if(paused){time=0;camera=T.sample(0);draw();}});
  document.addEventListener('visibilitychange',()=>{last=null;lastDraw=null;frameTime=0;frameCount=0;});
  let frameTime=0,frameCount=0,lastDraw=null;
  function frame(now){const dt=last===null?0:(now-last)/1000;last=now;
    if(!paused&&visible&&!document.hidden){time+=dt;

      camera=T.sample(time);
      // High-refresh screens otherwise rebuild the scene up to 240 times/sec.
      // Keep the clock continuous while limiting the drawing work to 60 fps.
      if(lastDraw===null||now-lastDraw>=1000/60-.6){
        if(lastDraw!==null){frameTime+=(now-lastDraw)/1000;if(++frameCount===60){canvas.dataset.fps=(60/frameTime).toFixed(1);frameTime=0;frameCount=0;}}
        lastDraw=now;draw();
      }}
    requestAnimationFrame(frame);}
  new ResizeObserver(resize).observe(canvas);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;last=null;},{threshold:.05}).observe(canvas);
  requestAnimationFrame(frame);
})();
