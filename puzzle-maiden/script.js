(() => {
  'use strict';
  const BOOK=window.BOOK;
  const root=document.getElementById('book'),shell=document.getElementById('bookShell');
  const previous=document.getElementById('previous'),next=document.getElementById('next');
  const locationLabel=document.getElementById('locationLabel'), pageCount=document.getElementById('pageCount'),progressFill=document.getElementById('progressFill');
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
    let leaf=0;
    const addText=(body)=>{const chunks=groupBlocks(body);chunks.forEach((blocks,n)=>pages.push({type:'text',chapter:chapter.id,number:chapter.number,title:chapter.title,blocks,id:`leaf-${chapter.id}-${++leaf}`,part:n+1,of:chunks.length}));};
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
  for(const chapter of BOOK.chapters){
    const leaves=pages.filter(p=>p.type==='text'&&p.chapter===chapter.id);
    leaves.forEach((page,n)=>{page.part=n+1;page.of=leaves.length;});
  }
  pages.push({type:'character',id:'characters',title:'The Puzzle Maiden',image:'character-maiden.webp'});
  pages.push({type:'character',id:'character-knight',title:'The Story-Knight',image:'character-knight.webp'});
  pages.push({type:'lore',id:'lore',title:'The Laws of the Puzzle'});
  pages.push({type:'back',id:'back',title:'Back Cover'});
  const findIndex=id=>typeof id!=='string'?-1:id==='cover'?0:(pageMap.get(id)??pages.findIndex(p=>p.id===id));
  const readSetting=(key,fallback)=>{try{return localStorage.getItem(key)??fallback;}catch{return fallback;}};
  const saveSetting=(key,value)=>{try{localStorage.setItem(key,value);}catch{/* Reading still works without browser storage. */}};
  // Older editions used absolute page numbers. Carry those to the matching
  // passage (or the nearest position in its chapter when it was rewritten).
  const legacyPosition=id=>/^page-\d+$/.test(id)?BOOK.legacyPositions?.[Number(id.slice(5))-1]:null;
  let bookmarks=[];
  try{const saved=JSON.parse(readSetting('puzzle-maiden-bookmarks','[]'));if(Array.isArray(saved))bookmarks=saved.filter(b=>b&&typeof b.id==='string'&&typeof b.title==='string'&&Array.isArray(b.scroll)).slice(0,100);}catch{}
  const migratedBookmarks=new Map();
  for(const bookmark of bookmarks){
    const migrated=legacyPosition(bookmark.id),id=migrated?.id||bookmark.id,target=findIndex(id);
    if(target<0)continue;
    migratedBookmarks.set(id,{...bookmark,id,title:pages[target].title,leaf:target+1,scroll:migrated&&!migrated.exact?[]:bookmark.scroll});
  }
  bookmarks=[...migratedBookmarks.values()];
  saveSetting('puzzle-maiden-bookmarks',JSON.stringify(bookmarks));
  function storeBookmarks(){try{localStorage.setItem('puzzle-maiden-bookmarks',JSON.stringify(bookmarks));}catch{document.getElementById('bookmarkStorageNote').textContent='Browser storage is unavailable. Bookmarks will last for this visit.';}}
  function syncBookmarks(){
    const marked=bookmarks.some(b=>b.id===pageHash(index)),button=document.getElementById('bookmarkButton');
    button.setAttribute('aria-pressed',String(marked));button.setAttribute('aria-label',marked?'Remove bookmark for this page':'Bookmark this page');button.title=marked?'Remove this bookmark':'Bookmark this page';button.textContent=marked?'★':'✧';
    document.getElementById('bookmarkList').innerHTML=bookmarks.length?bookmarks.map(b=>`<div class="bookmark-item"><button data-bookmark="${esc(b.id)}"><span>${esc(b.title)}</span><small>Leaf ${esc(b.leaf)}</small></button><button data-remove-bookmark="${esc(b.id)}" aria-label="Remove bookmark: ${esc(b.title)}">✕</button></div>`).join(''):'<p class="bookmark-help">Your saved pages will appear here.</p>';
  }
  function saveBookmark(){
    const id=pageHash(index),existing=bookmarks.findIndex(b=>b.id===id);
    if(existing>=0){bookmarks.splice(existing,1);document.getElementById('bookmarkStatus').textContent='Bookmark removed.';}
    else{
      const scroll=[...root.querySelectorAll('.prose,.toc-on-page')].map(n=>n.scrollTop/Math.max(1,n.scrollHeight-n.clientHeight));
      bookmarks.push({id,title:pages[index].title,leaf:index+1,scroll});document.getElementById('bookmarkStatus').textContent='Page bookmarked. Find it in Contents.';
    }
    storeBookmarks();syncBookmarks();
  }
  const stored=Number(readSetting('puzzle-maiden-page','0'));
  const savedLocation=findIndex(readSetting('puzzle-maiden-location',''));
  const migratedLocation=readSetting('puzzle-maiden-edition','')!==BOOK.edition&&Number.isInteger(stored)?findIndex(BOOK.legacyPositions?.[stored]?.id):-1;
  let index=savedLocation>=0?savedLocation:migratedLocation>=0?migratedLocation:Number.isInteger(stored)&&stored>=0&&stored<pages.length?stored:0;
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
    if(page.type==='cover'||page.type==='back')return `<div class="cover-page" data-read-aloud="${esc(page.type==='cover'?BOOK.title+'. '+BOOK.subtitle:'Back cover. The end of '+BOOK.title+'.')}" style="position:relative"><img src="assets/cover-${page.type==='cover'?'front':'back'}.webp" alt="${page.type==='cover'?'The Puzzle Maiden and the Story-Knight, an illustrated purple and gold leatherbound cover':'Matching back cover with a moonlit road, lilies, and the moon-bunny crest'}"><button class="enter-button" data-goto="${page.type==='cover'?'frontispiece':'cover'}">${page.type==='cover'?'✧ OPEN THE BOOK ✧':'↶ BEGIN AGAIN'}</button></div>`;
    if(page.type==='toc')return `<article class="page ${side}"><div class="page-inner"><div class="toc-on-page">${tocMarkup()}</div>${bottom}</div></article>`;
    if(['frontispiece','chapter-art','finale','character'].includes(page.type)){
      const file=page.type==='frontispiece'?'00_cover.webp':page.image;
      const spoken=page.type==='frontispiece'?'Frontispiece. '+BOOK.title+'.':page.type==='chapter-art'?'Part '+({I:1,II:2,III:3,IV:4,V:5}[page.number]||page.number)+'. '+page.title+'. Illustration.':page.type==='character'?'Character folio. '+page.title+'.':page.title+'. '+(page.quote||'');
      return `<article class="page ${side} art-page" data-read-aloud="${esc(spoken)}"><div class="page-inner"><img class="zoomable" src="assets/${esc(file)}" alt="${esc(page.title)}" role="button" tabindex="0" aria-label="Enlarge illustration: ${esc(page.title)}"></div></article>`;
    }
    if(page.type==='text')return `<article class="page ${side}"><div class="page-inner"><div class="page-top">✧ PART ${page.number} · ${esc(page.title)} ✧</div><div class="prose" tabindex="0" aria-label="Story text; scroll to read this leaf">${prose(page.blocks)}</div>${bottom}</div></article>`;
    if(page.type==='lore')return `<article class="page ${side} lore"><div class="page-inner"><div class="page-top">THE ENCHANTED WORLD</div><h2 class="page-title">Laws of the Puzzle</h2><div class="prose" tabindex="0"><p><strong>Eldermere</strong> is the enchanted country where this tale begins. The puzzleverse is their universe, where these laws hold.</p><p><strong>Every life is a living puzzle.</strong> Events leave pieces behind, beautiful or painful. True pieces carry the crests of those who shaped them.</p><p><strong>Stories gather related pieces.</strong> An unfolding story may be unfinished. A story presented as complete while its known middle is concealed cannot be understood honestly.</p><p><strong>Dream-pieces are translucent.</strong> They represent hoped-for futures. They become solid through deeds.</p><p><strong>The clock has two hands.</strong> Gold advances with promises; silver advances when promises are met by action.</p><p><strong>The moon-bunny crest</strong> marks the Maiden’s own pieces: curiosity, self-knowledge, and the freedom to choose what comes next.</p><p><strong>Old wounds can leak into new pieces.</strong> Their colors may explain a pattern without excusing a fresh cut.</p><p><strong>Masks and armor</strong> may share a shadow. Understanding the wound does not erase responsibility for the blade.</p><p><strong>Boundaries filter what may enter.</strong> A keeper can welcome closeness while refusing lies, cruelty, and repeated harm.</p><p><strong>Empty spaces</strong> may be places where life has not happened yet.</p></div>${bottom}</div></article>`;
    return '';
  }
  function pageHash(n){return pages[n].id||(pages[n].type==='chapter-art'?pages[n].chapter:`page-${n+1}`);}
  function parseHash(){let id;try{id=decodeURIComponent(location.hash.slice(1));}catch{return -1;}const migrated=legacyPosition(id);return findIndex(migrated?.id||id);}
  function render(){
    index=clamp(index);
    const cover=['cover','back'].includes(pages[index].type),start=spreadStart(index);
    const visible=cover||isMobile()?[pages[index]]:[pages[start],pages[start+1]?.type==='back'?null:pages[start+1]];
    root.innerHTML=visible.map((p,j)=>renderPage(p,start+j,isMobile()?'right':j?'right':'left')).join('');
    shell.classList.toggle('cover-mode',cover);shell.classList.toggle('art-mode',!cover&&visible.filter(Boolean).every(p=>['frontispiece','chapter-art','finale','character'].includes(p.type)));root.classList.toggle('is-cover',cover);
    previous.disabled=index===0;next.disabled=index===pages.length-1;
    const page=pages[index];
    locationLabel.textContent=page.type==='text'?`Part ${page.number} · leaf ${page.part} of ${page.of}`:page.title;
    const last=Math.min(pages.length,start+visible.filter(Boolean).length);
    pageCount.textContent=visible.length===2?`${start+1}–${last} / ${pages.length}`:`${index+1} / ${pages.length}`;
    progressFill.style.width=`${Math.round(index/(pages.length-1)*100)}%`;
    document.getElementById('progressTrack').setAttribute('aria-valuenow',String(Math.round(index/(pages.length-1)*100)));
    saveSetting('puzzle-maiden-page',String(index));
    saveSetting('puzzle-maiden-location',pageHash(index));
    saveSetting('puzzle-maiden-edition',BOOK.edition);
    history.replaceState(null,'',`#${pageHash(index)}`);
    syncBookmarks();
    window.ReadAloud?.pageChanged();
    window.BookMusic?.pageChanged(page.chapter||'');
  }
  function goto(n){if(n<0)return;const before=index;index=clamp(n);closeDrawer();render();if(index!==before)window.Reader?.turn(index-before);}
  function gotoId(id){goto(findIndex(id));}
  function turn(delta){
    const start=spreadStart(index),step=isMobile()?1:2;
    if(index===0){if(delta>0)goto(1);return;}
    if(delta<0&&index===pages.length-1){goto(spreadStart(index-1));return;}
    goto(delta<0&&start===1?0:start+delta*step);
  }
  const viewer=document.getElementById('artViewer'),viewerImage=document.getElementById('viewerImage');
  let zoomOrigin=null,zoomScale=1;
  const viewport=document.getElementById('imageViewport'),canvas=document.getElementById('imageCanvas');
  function applyZoom(){
    if(!viewerImage.naturalWidth)return;
    const fit=Math.min(viewport.clientWidth/viewerImage.naturalWidth,viewport.clientHeight/viewerImage.naturalHeight);
    const w=viewerImage.naturalWidth*fit*zoomScale,h=viewerImage.naturalHeight*fit*zoomScale;
    viewerImage.style.width=w+'px';viewerImage.style.height=h+'px';
    canvas.style.width=Math.max(viewport.clientWidth,w)+'px';canvas.style.height=Math.max(viewport.clientHeight,h)+'px';
    document.getElementById('zoomValue').textContent=Math.round(zoomScale*100)+'%';
    document.getElementById('zoomOut').disabled=zoomScale<=1;document.getElementById('zoomIn').disabled=zoomScale>=4;
  }
  function zoom(img){zoomOrigin=img;zoomScale=1;viewerImage.onload=applyZoom;viewerImage.src=img.src;viewerImage.alt=img.alt;viewer.showModal();applyZoom();viewport.scrollTop=0;viewport.scrollLeft=0;}
  document.getElementById('zoomIn').onclick=()=>{zoomScale=Math.min(4,zoomScale+.5);applyZoom();};
  document.getElementById('zoomOut').onclick=()=>{zoomScale=Math.max(1,zoomScale-.5);applyZoom();};
  viewerImage.onclick=()=>{zoomScale=zoomScale===1?2:1;applyZoom();};
  window.addEventListener('resize',()=>{if(viewer.open)applyZoom();});
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
  document.getElementById('bookmarkButton').onclick=saveBookmark;
  document.getElementById('bookmarkList').onclick=e=>{
    const remove=e.target.closest('[data-remove-bookmark]');if(remove){bookmarks=bookmarks.filter(b=>b.id!==remove.dataset.removeBookmark);storeBookmarks();syncBookmarks();return;}
    const link=e.target.closest('[data-bookmark]');if(!link)return;
    const bookmark=bookmarks.find(b=>b.id===link.dataset.bookmark);if(!bookmark)return;
    const target=pages.findIndex((p,n)=>pageHash(n)===bookmark.id);if(target<0)return;
    goto(target);requestAnimationFrame(()=>root.querySelectorAll('.prose,.toc-on-page').forEach((n,j)=>{const ratio=Math.max(0,Math.min(1,Number(bookmark.scroll[j])||0));n.scrollTop=ratio*Math.max(0,n.scrollHeight-n.clientHeight);}));
  };
  toggle.onclick=openDrawer;document.getElementById('closeDrawer').onclick=closeDrawer;veil.onclick=closeDrawer;
  document.getElementById('drawerLinks').innerHTML=`<button data-goto="cover">❦ <span>Front Cover</span></button><button data-goto="frontispiece">✧ <span>Frontispiece & Contents</span></button>${BOOK.chapters.map(c=>`<button data-chapter="${c.id}">✧ <span>Part ${c.number} · ${esc(c.title)}</span></button>`).join('')}${BOOK.finale.map(f=>`<button data-goto="finale-${f.title.toLowerCase().replaceAll(' ','-')}">☾ <span>${esc(f.title)}</span></button>`).join('')}<button data-goto="characters">♧ <span>Character Folio</span></button><button data-goto="lore">✦ <span>World Lore</span></button><button data-goto="back">❦ <span>Back Cover</span></button>`;
  document.getElementById('drawerLinks').onclick=e=>{const t=e.target.closest('[data-chapter],[data-goto]');if(t)gotoId(t.dataset.chapter||t.dataset.goto);};
  document.addEventListener('keydown',e=>{
    if(viewer.open||document.getElementById('settingsDialog').open)return;
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
