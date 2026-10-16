(function () {
  'use strict';
  const E=window.NightEngine, A=window.NightArt, config=window.NIGHT_CONFIG||{};
  const $=id=>document.getElementById(id);
  const canvas=$('game-canvas'), ctx=canvas.getContext('2d',{alpha:false});
  if(!ctx){$('start-button').textContent='Canvas is unavailable / 请更换浏览器';$('start-button').disabled=true;return;}
  let state=E.createGame(), chinese=!!config.defaultChinese, soundOn=!!config.soundInitiallyOn;
  let reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let view={ctx,width:600,height:336}, last=0, accumulator=0, toastTime=0, toastCopy=null, oldFocus=null;
  let toastAnchor=null, toastFade=0, toastFadeDuration=.55, toastPlacement=null, dismissedPromptId=null;
  let memorialPulse=0, filmBoardInside=false;
  let jumpQueued=false, particles=[], audio=null, music=null, musicSource=null, musicToken=0, musicNeedsResume=false, musicProbe=null;
  let musicGain=null, musicNode=null, musicLevel=.85, musicFade=null;
  const MUSIC_LEVEL=.85, MUSIC_FADE_SECONDS=1.5;
  let outdoor=null, outdoorGain=null, outdoorNode=null, outdoorIndex=0, outdoorToken=0, outdoorFade=0, outdoorAwaitGesture=false;
  const outdoorTracks=config.outdoorTracks||[], OUTDOOR_LEVEL=.65;
  function outdoorAllowed(){return soundOn&&!document.hidden&&!outdoorAwaitGesture&&!musicFade&&(state.scene==='night'||state.scene==='house'&&!state.house.candleLit)&&state.mode==='playing';}
  function pauseOutdoor(){outdoorToken++;outdoorFade=0;if(outdoor)outdoor.pause();}
  function resetOutdoor(){pauseOutdoor();outdoorIndex=0;if(outdoor){outdoor.src=outdoorTracks[0];outdoor.currentTime=0;}}
  function setOutdoorLevel(level){
    if(outdoorGain&&audio){outdoorGain.gain.cancelScheduledValues(audio.currentTime);outdoorGain.gain.setValueAtTime(level,audio.currentTime);}
    else if(outdoor)outdoor.volume=level;
  }
  function playOutdoor(){
    if(!outdoorAllowed()||!outdoorTracks.length||outdoor&&!outdoor.paused)return;
    try{
      if(!outdoor){
        outdoor=new window.Audio(outdoorTracks[outdoorIndex]);outdoor.preload='none';outdoor.loop=false;
        if(audio&&typeof audio.createMediaElementSource==='function'){
          try{outdoorGain=audio.createGain();outdoorNode=audio.createMediaElementSource(outdoor);outdoorNode.connect(outdoorGain);outdoorGain.connect(audio.destination);outdoor.volume=1;}
          catch(_){outdoorGain=null;if(outdoorNode)outdoorNode.connect(audio.destination);}
        }
        outdoor.addEventListener('ended',()=>{
          if(!outdoorAllowed())return;
          outdoorIndex=(outdoorIndex+1)%outdoorTracks.length;outdoor.src=outdoorTracks[outdoorIndex];outdoor.currentTime=0;playOutdoor();
        });
      }
      const token=++outdoorToken;outdoorFade=0;setOutdoorLevel(0);
      const result=outdoor.play();
      const failed=()=>{if(token===outdoorToken&&outdoorAllowed()){pauseOutdoor();showToast(['The night is quiet. Tap ♪ off and on to retry music.','音乐暂时未播放，可切换 ♪ 开关重试。'],5);}};
      if(result&&result.catch)result.catch(failed);
    }catch(_){pauseOutdoor();showToast(['The night is quiet. Music is unavailable in this browser.','当前浏览器暂时无法播放背景音乐。'],5);}
  }
  function updateOutdoor(dt){if(outdoor&&!outdoor.paused&&outdoorAllowed()&&outdoorFade<1){outdoorFade=Math.min(1,outdoorFade+dt/1.2);setOutdoorLevel(OUTDOOR_LEVEL*outdoorFade);}}
  const playedMusic=new Set();
  const keys=new Set(), pointers=new Map();
  const text={
    start:['Welcome to your little break.','欢迎来到属于你的小小休息时间。'],
    bench:["Take your time.\nThere's no need to rush to the next chapter.",'慢慢来。\n不必急着翻开下一章。'],
    hkMemory:['Funny how one game can lead to a whole new world.','没想到，一局游戏也能通向一个全新的世界。'],
    roundMemory:['An unexpected beginning.\nSometimes, the best things start by accident.','一场意料之外的开始。\n有时候，最美好的事就这样偶然开始。'],
    benchMemory:["Take your time.\nThere's no need to rush to the next chapter.",'慢慢来。\n不必急着翻开下一章。'],
    sign:['Enjoy the night.','享受这个夜晚。'],
    filmNote:['The end of this little world...\nBut not the end of the story.','这个小世界到了尽头……\n但故事还没有结束。'],
    boxLocked:['A couple of stars might wake this up.','带两颗星星来，也许会有小惊喜。'],
    boxOpen:['A pocket-sized constellation. Yours to keep.','一小片星光，送给你。'],
    boxAgain:['Still a little brighter in here.','这里还亮着一点星光。'],
    dark:['It’s a little too dark in here…','这里有点暗……'],
    lightHint:['Looks like it could be lit…','似乎可以点燃…'],
    musicFailed:['Music couldn’t start. The birthday note will still appear.','音乐暂未播放，生日祝福仍会出现。'],
    birthday:[config.birthdayBody||'',config.birthdayBodyZh||'']
  };
  function clearInput(){keys.clear();pointers.clear();jumpQueued=false;document.querySelectorAll('[data-control]').forEach(el=>el.classList.remove('is-down'));}
  function held(action){return [...pointers.values()].some(p=>p.action===action)||(action==='left'?(keys.has('KeyA')||keys.has('ArrowLeft')):action==='right'?(keys.has('KeyD')||keys.has('ArrowRight')):false);}
  function reset(){memorialPulse=0;filmBoardInside=false;resetOutdoor();stopMusic();playedMusic.clear();clearInput();state=E.createGame();particles=[];hideToast();last=0;accumulator=0;E.updateCamera(state,view.width,0,true);syncUI();canvas.focus({preventScroll:true});}
  function setSoundUI(){
    $('sound-label').textContent=soundOn?'ON':'OFF';$('sound-button').setAttribute('aria-pressed',String(soundOn));$('sound-button').setAttribute('aria-label',soundOn?'Mute sound / 静音':'Turn sound on / 开启声音');
    $('dialog-sound-label').textContent=soundOn?'MUSIC ON':'MUSIC OFF';$('dialog-sound').setAttribute('aria-pressed',String(soundOn));$('dialog-sound').setAttribute('aria-label',soundOn?'Mute music / 关闭音乐':'Turn music on / 开启音乐');
  }
  function ensureAudio(){
    if(!soundOn)return;
    const resumeOutdoor=outdoorAwaitGesture;outdoorAwaitGesture=false;
    try{const Audio=window.AudioContext||window.webkitAudioContext;if(Audio){if(!audio)audio=new Audio();if(audio.state==='suspended')audio.resume().catch(()=>{});}}
    catch(_){} // Short effects can fail independently of the local recordings.
    if(resumeOutdoor)playOutdoor();
  }
  function connectMusicGain(){
    if(musicGain||!music||!audio||typeof audio.createMediaElementSource!=='function')return;
    try{const gain=audio.createGain();musicNode=audio.createMediaElementSource(music);musicNode.connect(gain);gain.connect(audio.destination);musicGain=gain;music.volume=1;musicGain.gain.setValueAtTime(musicLevel,audio.currentTime);}catch(_){if(musicNode)try{musicNode.connect(audio.destination);}catch(_){}music.volume=musicLevel;}
  }
  function setMusicLevel(level,seconds=0){
    const from=musicLevel;musicLevel=E.clamp(level,0,MUSIC_LEVEL);
    if(musicGain&&audio){const t=audio.currentTime;musicGain.gain.cancelScheduledValues(t);musicGain.gain.setValueAtTime(from,t);if(seconds)musicGain.gain.linearRampToValueAtTime(musicLevel,t+seconds);else musicGain.gain.setValueAtTime(musicLevel,t);}
    else if(music)music.volume=musicLevel;
  }
  function finishMusicFade(){musicFade=null;musicProbe=null;musicNeedsResume=false;if(music){setMusicLevel(0);music.pause();music.loop=false;}playOutdoor();}
  function fadeOutMusic(){
    if(!music||music.paused){finishMusicFade();return;}
    if(musicFade)return;
    musicProbe=null;musicNeedsResume=false;musicToken++;
    musicFade={elapsed:0,from:musicLevel};
    if(musicGain&&audio){const t=audio.currentTime;musicGain.gain.cancelScheduledValues(t);musicGain.gain.setValueAtTime(musicLevel,t);musicGain.gain.linearRampToValueAtTime(0,t+MUSIC_FADE_SECONDS);}
  }
  function updateMusicFade(dt){
    if(!musicFade)return;
    musicFade.elapsed+=dt;musicLevel=musicFade.from*Math.max(0,1-musicFade.elapsed/MUSIC_FADE_SECONDS);
    if(!musicGain&&music)music.volume=musicLevel;
    if(musicFade.elapsed>=MUSIC_FADE_SECONDS)finishMusicFade();
  }
  function keepBirthdayMusic(){
    if(!soundOn||!music||!playedMusic.has('candle'))return;
    musicFade=null;musicSource='candle';music.loop=true;setMusicLevel(MUSIC_LEVEL,.25);musicNeedsResume=false;
    if(music.paused){try{const result=music.play();if(result&&result.catch)result.catch(()=>{musicNeedsResume=true;});}catch(_){musicNeedsResume=true;}}
  }
  function stopMusic(){musicToken++;musicFade=null;musicProbe=null;if(music){setMusicLevel(0);music.pause();music.loop=false;try{music.currentTime=0;}catch(_){}}musicSource=null;musicNeedsResume=false;}
  function blockMusic(){musicToken++;musicProbe=null;if(music)music.pause();playedMusic.delete(musicSource);musicNeedsResume=false;E.beginBirthday(state,musicSource);showToast(text.musicFailed,8);}
  function confirmPlayback(){
    if(!musicProbe||musicProbe.token!==musicToken||!soundOn||!music||music.paused||document.hidden||state.scene!=='house'||!['playing','birthday'].includes(state.mode))return;
    if(musicGain&&audio&&audio.state!=='running')return;
    // Require the media clock to move, not just a resolved play() promise.
    let progress=music.currentTime-musicProbe.time;
    if(progress<0&&music.loop&&Number.isFinite(music.duration))progress+=music.duration;
    if(progress>=.12){playedMusic.add(musicProbe.source);E.beginBirthday(state,musicProbe.source);musicProbe=null;}
  }
  function suspendMusic(){if(music&&!music.paused){music.pause();musicNeedsResume=true;}}
  function resumeMusic(){
    if(state.scene!=='house'||!['playing','birthday'].includes(state.mode))return;
    if(!soundOn||!musicNeedsResume||!music||!musicSource||music.ended||document.hidden)return;
    musicNeedsResume=false;
    if(state.reveal.status==='counting'){state.reveal.status='waiting';state.reveal.elapsed=0;state.reveal.wait=0;}
    playBirthday(musicSource);
  }
  function playBirthday(source){
    musicSource=source;
    // An explicit mute wins. Only the user's mute choice permits a silent reveal.
    if(!soundOn){E.beginBirthday(state,source);return;}
    // Candle interactions and note dismissal keep the existing room soundtrack running.
    if(music&&!music.paused&&!musicFade){if(playedMusic.has(source))E.beginBirthday(state,source);return;}
    playedMusic.delete(source);
    const token=++musicToken;
    const valid=()=>token===musicToken&&musicSource===source&&state.mode!=='title'&&state.scene==='house';
    const started=()=>{if(!valid()||!soundOn||document.hidden||state.mode==='paused'||(music&&music.paused))return;musicProbe={token,source,time:music.currentTime};};
    const failed=()=>{if(!valid())return;if(document.hidden||state.mode==='paused'){musicNeedsResume=true;return;}blockMusic();};
    try{
      if(!music){music=new window.Audio('./assets/happy-birthday.mp3');music.preload='auto';music.volume=MUSIC_LEVEL;connectMusicGain();}
      musicFade=null;music.loop=true;setMusicLevel(MUSIC_LEVEL,.25);musicNeedsResume=false;
      // Called directly from pointerdown/keydown/click, inside the user's activation.
      const result=music.play();if(result&&result.then)result.then(started).catch(failed);else started();
    }catch(_){failed();}
  }
  function toggleSound(){
    soundOn=!soundOn;ensureAudio();setSoundUI();
    if(!soundOn){pauseOutdoor();if(musicFade)finishMusicFade();else suspendMusic();musicProbe=null;if(audio)audio.suspend().catch(()=>{});if(['waiting','audioBlocked'].includes(state.reveal.status))E.beginBirthday(state,state.reveal.source);}
    else if(musicSource&&!playedMusic.has(musicSource)&&state.scene==='house'&&['playing','birthday'].includes(state.mode)){if(state.mode==='playing'&&['counting','audioBlocked'].includes(state.reveal.status)){state.reveal.status='waiting';state.reveal.elapsed=0;state.reveal.wait=0;}playBirthday(musicSource);}
    else{if(state.mode==='birthday')keepBirthdayMusic();else resumeMusic();playOutdoor();tone(523,.12,.018);}
  }
  function tone(freq,length=.14,volume=.025,delay=0){
    if(!soundOn||!audio||audio.state!=='running'||document.hidden)return;
    try{const t=audio.currentTime+delay,o=audio.createOscillator(),g=audio.createGain();o.type='sine';o.frequency.value=freq;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(volume,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+length);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+length+.02);o.onended=()=>{o.disconnect();g.disconnect();};}catch(_){}
  }
  function burst(x,y,n=14){if(reduced)return;for(let i=0;i<n;i++){const angle=i/n*Math.PI*2;const speed=13+(i%5)*7;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-19,size:i%3===0?2:1,color:['#edca86','#90aaa2','#d8b9ac'][i%3],life:1.2,max:1.2});}}
  function resetToastPlacement(){toastPlacement=null;$('toast').style.top='';$('toast').style.bottom='';$('toast').style.transform='';$('toast').dataset.outdoorOffset='0';}
  function hasOutdoorDialogue(){return toastAnchor&&toastAnchor.scene==='night'&&state.scene==='night'&&state.mode==='playing';}
  function showToast(copy,duration=4,memory=false){resetToastPlacement();dismissedPromptId=null;$('object-prompt').style.opacity='1';$('toast').classList.toggle('memory-toast',memory);$('toast').classList.remove('toast-fading');$('toast').style.opacity='1';toastAnchor=null;toastFade=0;toastCopy=copy;toastTime=duration;$('toast-en').textContent=copy[0];$('toast-zh').textContent=copy[1];$('toast-zh').hidden=!chinese;$('toast').hidden=false;}
  function hideToast(){if(toastAnchor&&toastAnchor.scene==='night')$('object-prompt').hidden=true;$('object-prompt').style.opacity='1';toastTime=0;toastCopy=null;toastAnchor=null;toastFade=0;$('toast').hidden=true;$('toast').style.opacity='1';$('toast').classList.remove('toast-fading');resetToastPlacement();}
  function showObjectDialogue(copy,id,memory=false){showToast(copy,0,memory);const object=E.OBJECTS.find(o=>o.id===id);if(object){toastAnchor={...object,scene:state.scene};if(object.auto)updateHUD();}positionOutdoorDialogue();}
  function updateFilmBoard(){
    const board=E.OBJECTS.find(o=>o.id==='filmBoard'),p=state.player;
    if(state.scene!=='night'){filmBoardInside=false;return;}
    // Reuse nearest's ground/proximity check. Rearm beyond the same departure
    // margin as the dialogue, so standing or hovering at its edge never loops.
    if(Math.abs(p.x+p.w/2-board.x)>board.reach+24||Math.abs(p.y+p.h-board.y)>70)filmBoardInside=false;
    if(!filmBoardInside&&E.nearest(state)?.id===board.id){filmBoardInside=true;showObjectDialogue(text.filmNote,board.id,true);}
  }
  function positionOutdoorDialogue(){
    const toast=$('toast');
    if(toast.hidden||!toastAnchor||toastAnchor.scene!=='night'||state.scene!=='night')return;
    const world=$('world').getBoundingClientRect();
    // Prompt visibility/camera changes must not reflow an already visible message.
    // Only a changed viewport size may resolve the existing responsive rules again.
    if(toastPlacement&&toastPlacement.width===world.width&&toastPlacement.height===world.height)return;
    resetToastPlacement();
    const box=toast.getBoundingClientRect();
    const viewportHeight=window.visualViewport&&window.visualViewport.height||window.innerHeight||world.height;
    const previous=Number(toast.dataset.outdoorOffset)||0;
    const top=box.top-previous,bottom=top+box.height;
    const gap=Math.max(8,world.height*.015);
    // Keep the upper messages above the ground band occupied by props. Desktop
    // messages already below that band may move only within their bottom margin.
    const sceneryTop=world.top+Math.max(0,view.height-118)/view.height*world.height;
    let room=world.top+world.height-gap-bottom;
    if(bottom<=sceneryTop)room=Math.min(room,sceneryTop-gap-bottom);
    else if(top<sceneryTop)room=0;
    const offset=Math.max(0,Math.min(viewportHeight*.09,room));
    // Snapshot the existing layout position without changing its initial offset.
    toast.style.top=(top-world.top)+'px';toast.style.bottom='auto';
    toast.dataset.outdoorOffset=String(offset);
    toast.style.transform=`translate(-50%, ${offset}px)`;
    toastPlacement={width:world.width,height:world.height};
  }
  function fadeToast(){if(!toastCopy||toastFade>0)return;toastFadeDuration=reduced?.15:.55;toastFade=toastFadeDuration;$('toast').classList.add('toast-fading');}
  function updateToast(dt){
    if(toastFade>0){toastFade=Math.max(0,toastFade-dt);$('toast').style.opacity=String(toastFade/toastFadeDuration);if(toastFade===0){if(hasOutdoorDialogue())dismissedPromptId=toastAnchor.id;hideToast();}return;}
    if(toastAnchor){
      const p=state.player;
      if(state.scene!==toastAnchor.scene||Math.abs(p.x+p.w/2-toastAnchor.x)>toastAnchor.reach+24||Math.abs(p.y+p.h-toastAnchor.y)>70)fadeToast();
    }else if(toastTime>0){
      toastTime-=dt;if(toastTime<=0){const guide=toastCopy===text.dark&&state.scene==='house'&&!state.house.candleLit;if(guide){hideToast();showToast(text.lightHint,5);}else fadeToast();}
    }
  }
  function start(){E.start(state);clearInput();ensureAudio();playOutdoor();syncUI();canvas.focus({preventScroll:true});}
  function openDialog(){oldFocus=document.activeElement;clearInput();hideToast();syncUI();$('dialog').focus({preventScroll:true});}
  function closeDialog(){
    const birthday=state.mode==='birthday';if(!birthday&&state.mode!=='paused')return;
    E.resume(state);clearInput();ensureAudio();
    resumeMusic();
    playOutdoor();syncUI();
    (birthday?canvas:oldFocus&&oldFocus.isConnected&&!oldFocus.closest('[hidden]')?oldFocus:canvas).focus({preventScroll:true});
  }
  function openPause(){if(state.mode!=='playing')return;E.pause(state);pauseOutdoor();if(!musicFade)suspendMusic();openDialog();}
  function doInteract(){if(state.mode!=='playing')return;ensureAudio();E.interact(state);events();updateHUD();}
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
    const playing=state.mode==='playing',modal=state.mode==='birthday'||state.mode==='paused',birthday=state.mode==='birthday',roomBirthday=birthday&&state.scene==='house';
    $('birthday-song').hidden=!birthday;
    $('title-layer').hidden=state.mode!=='title';$('dialog-layer').hidden=!modal;$('pause-button').hidden=state.mode==='title';
    $('star-counter').hidden=state.mode==='title';$('touch-controls').hidden=!playing;
    $('location').hidden=state.mode==='title'||modal;
    $('app').classList.toggle('is-playing',playing);
    $('dialog-layer').classList.toggle('room-birthday',roomBirthday);
    $('dialog').setAttribute('aria-modal','true');
    // Modal blocks every background control from pointer, keyboard and accessibility navigation.
    document.querySelector('.topbar').inert=modal;document.querySelector('.bottom-bar').inert=modal;
    $('world').inert=modal;canvas.inert=modal||state.mode==='title';
    if(modal){
      $('dialog-eyebrow').textContent=birthday?'A LITTLE SOMETHING FOR YOU':'A QUIET MOMENT';
      $('dialog-title').textContent=birthday?(config.birthdayTitle||'Happy Birthday! 🥳🎂'):'Take a little breath.';
      $('dialog-body').textContent=birthday?text.birthday[0]:'The night will be right here.';
      $('dialog-body-zh').textContent=birthday?text.birthday[1]:'夜色会一直在这里，等你继续散步。';
      $('dialog-body-zh').lang='zh-CN';$('dialog-body-zh').hidden=!chinese;
      $('birthday-actions').hidden=!birthday;$('pause-actions').hidden=birthday;
      $('optional-line').hidden=!birthday||!config.showGamingLine;$('optional-line').textContent=config.gamingLine||'';
      $('optional-line-zh').hidden=!birthday||!config.showGamingLine||!chinese;$('optional-line-zh').textContent=config.gamingLineZh||'';
    }
    syncLanguage();updateHUD();resize();
  }
  function updateHUD(){
    const count=E.countStars(state);if($('star-count').textContent!==String(count))$('star-count').textContent=String(count);
    $('star-counter').setAttribute('aria-label',`${count} of 5 stars / ${count} 颗星星，共 5 颗`);
    let target=state.mode==='playing'?E.nearest(state):null;
    if(target&&target.id==='candle'&&['waiting','counting','audioBlocked'].includes(state.reveal.status))target=null;
    const labels={bench:state.player.sitting?['Stand up','起身']:['Take a seat','坐一会儿'],box:state.boxOpen?['A little light','一点星光']:['Open the box','打开盒子'],sign:['Read','读一读'],house:['Step inside','进入小屋'],exit:['Step outside','离开小屋'],candle:state.house.candleLit?['Read the birthday note','阅读生日祝福']:['Looks like it could be lit…','似乎可以点燃…'],hkTerminal:['HK SERVER · ONE YEAR AGO','港服 · 一年前'],roundOne:['A quiet keepsake','一件安静的纪念物'],filmBoard:['A faded seaside poster','一张褪色的海边海报']};
    const prompt=$('object-prompt'),promptWasHidden=prompt.hidden,linked=hasOutdoorDialogue();
    if(dismissedPromptId&&(!target||target.id!==dismissedPromptId))dismissedPromptId=null;
    // Keep the matching prompt visible through the dialogue's existing departure
    // threshold and fade; control availability still follows the real target below.
    prompt.hidden=linked?false:!target||target.id===dismissedPromptId;
    prompt.style.opacity=linked?$('toast').style.opacity:'1';
    prompt.classList.toggle('auto-prompt',!!(linked?toastAnchor.auto:target&&target.auto));
    const promptTarget=linked&&(!target||target.id!==toastAnchor.id)?null:target;
    if(promptTarget){$('object-prompt-text').textContent=chinese?`${labels[promptTarget.id][0]} · ${labels[promptTarget.id][1]}`:labels[promptTarget.id][0];const world=$('world').getBoundingClientRect();const px=(promptTarget.x-state.camera+E.screenOffset(state,view.width))/view.width*world.width;const py=(promptTarget.y-(promptTarget.id==='candle'?92:49)+view.height-336)/view.height*world.height;const half=Math.min(world.width/2-10,(prompt.offsetWidth||200)/2+12);prompt.style.left=E.clamp(px,half,world.width-half)+'px';prompt.style.top=Math.max(45,py)+'px';}
    const actionable=target&&!target.auto;
    $('touch-interact').classList.toggle('available',!!actionable);$('touch-interact').setAttribute('aria-label',actionable?`${labels[target.id][0]} / ${labels[target.id][1]}`:'Interact / 互动');
    $('touch-interact').disabled=!actionable;
    const x=state.player.x;$('location-text').textContent=state.scene==='house'?(state.house.candleLit?'A LITTLE LIGHT':'A QUIET LITTLE ROOM'):x<670?'THE QUIET PATH':x<1140?'A FEW STEPPING STONES':x<1740?'LITTLE THINGS, ALONG THE WAY':'A QUIET LITTLE CLEARING';
    if(promptWasHidden!==prompt.hidden)positionOutdoorDialogue();
  }
  function events(){for(const ev of E.drainEvents(state)){
    if(ev.type==='start')showToast(text.start,3.5);
    if(ev.type==='bench')showObjectDialogue(text.bench,'bench');
    if(ev.type==='stand'&&(!toastAnchor||toastAnchor.id!=='bench'))hideToast();
    if(ev.type==='benchMemory')showObjectDialogue(text.benchMemory,'bench',true);
    if(ev.type==='hkTerminal'){if(toastCopy===text.hkMemory&&!toastFade)fadeToast();else showObjectDialogue(text.hkMemory,'hkTerminal',true);}
    if(ev.type==='roundOne'){if(toastCopy===text.roundMemory&&!toastFade)fadeToast();else{if(memorialPulse===0)memorialPulse=1.1;showObjectDialogue(text.roundMemory,'roundOne',true);}}
    if(ev.type==='sign')showObjectDialogue(text.sign,'sign');
    if(ev.type==='boxLocked')showObjectDialogue(text.boxLocked,'box');
    if(ev.type==='boxOpen'){showObjectDialogue(text.boxOpen,'box');burst(ev.x,ev.y,18);tone(440,.4);tone(660,.45,.025,.1);}
    if(ev.type==='boxAgain')showObjectDialogue(text.boxAgain,'box');
    if(ev.type==='star'){burst(ev.x,ev.y);tone(660+ev.count*55,.22);if(ev.count===1&&!toastAnchor)showToast(['A little light for the walk.','带一点星光，继续散步。'],3);}
    if(ev.type==='enterHouse'){memorialPulse=0;clearInput();particles=[];E.updateCamera(state,view.width,0,true);showToast(ev.lit?['The little light is still here.','这里的烛光还亮着。']:text.dark,4);syncUI();if(ev.lit){pauseOutdoor();playBirthday('candle');}else playOutdoor();}
    if(ev.type==='leaveHouse'){fadeOutMusic();playOutdoor();clearInput();hideToast();particles=[];E.updateCamera(state,view.width,0,true);syncUI();canvas.focus({preventScroll:true});}
    if(ev.type==='ignite'){pauseOutdoor();hideToast();playBirthday(ev.source);}
    if(ev.type==='audioTimeout')blockMusic();
    if(ev.type==='birthday'){keepBirthdayMusic();openDialog();}
  }}
  function resize(){const r=$('world').getBoundingClientRect();if(!r.width||!r.height)return;const scale=Math.max(1,Math.min(3,r.height/310,r.width/280));const width=Math.round(r.width/scale),height=Math.round(r.height/scale);if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;ctx.imageSmoothingEnabled=false;view={ctx,width,height};E.updateCamera(state,width,0,true);}positionOutdoorDialogue();}
  function frame(now){
    const dt=last?Math.min((now-last)/1000,.1):0;last=now;
    if(!document.hidden){updateMusicFade(dt);updateOutdoor(dt);confirmPlayback();accumulator+=dt;while(accumulator>=1/60){
      const input={left:held('left'),right:held('right'),jumpPressed:jumpQueued};jumpQueued=false;
      E.step(state,input,1/60);events();if(state.mode==='playing'){if(memorialPulse>0)memorialPulse=Math.max(0,memorialPulse-1/60);updateFilmBoard();updateToast(1/60);E.updateCamera(state,view.width,1/60,reduced);}
      if(state.mode==='playing'||state.mode==='birthday'){for(const p of particles){p.x+=p.vx/60;p.y+=p.vy/60;p.vy+=18/60;p.life-=1/60;}particles=particles.filter(p=>p.life>0);}
      accumulator-=1/60;
    }
    A.draw(state,view,{reduced,particles,memorialGlow:memorialPulse>0?Math.sin(Math.PI*(1-memorialPulse/1.1)):0});updateHUD();}
    window.requestAnimationFrame(frame);
  }
  function releasePointer(ev){const old=pointers.get(ev.pointerId);pointers.delete(ev.pointerId);if(old&&![...pointers.values()].some(p=>p.element===old.element))old.element.classList.remove('is-down');}
  document.querySelectorAll('[data-control]').forEach(button=>{
    button.addEventListener('pointerdown',ev=>{ev.preventDefault();if(state.mode!=='playing'||button.disabled)return;ensureAudio();const action=button.dataset.control;pointers.set(ev.pointerId,{action,element:button});button.classList.add('is-down');try{button.setPointerCapture(ev.pointerId);}catch(_){}if(action==='jump')jumpQueued=true;if(action==='interact')doInteract();});
    for(const type of ['pointerup','pointercancel','lostpointercapture'])button.addEventListener(type,releasePointer);
    button.addEventListener('contextmenu',ev=>ev.preventDefault());
    // Native keyboard/screen-reader activation also works without synthesizing touch.
    button.addEventListener('click',ev=>{if(ev.detail!==0||state.mode!=='playing')return;const action=button.dataset.control;if(action==='jump')jumpQueued=true;if(action==='interact')doInteract();if(action==='left'||action==='right'){E.step(state,{[action]:true},1/30);}});
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
    if(['KeyE','Enter'].includes(ev.code))doInteract();
  });
  window.addEventListener('keyup',ev=>{keys.delete(ev.code);});
  window.addEventListener('blur',()=>{outdoorAwaitGesture=true;pauseOutdoor();clearInput();if(state.mode==='playing')openPause();if(musicFade)finishMusicFade();else suspendMusic();});
  document.addEventListener('visibilitychange',()=>{clearInput();last=0;accumulator=0;if(document.hidden){outdoorAwaitGesture=true;pauseOutdoor();if(state.mode==='playing')openPause();if(musicFade)finishMusicFade();else suspendMusic();if(audio)audio.suspend().catch(()=>{});}});
  window.addEventListener('pagehide',()=>{outdoorAwaitGesture=true;pauseOutdoor();clearInput();if(musicFade)finishMusicFade();else suspendMusic();if(audio)audio.suspend().catch(()=>{});});
  window.addEventListener('resize',()=>{clearInput();resize();});if(window.visualViewport)window.visualViewport.addEventListener('resize',resize);
  if(window.ResizeObserver)new ResizeObserver(resize).observe($('world'));
  const motionQuery=window.matchMedia('(prefers-reduced-motion: reduce)');const motionChange=ev=>{reduced=ev.matches;if(reduced)particles=[];};if(motionQuery.addEventListener)motionQuery.addEventListener('change',motionChange);else if(motionQuery.addListener)motionQuery.addListener(motionChange);
  $('start-button').addEventListener('click',start);$('pause-button').addEventListener('click',()=>{if(state.mode==='birthday')closeDialog();else openPause();});$('home-button').addEventListener('click',ev=>{ev.preventDefault();if(state.mode==='birthday')closeDialog();else openPause();});
  $('resume-button').addEventListener('click',closeDialog);$('explore-button').addEventListener('click',closeDialog);$('dialog-close').addEventListener('click',closeDialog);
  $('night-button').addEventListener('click',()=>{if(state.mode!=='birthday'||state.scene!=='house')return;E.leaveHouse(state);events();});
  $('restart-button').addEventListener('click',()=>{reset();start();});
  $('sound-button').addEventListener('click',toggleSound);$('dialog-sound').addEventListener('click',toggleSound);
  $('language-button').addEventListener('click',()=>{chinese=!chinese;syncUI();});
  $('dialog-layer').addEventListener('keydown',ev=>{if(ev.code!=='Tab')return;const buttons=[...$('dialog').querySelectorAll('button,a,summary')].filter(b=>{const detail=b.closest('details');return !b.hidden&&!b.closest('[hidden]')&&(!detail||detail.open||b.tagName==='SUMMARY');});const first=buttons[0],end=buttons[buttons.length-1];if(ev.shiftKey&&(document.activeElement===first||document.activeElement===$('dialog'))){ev.preventDefault();end.focus();}else if(!ev.shiftKey&&(document.activeElement===end||document.activeElement===$('dialog'))){ev.preventDefault();first.focus();}});
  canvas.tabIndex=-1;$('toast-zh').lang='zh-CN';$('optional-line-zh').lang='zh-CN';setSoundUI();syncUI();requestAnimationFrame(frame);
})();
