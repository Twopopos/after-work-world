/* Original pixel artwork, drawn from small rectangles. No remote assets. */
(function (root) {
  'use strict';
  const C = { sky:'#111e34',sky2:'#16283f',sky3:'#1d3448',far:'#223d4e',hill:'#1a3846',tree:'#142d38',leaf:'#285047',grass:'#3c6051',grassLight:'#60806a',earth:'#283f3c',soil:'#24363a',path:'#576260',pathLight:'#6c7470',gold:'#edc986',warm:'#f9e2a4',wood:'#9a7353',woodLight:'#b48b62',woodDark:'#5d4a42',ink:'#17283b' };
  let ctx, w, h, camera, base, time, reduced, playerScreenX;
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
  function filmBoard(x,y){
    // A small, weathered board beyond the roof's right edge. Original color
    // blocks recall a faded seaside print; no poster image or film assets.
    rect(x-31,y-24,4,24,'#3c4440');rect(x+27,y-24,4,24,'#3c4440');
    rect(x-42,y-84,84,62,'#303d40');rect(x-40,y-82,80,58,'#4e5149');
    rect(x-38,y-80,76,54,'#3b4643');rect(x-42,y-84,84,2,'#727164');
    rect(x-37,y-81,9,1,'#8c8871');rect(x+28,y-25,11,1,'#77725e');
    // The 36px print occupies the left half of the 84px board, not the view.
    rect(x-37,y-79,36,50,'#8e9f9c');rect(x-36,y-78,34,25,'#9daaa1');
    rect(x-36,y-76,12,13,'#8ea6a5');rect(x-24,y-74,22,15,'#a8afa1');
    rect(x-35,y-62,33,8,'#b1b09a');rect(x-34,y-55,32,5,'#b7aa8c');
    rect(x-36,y-50,34,20,'#567d85');rect(x-36,y-47,13,2,'#779393');
    rect(x-20,y-44,18,2,'#86a19b');rect(x-35,y-38,12,1,'#a6b2a2');
    rect(x-17,y-35,14,2,'#9ba99a');rect(x-36,y-49,9,2,'#516f79');
    // Two indistinct backs facing the water, following the reference's mood.
    rect(x-29,y-43,6,6,'#414f4d');rect(x-30,y-39,8,3,'#606555');
    rect(x-32,y-36,12,7,'#a38a6c');rect(x-30,y-38,8,3,'#b49a79');
    rect(x-12,y-40,5,6,'#3d504e');rect(x-14,y-34,9,5,'#a29177');
    rect(x-11,y-34,2,5,'#706961');rect(x-32,y-60,21,1,'#d0c9ad');
    rect(x-31,y-58,19,1,'#bcc0a9');rect(x-36,y-31,34,1,'#b0aa90');
    // Smaller taped note, with two groups of handwriting marks. Its complete
    // wording is read once through the existing toast, rather than tiny type.
    rect(x+7,y-66,28,32,'#2c393b');rect(x+6,y-67,27,31,'#bcaf8b');
    rect(x+7,y-66,25,28,'#d0c3a0');rect(x+15,y-69,9,4,'#9eaa91');
    for(const [row,length] of [[0,16],[1,19],[2,13],[4,18],[5,17],[6,9]])rect(x+10,y-60+row*3,length,1,'#756e58');
    rect(x+29,y-39,3,2,'#a79c7d');rect(x+8,y-65,4,1,'#dfd0aa');
    rect(x-40,y-81,2,2,'#959382');rect(x+37,y-28,2,2,'#959382');
  }
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
  function computer(x,y){
    // Original CRT on its own desk, clear of the cake table and the room wall.
    rect(x-33,y-20,68,5,'#30323a');rect(x-29,y-15,5,15,'#242833');rect(x+26,y-15,5,15,'#242833');
    rect(x-19,y-60,38,32,'#29343d');rect(x-17,y-58,34,28,'#3a454a');rect(x-14,y-55,28,20,'#0d2128');
    rect(x-4,y-28,8,6,'#28323b');rect(x-12,y-23,24,3,'#374047');
    rect(x-17,y-23,34,2,'#4a4d4d');rect(x-13,y-22,24,1,'#222a32');
  }
  function computerScreen(x,y,ease){
    // Emission is drawn after room darkness. Its 22px halo cannot reach the cake.
    const sy=y-46,halo=ctx.createRadialGradient(x,sy,3,x,sy,22);
    halo.addColorStop(0,'rgba(85,165,157,0.10)');halo.addColorStop(.5,'rgba(66,131,135,0.035)');halo.addColorStop(1,'rgba(48,98,109,0)');
    ctx.fillStyle=halo;ctx.fillRect(x-22,sy-22,44,44);
    ctx.save();ctx.globalAlpha=.78-ease*.1;
    rect(x-13,y-54,26,18,'#315c62');rect(x-12,y-53,24,16,'#143b43');
    rect(x-10,y-51,17,1,'#6da597');rect(x-10,y-48,9,1,'#4c807e');
    rect(x-10,y-44,20,5,'#204b53');rect(x-9,y-43,3,3,'#639c92');
    rect(x-4,y-43,12,1,'#497c7a');rect(x-4,y-41,8,1,'#3b696f');rect(x+9,y-51,1,1,'#8cb9a7');
    ctx.restore();
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
    // The final darkness layer suppresses these surfaces before ignition.
    rect(sx(30),sy(207),44,73,'#31404b');rect(sx(34),sy(211),36,69,'#202c39');rect(sx(38),sy(215),28,63,'#273644');rect(sx(61),sy(248),2,3,'#b2a890');rect(sx(33),gy-1,39,2,'#87939a');
    rect(sx(375),sy(151),40,47,'#36414d');rect(sx(379),sy(155),32,39,'#23394c');rect(sx(382),sy(158),25,31,'#2c455a');rect(sx(394),sy(155),3,39,'#414852');rect(sx(379),sy(174),32,3,'#414852');
    rect(sx(122),sy(192),62,4,'#38404a');rect(sx(130),sy(176),5,16,'#444652');rect(sx(137),sy(181),7,11,'#3e4b50');rect(sx(147),sy(178),5,14,'#4c4748');
    rect(sx(245),sy(276),124,3,'#141b28');rect(sx(255),sy(250),102,6,'#2b2d37');rect(sx(263),sy(256),6,24,'#252a35');rect(sx(342),sy(256),6,24,'#252a35');
    // No cake or plate is drawn before ignition: only a small, findable unlit wick.
    rect(x,sy(225),1,6,'#8b877a');
    computer(sx(root.NightEngine.ROOM.computer),gy);
    if(t>0){
      const light=ctx.createRadialGradient(x,cy,0,x,cy,radius);
      light.addColorStop(0,`rgba(255,213,137,${.28*ease})`);light.addColorStop(.45,`rgba(238,174,86,${.16*ease})`);light.addColorStop(1,'rgba(229,154,65,0)');
      ctx.fillStyle=light;ctx.fillRect(x-radius,cy-radius,radius*2,radius*2);
      ctx.save();ctx.globalAlpha=ease;rect(sx(255),sy(250),102,6,'#a3825e');rect(sx(263),sy(256),6,24,'#776049');rect(sx(342),sy(256),6,24,'#776049');cake(x,sy(254),true,time);ctx.restore();
    }
    player(state.player);
    // Use the existing candle state/progress/radius, never proximity or entry.
    // A little ambient visibility reveals the table/wick, never an unlit cake.
    // Return to the original final darkness as the candle's warm light takes over.
    const ambient=.86+.11*ease;
    if(t>0){
      const darkness=ctx.createRadialGradient(x,cy,0,x,cy,radius);
      darkness.addColorStop(0,`rgba(1,3,9,${ambient-.93*ease})`);
      darkness.addColorStop(.35,`rgba(1,3,9,${ambient-.82*ease})`);
      darkness.addColorStop(.7,`rgba(1,3,9,${ambient-.30*ease})`);
      darkness.addColorStop(1,`rgba(1,3,9,${ambient})`);ctx.fillStyle=darkness;ctx.fillRect(0,0,w,h);
    }else rect(0,0,w,h,'rgba(1,3,9,0.86)');
    if(state.house.candleLit){
      for(let i=-1;i<=1;i++){rect(x+i*9-1,cy-2,2,3,C.gold);rect(x+i*9,cy-2,1,1,C.warm);}
      if(!reduced&&t<.16){rect(x-2,cy-3,1,2,'#ffe7a4');rect(x+4,cy-1,1,1,'#cba66c');}
    }
    computerScreen(sx(root.NightEngine.ROOM.computer),gy,ease);
  }
  // Presentation history only: never write animation fields into the player or
  // change physics. Weak keys also discard the old pose after a game restart.
  const playerMotion=new WeakMap();
  // Contact, support, toe-off, passing and forward swing. Interpolate between
  // these eight positions using travelled distance, not a low-FPS frame clock.
  const walkFeet=[[3,0],[1.5,0],[-.5,0],[-2.5,0],[-3,1],[-1,2],[1.5,2],[3,1]];
  function walkFoot(phase){const index=(phase/(Math.PI*2)*8)%8,i=Math.floor(index),t=index-i,a=walkFeet[i],b=walkFeet[(i+1)%8];return{dx:a[0]+(b[0]-a[0])*t,lift:a[1]+(b[1]-a[1])*t};}
  function playerPose(p){
    let previous=playerMotion.get(p);
    if(!previous||time<previous.time||time-previous.time>.25||Math.abs(p.x-previous.x)>48||Math.abs(p.y-previous.y)>64)previous={grounded:p.grounded,vy:p.vy,landUntil:0,time,x:p.x,y:p.y,phase:0,weight:0,walking:false};
    if(!reduced&&p.grounded&&!previous.grounded&&previous.vy>=0)previous.landUntil=time+.12;
    const dt=Math.max(0,time-previous.time),distance=Math.abs(p.x-previous.x);
    const walking=p.grounded&&!p.sitting&&Math.abs(p.vx)>0&&(distance>0||dt===0&&previous.walking);
    const weight=reduced||!p.grounded||p.sitting?0:previous.weight+Math.max(-dt/.08,Math.min(dt/.08,(walking?1:0)-previous.weight));
    const phase=(previous.phase+(walking?distance/56*Math.PI*2:0))%(Math.PI*2);
    const landing=!reduced&&!p.sitting&&p.grounded&&time<previous.landUntil;
    playerMotion.set(p,{grounded:p.grounded,vy:p.vy,landUntil:previous.landUntil,time,x:p.x,y:p.y,phase,weight,walking});
    return {phase,weight,landing,air:!p.grounded,body:landing?1:0};
  }
  function player(p){
    const pose=playerPose(p);
    const screenX=Number.isFinite(playerScreenX)?playerScreenX:p.x-camera;
    let x=Math.round(screenX),y=Math.round(p.y+base);
    ctx.save();
    // Align the complete sprite to whole canvas pixels. Fractional translation
    // changes edge coverage every frame and makes the pixel artwork shimmer.
    if(p.facing<0){ctx.translate(x+p.w,y);ctx.scale(-1,1);x=0;y=0;}
    const upper=y+pose.body,airLift=pose.air?(Math.abs(p.vy)<65?2:1):0;
    // Small travel pack, behind the body. It is scenery on the sprite only,
    // with no inventory or gameplay behavior.
    rect(x-2,upper+13,6,8,'#45372d');rect(x-1,upper+14,4,6,'#614837');
    rect(x-1,upper+13,5,2,'#7a5a40');rect(x-1,upper+17,2,2,'#ba8c4d');
    // Legs retain the old 24px footprint. Feet stay planted during the small
    // landing crouch; airborne knees follow ascent, apex and descent instead.
    if(p.sitting){
      rect(x-2,y+21,20,3,'#172a30');rect(x+1,y+14,12,6,'#59483e');
      rect(x+10,y+17,6,4,'#4a3b34');rect(x+12,y+20,6,3,'#4b3b31');
    }else if(pose.weight>0&&!pose.landing){
      function leg(front){
        const foot=walkFoot(pose.phase+(front?0:Math.PI)),blend=pose.weight;
        const hip=front?10-2*blend:5+blend;
        const footX=(front?8:2)+((front?6:4)+foot.dx-(front?8:2))*blend;
        const lift=Math.round(foot.lift*blend),ankleY=22-lift,kneeY=20-lift*.3;
        const kneeX=(hip+footX+2)/2+lift*.4;
        for(let row=18;row<ankleY;row++){
          const t=row<kneeY?(row-18)/Math.max(1,kneeY-18):(row-kneeY)/Math.max(1,ankleY-kneeY);
          const center=row<kneeY?hip+(kneeX-hip)*t:kneeX+(footX+2-kneeX)*t;
          rect(x+center-1,y+row,3,1,front?'#59483e':'#4a3b34');
        }
        rect(x+footX,y+ankleY,5,2,front?'#4b3b31':'#3d302b');
      }
      leg(false);leg(true);
    }else{
      const farLift=pose.air?airLift:0;
      const nearLift=pose.air?airLift+(p.vy< -65?1:0):0;
      const knee=pose.landing?1:0;
      rect(x+3,y+18+knee,4,4-farLift-knee,'#4a3b34');
      rect(x+8,y+18+knee,4,4-nearLift-knee,'#59483e');
      rect(x+3,y+19+knee,1,2-farLift,'#6c5748');
      rect(x+8,y+19+knee,1,Math.max(1,2-nearLift),'#745c4e');
      rect(x+2,y+22-farLift,5,2,'#3d302b');
      rect(x+8,y+22-nearLift,5,2,'#4b3b31');
    }
    // Compact cream hoodie, soft folds and pack straps from the new reference.
    // The shorter visible torso leaves room for a fuller, softer head silhouette.
    rect(x+2,upper+12,10,8,'#d8cab6');rect(x+3,upper+14,1,5,'#eee0ca');
    rect(x+10,upper+14,2,5,'#b6a591');rect(x+5,upper+17,5,2,'#c4b49d');
    rect(x+5,upper+17,1,1,'#a99781');rect(x+9,upper+17,1,1,'#a99781');
    rect(x+3,upper+13,1,4,'#614837');rect(x+10,upper+13,1,4,'#614837');
    rect(x+5,upper+14,1,2,'#574b41');rect(x+8,upper+14,1,2,'#574b41');
    rect(x+3,upper+19,8,1,'#b6a591');
    const swing=Math.cos(pose.phase)*1.4*pose.weight;
    const armLift=pose.air?(p.vy< -65?-2:-1):0;
    function sleeve(ax,ay,front,bend){
      for(let row=0;row<5;row++){
        const drift=Math.round(bend*row/4);rect(ax+drift,ay+row,3,1,front?'#d8cab6':'#b6a591');
      }
      rect(ax+Math.round(bend),ay+5,3,2,front?'#e2bd9d':'#cba183');
    }
    sleeve(x,upper+13+armLift,false,swing);
    sleeve(x+11,upper+13+armLift,true,-swing);
    // Muted blue scarf and short loose end, painted over the hoodie collar.
    rect(x+2,upper+12,11,2,'#3e576d');rect(x+4,upper+12,8,1,'#8ba6b9');
    rect(x+3,upper+13,9,1,'#587b95');rect(x+4,upper+14,2,2,'#587b95');
    // Rounded, tousled brown hair with a small crown tuft. The sprite stays
    // at its existing height with an unchanged hitbox; only the art is chibi-like.
    rect(x+2,upper+5,11,7,'#e2bd9d');rect(x+12,upper+9,2,2,'#edcdb0');
    rect(x+1,upper+10,2,2,'#cba183');rect(x+10,upper+9,1,2,'#342923');
    rect(x+4,upper+9,1,2,'#342923');rect(x+3,upper+11,1,1,'#d79781');
    rect(x+10,upper+11,1,1,'#d79781');
    // Swept crown tuft and uneven, tapered fringe from the reference.
    // Skin gaps keep the two-pixel eyes separate from the hair.
    const hair=[
      '        OO      ',
      '         MO     ',
      '    OOOMMOMOO   ',
      '  OOMHHMMMMMMO  ',
      '  OMHHMMMMHMMMO ',
      ' OMMHMMMMMMHMMO ',
      'OMMMMMMMMMMMMHMO',
      ' OMMM MMMM MHMO ',
      ' OMM   MM    MO ',
      '  OM   M     MO ',
      '  O          O  '
    ];
    const hairColors={O:'#322a28',M:'#594940',H:'#806657'};
    for(let row=0;row<hair.length;row++)for(let col=0;col<hair[row].length;col++)if(hairColors[hair[row][col]])rect(x+col-1,upper+row,1,1,hairColors[hair[row][col]]);
    ctx.restore();
  }
  function flowers(x,y,seed){const color=seed%3===0?'#bdbb91':seed%3===1?'#85998a':'#657c75';rect(x,y-4,1,4,C.grassLight);rect(x-1,y-5,3,2,color);}
  function draw(state, view, options={}) {
    ctx=view.ctx;w=view.width;h=view.height;camera=Math.round(state.camera)-root.NightEngine.screenOffset(state,w);base=h-336;time=state.time;reduced=!!options.reduced;
    // The fallback uses the same unrounded relative coordinate as game.js;
    // scenery retains its existing integer camera and the actor snaps once.
    playerScreenX=Number.isFinite(options.playerScreenX)?options.playerScreenX:state.player.x-state.camera+root.NightEngine.screenOffset(state,w);
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
      if(o.id==='filmBoard')filmBoard(o.x-camera,gy);
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
