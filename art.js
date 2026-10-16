/* Original pixel artwork, drawn from small rectangles. No remote assets. */
(function (root) {
  'use strict';
  const C = { sky:'#111e34',sky2:'#16283f',sky3:'#1d3448',far:'#223d4e',hill:'#1a3846',tree:'#142d38',leaf:'#285047',grass:'#3c6051',grassLight:'#60806a',earth:'#283f3c',soil:'#24363a',path:'#576260',pathLight:'#6c7470',gold:'#edc986',warm:'#f9e2a4',wood:'#9a7353',woodLight:'#b48b62',woodDark:'#5d4a42',ink:'#17283b' };
  let ctx, w, h, camera, base, time, reduced;
  function rect(x,y,width,height,color){ctx.fillStyle=color;ctx.fillRect(Math.round(x),Math.round(y),Math.round(width),Math.round(height));}
  function rand(n){const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v);}
  function star(x,y,color=C.gold,size=1){rect(x,y-3*size,size,7*size,color);rect(x-2*size,y-size,5*size,3*size,color);}
  function pine(x,y,s,color){rect(x-2*s,y-34*s,4*s,34*s,color);for(let i=0;i<4;i++){const level=8+i*7;rect(x-(3+i*3)*s,y-(40-level)*s,(6+i*6)*s,8*s,color);}rect(x-2*s,y-2*s,4*s,8*s,C.tree);}
  function bush(x,y,s=1){rect(x-14*s,y-6*s,28*s,8*s,C.tree);rect(x-10*s,y-11*s,18*s,8*s,C.leaf);rect(x-4*s,y-14*s,9*s,8*s,C.leaf);rect(x+4*s,y-7*s,12*s,6*s,'#315247');}
  function moon(x,y){rect(x-11,y-15,23,30,'#c9caa2');rect(x-16,y-10,31,20,'#ded4ac');rect(x-9,y-17,17,34,'#ded4ac');rect(x-7,y-13,19,26,'#edddb0');rect(x+3,y-17,15,23,C.sky);rect(x+9,y+3,9,8,C.sky);rect(x-12,y+2,3,4,'#c4bd98');rect(x-5,y+10,4,2,'#cfc49e');}
  function glow(x,y,size){ctx.save();for(let i=3;i>0;i--){ctx.globalAlpha=.025;rect(x-size*i,y-size*i,size*i*2,size*i*2,C.gold);}ctx.restore();}
  function lamp(x,y){glow(x,y-71,14);rect(x-2,y-66,4,65,'#17252d');rect(x-5,y-3,10,3,'#1b2c32');rect(x-7,y-77,14,2,'#617166');rect(x-5,y-75,10,11,'#b19b6b');rect(x-3,y-74,6,9,C.warm);rect(x-7,y-64,14,3,'#536252');rect(x-2,y-80,4,3,'#6a7866');rect(x-1,y-62,1,56,'#5a6660');ctx.save();ctx.globalAlpha=.1;rect(x-17,y-1,34,2,C.gold);ctx.restore();}
  function bench(x,y){rect(x-29,y-20,58,5,C.woodLight);rect(x-29,y-13,58,4,C.wood);rect(x-32,y-7,64,5,C.woodLight);rect(x-31,y-7,62,1,'#c8a477');rect(x-24,y-2,4,5,C.woodDark);rect(x+20,y-2,4,5,C.woodDark);rect(x-24,y-25,3,23,C.woodDark);rect(x+21,y-25,3,23,C.woodDark);rect(x-28,y-19,6,1,'#dec092');rect(x+6,y-12,9,1,'#b28a5d');}
  function box(x,y,open,t){rect(x-13,y-16,26,16,C.woodDark);rect(x-12,y-15,24,13,C.wood);rect(x-10,y-14,20,10,C.woodLight);rect(x-10,y-7,20,2,C.wood);rect(x-2,y-16,4,16,'#c6b185');if(open){rect(x-13,y-27,26,5,C.woodDark);rect(x-12,y-26,24,2,C.woodLight);rect(x-10,y-17,20,4,'#3c3b3c');const bob=reduced?0:Math.round(Math.sin(t*2)*2);glow(x,y-30+bob,5);star(x,y-32+bob,C.warm,1);rect(x-1,y-19,2,2,C.warm);}else{rect(x-14,y-18,28,4,C.woodLight);rect(x-2,y-18,4,4,'#e0c995');rect(x-2,y-10,4,4,C.gold);}}
  function cake(x,y,lit,t){rect(x-24,y-5,48,3,C.woodDark);rect(x-21,y-4,4,5,C.woodDark);rect(x+17,y-4,4,5,C.woodDark);rect(x-17,y-17,34,12,'#c99a85');rect(x-17,y-19,34,5,'#efe1c3');rect(x-15,y-14,4,3,'#e6cbb0');rect(x-7,y-14,4,3,'#e6cbb0');rect(x+9,y-14,4,3,'#e6cbb0');rect(x-17,y-7,34,2,'#ad766d');for(let i=-1;i<=1;i++){rect(x+i*9-1,y-26,2,7,'#d3b787');if(lit){const flick=reduced?0:Math.floor(t*5+i)%2;glow(x+i*9,y-29,4);rect(x+i*9-1,y-31-flick,2,4+flick,C.gold);rect(x+i*9,y-30,1,2,C.warm);}}}
  function sign(x,y){rect(x-2,y-22,4,22,C.woodDark);rect(x-13,y-32,27,14,'#6e6351');rect(x-12,y-31,25,12,'#9f8c68');rect(x-8,y-27,16,1,'#544e45');rect(x-6,y-24,12,1,'#655947');}
  function player(p){let x=Math.round(p.x-camera),y=Math.round(p.y+base);const walking=p.grounded&&Math.abs(p.vx)>0;const frame=walking&&!reduced?Math.floor(time*9)%4:0;const bob=walking&&frame%2===1?1:0;y-=bob;ctx.save();if(p.facing<0){ctx.translate(x+p.w,y);ctx.scale(-1,1);x=0;y=0;}
    if(p.sitting){rect(x-2,y+21,20,3,'#172a30');rect(x+1,y+14,12,6,'#607b82');rect(x+10,y+17,6,4,'#3c505e');rect(x+12,y+20,6,3,'#d4c7aa');}
    else{const stride=frame===1?2:frame===3?-2:0;rect(x+2+stride,y+18,4,5,'#3a4a59');rect(x+8-stride,y+18,4,5,'#465a65');rect(x+1+stride,y+22,6,2,'#d3c6ac');rect(x+8-stride,y+22,6,2,'#d3c6ac');}
    rect(x+1,y+10,12,9,'#688b8f');rect(x+2,y+10,9,2,'#91aaa5');rect(x+1,y+15,3,4,'#506e7b');rect(x+12,y+11,3,7,'#8ba09d');rect(x+12,y+17,3,3,'#d2ae8c');rect(x-1,y+11,3,6,'#506e7b');rect(x+3,y+3,10,8,'#d3ac88');rect(x+1,y+1,11,5,'#473f3b');rect(x+3,y,8,2,'#5c4a3e');rect(x+1,y+4,4,4,'#473f3b');rect(x+10,y+6,1,2,'#28323b');rect(x+6,y+10,6,2,'#e4c58e');rect(x+4,y+11,3,3,'#d4ac76');ctx.restore();
  }
  function flowers(x,y,seed){const color=seed%3===0?'#bdbb91':seed%3===1?'#85998a':'#657c75';rect(x,y-4,1,4,C.grassLight);rect(x-1,y-5,3,2,color);}
  function draw(state, view, options={}) {
    ctx=view.ctx;w=view.width;h=view.height;camera=Math.round(state.camera);base=h-336;time=state.time;reduced=!!options.reduced;
    rect(0,0,w,h,C.sky);rect(0,Math.round(h*.5),w,h*.5,C.sky2);rect(0,h*.68,w,h*.32,C.sky3);
    for(let i=0;i<100;i++){const sx=((rand(i+10)*2400-camera*.12)% (w+120)+w+120)%(w+120)-60;const sy=12+rand(i+100)*Math.max(50,h*.65);const bright=i%11===0;const twinkle=reduced?1:.72+Math.sin(time*.55+i)*.22;ctx.globalAlpha=twinkle;rect(sx,sy,1,1,bright?'#d9c797':'#61778d');if(bright&&i%2===0)rect(sx-1,sy+1,3,1,'#809299');}ctx.globalAlpha=1;
    moon(w*.77-camera*.025,Math.max(35,h*.19));
    for(let layer=0;layer<2;layer++){const bw=layer===0?26:33;const offset=camera*(layer===0?.12:.22);const horizon=h-102+layer*12;for(let i=-2;i<w/bw+3;i++){const index=i+Math.floor(offset/bw);const x=i*bw-(offset%bw);const height=16+Math.floor(rand(index+layer*400+80)*36);rect(x,horizon-height,bw-2,height+30,layer===0?'#20394c':'#213c49');if(rand(index+10)>.5){rect(x+7,horizon-height+6,2,3,'#5b6456');rect(x+15,horizon-height+15,2,3,'#69705b');}}}
    for(let i=-1;i<w/58+2;i++){const index=i+Math.floor(camera*.32/58);const x=i*58-(camera*.32%58);const yy=h-81;pine(x,yy,.75+rand(index+13)*.7,'#1b3441');}
    rect(0,h-70,w,20,'#233e43');for(let i=0;i<w+20;i+=16){rect(i,h-73+Math.floor(rand(i+1)*5),17,9,'#29494a');}
    const gy=280+base;
    rect(0,gy,w,h-gy,C.soil);rect(0,gy,w,5,C.grass);rect(0,gy+5,w,12,C.earth);rect(0,gy+17,w,15,C.path);rect(0,gy+18,w,2,C.pathLight);rect(0,gy+33,w,3,'#3d514d');rect(0,gy+36,w,h-gy-36,'#24383a');
    const start=Math.floor(camera/13);for(let i=start;i<(camera+w)/13+1;i++){const xx=i*13-camera;rect(xx,gy-2-rand(i+800)*3,2,5,C.grassLight);if(i%3===0)rect(xx+4,gy+24,4,1,'#7b7f72');if(i%7===0)rect(xx+8,gy+40,6,2,'#334b47');if(i%5===0)flowers(xx+5,gy-2,i);}
    // Foreground objects are scenery, never solid obstacles on the main path.
    for(const x of [20,360,675,1090,1450,1760,2110]){bush(x-camera,gy-1,.8);}
    for(const x of [25,1070,1780,2135])pine(x-camera,gy-2,1.55,C.tree);
    for(const x of [290,690,1395,1880])lamp(x-camera,gy);
    sign(90-camera,gy);bench(460-camera,gy);box(1220-camera,gy,state.boxOpen,time);cake(1940-camera,gy,state.cakeLit,time);
    // A few stepping stones let curious players find higher stars.
    for(const p of root.NightEngine.PLATFORMS){const x=p.x-camera,y=p.y+base;rect(x+5,y+4,p.w-10,8,'#3e5351');rect(x,y,p.w,5,'#68796a');rect(x+3,y-2,p.w-6,3,'#799279');rect(x+8,y+5,5,3,'#52675c');rect(x+p.w-19,y+5,7,2,'#52675c');}
    for(const s of state.stars){if(!s.collected){const bob=reduced?0:Math.sin(time*2+s.id)*2;const x=s.x-camera,y=s.y+base+bob;glow(x,y,5);star(x,y,C.gold,1);rect(x,y-1,1,2,'#fff1c3');}}
    // Wayfinding stays modest: no quest marker or mandatory collection.
    rect(1800-camera,gy-18,3,18,'#5b5b4c');rect(1794-camera,gy-23,23,7,'#8f8967');rect(1817-camera,gy-21,3,3,'#8f8967');rect(1799-camera,gy-21,10,1,'#d3c299');
    player(state.player);
    if(state.boxOpen){const x=1220-camera;for(let i=0;i<3;i++){const shift=reduced?0:Math.sin(time*1.2+i*2)*3;rect(x-17+i*15,gy-39+shift,1,2,'#c8be8c');}}
    for(const p of options.particles||[]){ctx.globalAlpha=Math.max(0,p.life/p.max);rect(p.x-camera,p.y+base,p.size,p.size,p.color);}ctx.globalAlpha=1;
    if(!reduced){for(let i=0;i<9;i++){const x=((i*263+Math.sin(time*.3+i)*14-camera*.7)%(w+180)+w+180)%(w+180)-90;const y=gy-12-rand(i+56)*43+Math.sin(time*.7+i)*3;ctx.globalAlpha=.25+Math.sin(time+i)*.18;rect(x,y,1,1,'#d1d195');}ctx.globalAlpha=1;}
  }
  root.NightArt={draw};
})(typeof globalThis!=='undefined'?globalThis:this);
