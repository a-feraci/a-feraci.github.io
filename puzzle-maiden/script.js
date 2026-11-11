(() => {
  'use strict';
  const BOOK=window.BOOK;
  const root=document.getElementById('book'),shell=document.getElementById('bookShell');
  const previous=document.getElementById('previous'),next=document.getElementById('next');
  const chapterLabel=document.getElementById('chapterLabel'), locationLabel=document.getElementById('locationLabel'), pageCount=document.getElementById('pageCount'),progressFill=document.getElementById('progressFill');
  const drawer=document.getElementById('contentsDrawer'),veil=document.getElementById('veil');
  const readAloud=document.getElementById('readAloud');
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
  const stored=Number(sessionStorage.getItem('puzzle-maiden-page')??localStorage.getItem('puzzle-maiden-page')??'0');
  let index=Number.isFinite(stored)&&stored>=0&&stored<pages.length?stored:0;
  let reading=false;
  const isMobile=()=>window.matchMedia('(max-width:900px)').matches;
  const spanSize=()=>isMobile()?1:2;
  const pageSides=start=>isMobile()?['right']:(start===0?['right']:['left','right']);
  const clamp=n=>Math.max(0,Math.min(pages.length-1,n));
  const esc=str=>String(str).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const inline=str=>esc(str).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\*(.+?)\*/g,'<em>$1</em>');
  const pageNum=idx=>idx>=3&&idx<pages.length-1?`✧ ${idx-2} ✧`:'';
  function prose(blocks){return blocks.map(b=>`<p>${inline(b)}</p>`).join('');}
  function tocMarkup(){return `<h2 class="page-title">Contents</h2><span class="flourish">❦</span><ol class="toc-list">${BOOK.chapters.map(c=>`<li><button data-chapter="${c.id}"><span>${c.number}.</span><span><strong>${esc(c.title)}</strong><small>Part ${c.number}</small></span></button></li>`).join('')}<li><button data-goto="finale"><span>✧</span><span><strong>The Final Four Pieces</strong><small>Clock · House · Moon-Bunny · Road</small></span></button></li><li><button data-goto="characters"><span>✦</span><span><strong>The Characters</strong><small>Illustrated character folio</small></span></button></li><li><button data-goto="lore"><span>☾</span><span><strong>The Laws of the Puzzle</strong><small>World and symbolism</small></span></button></li></ol>`;}
  function renderPage(page,idx,side){
    const bottom=`<div class="page-bottom">${pageNum(idx)}</div>`;
    if(!page)return `<div class="page ${side}" aria-hidden="true"><div class="page-inner"></div></div>`;
    if(page.type==='cover')return `<div class="cover-page" style="position:relative"><img src="assets/cover-front.webp" alt="Leatherbound fairytale cover with the Puzzle Maiden and the Story-Knight under a crescent moon"><button class="enter-button" data-goto="frontispiece">✧ OPEN THE BOOK ✧</button></div>`;
    if(page.type==='back')return `<div class="cover-page" style="position:relative"><img src="assets/cover-back.webp" alt="Ornate moonlit back cover with lilies, ruins and a moon-bunny emblem"><button class="enter-button" data-goto="cover">↶ BEGIN AGAIN</button></div>`;
    if(page.type==='frontispiece')return `<article class="page ${side}"><div class="page-inner book-frontispiece"><span class="page-top">☾ AN ENCHANTED TALE ☽</span><img src="assets/00_cover.webp" alt="The Puzzle Maiden and the Story-Knight beside their living puzzle"><blockquote class="frontis-quote">“Some stories arrive unfinished. Others arrive with pieces someone never intended you to find.”</blockquote>${bottom}</div></article>`;
    if(page.type==='toc')return `<article class="page ${side}"><div class="page-inner toc-on-page">${tocMarkup()}${bottom}</div></article>`;
    if(page.type==='chapter-art'||page.type==='finale'||page.type==='character'){
      let name=page.type==='chapter-art'?`PART ${page.number} · ${page.title}`:page.title;
      let caption=page.type==='finale'?page.quote:(page.type==='character'?'An illustrated character from the enchanted world':'');
      return `<article class="page ${side} art-page"><div class="page-inner"><span class="page-top">${esc(name)}</span><img src="assets/${esc(page.image)}" loading="lazy" alt="Illustration: ${esc(page.title)}"><p class="art-caption">${esc(caption)}</p>${bottom}</div></article>`;
    }
    if(page.type==='text')return `<article class="page ${side}"><div class="page-inner"><div class="page-top">✧ PART ${page.number} · ${esc(page.title)} ✧</div><div class="prose" tabindex="0">${prose(page.blocks)}</div>${bottom}</div></article>`;
    if(page.type==='finale-intro')return `<article class="page ${side}"><div class="page-inner title-page-inner"><span class="title-eyebrow">Four images. One final truth.</span><h2 class="page-title">The Last<br>Four Pieces</h2><span class="flourish">☾ ✧ ☽</span><p class="subtitle">The Clock<br>The Transparent House<br>The Moon-Bunny Piece<br>The Open Road</p><p class="subtitle">An ending that leaves room for another beginning.</p>${bottom}</div></article>`;
    if(page.type==='lore')return `<article class="page ${side} lore"><div class="page-inner"><div class="page-top">THE ENCHANTED WORLD</div><h2 class="page-title">Laws of the Puzzle</h2><div class="prose"><p><strong>Every life is a living puzzle.</strong> Events leave pieces behind, beautiful or painful. True pieces carry the crests of those who shaped them.</p><p><strong>A story is a gathering of related pieces.</strong> It can remain unfinished without being false. But a story presented as complete while its known middle is hidden cannot be understood honestly.</p><p><strong>Dream-pieces are translucent.</strong> They represent futures hoped for, not futures already earned. They become solid only through deeds.</p><p><strong>The enchanted clock has two hands.</strong> Gold advances with promises. Silver advances when promises are met through action. The distance between them is the distance between intention and practice.</p><p><strong>The Maiden's moon-bunny crest</strong> marks her own authentic pieces. It represents curiosity, self-knowledge and the freedom to choose what comes next.</p><p><strong>The Trickster is also the Knight.</strong> His wounds may be real; so may the clever harm he has learned to conceal behind them. Understanding the wound does not erase responsibility for the blade.</p><p><strong>An empty space is not always a missing piece.</strong> Sometimes it is a part of life that has not happened yet.</p></div>${bottom}</div></article>`;
    return '';
  }
  function setTitleLabel(page){
    chapterLabel.textContent=page?.chapter?`✦ PART ${page.number} · ${page.title} ✦`:`✦ ${page?.title||'AN ILLUMINATED FAIRYTALE'} ✦`;
    locationLabel.textContent=page?.type==='text'?`Part ${page.number} · leaf ${page.part} of ${page.of}`:page?.title||'Cover';
  }
  function render(){
    stopSpeech();
    index=clamp(index);
    const cover=pages[index]?.type==='cover'||pages[index]?.type==='back';
    const start=cover?index:(isMobile()?index:index-(index%2));
    const visible=cover?[pages[index]]:(isMobile()?[pages[start]]:[pages[start],pages[start+1]]);
    const sides=pageSides(start);
    root.innerHTML=visible.map((p,j)=>renderPage(p,start+j,sides[j]||'right')).join('');
    shell.classList.toggle('cover-mode',cover);root.classList.toggle('is-cover',cover);
    previous.disabled=index<=0;next.disabled=index>=pages.length-1;
    setTitleLabel(pages[index]);pageCount.textContent=`${Math.min(pages.length,index+1)} / ${pages.length}`;
    progressFill.style.width=`${Math.round((index/(pages.length-1))*100)}%`;
    localStorage.setItem('puzzle-maiden-page',String(index));
    const nextHash=pages[index].id||pages[index].chapter||'reading';
    history.replaceState(null,'',`#${nextHash}`);
  }
  function goto(n){index=clamp(n);closeDrawer();render();document.querySelector('.book-shell').scrollIntoView({behavior:'smooth',block:'nearest'});}
  function gotoId(id){goto(findIndex(id));}
  function turn(delta){let step=spanSize();if(index===0&&delta>0)step=1;if(pages[index].type==='back'&&delta<0)step=1;goto(index+delta*step);}
  root.addEventListener('click',e=>{const t=e.target.closest('[data-chapter],[data-goto]');if(t)gotoId(t.dataset.chapter||t.dataset.goto);});
  previous.onclick=()=>turn(-1);next.onclick=()=>turn(1);
  document.getElementById('brandHome').onclick=e=>{e.preventDefault();goto(0);};
  function openDrawer(){drawer.classList.add('open');drawer.setAttribute('aria-hidden','false');veil.hidden=false;document.getElementById('contentsToggle').setAttribute('aria-expanded','true');document.getElementById('closeDrawer').focus();}
  function closeDrawer(){drawer.classList.remove('open');drawer.setAttribute('aria-hidden','true');veil.hidden=true;document.getElementById('contentsToggle').setAttribute('aria-expanded','false');}
  document.getElementById('contentsToggle').onclick=openDrawer;
  document.getElementById('closeDrawer').onclick=()=>{closeDrawer();document.getElementById('contentsToggle').focus();};
  veil.onclick=closeDrawer;
  document.getElementById('drawerLinks').innerHTML=`${BOOK.chapters.map(c=>`<button data-chapter="${c.id}">✧ <span>Part ${c.number} · ${esc(c.title)}</span></button>`).join('')}<button data-goto="finale">☾ <span>The Last Four Pieces</span></button><button data-goto="characters">♧ <span>Character Folio</span></button><button data-goto="lore">✦ <span>World Lore</span></button><button data-goto="back">❦ <span>Back Cover</span></button>`;
  document.getElementById('drawerLinks').onclick=e=>{const t=e.target.closest('[data-chapter],[data-goto]');if(t)gotoId(t.dataset.chapter||t.dataset.goto);};
  document.getElementById('fontButton').onclick=()=>{const sizes=[18,20,22,24],now=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--body-size'))||20;document.documentElement.style.setProperty('--body-size',`${sizes[(sizes.indexOf(now)+1)%sizes.length]}px`);};
  function stopSpeech(){if('speechSynthesis' in window){window.speechSynthesis.cancel();}reading=false;readAloud.setAttribute('aria-pressed','false');readAloud.lastElementChild&&(readAloud.lastElementChild.textContent='Read aloud');}
  readAloud.onclick=()=>{
    if(reading){stopSpeech();return;}
    if(!('speechSynthesis' in window)){alert('Read aloud is not available in this browser.');return;}
    const text=[...root.querySelectorAll('.prose p,.frontis-quote,.page-title,.art-caption')].map(n=>n.textContent).join(' ');
    if(!text.trim()){return;}
    const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.88;u.pitch=1;u.onend=stopSpeech;u.onerror=stopSpeech;reading=true;readAloud.setAttribute('aria-pressed','true');readAloud.lastElementChild.textContent='Stop reading';window.speechSynthesis.speak(u);
  };
  document.addEventListener('keydown',e=>{if(drawer.classList.contains('open')){if(e.key==='Escape')closeDrawer();return;}if(['INPUT','TEXTAREA'].includes(e.target.tagName))return;if(e.key==='ArrowRight'){e.preventDefault();turn(1);}if(e.key==='ArrowLeft'){e.preventDefault();turn(-1);}if(e.key==='Home'){goto(0);}});
  let lastMobile=isMobile();window.addEventListener('resize',()=>{if(lastMobile!==isMobile()){lastMobile=isMobile();render();}});
  const hash=location.hash.slice(1);if(hash&&hash!=='reading'&&(!stored||stored===0)){const h=findIndex(hash);if(h>=0)index=h;}
  render();
})();