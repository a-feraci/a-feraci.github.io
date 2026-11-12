/* Original chapter music. Selection is saved; playback always needs a reader's tap. */
(() => {
  'use strict';
  const tracks=[
  {
    "id": "moonlit-garden",
    "title": "Moonlit Garden",
    "part": "",
    "mood": "Prologue · harp, bells & starlight",
    "file": "moonlit-garden.wav",
    "duration": 53
  },
  {
    "id": "first-click",
    "title": "The First Click",
    "part": "I",
    "mood": "Wonder · harp & music box",
    "file": "music/first-click.mp3",
    "duration": 74
  },
  {
    "id": "midnight-threads",
    "title": "Threads at Midnight",
    "part": "II",
    "mood": "Mystery · celesta & quiet clockwork",
    "file": "music/midnight-threads.mp3",
    "duration": 70
  },
  {
    "id": "wound-and-dust",
    "title": "The Wound and the Dust",
    "part": "III",
    "mood": "Sorrow · low strings & distant flute",
    "file": "music/wound-and-dust.mp3",
    "duration": 93
  },
  {
    "id": "dance-of-distance",
    "title": "The Dance of Distance",
    "part": "IV",
    "mood": "Longing · a turning harp waltz",
    "file": "music/dance-of-distance.mp3",
    "duration": 65
  },
  {
    "id": "pieces-that-were-hers",
    "title": "The Pieces That Were Hers",
    "part": "V",
    "mood": "Resolve · warm harp & dawn flute",
    "file": "music/pieces-that-were-hers.mp3",
    "duration": 76
  }
];
  const $=id=>document.getElementById(id),music=$('fairytaleMusic');
  const byId=new Map(tracks.map(t=>[t.id,t]));
  const help='Follow the story changes the music with each part. Choose a track to loop it, or listen to the playlist in order. Music starts only when you press Play.';
  let prefs={mode:'story',track:'moonlit-garden'};
  try{const saved=JSON.parse(localStorage.getItem('puzzle-maiden-music')||'null');if(saved&&typeof saved==='object')prefs={...prefs,...saved};}catch{}
  if(!['story','playlist','track'].includes(prefs.mode))prefs.mode='story';
  if(!byId.has(prefs.track))prefs.track='moonlit-garden';
  let chapter='',wanted=false,generation=0;
  const store=()=>{try{localStorage.setItem('puzzle-maiden-music',JSON.stringify({mode:prefs.mode,track:prefs.track}));}catch{}};
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const duration=n=>Math.floor(n/60)+':'+String(n%60).padStart(2,'0');
  const storyTrack=()=>tracks.find(t=>t.part===chapter.toUpperCase())?.id||'moonlit-garden';
  $('musicPlaylist').innerHTML=tracks.map((t,n)=>`<button type="button" data-track="${t.id}" aria-pressed="false"><span class="track-symbol" aria-hidden="true">${n?'✧':'☾'}</span><span><strong>${esc(t.title)}</strong><small>${t.part?'Part '+t.part+' · ':''}${esc(t.mood)}</small></span><time>${duration(t.duration)}</time></button>`).join('');
  function sync(){
    const track=byId.get(prefs.track),playing=wanted&&!music.paused;
    $('musicMode').value=prefs.mode;
    $('musicButton').setAttribute('aria-pressed',String(wanted));
    $('musicButton').setAttribute('aria-label',wanted?'Pause fairytale music':'Play fairytale music');
    $('musicButton').title=(wanted?'Pause':'Play')+' · '+track.title;
    $('musicPlayPause').textContent=wanted?'Pause music':'Play music';
    $('musicNowPlaying').textContent=(playing?'Playing':wanted?'Loading':'Ready')+' · '+track.title;
    $('musicPlaylist').querySelectorAll('[data-track]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.track===prefs.track)));
  }
  async function play(token){
    try{await music.play();if(!wanted)music.pause();if(token===generation)sync();}
    catch{if(token!==generation||!wanted)return;wanted=false;const note='Music could not start. Tap Play to try again, or choose another track.';$('musicHelp').textContent=note;$('audioStatus').textContent=note;sync();}
  }
  function choose(id){
    if(!byId.has(id))return;
    const change=prefs.track!==id;
    prefs.track=id;music.loop=prefs.mode!=='playlist';store();$('musicHelp').textContent=help;
    if(change){
      ++generation;music.pause();music.src='assets/'+byId.get(id).file;music.load();
      if(wanted)play(generation);
    }
    sync();
  }
  function toggle(){
    ++generation;
    if(wanted){wanted=false;music.pause();}
    else{wanted=true;$('musicHelp').textContent=help;play(generation);}
    sync();
  }
  function step(direction){
    if(prefs.mode==='story')prefs.mode='playlist';
    const index=tracks.findIndex(t=>t.id===prefs.track);
    choose(tracks[(index+direction+tracks.length)%tracks.length].id);
  }
  $('musicButton').onclick=toggle;$('musicPlayPause').onclick=toggle;
  $('musicPrevious').onclick=()=>step(-1);$('musicNext').onclick=()=>step(1);
  $('musicMode').onchange=()=>{prefs.mode=$('musicMode').value;choose(prefs.mode==='story'?storyTrack():prefs.track);};
  $('musicPlaylist').onclick=e=>{const b=e.target.closest('[data-track]');if(!b||!byId.has(b.dataset.track))return;prefs.mode='track';choose(b.dataset.track);};
  music.addEventListener('play',()=>{if(!wanted){music.pause();return;}sync();});
  music.addEventListener('pause',sync);
  music.addEventListener('ended',()=>{if(!wanted)return;if(prefs.mode==='playlist')step(1);else{music.currentTime=0;play(generation);}});
  music.addEventListener('error',()=>{++generation;wanted=false;const note='This track could not load. Choose another track or press Play to try again.';$('audioStatus').textContent=note;$('musicHelp').textContent=note;sync();});
  window.BookMusic={pageChanged(part){chapter=String(part||'');if(prefs.mode==='story'&&storyTrack()!==prefs.track)choose(storyTrack());},reset(){++generation;wanted=false;music.pause();prefs={mode:'story',track:prefs.track};choose(storyTrack());}};
  window.addEventListener('pagehide',()=>{++generation;wanted=false;music.pause();sync();});
  music.src='assets/'+byId.get(prefs.track).file;music.loop=prefs.mode!=='playlist';sync();
})();
