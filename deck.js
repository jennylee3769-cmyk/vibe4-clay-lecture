/* 바이브 코딩 4기 본수업 슬라이드 공용 엔진 */
(function(){
  const slides=[...document.querySelectorAll(".slide")], deck=document.getElementById("deck");
  const total=slides.length; let idx=0, buf="";
  const $=id=>document.getElementById(id);
  const pager=$("pager"), progress=$("progress"), notes=$("notes"), notesText=$("notesText"), help=$("help"), toc=$("toc"), toast=$("toast");

  // 목차 생성
  const tocList=toc.querySelector("ol");
  slides.forEach((s,i)=>{
    const t=s.dataset.title || (s.querySelector("h1,h2,.big")||{}).textContent || `슬라이드 ${i+1}`;
    const li=document.createElement("li"); li.textContent=t.replace(/\s+/g," ").trim().slice(0,40);
    li.onclick=()=>{ toc.classList.remove("open"); go(i); };
    tocList.appendChild(li);
  });
  const isPreviewFrame=new URLSearchParams(location.search).get("preview")==="1";
  function fit(){
    const open=notes.classList.contains("open");
    const CHROME=isPreviewFrame?0:48; // 하단 조작 바가 차지하는 띠
    const PAD=isPreviewFrame?0:16;
    const taken=(open ? Math.min(innerHeight*0.34, notes.offsetHeight) : 0)+CHROME;
    const availW=innerWidth-PAD*2, availH=innerHeight-taken-(isPreviewFrame?0:PAD);
    const s=Math.min(availW/1280, availH/720);
    const x=(innerWidth-1280*s)/2, y=(innerHeight-taken-720*s)/2;
    deck.style.transform=`translate(${x.toFixed(1)}px,${y.toFixed(1)}px) scale(${s.toFixed(4)})`;
  }
  // 표지 모션 : 활성화될 때마다 재생
  let coverTimer=null;
  const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
  function playCover(slide){
    const poster=slide.querySelector(".poster"), slot=slide.querySelector(".cover-slot");
    if(!poster||!slot) return;
    slide.querySelectorAll(".cover-copy [data-i]").forEach(el=>el.style.setProperty("--i",el.dataset.i));
    clearTimeout(coverTimer);
    slide.classList.remove("play","settle"); void slide.offsetWidth;
    if(reduce){ slide.classList.add("play","settle"); return; }
    const dr=deck.getBoundingClientRect(), sr=slot.getBoundingClientRect(), sc=dr.width/1280||1;
    const w=sr.width/sc, h=sr.height/sc, cx1=(sr.left-dr.left)/sc+w/2, cy1=(sr.top-dr.top)/sc+h/2;
    const s0=Math.min(1100/w, 620/h);
    poster.style.setProperty("--t0", `translate(${(640-cx1).toFixed(1)}px, ${(352-cy1).toFixed(1)}px) scale(${s0.toFixed(3)})`);
    slide.classList.add("play");
    coverTimer=setTimeout(()=>slide.classList.add("settle"), 2600);
  }
  const listeners=[];
  function go(n, pushHash=true, source="user"){
    n=Math.max(0,Math.min(total-1,n));
    slides.forEach((s,i)=>{ s.classList.toggle("active",i===n); s.classList.toggle("prev",i<n); });
    listeners.forEach(f=>{ try{ f(n,source); }catch(e){} });
    if(slides[n].classList.contains("cover")) requestAnimationFrame(()=>playCover(slides[n])); else clearTimeout(coverTimer);
    idx=n;
    pager.textContent=`${n+1} / ${total}`;
    progress.style.width=((n+1)/total*100)+"%";
    notesText.textContent=slides[n].dataset.notes||"";
    tocList.querySelectorAll("li").forEach((li,i)=>li.classList.toggle("cur",i===n));
    if(pushHash) history.replaceState(null,"","#"+(n+1));
  }
  function fromHash(){ const h=parseInt(location.hash.slice(1),10); go(isNaN(h)?0:h-1,false,"hash"); }
  addEventListener("hashchange",fromHash);
  addEventListener("resize",fit);
  addEventListener("keydown",e=>{
    if(e.target.tagName==="INPUT"||e.target.tagName==="TEXTAREA") return;
    const k=e.key;
    if(k==="ArrowRight"||k==="ArrowDown"||k===" "||k==="PageDown"){ e.preventDefault(); go(idx+1); }
    else if(k==="ArrowLeft"||k==="ArrowUp"||k==="PageUp"){ e.preventDefault(); go(idx-1); }
    else if(k==="Home"){ go(0); } else if(k==="End"){ go(total-1); }
    else if(k.toLowerCase()==="n"){ notes.classList.toggle("open"); fit(); }
    else if(k.toLowerCase()==="o"){ toc.classList.toggle("open"); }
    else if(k.toLowerCase()==="f"){ document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.(); }
    else if(/^[0-9]$/.test(k)){ buf+=k; }
    else if(k==="Enter"&&buf){ go(parseInt(buf,10)-1); buf=""; }
    else if(k==="Escape"){ buf=""; notes.classList.remove("open"); toc.classList.remove("open"); fit(); }
  });
  $("prevBtn").onclick=()=>go(idx-1);
  $("nextBtn").onclick=()=>go(idx+1);
  $("tocBtn").onclick=()=>toc.classList.toggle("open");
  let sx=null, sy=null;
  addEventListener("touchstart",e=>{ sx=e.touches[0].clientX; sy=e.touches[0].clientY; },{passive:true});
  addEventListener("touchend",e=>{ if(sx===null) return; const dx=e.changedTouches[0].clientX-sx, dy=e.changedTouches[0].clientY-sy; if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)) go(idx+(dx<0?1:-1)); sx=sy=null; });
  deck.addEventListener("click",e=>{ if(e.target.closest("a,button,.prompt,table")) return; go(e.clientX>innerWidth/2?idx+1:idx-1); });
  setTimeout(()=>help.style.opacity=.25,6000);

  // 프롬프트 복사
  let tt;
  function showToast(m){ toast.textContent=m; toast.classList.add("show"); clearTimeout(tt); tt=setTimeout(()=>toast.classList.remove("show"),1800); }
  document.querySelectorAll(".prompt").forEach(p=>{
    const pre=p.querySelector("pre"); if(!pre) return;
    const lbl=p.querySelector(".pl"); if(!lbl) return;
    const b=document.createElement("button"); b.className="copy"; b.type="button"; b.textContent="복사";
    b.onclick=async()=>{ try{ await navigator.clipboard.writeText(pre.innerText); showToast("프롬프트를 복사했습니다"); }catch(e){ showToast("길게 눌러 직접 복사해 주세요"); } };
    lbl.appendChild(b);
  });

  /* ===== 전체 보기(그리드뷰) · PDF 저장 · 실습 타이머 ===== */
  const grid=document.createElement("div"); grid.className="gridview"; grid.setAttribute("role","dialog"); grid.setAttribute("aria-label","전체 슬라이드");
  grid.innerHTML='<div class="gv-head"><h4>전체 슬라이드</h4><button type="button" class="gv-close" aria-label="닫기">닫기 <kbd>Esc</kbd></button></div><div class="gv-list"></div>';
  document.body.appendChild(grid);
  let gridBuilt=false;
  function buildGrid(){
    if(gridBuilt) return; gridBuilt=true;
    const list=grid.querySelector(".gv-list");
    slides.forEach((s,i)=>{
      const b=document.createElement("button"); b.type="button"; b.className="gv-item";
      const t=s.dataset.title||`슬라이드 ${i+1}`; b.setAttribute("aria-label",`${i+1}. ${t}`);
      const box=document.createElement("div"); box.className="gv-thumb";
      const c=s.cloneNode(true); c.classList.add("active","play","settle"); c.classList.remove("prev"); c.removeAttribute("data-notes");
      c.querySelectorAll("[id]").forEach(el=>el.removeAttribute("id")); c.querySelectorAll("button,a").forEach(el=>el.setAttribute("tabindex","-1"));
      c.setAttribute("aria-hidden","true"); box.appendChild(c);
      const cap=document.createElement("span"); cap.className="gv-cap"; cap.textContent=`${i+1}. ${t}`;
      b.append(box,cap); b.onclick=()=>{ closeGrid(); go(i); };
      list.appendChild(b);
    });
  }
  function scaleGrid(){ const t=grid.querySelector(".gv-thumb"); if(t&&t.clientWidth) grid.style.setProperty("--gvs",(t.clientWidth/1280).toFixed(4)); }
  addEventListener("resize",()=>{ if(grid.classList.contains("open")) scaleGrid(); });
  function openGrid(){ buildGrid(); grid.classList.add("open"); scaleGrid(); grid.querySelectorAll(".gv-item").forEach((b,i)=>b.classList.toggle("cur",i===idx)); const cur=grid.querySelectorAll(".gv-item")[idx]; if(cur){ cur.scrollIntoView({block:"center"}); cur.focus({preventScroll:true}); } }
  function closeGrid(){ grid.classList.remove("open"); }
  grid.querySelector(".gv-close").onclick=closeGrid;
  function printPdf(){ closeGrid(); toc.classList.remove("open"); window.print(); }
  // 하단 조작 바에 버튼 추가 (각 덱 HTML 은 손대지 않음)
  const tocBtnEl=$("tocBtn");
  if(tocBtnEl){
    const gb=document.createElement("button"); gb.type="button"; gb.id="gridBtn"; gb.title="전체 보기 (G)"; gb.setAttribute("aria-label","전체 슬라이드 보기"); gb.textContent="▦"; gb.onclick=openGrid;
    const pb=document.createElement("button"); pb.type="button"; pb.id="pdfBtn"; pb.title="PDF 저장 (P)"; pb.setAttribute("aria-label","PDF로 저장"); pb.textContent="⎙"; pb.onclick=printPdf;
    tocBtnEl.after(gb,pb);
  }
  addEventListener("keydown",e=>{
    if(e.target.closest&&e.target.closest("input,textarea,select")) return;
    const k=(e.key||"").toLowerCase();
    if(k==="g"||k==="ㅎ"){ e.preventDefault(); grid.classList.contains("open")?closeGrid():openGrid(); }
    else if((k==="p"||k==="ㅔ")&&!e.ctrlKey&&!e.metaKey){ e.preventDefault(); printPdf(); }
    else if(k==="escape") closeGrid();
  },true);
  const helpEl=$("help"); if(helpEl&&!/전체 보기/.test(helpEl.textContent)) helpEl.insertAdjacentHTML("beforeend"," · <kbd>G</kbd> 전체 보기 · <kbd>P</kbd> PDF");

  // 실습 타이머 : 눈썹 라벨에 "실습 … N분" 이 있으면 타이머 버튼 부착. 클릭 시작/일시정지, 더블클릭 초기화. 벽시계 기준
  slides.forEach(s=>{
    const eb=s.querySelector(".eyebrow"); if(!eb) return;
    const m=eb.textContent.match(/실습[^\d]*.*?(\d+)\s*분/); if(!m) return;
    const total=parseInt(m[1],10)*60; let left=total, endAt=0, iv=null;
    const b=document.createElement("button"); b.type="button"; b.className="tchip"; b.title="클릭 시작·정지 · 더블클릭 초기화";
    const fmt=v=>String(Math.floor(v/60)).padStart(2,"0")+":"+String(v%60).padStart(2,"0");
    const paint=()=>{ b.textContent="⏱ "+fmt(Math.max(0,left)); b.classList.toggle("run",!!iv); b.classList.toggle("warn",left<=60&&left>0); b.classList.toggle("done",left<=0); b.setAttribute("aria-label","실습 타이머 "+fmt(Math.max(0,left))+(iv?" 진행 중":"")); };
    const tick=()=>{ left=Math.round((endAt-Date.now())/1000); if(left<=0){ left=0; clearInterval(iv); iv=null; } paint(); };
    b.onclick=e=>{ e.stopPropagation(); if(iv){ clearInterval(iv); iv=null; paint(); return; } if(left<=0) left=total; endAt=Date.now()+left*1000; iv=setInterval(tick,250); paint(); };
    b.ondblclick=e=>{ e.stopPropagation(); clearInterval(iv); iv=null; left=total; paint(); };
    paint(); s.appendChild(b);
  });

  window.DECK={ go, get index(){ return idx; }, total, slides, onChange:f=>listeners.push(f), notesOf:i=>slides[i]?.dataset.notes||"", titleOf:i=>slides[i]?.dataset.title||"" };
  fit(); fromHash();
})();

/* ===== 슬라이드 동기화 : 강사 화면을 수강생이 따라감 ===== */
(function(){
  const D=window.DECK; if(!D) return;
  const params=new URLSearchParams(location.search);
  const isPresenter=params.get("presenter")==="1";
  const isPreview=params.get("preview")==="1";
  const deckId=(location.pathname.split("/").pop()||"index.html").replace(/\.html$/,"");
  const url=(window.GATE_CONFIG&&window.GATE_CONFIG.apiUrl)||"";
  const pin=params.get("pin")||"";
  let bc=null; try{ bc=new BroadcastChannel("vibe4-sync"); }catch(e){}
  if(isPreview){ document.body.classList.add("preview"); }

  // 부모(강사 콘솔)와의 통신
  function report(i){ if(window.parent!==window){ window.parent.postMessage({type:"vibe4-state",deck:deckId,index:i,total:D.total,title:D.titleOf(i),notes:D.notesOf(i)},"*"); } }
  addEventListener("message",e=>{ const m=e.data||{}; if(m.type!=="vibe4-cmd") return;
    if(m.cmd==="next") D.go(D.index+1,true,"sync"); else if(m.cmd==="prev") D.go(D.index-1,true,"sync"); else if(m.cmd==="go") D.go(+m.index,true,"sync"); else if(m.cmd==="setpin"){ pinNow=m.pin; if(typeof resend==="function") resend(); } });
  let resend=null;
  let pinNow=pin;
  if(isPreview){ D.onChange(report); report(D.index); return; }

  // 배지 UI
  const badge=document.createElement("div"); badge.className="sync"; badge.id="sync"; document.body.appendChild(badge);
  let follow=!isPresenter, on=false, followers=0, remote=null, err="";
  function render(){
    if(isPresenter){ const idle=apiOk&&!pinNow; badge.innerHTML=`<span class="dot ${err?"bad":(idle?"":"live")}"></span>${err?err:(idle?"강사 모드 · 동기화 대기":"강사 모드 · 전송 중")}${(url&&!idle)?` · 접속 ${followers}명`:""}`; badge.style.display="flex"; return; }
    if(!on){ badge.style.display="none"; return; }
    badge.style.display="flex";
    badge.innerHTML = follow
      ? `<span class="dot live"></span>강사 화면 따라가는 중 <button type="button" id="syncFree">자유 보기</button>`
      : `<span class="dot"></span>자유 보기 중 <button type="button" id="syncBack">강사 화면으로</button>`;
    const f=document.getElementById("syncFree"), b=document.getElementById("syncBack");
    if(f) f.onclick=()=>{ follow=false; render(); };
    if(b) b.onclick=()=>{ follow=true; if(remote!=null) D.go(remote,true,"sync"); render(); };
  }
  async function post(data){ const r=await fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(data),redirect:"follow"}); if(!r.ok) throw new Error("http "+r.status); return r.json(); }
  const client=(()=>{ try{ let c=sessionStorage.getItem("vibe4_client"); if(!c){ c=Math.random().toString(36).slice(2,10); sessionStorage.setItem("vibe4_client",c); } return c; }catch(e){ return Math.random().toString(36).slice(2,10); } })();

  let apiOk=!!url;   // API 가 실제로 응답하는지 (없으면 같은 PC 창 모드)
  if(isPresenter){
    // 강사 : 장이 바뀔 때마다 전송 + 20초마다 유지 신호
    let last=-1, sentAt=0;
    async function send(i,force){
      if(bc) bc.postMessage({deck:deckId,index:i,on:!!(pinNow||!apiOk)});
      report(i);
      if(!apiOk){ err=""; render(); if(window.parent!==window) window.parent.postMessage({type:"vibe4-sync",ok:true,local:true},"*"); return; }
      if(!pinNow){ err=""; last=-1; render(); if(window.parent!==window) window.parent.postMessage({type:"vibe4-sync",ok:true,idle:true},"*"); return; }   // 동기화 꺼짐 : 서버로 보내지 않음
      if(i===last&&!force) return; last=i; sentAt=Date.now();
      try{ const r=await post({action:"sync_set",deck:deckId,index:i,pin:pinNow,client}); if(r&&r.ok){ err=""; followers=r.followers||0; } else { err=(r&&r.reason==="pin")?"비밀번호가 틀렸습니다":(r&&r.reason==="locked")?"비밀번호 잠김 (10분)":(r&&r.reason==="data_dir")?"api/data 폴더 쓰기 권한 필요":"전송 실패"; } }
      catch(e){ err="서버 연결 실패"; }
      render(); if(window.parent!==window) window.parent.postMessage({type:"vibe4-sync",ok:!err,err,followers},"*");
    }
    resend=()=>send(D.index,true);
    D.onChange(i=>send(i,false)); send(D.index,true);
    if(url){ (async()=>{ try{ const r=await post({action:"ping"}); apiOk=!!(r&&r.ok); }catch(e){ apiOk=false; } send(D.index,true); })(); }
    // 켜짐 상태는 서버에 저장되므로 유지 신호 대신 20초마다 상태 확인 : 다른 화면(관리자)이 끄면 강사 콘솔도 꺼짐으로 맞춤
    setInterval(async()=>{
      if(!apiOk||!pinNow) return;
      try{ const r=await post({action:"sync_get",deck:deckId});
        if(r&&r.ok){ followers=r.followers||0;
          if(!r.on&&Date.now()-sentAt>5000){ pinNow=""; last=-1; if(window.parent!==window) window.parent.postMessage({type:"vibe4-sync",remoteOff:true},"*"); }
          render(); }
      }catch(e){}
    },20000);
    addEventListener("beforeunload",()=>{ if(bc) bc.postMessage({deck:deckId,index:D.index,on:false}); });
    render();
  } else {
    // 수강생 : 같은 PC 는 즉시, 다른 기기는 2.5초마다 확인
    function apply(st){
      if(!st||st.deck!==deckId) return;
      on=!!st.on; if(typeof st.followers==="number") followers=st.followers;
      if(on&&typeof st.index==="number"){ remote=st.index; if(follow&&st.index!==D.index) D.go(st.index,true,"sync"); }
      render();
    }
    if(bc) bc.onmessage=e=>apply(e.data);
    D.onChange((i,source)=>{ if(source==="user"&&on&&follow&&remote!=null&&i!==remote){ follow=false; render(); } });
    if(url){
      let fails=0, timer=null;
      async function poll(){
        try{ const r=await post({action:"sync_get",deck:deckId,client}); fails=0; if(r&&r.ok) apply({deck:deckId,on:r.on,index:r.index,followers:r.followers}); }
        catch(e){ if(++fails>=3){ clearInterval(timer); } }   // API 가 없는 서버(깃허브 페이지 등)에서는 조용히 멈춤
      }
      poll(); timer=setInterval(poll,2500);
    }
    render();
  }
})();
