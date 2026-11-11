(() => {
  'use strict';
  const BOOK=window.BOOK;
  const root=document.getElementById('book'),shell=document.getElementById('bookShell');
  const previous=document.getElementById('previous'),next=document.getElementById('next');
  const chapterLabel=document.getElementById('chapterLabel'), locationLabel=document.getElementById('locationLabel'), pageCount=document.getElementById('pageCount'),progressFill=document.getElementById('progressFill');
  const drawer=document.getElementById('contentsDrawer'),veil=document.getElementById('veil');
  const pages=[];
  pages.push({type:'cover',title:'Cover',id:'cover'});
  pages.push({type:'frontispiece',title:'The tale begins',id:'frontispiece'});
  pages.push({type:'toc',title:'Table of Contents',id:'contents'});
  const pageMap=new Map();
  const maxPageChars=980;
  function splitParagraphs(body){
    const blocks=body.trim().split(/\n\s*\n/).map(p=>p.trim()).filter(Boolean);
    const paragraphs=[];
    for(const b of blocks){
      if(b==='---'){paragraphs.push(b);continue;}
      if(b.length<maxPageChars){paragraphs.push(b);continue;}
      const sentences=b.match(/[^.!?]+(?:[.!?]+|$)/g)||[b];
      let cur='';
      for(const s of sentences){if(cur && cur.length+s.length>800){paragraphs.push(cur.trim());cur='';}cur+=s;}
      if(cur.trim())paragraphs.push(cur.trim());
    }
    return paragraphs;
  }
  function groupBlocks(body){
    const paragraphs=splitParagraphs(body), out=[];
    let cur=[], len=0;
    for(const block of paragraphs){
      if(block==='---'){
        if(cur.length){out.push(cur);cur=[];len=0;}continue;
      }
      if(cur.length && len+block.length>maxPageChars){out.push(cur);cur=[];len=0;}
      cur.push(block);len+=block.length;
    }
    if(cur.length)out.push(cur);
    return out;
  }
  for(const chapter of BOOK.chapters){
    pageMap.set(chapter.id,pages.length);
    pages.push({type:'chapter-art',chapter:chapter.id,number:chapter.number,title:chapter.title,image:chapter.art});
    const addText=(body)=>{const chunks=groupBlocks(body);chunks.forEach((blocks,n)=>pages.push({type:'text',chapter:chapter.id,number:chapter.number,title:chapter.title,blocks,part:n+1,of:chunks.length}));};
    if(chapter.id!=='v'){addText(chapter.body);continue;}
    // Preserve the exact finale order at the narrative moments where each symbol resolves.
    const anchors=[
      'After all this time, the Knight could still describe the house perfectly. He simply had not built toward it.',
      'She studied the translucent pieces. “I have stopped believing the dream belongs to only one possible story.”',
      'Something better. Understanding herself.'
    ];
    let remainder=chapter.body;
    for(let fidx=0;fidx<3;fidx++){
      const needle=anchors[fidx],at=remainder.indexOf(needle);
      if(at<0)throw new Error('Missing illustration anchor: '+needle);
      const end=at+needle.length;
      addText(remainder.slice(0,end));
      remainder=remainder.slice(end);
      const f=BOOK.finale[fidx];
      if(fidx===0)pageMap.set('finale',pages.length);
      pages.push({type:'finale',chapter:'v',number:'V',title:f.title,image:f.image,quote:f.quote,id:'finale-'+f.title.toLowerCase().replaceAll(' ','-')});
    }
    addText(remainder);
    const road=BOOK.finale[3];
    pages.push({type:'finale',chapter:'v',number:'V',title:road.title,image:road.image,quote:road.quote,id:'finale-the-open-road'});
  }
  pages.push({type:'character',id:'characters',title:'The Puzzle Maiden',image:'character-maiden.webp'});
  pages.push({type:'character',title:'The Story-Knight',image:'character-knight.webp'});
  pages.push({type:'lore',id:'lore',title:'The Laws of the Puzzle'});
  pages.push({type:'back',id:'back',title:'Back Cover'});
  const findIndex=id=>id==='cover'?0:(pageMap.get(id)??pages.findIndex(p=>p.id===id));
  const readSetting=(key,fallback)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
  const saveSetting=(key,value)=>{try{localStorage.setItem(key,value);}catch{/* Reading still works without browser storage. */}};
  const stored=Number(readSetting('puzzle-maiden-page','0'));
  let index=Number.isInteger(stored)&&stored>=0&&stored<pages.length?stored:0;
  const isMobile=()=>window.matchMedia('(max-width:900px)').matches;
  const clamp=n=>Math.max(0,Math.min(pages.length-1,n));
  const spreadStart=n=>n===0||n===pages.length-1||isMobile()?n:1+Math.floor((n-1)/2)*2;
  const esc=str=>String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const inline=str=>esc(str).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
  const pageNum=idx=>idx>=3&&idx<pages.length-1?`✧ ${idx-2} ✧`:'';
  function prose(blocks){return blocks.map(b=>`<p>${inline(b)}</p>`).join('');}
  function tocMarkup(){return `<h2 class="page-title">Contents</h2><span class="flourish">❦</span><ol class="toc-list">${BOOK.chapters.map(c=>`<li><button data-chapter="${c.id}"><span>${c.number}.</span><span><strong>${esc(c.title)}</strong><small>Part ${c.number}</small></span></button></li>`).join('')}<li><button data-goto="finale"><span>✧</span><span><strong>The Final Four Pieces</strong><small>Clock · House · Moon-Bunny · Road</small></span></button></li><li><button data-goto="characters"><span>✦</span><span><strong>The Characters</strong><small>Illustrated character folio</small></span></button></li><li><button data-goto="lore"><span>☾</span><span><strong>The Laws of the Puzzle</strong><small>World and symbolism</small></span></button></li></ol>`;}
  function renderPage(page,idx,side){
    const bottom=`<div class="page-bottom">${pageNum(idx)}</div>`;
    if(!page)return `<div class="page ${side}" aria-hidden="true"></div>`;
    if(page.type==='cover'||page.type==='back')return `<div class="cover-page" style="position:relative"><img src="assets/cover-${page.type==='cover'?'front':'back'}.webp" alt="${page.type==='cover'?'The Puzzle Maiden and the Story-Knight, an illustrated purple and gold leatherbound cover':'Matching back cover with a moonlit road, lilies, and the moon-bunny crest'}"><button class="enter-button" data-goto="${page.type==='cover'?'frontispiece':'cover'}">${page.type==='cover'?'✧ OPEN THE BOOK ✧':'↶ BEGIN AGAIN'}</button></div>`;
    if(page.type==='frontispiece')return `<article class="page ${side}"><div class="page-inner book-frontispiece"><span class="page-top">☾ AN ENCHANTED TALE ☽</span><img class="zoomable" src="assets/00_cover.webp" alt="The Puzzle Maiden and the Story-Knight beside their living puzzle" tabindex="0" role="button" aria-label="Enlarge the frontispiece"><blockquote class="frontis-quote">“Some stories arrive unfinished. Others arrive with pieces someone never intended you to find.”</blockquote>${bottom}</div></article>`;
    if(page.type==='toc')return `<article class="page ${side}"><div class="page-inner"><div class="toc-on-page">${tocMarkup()}</div>${bottom}</div></article>`;
    if(['chapter-art','finale','character'].includes(page.type)){
      const name=page.type==='chapter-art'?`PART ${page.number} · ${page.title}`:page.title;
      const caption=page.type==='finale'?page.quote:(page.type==='character'?'Character folio · select the illustration to explore its details':'Select the illustration to see every detail');
      return `<article class="page ${side} art-page"><div class="page-inner"><span class="page-top">${esc(name)}</span><img class="zoomable" src="assets/${esc(page.image)}" alt="${esc(page.title)}" role="button" tabindex="0" aria-label="Enlarge illustration: ${esc(page.title)}"><p class="art-caption">${esc(caption)}</p>${bottom}</div></article>`;
    }
    if(page.type==='text')return `<article class="page ${side}"><div class="page-inner"><div class="page-top">✧ PART ${page.number} · ${esc(page.title)} ✧</div><div class="prose" tabindex="0" aria-label="Story text; scroll to read this leaf">${prose(page.blocks)}</div>${bottom}</div></article>`;
    if(page.type==='lore')return `<article class="page ${side} lore"><div class="page-inner"><div class="page-top">THE ENCHANTED WORLD</div><h2 class="page-title">Laws of the Puzzle</h2><div class="prose" tabindex="0"><p><strong>Every life is a living puzzle.</strong> Events leave pieces behind, beautiful or painful. True pieces carry the crests of those who shaped them.</p><p><strong>Stories gather related pieces.</strong> An unfolding story may be unfinished. A story presented as complete while its known middle is concealed cannot be understood honestly.</p><p><strong>Dream-pieces are translucent.</strong> They represent hoped-for futures. They become solid through deeds.</p><p><strong>The clock has two hands.</strong> Gold advances with promises; silver advances when promises are met by action.</p><p><strong>The moon-bunny crest</strong> marks the Maiden’s own pieces: curiosity, self-knowledge, and the freedom to choose what comes next.</p><p><strong>The Trickster is also the Knight.</strong> Understanding his wound does not erase responsibility for the blade.</p><p><strong>Empty spaces</strong> may be places where life has not happened yet.</p></div>${bottom}</div></article>`;
    return '';
  }
  function pageHash(n){return pages[n].id||(pages[n].type==='chapter-art'?pages[n].chapter:`page-${n+1}`);}
  function parseHash(){const id=decodeURIComponent(location.hash.slice(1));if(/^page-\d+$/.test(id)){const n=Number(id.slice(5))-1;return n>=0&&n<pages.length?n:-1;}return findIndex(id);}
  function render(){
    index=clamp(index);
    const cover=['cover','back'].includes(pages[index].type),start=spreadStart(index);
    const visible=cover||isMobile()?[pages[index]]:[pages[start],pages[start+1]?.type==='back'?null:pages[start+1]];
    root.innerHTML=visible.map((p,j)=>renderPage(p,start+j,isMobile()?'right':j?'right':'left')).join('');
    shell.classList.toggle('cover-mode',cover);root.classList.toggle('is-cover',cover);
    previous.disabled=index===0;next.disabled=index===pages.length-1;
    const page=pages[index];
    chapterLabel.textContent=page.chapter?`✦ PART ${page.number} · ${page.title} ✦`:`✦ ${page.title} ✦`;
    locationLabel.textContent=page.type==='text'?`Part ${page.number} · leaf ${page.part} of ${page.of}`:page.title;
    const last=Math.min(pages.length,start+visible.filter(Boolean).length);
    pageCount.textContent=visible.length===2?`${start+1}–${last} / ${pages.length}`:`${index+1} / ${pages.length}`;
    progressFill.style.width=`${Math.round(index/(pages.length-1)*100)}%`;
    saveSetting('puzzle-maiden-page',String(index));
    history.replaceState(null,'',`#${pageHash(index)}`);
  }
  function goto(n){if(n<0)return;index=clamp(n);closeDrawer();render();}
  function gotoId(id){goto(findIndex(id));}
  function turn(delta){
    const start=spreadStart(index),step=isMobile()?1:2;
    if(index===0){if(delta>0)goto(1);return;}
    if(delta<0&&index===pages.length-1){goto(spreadStart(index-1));return;}
    goto(delta<0&&start===1?0:start+delta*step);
  }
  const viewer=document.getElementById('artViewer'),viewerImage=document.getElementById('viewerImage');
  let zoomOrigin=null;
  function zoom(img){zoomOrigin=img;viewerImage.src=img.src;viewerImage.alt=img.alt;viewer.showModal();}
  root.addEventListener('click',e=>{const image=e.target.closest('.zoomable');if(image){zoom(image);return;}const t=e.target.closest('[data-chapter],[data-goto]');if(t)gotoId(t.dataset.chapter||t.dataset.goto);});
  root.addEventListener('keydown',e=>{if(e.target.matches('.zoomable')&&['Enter',' '].includes(e.key)){e.preventDefault();zoom(e.target);}});
  document.getElementById('closeViewer').onclick=()=>viewer.close();
  viewer.addEventListener('click',e=>{if(e.target===viewer)viewer.close();});
  viewer.addEventListener('close',()=>zoomOrigin?.isConnected&&zoomOrigin.focus());
  previous.onclick=()=>turn(-1);next.onclick=()=>turn(1);
  document.getElementById('brandHome').onclick=e=>{e.preventDefault();goto(0);};
  const toggle=document.getElementById('contentsToggle');
  function openDrawer(){drawer.classList.add('open');drawer.inert=false;drawer.setAttribute('aria-hidden','false');veil.hidden=false;toggle.setAttribute('aria-expanded','true');document.getElementById('closeDrawer').focus();}
  function closeDrawer(){const wasOpen=drawer.classList.contains('open');drawer.classList.remove('open');drawer.inert=true;drawer.setAttribute('aria-hidden','true');veil.hidden=true;toggle.setAttribute('aria-expanded','false');if(wasOpen)toggle.focus();}
  toggle.onclick=openDrawer;document.getElementById('closeDrawer').onclick=closeDrawer;veil.onclick=closeDrawer;
  document.getElementById('drawerLinks').innerHTML=`<button data-goto="cover">❦ <span>Front Cover</span></button><button data-goto="frontispiece">✧ <span>Frontispiece & Contents</span></button>${BOOK.chapters.map(c=>`<button data-chapter="${c.id}">✧ <span>Part ${c.number} · ${esc(c.title)}</span></button>`).join('')}${BOOK.finale.map(f=>`<button data-goto="finale-${f.title.toLowerCase().replaceAll(' ','-')}">☾ <span>${esc(f.title)}</span></button>`).join('')}<button data-goto="characters">♧ <span>Character Folio</span></button><button data-goto="lore">✦ <span>World Lore</span></button><button data-goto="back">❦ <span>Back Cover</span></button>`;
  document.getElementById('drawerLinks').onclick=e=>{const t=e.target.closest('[data-chapter],[data-goto]');if(t)gotoId(t.dataset.chapter||t.dataset.goto);};
  const sizes=[18,20,22,24];let fontSize=Number(readSetting('puzzle-maiden-font','20'));if(!sizes.includes(fontSize))fontSize=20;
  function applyFont(){document.documentElement.style.setProperty('--body-size',`${fontSize}px`);document.getElementById('fontButton').setAttribute('aria-label',`Text size ${fontSize}. Select to change.`);}
  applyFont();document.getElementById('fontButton').onclick=()=>{fontSize=sizes[(sizes.indexOf(fontSize)+1)%sizes.length];saveSetting('puzzle-maiden-font',String(fontSize));applyFont();};
  document.addEventListener('keydown',e=>{
    if(viewer.open)return;
    if(drawer.classList.contains('open')){
      if(e.key==='Escape'){closeDrawer();return;}
      if(e.key==='Tab'){const controls=[...drawer.querySelectorAll('button')],first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}return;
    }
    if(['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName))return;
    if(e.key==='ArrowRight'){e.preventDefault();turn(1);}if(e.key==='ArrowLeft'){e.preventDefault();turn(-1);}if(e.key==='Home'){e.preventDefault();goto(0);}
  });
  let lastMobile=isMobile();window.addEventListener('resize',()=>{if(lastMobile!==isMobile()){lastMobile=isMobile();render();}});
  window.addEventListener('hashchange',()=>{const n=parseHash();if(n>=0)goto(n);});
  // A shared link takes precedence over saved progress, including the cover link.
  const target=parseHash();if(target>=0)index=target;
  closeDrawer();render();
})();
