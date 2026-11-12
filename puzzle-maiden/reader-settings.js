/* Reader preferences and original fairytale atmosphere. No account or tracking. */
(() => {
  'use strict';
  const defaults={theme:'candlelight',size:20,font:'storybook',ink:'#432b33',paper:'#f7e3bf',sound:true,animation:!matchMedia('(prefers-reduced-motion: reduce)').matches,volume:30};
  const palettes={candlelight:['#f7e3bf','#432b33','none'],daylight:['#fffaf0','#302e35','brightness(1.12) saturate(.65)'],midnight:['#252538','#e7dfd3','brightness(.44) saturate(.65)'],rose:['#f5dfe3','#513347','sepia(.15) hue-rotate(315deg) saturate(.75)'],sage:['#dfe8d6','#304334','sepia(.3) hue-rotate(42deg) saturate(.65)'],lavender:['#e9e1f3','#40334f','sepia(.15) hue-rotate(225deg) saturate(.65)']};
  const fonts={storybook:"'Cormorant Garamond',Georgia,serif",oldbook:"'IM Fell English',Georgia,serif",georgia:'Georgia,serif',palatino:"Palatino,'Palatino Linotype',serif",sans:'system-ui,-apple-system,BlinkMacSystemFont,sans-serif'};
  let prefs={...defaults};try{const saved=JSON.parse(localStorage.getItem('puzzle-maiden-settings')||'null');if(saved&&typeof saved==='object')prefs={...defaults,...saved};}catch{}
  if(!palettes[prefs.theme]&&prefs.theme!=='custom')prefs.theme='candlelight';
  if(!fonts[prefs.font])prefs.font='storybook';
  for(const key of ['ink','paper'])if(!/^#[0-9a-f]{6}$/i.test(prefs[key]))prefs[key]=defaults[key];
  prefs.size=Math.max(16,Math.min(32,Number(prefs.size)||20));prefs.volume=Math.max(0,Math.min(100,Number(prefs.volume)||0));
  const $=id=>document.getElementById(id),dialog=$('settingsDialog'),music=$('fairytaleMusic');let lastLight=palettes[prefs.theme]&&prefs.theme!=='midnight'?prefs.theme:'candlelight';
  const store=()=>{try{localStorage.setItem('puzzle-maiden-settings',JSON.stringify(prefs));}catch{}};
  function apply(){
    const style=document.documentElement.style;style.setProperty('--body-size',prefs.size+'px');style.setProperty('--reader-font',fonts[prefs.font]);style.setProperty('--paper',prefs.paper);style.setProperty('--ink',prefs.ink);style.setProperty('--page-filter',palettes[prefs.theme]?.[2]||'saturate(.65)');
    $('textSize').value=prefs.size;$('textSizeValue').textContent=prefs.size+' px';$('textFont').value=prefs.font;$('textColor').value=prefs.ink;$('paperColor').value=prefs.paper;$('turnSound').checked=prefs.sound;$('turnAnimation').checked=prefs.animation;$('musicVolume').value=prefs.volume;$('musicVolumeValue').textContent=prefs.volume+'%';music.volume=prefs.volume/100;
    $('themeChoices').querySelectorAll('button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===prefs.theme)));
    const dark=prefs.theme==='midnight';$('dayNight').textContent=dark?'☀':'☾';$('dayNight').setAttribute('aria-pressed',String(dark));$('dayNight').setAttribute('aria-label',dark?'Switch to day mode':'Switch to night mode');store();
  }
  function theme(name){if(!palettes[name])return;[prefs.paper,prefs.ink]=palettes[name];prefs.theme=name;if(name!=='midnight')lastLight=name;apply();}
  $('settingsButton').onclick=()=>dialog.showModal();$('closeSettings').onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog&&e.offsetX<0)dialog.close();});
  $('themeChoices').onclick=e=>{const b=e.target.closest('[data-theme]');if(b)theme(b.dataset.theme);};
  $('dayNight').onclick=()=>theme(prefs.theme==='midnight'?lastLight:'midnight');
  $('textSize').oninput=e=>{prefs.size=Number(e.target.value);apply();};$('textFont').onchange=e=>{prefs.font=e.target.value;apply();};
  $('textColor').oninput=e=>{prefs.ink=e.target.value;prefs.theme='custom';apply();};
  $('paperColor').oninput=e=>{prefs.paper=e.target.value;prefs.theme='custom';apply();};
  $('turnSound').onchange=e=>{prefs.sound=e.target.checked;apply();};$('turnAnimation').onchange=e=>{prefs.animation=e.target.checked;apply();};$('musicVolume').oninput=e=>{prefs.volume=Number(e.target.value);apply();};
  $('resetSettings').onclick=()=>{prefs={...defaults};lastLight='candlelight';apply();};
  function musicState(playing){$('musicButton').setAttribute('aria-pressed',String(playing));$('musicButton').setAttribute('aria-label',playing?'Pause fairytale music':'Play fairytale music');}
  $('musicButton').onclick=async()=>{if(!music.paused){music.pause();return;}try{await music.play();}catch{$('audioStatus').textContent='Music could not start. Press the music button to try again.';musicState(false);}};
  music.addEventListener('play',()=>musicState(true));music.addEventListener('pause',()=>musicState(false));music.addEventListener('error',()=>{$('audioStatus').textContent='Music is temporarily unavailable.';musicState(false);});
  let curlTimer;
  window.Reader={turn(direction){
    if(prefs.sound){const audio=$('pageSound');audio.volume=.28;audio.currentTime=0;const playing=audio.play();if(playing)playing.catch(()=>{});}
    const shell=$('bookShell');clearTimeout(curlTimer);shell.classList.remove('turn-forward','turn-back');
    if(prefs.animation&&!matchMedia('(prefers-reduced-motion: reduce)').matches){void shell.offsetWidth;shell.classList.add(direction>=0?'turn-forward':'turn-back');curlTimer=setTimeout(()=>shell.classList.remove('turn-forward','turn-back'),550);}
  }};
  apply();
})();
