/* NDT Masterclass Academy — rebuilt Learning Academy (isolated, no legacy renderer dependency) */
(() => {
  "use strict";
  if (window.NDTLearningAcademy && window.NDTLearningAcademy.__ready) return;
  const STORE = "ndt-masterclass-learning-academy-v2";
  const $ = (id, root=document) => root.getElementById(id);
  const esc = value => String(value == null ? "" : value).replace(/[&<>"']/g, ch => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  })[ch]);
  const getModules = () => {
    const rows = window.UTMA_DATA && Array.isArray(window.UTMA_DATA.modules) ? window.UTMA_DATA.modules : [];
    return rows.filter(m => m && m.id && m.title && Array.isArray(m.sections));
  };
  const load = () => {
    try {
      const raw = JSON.parse(localStorage.getItem(STORE) || "{}");
      return raw && typeof raw === "object" && raw.completed && typeof raw.completed === "object" ? raw : {completed:{}};
    } catch (_) { return {completed:{}}; }
  };
  let data = load();
  let filter = "";
  let phase = "All";
  let activeId = null;
  let root = null;
  const save = () => { try { localStorage.setItem(STORE, JSON.stringify(data)); } catch (_) {} };
  const modules = () => getModules();
  const active = () => modules().find(m => m.id === activeId);
  const completedCount = () => modules().filter(m => !!data.completed[m.id]).length;
  const safeRoot = () => {
    root = $("app");
    if (!root) return false;
    return true;
  };
  const crumb = label => '<div class="breadcrumbs"><button class="btn btn-outline" data-la="home">← Learning Academy</button><span>›</span><span>'+esc(label)+'</span></div>';
  const progressBar = () => {
    const all = modules(), done = completedCount(), pct = all.length ? Math.round(done/all.length*100) : 0;
    return '<div class="la-progress-head"><div><strong>'+done+' of '+all.length+'</strong><span> modules completed</span></div><strong>'+pct+'%</strong></div><div class="progress-track"><span style="width:'+pct+'%"></span></div>';
  };
  function renderIndex() {
    if (!safeRoot()) return;
    const all = modules();
    if (!all.length) {
      root.innerHTML = '<section class="page-hero"><div class="eyebrow">Structured course • Theory only</div><h1>Learning Academy</h1><p>Learning content is unavailable right now. Refresh the page to reload the course data.</p><button class="btn btn-primary" data-la="retry">Reload learning content</button></section>';
      return;
    }
    const phases = ["All", ...new Set(all.map(m => m.phase || m.level || "Core"))];
    const shown = all.filter(m => (!filter || (m.title+" "+m.summary+" "+(m.objectives||[]).join(" ")+" "+(m.sections||[]).map(s=>s.join(" ")).join(" ")).toLowerCase().includes(filter.toLowerCase())) && (phase === "All" || (m.phase || m.level || "Core") === phase));
    root.innerHTML = crumb("Learning Academy") +
      '<section class="page-hero"><div class="eyebrow">Structured course • Theory only</div><h1>Learning Academy: foundations to field application</h1><p>Study each concept in order, review the objectives, work through detailed explanations and mark a module complete when you are confident. This is a self-learning record, not an NDT personnel certification.</p><div class="la-top-progress">'+progressBar()+'</div></section>' +
      '<div class="toolbar"><input class="field" id="laSearch" value="'+esc(filter)+'" placeholder="Search lessons, concepts or keywords…" aria-label="Search learning modules"><select id="laPhase" aria-label="Filter by course phase">'+phases.map(p=>'<option value="'+esc(p)+'" '+(p===phase?'selected':'')+'>'+esc(p==='All'?'All course phases':p)+'</option>').join("")+'</select><span class="small" style="align-self:center">'+shown.length+' of '+all.length+' modules</span></div>' +
      '<div class="grid two la-module-grid">'+shown.map((m,i)=>{
        const done=!!data.completed[m.id], pos=all.findIndex(x=>x.id===m.id)+1;
        return '<article class="card la-module-card"><div class="la-module-meta"><span class="tag">'+esc(m.phase||m.level||"Core")+'</span><span class="small">'+esc(m.time||"Self-paced")+'</span></div><div class="la-module-number">'+String(pos).padStart(2,"0")+'</div><h3>'+esc(m.title)+'</h3><p>'+esc(m.summary||m.sections[0]?.[1]||"Study the core concepts and practical context.")+'</p>' +
        (m.objectives&&m.objectives.length?'<details class="la-objectives"><summary>Learning objectives ('+m.objectives.length+')</summary><ul>'+m.objectives.map(o=>'<li>'+esc(o)+'</li>').join("")+'</ul></details>':'')+
        '<div class="la-module-footer"><span class="small '+(done?'la-done':'')+'">'+(done?'✓ Completed':'○ Not completed')+'</span><button class="btn btn-primary" data-la="open" data-id="'+esc(m.id)+'">Study module →</button></div></article>';
      }).join("")+'</div>' +
      (shown.length?'':'<div class="empty">No modules match these filters. Try another keyword or select all phases.</div>')+
      '<div class="notice">Important: completing a module only records your personal study progress. It does not qualify or authorise you to perform or sign off an inspection.</div>';
    const search=$("laSearch"), phaseSelect=$("laPhase");
    if(search) search.addEventListener("input",()=>{filter=search.value;const cursor=filter.length;renderIndex();const next=$("laSearch");if(next){next.focus();next.setSelectionRange(cursor,cursor);}});
    if(phaseSelect) phaseSelect.addEventListener("change",()=>{phase=phaseSelect.value;renderIndex();});
  }
  function renderLesson(id) {
    if (!safeRoot()) return;
    const all=modules(), m=all.find(x=>x.id===id);
    if(!m){activeId=null;renderIndex();return;}
    activeId=m.id;
    const i=all.findIndex(x=>x.id===m.id), prev=all[(i-1+all.length)%all.length], next=all[(i+1)%all.length], done=!!data.completed[m.id];
    root.innerHTML=crumb(m.title)+'<div class="lesson-layout la-lesson-layout"><article class="lesson-content"><div class="kicker">'+esc(m.phase||m.level||"Core")+' • '+esc(m.time||"Self-paced")+'</div><h1>'+esc(m.title)+'</h1><p class="lesson-lead">'+esc(m.summary||"Build your understanding step by step.")+'</p>'+
      (m.objectives&&m.objectives.length?'<section class="la-objectives-panel"><h2>What you will learn</h2><ul>'+m.objectives.map(o=>'<li>'+esc(o)+'</li>').join("")+'</ul></section>':'')+
      m.sections.map((s,j)=>'<section class="la-lesson-section"><div class="la-section-count">'+String(j+1).padStart(2,"0")+'</div><div><h2>'+esc(s[0])+'</h2><p>'+esc(s[1])+'</p></div></section>').join("")+
      (m.key?'<div class="notice"><strong>Key takeaway:</strong> '+esc(m.key)+'</div>':'')+
      '<div class="la-completion"><button class="btn '+(done?'btn-soft':'btn-primary')+'" data-la="complete" data-id="'+esc(m.id)+'">'+(done?'✓ Completed — mark as not completed':'Mark module complete ✓')+'</button><span class="small">Progress saves in this browser.</span></div>'+
      '<div class="hero-actions la-pagination"><button class="btn btn-outline" data-la="open" data-id="'+esc(prev.id)+'">← Previous module</button><button class="btn btn-outline" data-la="home">All modules</button><button class="btn btn-primary" data-la="open" data-id="'+esc(next.id)+'">Next module →</button></div>'+
      '<div class="notice">Theory learning aid only. Actual inspection requires applicable procedures, equipment-specific training, supervised practical experience and the relevant qualification/authorisation.</div></article>'+
      '<aside class="lesson-aside"><div class="kicker">Module outline</div><h3>'+esc(m.title)+'</h3><p>'+esc(m.phase||m.level||"Core")+' · '+esc(m.time||"Self-paced")+'</p><ul>'+m.sections.map(s=>'<li><a href="#la-section-'+esc(m.id)+'-'+m.sections.indexOf(s)+'">'+esc(s[0])+'</a></li>').join("")+'</ul><h3>Your course progress</h3>'+progressBar()+'<button class="btn btn-dark" style="width:100%;margin-top:15px" data-la="home">Return to module list</button></aside></div>';
    root.querySelectorAll(".la-lesson-section").forEach((el,j)=>el.id="la-section-"+m.id+"-"+j);
  }
  function open(id) { if(id) renderLesson(id); else renderIndex(); window.scrollTo({top:0,behavior:"auto"}); }
  function handleClick(e) {
    const b=e.target.closest("button,a"); if(!b)return;
    if(b.matches('[data-view="academy"]') || b.matches('[data-la="home"]')) {
      e.preventDefault(); e.stopImmediatePropagation(); activeId=null; renderIndex(); window.scrollTo({top:0,behavior:"auto"}); return;
    }
    if(b.matches("[data-open-module]")) {
      e.preventDefault(); e.stopImmediatePropagation(); open(b.getAttribute("data-open-module")); return;
    }
    if(!b.matches("[data-la]"))return;
    e.preventDefault(); e.stopImmediatePropagation();
    const action=b.getAttribute("data-la");
    if(action==="open"){open(b.getAttribute("data-id"));return;}
    if(action==="complete"){
      const id=b.getAttribute("data-id"); data.completed[id]=!data.completed[id]; save(); renderLesson(id); return;
    }
    if(action==="retry"){renderIndex();return;}
  }
  function installStyle() {
    if($("la-v2-style"))return;
    const style=document.createElement("style"); style.id="la-v2-style";
    style.textContent='.la-top-progress{max-width:520px;margin-top:20px}.la-progress-head{display:flex;justify-content:space-between;gap:10px;color:var(--maroon);font-size:12px}.la-progress-head span{color:var(--muted);font-weight:400}.la-module-grid{align-items:stretch}.la-module-card{position:relative;display:flex;flex-direction:column;min-height:270px}.la-module-meta{display:flex;align-items:center;justify-content:space-between;gap:10px}.la-module-number{font-size:38px;line-height:1;font-weight:900;letter-spacing:-1px;color:#c65d241b;margin:17px 0 3px}.la-module-card h3{margin:0 0 9px}.la-module-card>p{flex:1}.la-module-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:16px;padding-top:13px;border-top:1px solid var(--line)}.la-done{color:#277747;font-weight:800}.la-objectives{font-size:12px;color:var(--muted);margin-top:5px}.la-objectives summary{cursor:pointer;color:var(--maroon);font-weight:800}.la-objectives ul,.la-objectives-panel ul{padding-left:20px}.la-objectives li,.la-objectives-panel li{font-size:12px;line-height:1.8;margin:4px 0}.la-lesson-section{display:grid;grid-template-columns:36px minmax(0,1fr);gap:13px;margin:26px 0;scroll-margin-top:100px}.la-section-count{width:34px;height:34px;display:grid;place-items:center;border-radius:11px;background:#fff0e6;color:var(--orange);font-size:11px;font-weight:900}.la-lesson-section h2{margin:2px 0 9px!important}.la-lesson-section p{margin:0!important}.la-objectives-panel{background:var(--warm);border:1px solid #ecd4c7;border-radius:15px;padding:18px;margin:22px 0}.la-objectives-panel h2{margin:0 0 8px!important}.la-completion{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:18px 0;border-top:1px solid var(--line);margin-top:26px}.la-pagination{justify-content:space-between}.la-lesson-layout .lesson-aside{min-width:0}.la-lesson-layout .lesson-aside a{font-size:12px;text-decoration:none}.la-lesson-layout .lesson-aside a:hover{text-decoration:underline}@media(max-width:760px){.la-module-footer{align-items:flex-start;flex-direction:column}.la-module-footer .btn{width:100%}.la-lesson-section{grid-template-columns:29px minmax(0,1fr);gap:9px}.la-section-count{width:28px;height:28px}.la-pagination .btn{flex:1 1 100%}}';
    document.head.appendChild(style);
  }
  window.NDTLearningAcademy={__ready:true,open,render:renderIndex,renderLesson,resetFilters(){filter="";phase="All";renderIndex();}};
  document.addEventListener("click",handleClick,true);
  document.addEventListener("DOMContentLoaded",installStyle);
  installStyle();
})();