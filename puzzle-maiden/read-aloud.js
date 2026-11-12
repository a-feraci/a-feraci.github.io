/* Browser-provided narration. Playback starts only after a reader presses Play. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),book=$('book'),button=$('readAloudButton');
  const synth=window.speechSynthesis,Utterance=window.SpeechSynthesisUtterance;
  const supported=Boolean(synth&&typeof synth.speak==='function'&&typeof Utterance==='function');
  const icon=button.innerHTML,voiceSelect=$('narrationVoice'),rateInput=$('narrationRate');
  let prefs={voice:'',rate:1};
  try{const saved=JSON.parse(localStorage.getItem('puzzle-maiden-narration')||'null');if(saved&&typeof saved==='object')prefs={...prefs,...saved};}catch{}
  if(typeof prefs.voice!=='string')prefs.voice='';
  prefs.rate=Math.max(.6,Math.min(1.4,Number(prefs.rate)||1));
  let voices=[],chunks=[],cursor=0,state='idle',generation=0,utterance=null,highlight=null;
  const store=()=>{try{localStorage.setItem('puzzle-maiden-narration',JSON.stringify(prefs));}catch{}};
  const clean=text=>String(text||'').replace(/[✧❦✦☾]/g,'').replace(/\bPART (IV|III|II|I|V)\b/gi,(_,n)=>'Part '+({I:1,II:2,III:3,IV:4,V:5}[n.toUpperCase()])).replace(/\s+/g,' ').trim();
  function clearHighlight(){highlight?.classList.remove('is-speaking');highlight=null;}
  function sync(message){
    const active=state!=='idle';
    button.innerHTML=active?'<span aria-hidden="true">■</span>':icon;
    button.setAttribute('aria-pressed',String(active));
    const label=!supported?'Read aloud is unavailable in this browser':active?'Stop reading aloud':window.matchMedia('(max-width:900px)').matches?'Read this page aloud':'Read this spread aloud';
    button.setAttribute('aria-label',label);button.title=label;
    $('narrationPlay').disabled=!supported||active;
    $('narrationPlay').textContent=window.matchMedia('(max-width:900px)').matches?'Read this page':'Read this spread';
    $('narrationPause').disabled=!supported||!active;
    $('narrationPause').textContent=state==='paused'?'Resume':'Pause';
    $('narrationStop').disabled=!supported||!active;
    window.Reader?.setNarrating(state==='reading');
    if(message)$('narrationStatus').textContent=message;
  }
  function stop(message='Reading stopped.'){
    ++generation;state='idle';utterance=null;chunks=[];cursor=0;clearHighlight();
    if(supported)synth.cancel();
    sync(message);
  }
  function fail(message){stop(message);$('narrationNotice').textContent=message;$('narrationNotice').hidden=false;}
  function loadVoices(){
    if(!supported)return;
    try{voices=synth.getVoices();}catch{voices=[];}
    voices=[...voices].sort((a,b)=>Number(/^en\b/i.test(b.lang))-Number(/^en\b/i.test(a.lang))||a.name.localeCompare(b.name));
    voiceSelect.replaceChildren(new Option('Automatic English voice',''));
    voices.forEach(v=>voiceSelect.add(new Option(v.name+' · '+v.lang,v.voiceURI)));
    voiceSelect.value=voices.some(v=>v.voiceURI===prefs.voice)?prefs.voice:'';
  }
  // Short utterances avoid the long uninterrupted requests some speech engines cut off.
  function split(text){
    let remaining=clean(text);const out=[];
    while(remaining.length>220){
      const head=remaining.slice(0,220),sentence=Math.max(head.lastIndexOf('. '),head.lastIndexOf('? '),head.lastIndexOf('! '));
      const at=sentence>70?sentence+1:(head.lastIndexOf(' ')>0?head.lastIndexOf(' '):head.length);
      out.push(remaining.slice(0,at).trim());remaining=remaining.slice(at).trim();
    }
    if(remaining)out.push(remaining);
    return out;
  }
  function collect(){
    const out=[];
    for(const page of book.querySelectorAll('.page,.cover-page')){
      if(page.dataset.readAloud){out.push(...split(page.dataset.readAloud).map(text=>({text,node:null})));continue;}
      const heading=page.querySelector('.page-title,.page-top');
      if(heading)out.push(...split(heading.textContent).map(text=>({text,node:null})));
      for(const node of page.querySelectorAll('.prose p,.toc-list button'))out.push(...split(node.innerText||node.textContent).map(text=>({text,node})));
    }
    return out;
  }
  function follow(node){
    if(node===highlight)return;
    clearHighlight();if(!node)return;
    highlight=node;node.classList.add('is-speaking');
    const scroller=node.closest('.prose,.toc-on-page');if(!scroller)return;
    const item=node.getBoundingClientRect(),area=scroller.getBoundingClientRect();
    if(item.top<area.top||item.bottom>area.bottom)scroller.scrollTop+=item.top-area.top-8;
  }
  function speakNext(token){
    if(token!==generation||state!=='reading')return;
    if(cursor>=chunks.length){stop('Finished this '+(window.matchMedia('(max-width:900px)').matches?'page':'spread')+'. Turn the page and tap the speaker to continue.');return;}
    const chunk=chunks[cursor];
    utterance=new Utterance(chunk.text);utterance.rate=prefs.rate;utterance.lang='en-US';
    const voice=voices.find(v=>v.voiceURI===prefs.voice)||voices.find(v=>/^en\b/i.test(v.lang)&&v.default)||voices.find(v=>/^en\b/i.test(v.lang));
    if(voice){utterance.voice=voice;utterance.lang=voice.lang;}
    utterance.onstart=()=>{if(token===generation)follow(chunk.node);};
    utterance.onend=()=>{if(token!==generation)return;utterance=null;++cursor;speakNext(token);};
    utterance.onerror=e=>{if(token!==generation)return;fail(e.error==='not-allowed'?'Your browser could not start the voice. Tap the speaker again, or try another voice in settings.':'Read aloud could not play this voice. Choose another voice in settings and try again.');};
    try{synth.speak(utterance);}catch{fail('Read aloud could not start. Choose another voice in settings and try again.');}
  }
  function start(){
    if(!supported)return;
    stop('');$('narrationNotice').hidden=true;loadVoices();chunks=collect();
    if(!chunks.length){sync('There is no text to read on this page.');return;}
    state='reading';cursor=0;synth.resume();sync('Reading aloud. Turn the page to stop, or use Pause and Stop here.');speakNext(generation);
  }
  function pause(){
    if(state==='idle')return;
    if(state==='reading'){state='paused';synth.pause();sync('Reading paused. Press Resume to continue.');}
    else{state='reading';synth.resume();sync('Reading aloud.');if(!utterance)speakNext(generation);}
  }
  function updatePreferences(){
    store();rateInput.value=prefs.rate;$('narrationRateValue').textContent=prefs.rate+'×';
    if(state==='idle')return;
    // Recreate the current short passage so a new voice/speed takes effect immediately.
    ++generation;utterance=null;synth.cancel();
    if(state==='reading'){synth.resume();speakNext(generation);}
  }
  button.onclick=()=>state==='idle'?start():stop();
  $('narrationPlay').onclick=()=>{start();if(state==='reading')$('settingsDialog').close();};
  $('narrationPause').onclick=pause;$('narrationStop').onclick=()=>stop();
  voiceSelect.onchange=()=>{prefs.voice=voiceSelect.value;updatePreferences();};
  rateInput.oninput=()=>{prefs.rate=Math.max(.6,Math.min(1.4,Number(rateInput.value)||1));updatePreferences();};
  window.ReadAloud={pageChanged(){if(state!=='idle')stop('Page changed. Tap the speaker to read this page.');else sync();$('narrationNotice').hidden=true;},reset(){stop('Ready to read. Voice choices depend on your device.');prefs={voice:'',rate:1};loadVoices();updatePreferences();}};
  window.addEventListener('pagehide',()=>stop());
  if(supported){synth.addEventListener('voiceschanged',loadVoices);loadVoices();}
  else{
    button.disabled=true;button.title='Read aloud is unavailable in this browser';voiceSelect.disabled=true;rateInput.disabled=true;
    $('readAloudHelp').textContent='This browser does not offer text-to-speech. Open the book in a browser with read-aloud support to listen.';
  }
  rateInput.value=prefs.rate;$('narrationRateValue').textContent=prefs.rate+'×';
  sync(supported?'Ready to read. Voice choices depend on your device.':'Read aloud is unavailable in this browser.');
})();
