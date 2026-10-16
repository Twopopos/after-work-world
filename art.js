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
  function moon(x,y){
    // Right-hand illuminated limb: a thin waxing crescent, not two chunky rectangles.
    const breath=reduced?1:.96+Math.sin(time*.35)*.035;
    const halo=ctx.createRadialGradient(x+11,y,2,x+11,y,40);
    halo.addColorStop(0,'rgba(224,204,144,0.055)');halo.addColorStop(.45,'rgba(123,155,189,0.045)');halo.addColorStop(1,'rgba(85,116,155,0)');
    ctx.save();ctx.globalAlpha=breath;ctx.fillStyle=halo;ctx.fillRect(x-31,y-42,84,84);ctx.restore();
    const r=18;
    for(let yy=-r;yy<r;yy++){
      const outer=Math.sqrt(Math.max(0,r*r-(yy+.5)*(yy+.5))),inner=outer*.64;
      for(let xx=Math.ceil(inner);xx<=Math.floor(outer);xx++){
        const t=(yy+r)/(r*2),edge=xx>=Math.floor(outer)-.5;
        const rgb=edge?[249,239,208]:[Math.round(243-t*13),Math.round(230-t*23),Math.round(191-t*25)];
        rect(x+xx-7,y+yy,1,1,`rgb(${rgb.join(',')})`);
      }
    }
  }
  function glow(x,y,size){ctx.save();for(let i=3;i>0;i--){ctx.globalAlpha=.025;rect(x-size*i,y-size*i,size*i*2,size*i*2,C.gold);}ctx.restore();}
  function lamp(x,y){glow(x,y-71,14);rect(x-2,y-66,4,65,'#17252d');rect(x-5,y-3,10,3,'#1b2c32');rect(x-7,y-77,14,2,'#617166');rect(x-5,y-75,10,11,'#b19b6b');rect(x-3,y-74,6,9,C.warm);rect(x-7,y-64,14,3,'#536252');rect(x-2,y-80,4,3,'#6a7866');rect(x-1,y-62,1,56,'#5a6660');ctx.save();ctx.globalAlpha=.1;rect(x-17,y-1,34,2,C.gold);ctx.restore();}
  function bench(x,y){rect(x-29,y-20,58,5,C.woodLight);rect(x-29,y-13,58,4,C.wood);rect(x-32,y-7,64,5,C.woodLight);rect(x-31,y-7,62,1,'#c8a477');rect(x-24,y-2,4,5,C.woodDark);rect(x+20,y-2,4,5,C.woodDark);rect(x-24,y-25,3,23,C.woodDark);rect(x+21,y-25,3,23,C.woodDark);rect(x-28,y-19,6,1,'#dec092');rect(x+6,y-12,9,1,'#b28a5d');}
  function box(x,y,open,t){rect(x-13,y-16,26,16,C.woodDark);rect(x-12,y-15,24,13,C.wood);rect(x-10,y-14,20,10,C.woodLight);rect(x-10,y-7,20,2,C.wood);rect(x-2,y-16,4,16,'#c6b185');if(open){rect(x-13,y-27,26,5,C.woodDark);rect(x-12,y-26,24,2,C.woodLight);rect(x-10,y-17,20,4,'#3c3b3c');const bob=reduced?0:Math.round(Math.sin(t*2)*2);glow(x,y-30+bob,5);star(x,y-32+bob,C.warm,1);rect(x-1,y-19,2,2,C.warm);}else{rect(x-14,y-18,28,4,C.woodLight);rect(x-2,y-18,4,4,'#e0c995');rect(x-2,y-10,4,4,C.gold);}}
  function cake(x,y,lit,t){rect(x-24,y-5,48,3,C.woodDark);rect(x-21,y-4,4,5,C.woodDark);rect(x+17,y-4,4,5,C.woodDark);rect(x-17,y-17,34,12,'#c99a85');rect(x-17,y-19,34,5,'#efe1c3');rect(x-15,y-14,4,3,'#e6cbb0');rect(x-7,y-14,4,3,'#e6cbb0');rect(x+9,y-14,4,3,'#e6cbb0');rect(x-17,y-7,34,2,'#ad766d');for(let i=-1;i<=1;i++){rect(x+i*9-1,y-26,2,7,'#d3b787');if(lit){const flick=reduced?0:Math.floor(t*5+i)%2;glow(x+i*9,y-29,4);rect(x+i*9-1,y-31-flick,2,4+flick,C.gold);rect(x+i*9,y-30,1,2,C.warm);}}}
  function sign(x,y){rect(x-2,y-22,4,22,C.woodDark);rect(x-13,y-32,27,14,'#6e6351');rect(x-12,y-31,25,12,'#9f8c68');rect(x-8,y-27,16,1,'#544e45');rect(x-6,y-24,12,1,'#655947');}
  // Use whole canvas pixels for this small label; a 7px font rasterizes its
  // 120/1000-em cells to fractional pixels, even with image smoothing disabled.
  const labelGlyphs={H:'1111111F111111',K:'11121418141211',S:'0F10100E01011E',E:'1F10101E10101F',R:'1E11111E141211',V:'11111111110A04',O:'0E11111111110E',N:'11191915131311',Y:'11110A04040404',A:'0E11111F111111',G:'0F10101711110F','·':'00000004000000',' ':'00000000000000'};
  function terminalLabel(x,y){
    const copy='HK SERVER · ONE YEAR AGO',left=Math.round(x-(copy.length*6-1)/2),top=Math.round(y-56);
    for(const shadow of [true,false])for(let i=0;i<copy.length;i++){
      const glyph=labelGlyphs[copy[i]];
      for(let row=0;row<7;row++){const bits=parseInt(glyph.slice(row*2,row*2+2),16);for(let col=0;col<5;col++)if(bits&(1<<(4-col)))rect(left+i*6+col+(shadow?1:0),top+row+(shadow?1:0),1,1,shadow?'#102331':'#d1dacf');}
    }
  }
  // Original pixel keepsakes, with no logos or imported game assets.
  function terminal(x,y){
    rect(x-13,y-41,26,30,'#283c52');rect(x-11,y-39,22,25,'#405469');
    rect(x-9,y-37,18,20,'#172638');rect(x-7,y-34,5,4,'#a9606c');
    rect(x+1,y-34,6,1,'#c0ced0');rect(x+1,y-31,4,1,'#7799b1');
    rect(x-7,y-26,14,1,'#37536d');rect(x-7,y-23,8,2,'#7394a8');rect(x+4,y-22,3,1,'#bcafb2');
    rect(x-5,y-11,10,8,'#2a3b49');rect(x-12,y-3,24,3,'#52616b');rect(x-8,y-40,8,1,'#738594');
    terminalLabel(x,y);
  }
  function memorial(x,y,light){
    if(light>0){
      const halo=ctx.createRadialGradient(x,y-33,1,x,y-33,34);
      halo.addColorStop(0,`rgba(151,210,202,${light*.16})`);halo.addColorStop(.55,`rgba(92,151,170,${light*.07})`);halo.addColorStop(1,'rgba(83,119,147,0)');
      ctx.fillStyle=halo;ctx.fillRect(x-34,y-67,68,68);
    }
    // Folded base, rounded light canister and open handle, following the
    // supplied silhouette at the game's own pixel scale. No emblem is copied.
    rect(x-18,y-15,36,3,'#6c7c69');rect(x-21,y-12,42,4,'#3c534d');rect(x-23,y-8,46,8,'#1c3339');
    for(let i=0;i<11;i++){
      rect(x-21+i,y-12+i,21-i,1,'#53665b');rect(x+i,y-12+i,21-i,1,'#304c49');
      rect(x-11+i,y-11+i,22-i*2,1,'#213b3f');
    }
    rect(x-23,y-9,2,9,'#3b534d');rect(x+21,y-9,2,9,'#142c33');rect(x-15,y-15,30,1,'#87917a');
    rect(x-12,y-47,24,33,'#173239');rect(x-9,y-46,18,32,'#25474a');
    for(let row=0;row<30;row++){
      const inset=row>3&&row<26?1:0;
      rect(x-10+inset,y-45+row,6-inset,1,'#79b6b2');rect(x+4,y-45+row,6-inset,1,'#a0d4ca');
    }
    rect(x-10,y-44,1,27,'#c3e5d7');rect(x+4,y-44,1,27,'#c3e5d7');
    rect(x-3,y-46,6,32,'#1b3a40');rect(x+2,y-45,1,30,'#3c6260');rect(x-11,y-31,22,2,'#2c4e50');
    rect(x-12,y-16,24,3,'#415f59');rect(x-10,y-14,20,1,'#638176');
    rect(x-8,y-62,15,3,'#1a3037');rect(x-10,y-59,3,5,'#263e40');rect(x+5,y-59,3,5,'#152c33');rect(x-7,y-62,13,1,'#6c7c70');
    rect(x-12,y-55,24,3,'#53695f');rect(x-15,y-52,30,4,'#1c3439');rect(x-13,y-48,26,2,'#789183');rect(x-12,y-52,24,1,'#3c5c55');
    if(light>0){ctx.save();ctx.globalAlpha=light*.45;rect(x-9,y-44,4,27,'#d4f2e4');rect(x+5,y-44,4,27,'#d4f2e4');rect(x-14,y-15,28,1,'#b7d5bd');ctx.restore();}
  }
  function house(x,y){
    rect(x-61,y-91,158,91,'#26353c');rect(x-57,y-85,150,85,'#344044');
    for(let i=0;i<9;i++){rect(x-57,y-81+i*9,150,1,'#4b4d47');rect(x-57,y-79+i*9,150,1,'#27363b');}
    for(let i=0;i<8;i++)rect(x-77+i*9,y-92-i*5,185-i*18,5,'#202f39');
    rect(x-76,y-92,186,4,'#54605a');rect(x+56,y-121,14,22,'#33434a');rect(x+53,y-124,20,4,'#475450');
    rect(x-18,y-57,36,57,'#1b2933');rect(x-15,y-54,30,54,'#3f4340');rect(x-11,y-50,22,48,'#29363b');rect(x+6,y-28,2,3,'#b3a27a');
    rect(x+40,y-67,35,29,'#1b2b36');rect(x+43,y-64,29,23,'#7f795a');rect(x+45,y-62,25,19,'#b09b6c');rect(x+56,y-64,3,23,'#3e4945');rect(x+43,y-54,29,3,'#3e4945');
    ctx.save();ctx.globalAlpha=.055;rect(x+38,y-69,39,34,C.gold);ctx.restore();
    rect(x-23,y-2,46,3,'#728078');rect(x-27,y+1,54,3,'#455852');
    rect(x-43,y-15,10,15,'#4d5750');rect(x-46,y-18,16,4,'#6e7060');bush(x-38,y-18,.4);
  }
  function room(state){
    const sx=x=>x-camera,sy=y=>y+base,gy=sy(280),x=sx(306),cy=sy(224);
    const t=state.house.candleLit?Math.min(1,state.house.light):0;
    const ease=t*t*(3-2*t),radius=reduced?124:22+102*ease;
    rect(0,0,w,h,'#0b1220');rect(sx(0),sy(100),480,180,'#101724');
    rect(sx(0),sy(102),480,5,'#1b2534');rect(sx(0),sy(108),480,2,'#151e2d');
    for(let i=0;i<12;i++)rect(sx(i*40),sy(112),1,168,'#141e2d');
    rect(sx(0),gy,480,h-gy,'#171e29');rect(sx(0),gy,480,4,'#2c313c');
    for(let i=0;i<8;i++)rect(sx(0),gy+5+i*9,480,1,'#30353b');
    for(let i=0;i<9;i++)rect(sx(i*59),gy+7+(i%3)*9,1,8,'#3e4044');
    // The door, window, table edge and unlit wick remain legible in the dark.
    rect(sx(30),sy(207),44,73,'#31404b');rect(sx(34),sy(211),36,69,'#202c39');rect(sx(38),sy(215),28,63,'#273644');rect(sx(61),sy(248),2,3,'#b2a890');rect(sx(33),gy-1,39,2,'#87939a');
    rect(sx(375),sy(151),40,47,'#36414d');rect(sx(379),sy(155),32,39,'#23394c');rect(sx(382),sy(158),25,31,'#2c455a');rect(sx(394),sy(155),3,39,'#414852');rect(sx(379),sy(174),32,3,'#414852');
    rect(sx(122),sy(192),62,4,'#38404a');rect(sx(130),sy(176),5,16,'#444652');rect(sx(137),sy(181),7,11,'#3e4b50');rect(sx(147),sy(178),5,14,'#4c4748');
    rect(sx(245),sy(276),124,3,'#141b28');rect(sx(255),sy(250),102,6,'#2b2d37');rect(sx(263),sy(256),6,24,'#252a35');rect(sx(342),sy(256),6,24,'#252a35');
    // No cake or plate is drawn before ignition: only a small, findable unlit wick.
    rect(x,sy(225),1,6,'#8b877a');
    if(t>0){
      const light=ctx.createRadialGradient(x,cy,0,x,cy,radius);
      light.addColorStop(0,`rgba(255,213,137,${.28*ease})`);light.addColorStop(.45,`rgba(238,174,86,${.16*ease})`);light.addColorStop(1,'rgba(229,154,65,0)');
      ctx.fillStyle=light;ctx.fillRect(x-radius,cy-radius,radius*2,radius*2);
      ctx.save();ctx.globalAlpha=ease;rect(sx(255),sy(250),102,6,'#a3825e');rect(sx(263),sy(256),6,24,'#776049');rect(sx(342),sy(256),6,24,'#776049');cake(x,sy(254),true,time);ctx.restore();
      for(let i=-1;i<=1;i++){rect(x+i*9-1,cy-2,2,3,C.gold);rect(x+i*9,cy-2,1,1,C.warm);}
      // One small ignition spark, lasting only the first fraction of the reveal.
      if(!reduced&&t<.16){rect(x-2,cy-3,1,2,'#ffe7a4');rect(x+4,cy-1,1,1,'#cba66c');}
    }
    player(state.player);
  }
  function player(p){let x=Math.round(p.x-camera),y=Math.round(p.y+base);const walking=p.grounded&&Math.abs(p.vx)>0;const frame=walking&&!reduced?Math.floor(time*9)%4:0;const bob=walking&&frame%2===1?1:0;y-=bob;ctx.save();if(p.facing<0){ctx.translate(x+p.w,y);ctx.scale(-1,1);x=0;y=0;}
    if(p.sitting){rect(x-2,y+21,20,3,'#172a30');rect(x+1,y+14,12,6,'#607b82');rect(x+10,y+17,6,4,'#3c505e');rect(x+12,y+20,6,3,'#d4c7aa');}
    else{const stride=frame===1?2:frame===3?-2:0;rect(x+2+stride,y+18,4,5,'#3a4a59');rect(x+8-stride,y+18,4,5,'#465a65');rect(x+1+stride,y+22,6,2,'#d3c6ac');rect(x+8-stride,y+22,6,2,'#d3c6ac');}
    rect(x+1,y+10,12,9,'#688b8f');rect(x+2,y+10,9,2,'#91aaa5');rect(x+1,y+15,3,4,'#506e7b');rect(x+12,y+11,3,7,'#8ba09d');rect(x+12,y+17,3,3,'#d2ae8c');rect(x-1,y+11,3,6,'#506e7b');rect(x+3,y+3,10,8,'#d3ac88');rect(x+1,y+1,11,5,'#473f3b');rect(x+3,y,8,2,'#5c4a3e');rect(x+1,y+4,4,4,'#473f3b');rect(x+10,y+6,1,2,'#28323b');rect(x+6,y+10,6,2,'#e4c58e');rect(x+4,y+11,3,3,'#d4ac76');ctx.restore();
  }
  function flowers(x,y,seed){const color=seed%3===0?'#bdbb91':seed%3===1?'#85998a':'#657c75';rect(x,y-4,1,4,C.grassLight);rect(x-1,y-5,3,2,color);}
  function draw(state, view, options={}) {
    ctx=view.ctx;w=view.width;h=view.height;camera=Math.round(state.camera)-root.NightEngine.screenOffset(state,w);base=h-336;time=state.time;reduced=!!options.reduced;
    if(state.scene==='house'){room(state);return;}
    rect(0,0,w,h,C.sky);rect(0,Math.round(h*.5),w,h*.5,C.sky2);rect(0,h*.68,w,h*.32,C.sky3);
    for(let i=0;i<100;i++){const sx=((rand(i+10)*2400-camera*.12)% (w+120)+w+120)%(w+120)-60;const sy=12+rand(i+100)*Math.max(50,h*.65);const bright=i%11===0;const twinkle=reduced?1:.72+Math.sin(time*.55+i)*.22;ctx.globalAlpha=twinkle;rect(sx,sy,1,1,bright?'#d9c797':'#61778d');if(bright&&i%2===0)rect(sx-1,sy+1,3,1,'#809299');}ctx.globalAlpha=1;
    moon(Math.max(42,Math.min(w-36,w*.77-camera*.025)),Math.max(35,h*.19));
    for(let layer=0;layer<2;layer++){const bw=layer===0?26:33;const offset=camera*(layer===0?.12:.22);const horizon=h-102+layer*12;for(let i=-2;i<w/bw+3;i++){const index=i+Math.floor(offset/bw);const x=i*bw-(offset%bw);const height=16+Math.floor(rand(index+layer*400+80)*36);rect(x,horizon-height,bw-2,height+30,layer===0?'#20394c':'#213c49');if(rand(index+10)>.5){rect(x+7,horizon-height+6,2,3,'#5b6456');rect(x+15,horizon-height+15,2,3,'#69705b');}}}
    for(let i=-1;i<w/58+2;i++){const index=i+Math.floor(camera*.32/58);const x=i*58-(camera*.32%58);const yy=h-81;pine(x,yy,.75+rand(index+13)*.7,'#1b3441');}
    rect(0,h-70,w,20,'#233e43');for(let i=0;i<w+20;i+=16){rect(i,h-73+Math.floor(rand(i+1)*5),17,9,'#29494a');}
    const gy=280+base;
    rect(0,gy,w,h-gy,C.soil);rect(0,gy,w,5,C.grass);rect(0,gy+5,w,12,C.earth);rect(0,gy+17,w,15,C.path);rect(0,gy+18,w,2,C.pathLight);rect(0,gy+33,w,3,'#3d514d');rect(0,gy+36,w,h-gy-36,'#24383a');
    const start=Math.floor(camera/13);for(let i=start;i<(camera+w)/13+1;i++){const xx=i*13-camera;rect(xx,gy-2-rand(i+800)*3,2,5,C.grassLight);if(i%3===0)rect(xx+4,gy+24,4,1,'#7b7f72');if(i%7===0)rect(xx+8,gy+40,6,2,'#334b47');if(i%5===0)flowers(xx+5,gy-2,i);}
    // Foreground objects are scenery, never solid obstacles on the main path.
    for(const x of [20,360,675,1090,1450,1760,2110]){bush(x-camera,gy-1,.8);}
    for(const x of [25,1070,1780,2135])pine(x-camera,gy-2,1.55,C.tree);
    for(const x of [290,690,1395,1830])lamp(x-camera,gy);
    sign(root.NightEngine.OBJECTS.find(o=>o.id==='sign').x-camera,gy);bench(460-camera,gy);box(1220-camera,gy,state.boxOpen,time);house(root.NightEngine.HOUSE_X-camera,gy);
    for(const o of root.NightEngine.OBJECTS){
      if(o.id==='hkTerminal')terminal(o.x-camera,gy);
      if(o.id==='roundOne')memorial(o.x-camera,gy,options.memorialGlow||0);
    }
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
