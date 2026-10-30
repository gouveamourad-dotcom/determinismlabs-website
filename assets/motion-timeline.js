(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.DLTimeline=api;})(globalThis,()=>{
  'use strict';
  const duration=35;
  const overview={focus:[0,0,0],scale:1,angle:.60,pitch:.5,reveal:[0,0,0]};
  const stations=[
    {focus:[-88,-11,-65],scale:3.25,angle:1.08,pitch:.94,reveal:[1,0,0]},
    {focus:[65,-4,-54],scale:3.15,angle:.48,pitch:.5,reveal:[0,1,0]},
    {focus:[64,4,98],scale:3.45,angle:.62,pitch:.5,reveal:[0,0,1]}
  ];
  const keys=[[0,overview],[2,overview],[3.8,stations[0]],[10,stations[0]],
    [11.5,overview],[14.5,overview],[16.3,stations[1]],[20.8,stations[1]],
    [22.3,overview],[25.3,overview],[27.1,stations[2]],[32,stations[2]],[34,overview],[35,overview]];
  const wrap=t=>((t%duration)+duration)%duration;
  const smooth=t=>t*t*t*(t*(t*6-15)+10);
  function blend(a,b,t){const f=smooth(Math.max(0,Math.min(1,t)));return {
    focus:a.focus.map((v,i)=>v+(b.focus[i]-v)*f),
    scale:a.scale+(b.scale-a.scale)*f,
    angle:a.angle+(b.angle-a.angle)*f,
    pitch:a.pitch+(b.pitch-a.pitch)*f,
    reveal:a.reveal.map((v,i)=>v+(b.reveal[i]-v)*f)
  };}
  function sample(t){t=wrap(t);let k=0;while(k<keys.length-2&&t>=keys[k+1][0])k++;
    return blend(keys[k][1],keys[k+1][1],(t-keys[k][0])/(keys[k+1][0]-keys[k][0]));}
  return {duration,overview,stations,wrap,smooth,blend,sample};
});
