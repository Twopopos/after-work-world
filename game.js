(function () {
  'use strict';
  const E=window.NightEngine, A=window.NightArt, config=window.NIGHT_CONFIG||{};
  const $=id=>document.getElementById(id);
  const canvas=$('game-canvas'), ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx){$('start-button').textContent='Canvas is unavailable / 请更换浏览器';$('start-button').disabled=true;return;}
  let state=E.createGame(), chinese=!!config.defaultChinese, soundOn=!!config.soundInitiallyOn;
  let reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let view={ctx,width:600,height:336}, last=0, accumulator=0, toastTime=0, toastCopy=null, oldFocus=null;
  let jumpQueued=false, interactQueued=false, particles=[], audio=null;
  const keys=new Set(), pointers=new Map();
  const text={
    start:['Welcome to your little break.','欢迎来到属于你的小小休息时间。'],
    bench:['No rush. Enjoy the night.','不着急，享受这个夜晚。'],
    sign:['Take your time.','慢慢来。'],
    boxLocked:['A couple of stars might wake this up.','带两颗星星来，也许会有小惊喜。'],
    boxOpen:['A pocket-sized constellation. Yours to keep.','一小片星光，送给你。'],
    boxAgain:['Still a little brighter in here.','这里还亮着一点星光。'],
    birthday:['Hope the year ahead brings you good surprises, fun adventures, and plenty of time for the things you enjoy. Have a good one!','希望新的一年里，你能遇到美好的惊喜、有趣的冒险，也有充足的时间做喜欢的事。生日快乐，玩得开心！']
  };
  function clearInput(){keys.clear();pointers.clear();jumpQueued=false;interactQueued=false;document.querySelectorAll('[data-control]').forEach(el=>el.classList.remove('is-down'));}
  function held(action){return [...pointers.values()].some(p=>p.action===action)||(action==='left'?(keys.has('KeyA')||keys.has('ArrowLeft')):action==='right'?(keys.has('KeyD')||keys.has('ArrowRight')):false);}
  function reset(){clearInput();state=E.createGame();particles=[];hideToast();last=0;accumulator=0;E.updateCamera(state,view.width,0,true);syncUI();canvas.focus({preventScroll:true});}
  function setSoundUI(){ $('sound-label').textContent=soundOn?'ON':'OFF';$('sound-button').setAttribute('aria-pressed',String(soundOn));$('sound-button').setAttribute('aria-label',soundOn?'Mute sound / 静音':'Turn sound on / 开启声音'); }
  function ensureAudio(){
    if(!soundOn)return;
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio){soundOn=false;setSoundUI();return;}if(!audio)audio=new Audio();if(audio.state==='suspended')audio.resume().catch(()=>{soundOn=false;setSoundUI();});}
    catch(_){soundOn=false;setSoundUI();}
  }
  function tone(freq,length=.14,volume=.025,delay=0){
    if(!soundOn||!audio||audio.state!=='running'||document.hidden)return;
    try{const t=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+length);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+length+.02);o.onended=()=>{o.disconnect();g.disconnect();};}catch(_){}
  }
  function burst(x,y,n=14){if(reduced)return;for(let i=0;i<n;i++){const angle=i/n*Math.PI*2;const speed=13+(i%5)*7;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-19,size:i%3===0?2:1,color:['#edca86','#90aaa2','#d8b9ac'][i%3],life:1.2,max:1.2});}}
  function showToast(copy,duration=4){toastCopy=copy;toastTime=duration;$('toast-en').textContent=copy[0];$('toast-zh').textContent=copy[1];$('toast-zh').hidden=!chinese;$('toast').hidden=false;}
  function hideToast(){toastTime=0;toastCopy=null;$('toast').hidden=true;}
  function start(){E.start(state);clearInput();ensureAudio();syncUI();canvas.focus({preventScroll:true});}
  function openDialog(){oldFocus=document.activeElement;clearInput();hideToast();syncUI();$('dialog').focus({preventScroll:true});}
  function closeDialog(){if(state.mode!=='paused'&&state.mode!=='birthday')return;E.resume(state);clearInput();ensureAudio();syncUI();(oldFocus&&oldFocus.isConnected&&!oldFocus.closest('[hidden]')?oldFocus:canvas).focus({preventScroll:true});}
  function openPause(){if(state.mode!=='playing')return;E.pause(state);openDialog();}
  function syncLanguage(){
    document.documentElement.lang='en';
    $('language-button').setAttribute('aria-pressed',String(chinese));
    $('language-button').setAttribute('aria-label',chinese?'Hide Chinese translations / 隐藏中文翻译':'Show Chinese translations / 显示中文翻译');
    document.querySelectorAll('[data-zh]').forEach(el=>{el.textContent=el.dataset.zh;el.lang='zh-CN';el.hidden=!chinese;});
    document.querySelectorAll('[data-cn]').forEach(el=>{el.textContent=chinese?el.dataset.cn:el.dataset.en;});
    $('touch-jump-label').textContent=chinese?'跳跃':'JUMP';$('touch-interact-label').textContent=chinese?'互动':'INTERACT';
    $('footer-note').textContent=chinese?'不赶时间，慢慢走。':'NOWHERE TO BE. NOTHING TO RUSH.';
    if(toastCopy){$('toast-zh').textContent=toastCopy[1];$('toast-zh').hidden=!chinese;}
  }
  function syncUI(){
    const playing=state.mode==='playing',modal=state.mode==='birthday'||state.mode==='paused',birthday=state.mode==='birthday';
    $('title-layer').hidden=state.mode!=='title';$('dialog-layer').hidden=!modal;$('pause-button').hidden=state.mode==='title';
    $('star-counter').hidden=state.mode==='title';$('touch-controls').hidden=!playing;
    $('location').hidden=state.mode==='title'||modal;
    $('app').classList.toggle('is-playing',playing);
    // Modal blocks every background control from pointer, keyboard and accessibility navigation.
    document.querySelector('.topbar').inert=modal;document.querySelector('.bottom-bar').inert=modal;
    canvas.inert=modal||state.mode==='title';
    if(modal){
      $('dialog-eyebrow').textContent=birthday?'A LITTLE SOMETHING FOR YOU':'A QUIET MOMENT';
      $('dialog-title').textContent=birthday?'Happy Birthday!':'Take a little breath.';
      $('dialog-body').textContent=birthday?text.birthday[0]:'The night will be right here.';
      $('dialog-body-zh').textContent=birthday?text.birthday[1]:'夜色会一直在这里，等你继续散步。';
      $('dialog-body-zh').lang='zh-CN';$('dialog-body-zh').hidden=!chinese;
      $('birthday-art').hidden=!birthday;$('birthday-actions').hidden=!birthday;$('pause-actions').hidden=birthday;
      $('optional-line').hidden=!birthday||!config.showGamingLine;$('optional-line').textContent=config.gamingLine||'';
      $('optional-line-zh').hidden=!birthday||!config.showGamingLine||!chinese;$('optional-line-zh').textContent=config.gamingLineZh||'';
    }
    syncLanguage();updateHUD();resize();
  }
  function updateHUD(){
    const count=E.countStars(state);if($('star-count').textContent!==String(count))$('star-count').textContent=String(count);
    $('star-counter').setAttribute('aria-label',`${count} of 5 stars / ${count} 颗星星，共 5 颗`);
    const target=state.mode==='playing'?E.nearest(state):null;
    const labels={bench:state.player.sitting?['Stand up','起身']:['Take a seat','坐一会儿'],box:state.boxOpen?['A little light','一点星光']:['Open the box','打开盒子'],cake:['Light the candles','点亮蜡烛'],sign:['Read','读一读']};
    const prompt=$('object-prompt');prompt.hidden=!target;
    if(target){$('object-prompt-text').textContent=chinese?`${labels[target.id][0]} · ${labels[target.id][1]}`:labels[target.id][0];const world=$('world').getBoundingClientRect();const px=(target.x-state.camera)/view.width*world.width;const py=(target.y-49+view.height-336)/view.height*world.height;prompt.style.left=E.clamp(px,90,world.width-90)+'px';prompt.style.top=Math.max(45,py)+'px';}
    $('touch-interact').classList.toggle('available',!!target);$('touch-interact').setAttribute('aria-label',target?`${labels[target.id][0]} / ${labels[target.id][1]}`:'Interact / 互动');
    $('touch-interact').disabled=!target;
    const x=state.player.x;$('location-text').textContent=x<670?'THE QUIET PATH':x<1140?'A FEW STEPPING STONES':x<1740?'LITTLE THINGS, ALONG THE WAY':'A WARM LITTLE CLEARING';
  }
  function events(){for(const ev of E.drainEvents(state)){
    if(ev.type==='start')showToast(text.start,3.5);
    if(ev.type==='bench')showToast(text.bench,7);
    if(ev.type==='stand')hideToast();
    if(ev.type==='sign')showToast(text.sign,4);
    if(ev.type==='boxLocked')showToast(text.boxLocked,4);
    if(ev.type==='boxOpen'){showToast(text.boxOpen,4);burst(ev.x,ev.y,18);tone(440,.4);tone(660,.45,.025,.1);}
    if(ev.type==='boxAgain')showToast(text.boxAgain,4);
    if(ev.type==='star'){burst(ev.x,ev.y);tone(660+ev.count*55,.22);if(ev.count===1)showToast(['A little light for the walk.','带一点星光，继续散步。'],3);}
    if(ev.type==='birthday'){burst(ev.x,ev.y,27);tone(523,.5);tone(659,.5,.02,.16);tone(784,.6,.02,.32);openDialog();}
  }}
  function resize(){const r=$('world').getBoundingClientRect();if(!r.width||!r.height)return;const scale=Math.max(1,Math.min(3,r.height/310,r.width/280));const width=Math.round(r.width/scale),height=Math.round(r.height/scale);if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;ctx.imageSmoothingEnabled=false;view={ctx,width,height};E.updateCamera(state,width,0,true);} }
  function frame(now){
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;
    if(!document.hidden){accumulator+=dt;while(accumulator>=1/60){
      const input={left:held('left'),right:held('right'),jumpPressed:jumpQueued,interactPressed:interactQueued};jumpQueued=false;interactQueued=false;
      E.step(state,input,1/60);events();if(state.mode==='playing'){if(toastTime>0){toastTime-=1/60;if(toastTime<=0)hideToast();}E.updateCamera(state,view.width,1/60,reduced);}
      if(state.mode==='playing'||state.mode==='birthday'){for(const p of particles){p.x+=p.vx/60;p.y+=p.vy/60;p.vy+=18/60;p.life-=1/60;}particles=particles.filter(p=>p.life>0);}
      accumulator-=1/60;
    }
    A.draw(state,view,{reduced,particles});updateHUD();}
    window.requestAnimationFrame(frame);
  }
  function releasePointer(ev){const old=pointers.get(ev.pointerId);pointers.delete(ev.pointerId);if(old&&![...pointers.values()].some(p=>p.element===old.element))old.element.classList.remove('is-down');}
  document.querySelectorAll('[data-control]').forEach(button=>{
    button.addEventListener('pointerdown',ev=>{ev.preventDefault();if(state.mode!=='playing'||button.disabled)return;ensureAudio();const action=button.dataset.control;pointers.set(ev.pointerId,{action,element:button});button.classList.add('is-down');try{button.setPointerCapture(ev.pointerId);}catch(_){}if(action==='jump')jumpQueued=true;if(action==='interact')interactQueued=true;});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,releasePointer);
    button.addEventListener('contextmenu',ev=>ev.preventDefault());
    // Native keyboard/screen-reader activation also works without synthesizing touch.
    button.addEventListener('click',ev=>{if(ev.detail!==0||state.mode!=='playing')return;const action=button.dataset.control;if(action==='jump')jumpQueued=true;if(action==='interact')interactQueued=true;if(action==='left'||action==='right'){E.step(state,{[action]:true},1/30);}});
  });
  window.addEventListener('pointerup',releasePointer);window.addEventListener('pointercancel',releasePointer);
  const gameCodes=['KeyA','KeyD','ArrowLeft','ArrowRight','KeyW','ArrowUp','Space','KeyE','Enter'];
  window.addEventListener('keydown',ev=>{
    if(ev.code==='Escape'){if(state.mode==='paused'||state.mode==='birthday'){ev.preventDefault();closeDialog();}else if(state.mode==='playing'){ev.preventDefault();openPause();}return;}
    if(state.mode!=='playing'||!gameCodes.includes(ev.code))return;
    // Preserve native button activation when settings have keyboard focus.
    if(ev.target instanceof HTMLElement&&ev.target.closest('button,a')&&['Space','Enter'].includes(ev.code))return;
    ev.preventDefault();if(ev.repeat)return;keys.add(ev.code);ensureAudio();
    if(['Space','KeyW','ArrowUp'].includes(ev.code))jumpQueued=true;
    if(['KeyE','Enter'].includes(ev.code))interactQueued=true;
  });
  window.addEventListener('keyup',ev=>{keys.delete(ev.code);});
  window.addEventListener('blur',()=>{clearInput();if(state.mode==='playing')openPause();});
  document.addEventListener('visibilitychange',()=>{clearInput();last=0;accumulator=0;if(document.hidden){if(state.mode==='playing')openPause();if(audio)audio.suspend().catch(()=>{});}});
  window.addEventListener('pagehide',()=>{clearInput();if(audio)audio.suspend().catch(()=>{});});
  window.addEventListener('resize',()=>{clearInput();resize();});if(window.visualViewport)window.visualViewport.addEventListener('resize',resize);
  if(window.ResizeObserver)new ResizeObserver(resize).observe($('world'));
  const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');const motionChange=ev=>{reduced=ev.matches;if(reduced)particles=[];};if(motionQuery.addEventListener)motionQuery.addEventListener('change',motionChange);else if(motionQuery.addListener)motionQuery.addListener(motionChange);
  $('start-button').addEventListener('click',start);$('pause-button').addEventListener('click',openPause);$('home-button').addEventListener('click',ev=>{ev.preventDefault();openPause();});
  $('resume-button').addEventListener('click',closeDialog);$('explore-button').addEventListener('click',closeDialog);$('dialog-close').addEventListener('click',closeDialog);
  $('night-button').addEventListener('click',()=>{E.backToNight(state);clearInput();particles=[];hideToast();syncUI();$('start-button').focus({preventScroll:true});});
  $('restart-button').addEventListener('click',()=>{reset();start();});
  $('sound-button').addEventListener('click',()=>{soundOn=!soundOn;ensureAudio();setSoundUI();if(soundOn)tone(523,.12,.018);else if(audio)audio.suspend().catch(()=>{});});
  $('language-button').addEventListener('click',()=>{chinese=!chinese;syncUI();});
  $('dialog-layer').addEventListener('keydown',ev=>{if(ev.code!=='Tab')return;const buttons=[...$('dialog').querySelectorAll('button')].filter(b=>!b.hidden&&!b.closest('[hidden]'));const first=buttons[0],end=buttons[buttons.length-1];if(ev.shiftKey&&(document.activeElement===first||document.activeElement===$('dialog'))){ev.preventDefault();end.focus();}else if(!ev.shiftKey&&(document.activeElement===end||document.activeElement===$('dialog'))){ev.preventDefault();first.focus();}});
  canvas.tabIndex=-1;$('toast-zh').lang='zh-CN';$('optional-line-zh').lang='zh-CN';setSoundUI();syncUI();requestAnimationFrame(frame);
})();
