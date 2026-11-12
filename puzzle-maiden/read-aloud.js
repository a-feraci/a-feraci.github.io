/* Browser narration, curated English voices, and optional continuous reading. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id),book=$('book'),button=$('readAloudButton');
  const synth=window.speechSynthesis,Utterance=window.SpeechSynthesisUtterance;
  const supported=Boolean(synth&&typeof synth.speak==='function'&&typeof Utterance==='function');
  const icon=button.innerHTML,voiceSelect=$('narrationVoice'),rateInput=$('narrationRate');
  let prefs={voice:'',rate:1,autoAdvance:false,allVoices:false};
  try{const saved=JSON.parse(localStorage.getItem('puzzle-maiden-narration')||'null');if(saved&&typeof saved==='object')prefs={...prefs,...saved};}catch{}
  if(typeof prefs.voice!=='string')prefs.voice='';
  prefs.rate=Math.max(.6,Math.min(1.4,Number(prefs.rate)||1));prefs.autoAdvance=prefs.autoAdvance===true;prefs.allVoices=prefs.allVoices===true;
  let voices=[],chunks=[],cursor=0,state='idle',generation=0,utterance=null,highlight=null;
  let timer=null,waitingFor=null,preview=false;
  const storytellers=['Samantha','Daniel','Ava','Alex','Moira','Karen','Tessa','Allison','Serena','Susan','Tom','Oliver','Victoria','Rishi','Aria','Jenny','Guy','Sonia','Ryan','Libby','Emma','Andrew','Brian','Michelle'];
  const english=v=>/^en(?:[-_]|$)/i.test(v.lang);
  const novelty=v=>/\b(Albert|Bad News|Bahh|Bells|Boing|Bubbles|Cellos|Good News|Jester|Organ|Trinoids|Whisper|Wobble|Zarvox)\b/i.test(v.name);
  const enhanced=v=>/natural|neural|enhanced|premium/i.test(v.name);
  const familiar=v=>storytellers.some(n=>v.name.toLowerCase().includes(n.toLowerCase()));
  const rank=v=>!english(v)?4:novelty(v)?5:enhanced(v)?0:familiar(v)?1:2;
  const store=()=>{try{localStorage.setItem('puzzle-maiden-narration',JSON.stringify(prefs));}catch{}};
  const clean=text=>String(text||'').replace(/[✧❦✦☾]/g,'').replace(/\bPART (IV|III|II|I|V)\b/gi,(_,n)=>'Part '+({I:1,II:2,III:3,IV:4,V:5}[n.toUpperCase()])).replace(/\s+/g,' ').trim();
  function selectedVoice(){return voices.find(v=>v.voiceURI===prefs.voice)||voices.find(v=>english(v)&&!novelty(v))||voices.find(english);}
  function cancelTimer(){if(timer!==null)clearTimeout(timer);timer=null;}
  function clearHighlight(){highlight?.classList.remove('is-speaking');highlight=null;}
  function sync(message){
    const active=state!=='idle';
    button.innerHTML=active?'<span aria-hidden="true">■</span>':icon;button.setAttribute('aria-pressed',String(active));
    const label=!supported?'Read aloud is unavailable in this browser':active?'Stop reading aloud':window.matchMedia('(max-width:900px)').matches?'Read this page aloud':'Read this spread aloud';
    button.setAttribute('aria-label',label);button.title=label;
    $('narrationPlay').disabled=!supported||active;$('narrationPlay').textContent=prefs.autoAdvance?'Start continuous reading':window.matchMedia('(max-width:900px)').matches?'Read this page':'Read this spread';
    $('narrationPause').disabled=!supported||!active;$('narrationPause').textContent=state==='paused'?'Resume':'Pause';$('narrationStop').disabled=!supported||!active;
    $('narrationAutoAdvance').checked=prefs.autoAdvance;$('narrationAllVoices').checked=prefs.allVoices;
    window.Reader?.setNarrating(state==='reading');
    if(message)$('narrationStatus').textContent=message;
  }
  function stop(message='Reading stopped.'){
    ++generation;cancelTimer();waitingFor=null;state='idle';utterance=null;chunks=[];cursor=0;preview=false;clearHighlight();
    if(supported)synth.cancel();sync(message);
  }
  function fail(message){stop(message);$('narrationNotice').textContent=message;$('narrationNotice').hidden=false;}
  function loadVoices(){
    if(!supported)return;
    try{voices=[...synth.getVoices()];}catch{voices=[];}
    voices.sort((a,b)=>rank(a)-rank(b)||(rank(a)===1?storytellers.findIndex(n=>a.name.includes(n))-storytellers.findIndex(n=>b.name.includes(n)):0)||a.name.localeCompare(b.name));
    const best=voices.find(v=>english(v)&&!novelty(v));
    voiceSelect.replaceChildren(new Option('Automatic English'+(best?' · '+best.name:''),''));
    const visible=voices.filter(v=>prefs.allVoices||(english(v)&&!novelty(v))||v.voiceURI===prefs.voice);
    visible.forEach(v=>voiceSelect.add(new Option(v.name+' · '+v.lang+(v.localService===false?' · online':''),v.voiceURI)));
    voiceSelect.value=voices.some(v=>v.voiceURI===prefs.voice)?prefs.voice:'';
  }
  // Keep each speech request short enough for engines that cut off long utterances.
  function split(text){
    let remaining=clean(text);const out=[];
    while(remaining.length>220){
      const head=remaining.slice(0,220),sentence=Math.max(head.lastIndexOf('. '),head.lastIndexOf('? '),head.lastIndexOf('! '));
      const at=sentence>70?sentence+1:(head.lastIndexOf(' ')>0?head.lastIndexOf(' '):head.length);
      out.push(remaining.slice(0,at).trim());remaining=remaining.slice(at).trim();
    }
    if(remaining)out.push(remaining);return out;
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
    if(node===highlight)return;clearHighlight();if(!node)return;highlight=node;node.classList.add('is-speaking');
    const scroller=node.closest('.prose,.toc-on-page');if(!scroller)return;
    const item=node.getBoundingClientRect(),area=scroller.getBoundingClientRect();if(item.top<area.top||item.bottom>area.bottom)scroller.scrollTop+=item.top-area.top-8;
  }
  function finished(){return 'Finished this '+(window.matchMedia('(max-width:900px)').matches?'page':'spread')+'.';}
  function queue(kind,delay){
    cancelTimer();waitingFor=kind;const token=generation;
    timer=setTimeout(()=>{
      timer=null;if(token!==generation||state!=='reading')return;waitingFor=null;
      if(kind==='speak'){speakNext(token);return;}
      if(!prefs.autoAdvance){stop(finished());return;}
      if(!window.BookNavigation?.nextForNarration())stop('You have reached the end of the book.');
    },delay);
  }
  function speakNext(token){
    if(token!==generation||state!=='reading')return;
    if(cursor>=chunks.length){
      if(preview){stop('Voice preview finished.');return;}
      if(prefs.autoAdvance&&window.BookNavigation){clearHighlight();sync('Turning the page. Continuous reading is on.');queue('turn',650);}
      else stop(finished()+' Tap the speaker to read the next page.');
      return;
    }
    const chunk=chunks[cursor];utterance=new Utterance(chunk.text);utterance.rate=prefs.rate;utterance.lang='en-US';
    const voice=selectedVoice();if(voice){utterance.voice=voice;utterance.lang=voice.lang;}
    utterance.onstart=()=>{if(token===generation)follow(chunk.node);};
    utterance.onend=()=>{if(token!==generation)return;utterance=null;++cursor;speakNext(token);};
    utterance.onerror=e=>{if(token!==generation)return;fail(e.error==='not-allowed'?'Your browser could not continue the voice. Tap the speaker to resume, or try another voice.':'Read aloud could not play this voice. Choose another voice in settings and try again.');};
    try{synth.speak(utterance);}catch{fail('Read aloud could not start. Choose another voice in settings and try again.');}
  }
  function start(sample=false){
    if(!supported)return;stop('');$('narrationNotice').hidden=true;loadVoices();preview=sample;
    chunks=sample?split('In the enchanted country of Eldermere lived a maiden whose mind could find a road between the stars.').map(text=>({text,node:null})):collect();
    if(!chunks.length){sync('There is no text to read on this page.');return;}
    state='reading';cursor=0;synth.resume();sync(sample?'Previewing this voice.':prefs.autoAdvance?'Continuous reading is on. Press Stop or turn a page yourself to stop.':'Reading aloud. Use Pause and Stop here.');speakNext(generation);
  }
  function pause(){
    if(state==='idle')return;
    if(state==='reading'){cancelTimer();state='paused';synth.pause();sync('Reading paused. Press Resume to continue.');}
    else{state='reading';synth.resume();sync('Reading aloud.');if(waitingFor)queue(waitingFor,600);else if(!utterance)speakNext(generation);}
  }
  function updatePreferences(){
    store();rateInput.value=prefs.rate;$('narrationRateValue').textContent=prefs.rate+'×';if(state==='idle')return;
    const pending=waitingFor;cancelTimer();++generation;utterance=null;synth.cancel();
    if(state==='reading'){if(pending)queue(pending,600);else{synth.resume();speakNext(generation);}}
  }
  button.onclick=()=>state==='idle'?start():stop();$('narrationPlay').onclick=()=>{start();if(state==='reading')$('settingsDialog').close();};
  $('narrationPause').onclick=pause;$('narrationStop').onclick=()=>stop();$('narrationPreview').onclick=()=>start(true);
  $('refreshNarrationVoices').onclick=()=>{loadVoices();sync('Voice list refreshed. New system voices appear only when this browser exposes them.');};
  $('narrationAllVoices').onchange=()=>{prefs.allVoices=$('narrationAllVoices').checked;store();loadVoices();};
  $('narrationAutoAdvance').onchange=()=>{prefs.autoAdvance=$('narrationAutoAdvance').checked;store();if(!prefs.autoAdvance&&waitingFor==='turn')stop(finished());else sync(prefs.autoAdvance?'Automatic page turns are on.':'Automatic page turns are off. The current page will finish.');};
  voiceSelect.onchange=()=>{prefs.voice=voiceSelect.value;updatePreferences();};
  rateInput.oninput=()=>{prefs.rate=Math.max(.6,Math.min(1.4,Number(rateInput.value)||1));updatePreferences();};
  window.ReadAloud={pageChanged({automatic=false}={}){
    if(automatic&&state!=='idle'&&prefs.autoAdvance&&!preview){
      cancelTimer();++generation;synth.cancel();utterance=null;clearHighlight();chunks=collect();cursor=0;waitingFor='speak';
      if(state==='reading')queue('speak',600);sync('Continuous reading.');
    }else if(state!=='idle')stop('Page changed. Tap the speaker to read this page.');else sync();
    $('narrationNotice').hidden=true;
  },reset(){stop('Ready to read.');prefs={voice:'',rate:1,autoAdvance:false,allVoices:false};loadVoices();updatePreferences();sync();}};
  window.addEventListener('pagehide',()=>stop());
  if(supported){synth.addEventListener('voiceschanged',loadVoices);loadVoices();}
  else{
    button.disabled=true;voiceSelect.disabled=true;rateInput.disabled=true;$('narrationPreview').disabled=true;$('refreshNarrationVoices').disabled=true;$('narrationAutoAdvance').disabled=true;$('narrationAllVoices').disabled=true;
    $('readAloudHelp').textContent='This browser does not offer text-to-speech. Open the book in a browser with read-aloud support to listen.';
  }
  rateInput.value=prefs.rate;$('narrationRateValue').textContent=prefs.rate+'×';
  sync(supported?'Ready to read. English narrators are shown first.':'Read aloud is unavailable in this browser.');
})();
