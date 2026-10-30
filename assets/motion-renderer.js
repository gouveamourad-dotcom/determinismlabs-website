/* Batched, depth-tested rendering. Geometry remains procedural and dependency-free. */
(function(root){'use strict';
  function create(canvas){
    const gl=canvas.getContext('webgl',{alpha:true,antialias:true,premultipliedAlpha:true,depth:true});
    if(!gl)return null;
    function shader(type,source){const s=gl.createShader(type);gl.shaderSource(s,source);gl.compileShader(s);
      if(!gl.getShaderParameter(s,gl.COMPILE_STATUS))throw new Error(gl.getShaderInfoLog(s));return s;}
    const program=gl.createProgram();
    gl.attachShader(program,shader(gl.VERTEX_SHADER,`
      attribute vec3 position; attribute vec4 color;
      uniform vec2 resolution; varying vec4 tint; varying float screenY;
      void main(){vec2 p=position.xy/resolution;
        gl_Position=vec4(p.x*2.0-1.0,1.0-p.y*2.0,-position.z/1024.0,1.0);
        tint=color;screenY=p.y;}`));
    gl.attachShader(program,shader(gl.FRAGMENT_SHADER,`
      precision mediump float; varying vec4 tint; varying float screenY;
      void main(){float edge=min(clamp(screenY/.13,0.0,1.0),clamp((1.0-screenY)/.22,0.0,1.0));
        float a=tint.a*edge;gl_FragColor=vec4(tint.rgb*a,a);}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error(gl.getProgramInfoLog(program));
    gl.useProgram(program);
    const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
    for(const [name,count,offset] of [['position',3,0],['color',4,12]]){
      const loc=gl.getAttribLocation(program,name);gl.enableVertexAttribArray(loc);gl.vertexAttribPointer(loc,count,gl.FLOAT,false,28,offset);}
    const resolution=gl.getUniformLocation(program,'resolution');
    gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);gl.enable(gl.BLEND);gl.blendFunc(gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    let vertices=new Float32Array(262144),used=0,allocated=0;
    const colors=new Map();
    function rgb(color){if(colors.has(color))return colors.get(color);
      const c=color[0]==='#'?[1,3,5].map(i=>parseInt(color.slice(i,i+2),16)/255):color.match(/[\d.]+/g).slice(0,3).map(v=>Number(v)/255);
      colors.set(color,c);return c;}
    function vertex(x,y,z,c,a){if(used+7>vertices.length){const next=new Float32Array(vertices.length*2);next.set(vertices);vertices=next;}
      vertices[used++]=x;vertices[used++]=y;vertices[used++]=z;
      vertices[used++]=c[0];vertices[used++]=c[1];vertices[used++]=c[2];vertices[used++]=a;}
    function triangle(a,b,c,color,alpha,bias=0){
      vertex(a[0],a[1],a[2]+bias,color,alpha);vertex(b[0],b[1],b[2]+bias,color,alpha);vertex(c[0],c[1],c[2]+bias,color,alpha);}
    function fill(o){const c=rgb(o.fill),p=o.ps;for(let i=1;i<p.length-1;i++)triangle(p[0],p[i],p[i+1],c,o.alpha);}
    function segment(a,b,color,width,alpha){const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);if(len<.001)return;
      const nx=-dy/len*width*.5,ny=dx/len*width*.5;
      const p=[a[0]+nx,a[1]+ny,a[2]],q=[a[0]-nx,a[1]-ny,a[2]],r=[b[0]-nx,b[1]-ny,b[2]],s=[b[0]+nx,b[1]+ny,b[2]];
      triangle(p,q,r,color,alpha,.035);triangle(p,r,s,color,alpha,.035);}
    function disk(p,r,color,alpha){for(let i=0;i<16;i++){
      const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
      triangle(p,[p[0]+Math.cos(a)*r,p[1]+Math.sin(a)*r,p[2]],[p[0]+Math.cos(b)*r,p[1]+Math.sin(b)*r,p[2]],color,alpha,.04);}}
    function draw(queue,w,h){
      gl.viewport(0,0,canvas.width,canvas.height);gl.uniform2f(resolution,w,h);
      gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);used=0;
      // Solid surfaces write actual depth; no painter-order overrides for trails.
      const translucent=[],ghosts=[];
      for(const o of queue)if(o.fill){if(o.alpha>.999)fill(o);else if(o.alpha>=.35)translucent.push(o);else ghosts.push(o);}
      translucent.sort((a,b)=>a.depth-b.depth);for(const o of translucent)fill(o);
      const surfaceCount=used/7;ghosts.sort((a,b)=>a.depth-b.depth);for(const o of ghosts)fill(o);
      for(const o of queue){if(o.dot){disk(o.dot,o.r,rgb(o.color),o.alpha);continue;}
        if(!o.stroke)continue;const c=rgb(o.stroke),p=o.ps;
        for(let i=1;i<p.length;i++)segment(p[i-1],p[i],c,o.width,o.alpha);
        if(o.closed)segment(p[p.length-1],p[0],c,o.width,o.alpha);
      }
      if(used>allocated){allocated=vertices.length;gl.bufferData(gl.ARRAY_BUFFER,allocated*4,gl.DYNAMIC_DRAW);}
      gl.bufferSubData(gl.ARRAY_BUFFER,0,vertices.subarray(0,used));
      gl.depthMask(true);gl.drawArrays(gl.TRIANGLES,0,surfaceCount);
      gl.depthMask(false);gl.drawArrays(gl.TRIANGLES,surfaceCount,used/7-surfaceCount);gl.depthMask(true);
    }
    canvas.addEventListener('webglcontextlost',e=>e.preventDefault());
    return {draw};
  }
  root.DLRenderer={create};
})(globalThis);
