/* Admin CMS — all mutations rely on Supabase RLS and app_metadata.role=admin. */
(() => {
  "use strict";
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const isAdmin=()=>window.utmaCurrentUser?.app_metadata?.role==="admin";
  let cache={courses:[],modules:[],lessons:[],glossary:[],resources:[],certificates:[],profiles:[],progress:[],lessonProgress:[]};
  let activeTab="courses";
  function refreshAdminNav(){
    const nav=$("academyNav");if(!nav)return;
    let button=nav.querySelector('[data-section="admin"]');
    if(isAdmin()&&!button){button=document.createElement("button");button.dataset.section="admin";button.textContent="Admin CMS";nav.appendChild(button);}
    if(!isAdmin()&&button)button.remove();
  }
  function status(text,kind=""){const el=$("adminStatus");if(el){el.textContent=text;el.className="formula-note "+kind;}}
  async function loadData(){
    const sb=window.utmaSupabase;
    const [courses,modules,lessons,glossary,resources,certificates,profiles,progress,lessonProgress]=await Promise.all([
      sb.from("courses").select("*").order("title"),
      sb.from("modules").select("*").order("position"),
      sb.from("lessons").select("*").order("position"),
      sb.from("glossary_terms").select("*").order("term"),
      sb.from("learning_resources").select("*").order("title"),
      sb.from("course_certificates").select("id,certificate_number,user_id,recipient_name,course_title,score,issued_at,revoked_at,revocation_reason").order("issued_at",{ascending:false}).limit(100),
      sb.from("profiles").select("id,display_name,learner_type,email,created_at").order("created_at",{ascending:false}).limit(100),
      sb.from("course_progress").select("user_id,completed,passed_quizzes,last_exam_result,certificate_record,saved_at").limit(100),
      sb.from("lesson_progress").select("user_id,lesson_id,completed,last_viewed_at,completed_at").limit(500)
    ]);
    const firstError=[courses,modules,lessons,glossary,resources,certificates,profiles,progress,lessonProgress].find(r=>r.error);
    if(firstError)throw firstError.error;
    cache={courses:courses.data||[],modules:modules.data||[],lessons:lessons.data||[],glossary:glossary.data||[],resources:resources.data||[],certificates:certificates.data||[],profiles:profiles.data||[],progress:progress.data||[],lessonProgress:lessonProgress.data||[]};
  }
  function setTab(tab){
    activeTab=tab;
    document.querySelectorAll("[data-admin-tab]").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.adminTab===tab));});
    document.querySelectorAll("[data-admin-panel]").forEach(p=>p.classList.toggle("hidden",p.dataset.adminPanel!==tab));
  }
  function formField(label,id,type="text",value="",placeholder=""){
    return '<label class="admin-field">'+esc(label)+'<input class="formula-control" id="'+id+'" type="'+type+'" value="'+esc(value)+'" placeholder="'+esc(placeholder)+'"></label>';
  }
  function selectField(label,id,options,emptyLabel){
    return '<label class="admin-field">'+esc(label)+'<select class="formula-control" id="'+id+'"><option value="">'+esc(emptyLabel||"Select…")+'</option>'+options.map(o=>'<option value="'+esc(o.value)+'">'+esc(o.label)+'</option>').join("")+'</select></label>';
  }
  function listRows(items,titleField,idField,metaField,tab){
    if(!items.length)return '<div class="formula-empty">No '+esc(tab)+' records yet.</div>';
    return '<div class="admin-list">'+items.map(item=>'<div class="admin-row"><div><b>'+esc(item[titleField])+'</b><small>'+esc(item[metaField]??"")+'</small></div><div class="admin-row-actions"><span class="formula-tag">'+(item.is_published===undefined?"Record":item.is_published?"Published":"Draft")+'</span><button class="btn btn-outline" data-admin-edit="'+esc(tab)+'" data-id="'+esc(item[idField])+'">Edit</button></div></div>').join("")+'</div>';
  }
  function render(){
    const page=$("page");
    page.innerHTML='<section class="hero"><div class="eyebrow">Restricted administration</div><h1>Academy Admin CMS</h1><p>Create and edit published course content, lessons, glossary terms and resources. Admin actions are enforced by Supabase Row Level Security using the trusted app_metadata role claim.</p><div class="hero-actions"><button class="btn btn-outline" data-back-academy>← Learning Academy</button><button class="btn btn-outline" id="adminReload">Refresh records</button></div></section><div id="adminStatus" class="formula-note">Loading protected records…</div><div class="admin-tabs">'+[["courses","Courses"],["modules","Modules"],["lessons","Lessons"],["glossary","Glossary"],["resources","Resources"],["learners","Learners & progress"],["certificates","Certificates"]].map(t=>'<button class="btn btn-outline" data-admin-tab="'+t[0]+'" aria-pressed="'+(t[0]===activeTab)+'">'+t[1]+'</button>').join("")+'</div><div id="adminPanels">'+
      '<section data-admin-panel="courses"><div class="formula-card"><h3>Course editor</h3><input type="hidden" id="courseId"><div class="admin-form-grid">'+formField("Slug","courseSlug")+formField("Title","courseTitle")+formField("Difficulty","courseDifficulty")+formField("Description","courseDescription")+ '<label class="admin-check"><input type="checkbox" id="coursePublished" checked> Published</label></div><div class="formula-actions"><button class="btn btn-primary" id="saveCourse">Save course</button><button class="btn btn-outline" id="clearCourse">Clear</button></div></div><h3 class="admin-section-title">Existing courses</h3><div id="courseRows"></div></section>'+
      '<section data-admin-panel="modules" class="hidden"><div class="formula-card"><h3>Module editor</h3><input type="hidden" id="moduleId"><div class="admin-form-grid">'+selectField("Course","moduleCourse",cache.courses.map(x=>({value:x.id,label:x.title})),"Choose course")+formField("Position","modulePosition","number","1")+formField("Title","moduleTitle")+formField("Description","moduleDescription")+'<label class="admin-check"><input type="checkbox" id="modulePublished" checked> Published</label></div><div class="formula-actions"><button class="btn btn-primary" id="saveModule">Save module</button><button class="btn btn-outline" id="clearModule">Clear</button></div></div><h3 class="admin-section-title">Existing modules</h3><div id="moduleRows"></div></section>'+
      '<section data-admin-panel="lessons" class="hidden"><div class="formula-card"><h3>Lesson editor</h3><input type="hidden" id="lessonId"><div class="admin-form-grid">'+selectField("Module","lessonModule",cache.modules.map(x=>({value:x.id,label:(cache.courses.find(c=>c.id===x.course_id)?.title||"Course")+" · "+x.position+". "+x.title})),"Choose module")+formField("Position","lessonPosition","number","1")+formField("Slug","lessonSlug")+formField("Title","lessonTitle")+formField("Difficulty","lessonDifficulty","text","Beginner")+'<label class="admin-field admin-wide">Lesson content (JSON)<textarea class="formula-control" id="lessonContent" rows="10" placeholder="{ &quot;introduction&quot;: &quot;...&quot;, &quot;learning_objectives&quot;: [] }"></textarea></label><label class="admin-check"><input type="checkbox" id="lessonPublished" checked> Published</label></div><div class="formula-actions"><button class="btn btn-primary" id="saveLesson">Save lesson</button><button class="btn btn-outline" id="clearLesson">Clear</button></div></div><h3 class="admin-section-title">Existing lessons</h3><div id="lessonRows"></div></section>'+
      '<section data-admin-panel="glossary" class="hidden"><div class="formula-card"><h3>Glossary editor</h3><input type="hidden" id="glossaryId"><div class="admin-form-grid">'+formField("Term","glossaryTerm")+formField("Method","glossaryMethod","text","General")+'<label class="admin-field admin-wide">Definition<textarea class="formula-control" id="glossaryDefinition" rows="4"></textarea></label><label class="admin-check"><input type="checkbox" id="glossaryPublished" checked> Published</label></div><div class="formula-actions"><button class="btn btn-primary" id="saveGlossary">Save term</button><button class="btn btn-outline" id="clearGlossary">Clear</button></div></div><h3 class="admin-section-title">Existing terms</h3><div id="glossaryRows"></div></section>'+
      '<section data-admin-panel="resources" class="hidden"><div class="formula-card"><h3>Resource editor</h3><input type="hidden" id="resourceId"><div class="admin-form-grid">'+formField("Title","resourceTitle")+formField("Category","resourceCategory","text","General")+formField("Type","resourceType","text","article")+formField("URL (optional if uploading)","resourceUrl","url")+'<label class="admin-field admin-wide">Description<textarea class="formula-control" id="resourceDescription" rows="3"></textarea></label><label class="admin-field admin-wide">Upload diagram or document<input class="formula-control" id="resourceFile" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.svg,.txt,.md"></label><label class="admin-check"><input type="checkbox" id="resourcePublished" checked> Published</label></div><div class="formula-actions"><button class="btn btn-primary" id="saveResource">Save resource</button><button class="btn btn-outline" id="clearResource">Clear</button></div></div><h3 class="admin-section-title">Existing resources</h3><div id="resourceRows"></div></section>'+
      '<section data-admin-panel="learners" class="hidden"><div class="formula-summary"><div class="formula-stat"><strong>'+cache.profiles.length+'</strong><span>Profile records</span></div><div class="formula-stat"><strong>'+cache.progress.length+'</strong><span>Course progress records</span></div><div class="formula-stat"><strong>'+cache.lessonProgress.filter(x=>x.completed).length+'</strong><span>Database lessons completed</span></div></div><div class="formula-card"><h3>Student learning progress</h3><div class="admin-table-wrap"><table class="formula-vars"><thead><tr><th>Learner</th><th>Category</th><th>Completed classes</th><th>Passed quizzes</th><th>Last saved</th></tr></thead><tbody>'+cache.profiles.map(p=>{const progress=cache.progress.find(x=>x.user_id===p.id)||{};return '<tr><td>'+esc(p.display_name)+'<br><small>'+esc(p.email||"")+'</small></td><td>'+esc(p.learner_type)+'</td><td>'+((progress.completed||[]).length)+'/24</td><td>'+((progress.passed_quizzes||[]).length)+'/24</td><td>'+esc(progress.saved_at?new Date(progress.saved_at).toLocaleString():"—")+'</td></tr>';}).join("")+'</tbody></table></div></div></section>'+
      '<section data-admin-panel="certificates" class="hidden"><div class="formula-card"><h3>Revoke a certificate</h3><p>Revocation updates the server-side certificate record; public verification will show it as revoked.</p><div class="admin-form-grid">'+selectField("Certificate","revokeCertificate",cache.certificates.map(x=>({value:x.certificate_number,label:x.certificate_number+" · "+x.recipient_name+(x.revoked_at?" · REVOKED":"")})),"Choose certificate")+'<label class="admin-field admin-wide">Reason<textarea id="revokeReason" class="formula-control" rows="3" placeholder="Reason for revocation"></textarea></label></div><button class="btn btn-primary" id="revokeCertificateButton">Revoke selected certificate</button></div><h3 class="admin-section-title">Certificate records</h3><div class="admin-list">'+cache.certificates.map(x=>'<div class="admin-row"><div><b>'+esc(x.certificate_number)+'</b><small>'+esc(x.recipient_name)+' · '+esc(x.course_title)+' · '+esc(x.score)+'%</small></div><span class="formula-tag">'+(x.revoked_at?"Revoked":"Active")+'</span></div>').join("")+'</div></section>'+
      '</div>';
    attachStyles();
    document.querySelectorAll("[data-admin-tab]").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.adminTab)));
    document.querySelectorAll("[data-back-academy]").forEach(b=>b.onclick=()=>{window.utmaOpenSection?.("academy");});
    $("adminReload").onclick=()=>openAdmin();
    renderLists();bindForms();setTab(activeTab);
  }
  function attachStyles(){
    if($("adminStyles"))return;const s=document.createElement("style");s.id="adminStyles";s.textContent='.admin-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:18px 0}.admin-tabs button[aria-pressed="true"]{background:var(--maroon);color:#fff}.admin-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin-top:14px}.admin-field{display:grid;gap:6px;font-size:11px;font-weight:700;color:var(--maroon)}.admin-wide{grid-column:1/-1}.admin-check{display:flex;align-items:center;gap:8px;font-size:12px;color:var(--maroon)}.admin-section-title{font:800 15px Manrope;color:var(--maroon);margin:24px 0 10px}.admin-list{display:grid;gap:8px}.admin-row{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px;background:#fff;border:1px solid var(--line);border-radius:10px}.admin-row b{display:block;font-size:12px;color:var(--maroon)}.admin-row small{display:block;font-size:10px;color:var(--muted);margin-top:4px}.admin-row-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}.admin-table-wrap{overflow:auto}.admin-table-wrap table{min-width:600px}.admin-table-wrap small{color:var(--muted)}@media(max-width:600px){.admin-form-grid{grid-template-columns:1fr}.admin-wide{grid-column:auto}.admin-row{align-items:flex-start;flex-direction:column}}';document.head.appendChild(s);
  }
  function renderLists(){
    $("courseRows").innerHTML=listRows(cache.courses,"title","id","slug","courses");
    $("moduleRows").innerHTML=listRows(cache.modules,"title","id","description","modules");
    $("lessonRows").innerHTML=listRows(cache.lessons,"title","id","slug","lessons");
    $("glossaryRows").innerHTML=listRows(cache.glossary,"term","id","method","glossary");
    $("resourceRows").innerHTML=listRows(cache.resources,"title","id","category","resources");
    document.querySelectorAll("[data-admin-edit]").forEach(b=>b.addEventListener("click",()=>editRecord(b.dataset.adminEdit,b.dataset.id)));
  }
  function editRecord(tab,id){
    setTab(tab);
    const item=({courses:cache.courses,modules:cache.modules,lessons:cache.lessons,glossary:cache.glossary,resources:cache.resources}[tab]||[]).find(x=>String(x.id)===String(id));if(!item)return;
    const set=(id,value)=>{const el=$(id);if(el)el.value=value??"";};
    const check=(id,value)=>{const el=$(id);if(el)el.checked=!!value;};
    if(tab==="courses"){set("courseId",item.id);set("courseSlug",item.slug);set("courseTitle",item.title);set("courseDifficulty",item.difficulty);set("courseDescription",item.description);check("coursePublished",item.is_published);}
    if(tab==="modules"){set("moduleId",item.id);set("moduleCourse",item.course_id);set("modulePosition",item.position);set("moduleTitle",item.title);set("moduleDescription",item.description);check("modulePublished",item.is_published);}
    if(tab==="lessons"){set("lessonId",item.id);set("lessonModule",item.module_id);set("lessonPosition",item.position);set("lessonSlug",item.slug);set("lessonTitle",item.title);set("lessonDifficulty",item.difficulty);set("lessonContent",JSON.stringify(item.content||{},null,2));check("lessonPublished",item.is_published);}
    if(tab==="glossary"){set("glossaryId",item.id);set("glossaryTerm",item.term);set("glossaryMethod",item.method);set("glossaryDefinition",item.definition);check("glossaryPublished",item.is_published);}
    if(tab==="resources"){set("resourceId",item.id);set("resourceTitle",item.title);set("resourceCategory",item.category);set("resourceType",item.resource_type);set("resourceUrl",item.url);set("resourceDescription",item.description);check("resourcePublished",item.is_published);}
    status("Editing: "+(item.title||item.term||item.slug));
  }
  function clear(ids){ids.forEach(id=>{const el=$(id);if(!el)return;if(el.type==="checkbox")el.checked=true;else el.value="";});}
  function bindForms(){
    const sb=window.utmaSupabase;
    $("saveCourse").onclick=async()=>{try{const row={slug:$("courseSlug").value.trim(),title:$("courseTitle").value.trim(),difficulty:$("courseDifficulty").value.trim()||"Beginner",description:$("courseDescription").value.trim(),is_published:$("coursePublished").checked,updated_at:new Date().toISOString()};if(!row.slug||!row.title)throw new Error("Course slug and title are required.");const id=$("courseId").value;const result=id?await sb.from("courses").update(row).eq("id",id):await sb.from("courses").insert(row);if(result.error)throw result.error;status("Course saved.");await openAdmin();}catch(e){status(e.message||"Could not save course.");}};
    $("clearCourse").onclick=()=>clear(["courseId","courseSlug","courseTitle","courseDifficulty","courseDescription"]);
    $("saveModule").onclick=async()=>{try{const row={course_id:$("moduleCourse").value,position:Number($("modulePosition").value),title:$("moduleTitle").value.trim(),description:$("moduleDescription").value.trim(),is_published:$("modulePublished").checked,updated_at:new Date().toISOString()};if(!row.course_id||!row.title||row.position<1)throw new Error("Choose a course and provide module position and title.");const id=$("moduleId").value;const result=id?await sb.from("modules").update(row).eq("id",id):await sb.from("modules").upsert(row,{onConflict:"course_id,position"});if(result.error)throw result.error;status("Module saved.");await openAdmin();}catch(e){status(e.message||"Could not save module.");}};
    $("clearModule").onclick=()=>clear(["moduleId","moduleCourse","modulePosition","moduleTitle","moduleDescription"]);
    $("saveLesson").onclick=async()=>{try{let content;try{content=JSON.parse($("lessonContent").value||"{}");}catch{throw new Error("Lesson content must be valid JSON.");}const row={module_id:$("lessonModule").value,position:Number($("lessonPosition").value),slug:$("lessonSlug").value.trim(),title:$("lessonTitle").value.trim(),difficulty:$("lessonDifficulty").value.trim()||"Beginner",content,is_published:$("lessonPublished").checked,updated_at:new Date().toISOString()};if(!row.module_id||!row.slug||!row.title||row.position<1)throw new Error("Choose a module and provide position, slug and title.");const id=$("lessonId").value;const result=id?await sb.from("lessons").update(row).eq("id",id):await sb.from("lessons").upsert(row,{onConflict:"slug"});if(result.error)throw result.error;status("Lesson saved.");await openAdmin();}catch(e){status(e.message||"Could not save lesson.");}};
    $("clearLesson").onclick=()=>clear(["lessonId","lessonModule","lessonPosition","lessonSlug","lessonTitle","lessonDifficulty","lessonContent"]);
    $("saveGlossary").onclick=async()=>{try{const row={term:$("glossaryTerm").value.trim(),method:$("glossaryMethod").value.trim()||"General",definition:$("glossaryDefinition").value.trim(),is_published:$("glossaryPublished").checked,updated_at:new Date().toISOString()};if(!row.term||!row.definition)throw new Error("Term and definition are required.");const id=$("glossaryId").value;const result=id?await sb.from("glossary_terms").update(row).eq("id",id):await sb.from("glossary_terms").upsert(row,{onConflict:"term"});if(result.error)throw result.error;status("Glossary term saved.");await openAdmin();}catch(e){status(e.message||"Could not save glossary term.");}};
    $("clearGlossary").onclick=()=>clear(["glossaryId","glossaryTerm","glossaryMethod","glossaryDefinition"]);
    $("saveResource").onclick=async()=>{try{let url=$("resourceUrl").value.trim();const file=$("resourceFile").files?.[0];if(file){const safe=file.name.replace(/[^a-zA-Z0-9._-]/g,"-");const path="published/"+Date.now()+"-"+safe;const {error:uploadError}=await sb.storage.from("academy-resources").upload(path,file,{upsert:true,contentType:file.type||"application/octet-stream"});if(uploadError)throw uploadError;url=sb.storage.from("academy-resources").getPublicUrl(path).data.publicUrl;}const row={title:$("resourceTitle").value.trim(),category:$("resourceCategory").value.trim()||"General",resource_type:$("resourceType").value.trim()||"article",url:url||null,description:$("resourceDescription").value.trim(),is_published:$("resourcePublished").checked,updated_at:new Date().toISOString()};if(!row.title)throw new Error("Resource title is required.");const id=$("resourceId").value;const result=id?await sb.from("learning_resources").update(row).eq("id",id):await sb.from("learning_resources").insert(row);if(result.error)throw result.error;status("Resource saved.");await openAdmin();}catch(e){status(e.message||"Could not save resource.");}};
    $("clearResource").onclick=()=>clear(["resourceId","resourceTitle","resourceCategory","resourceType","resourceUrl","resourceDescription"]);
    $("revokeCertificateButton").onclick=async()=>{try{const number=$("revokeCertificate").value,reason=$("revokeReason").value.trim();if(!number||!reason)throw new Error("Choose a certificate and provide a revocation reason.");const {error}=await sb.from("course_certificates").update({revoked_at:new Date().toISOString(),revocation_reason:reason}).eq("certificate_number",number).is("revoked_at",null);if(error)throw error;status("Certificate revocation saved. Public verification will show the revoked status.");await openAdmin();setTab("certificates");}catch(e){status(e.message||"Could not revoke certificate.");}};
  }
  async function openAdmin(){
    if(!isAdmin()){$("page").innerHTML='<section class="hero"><div class="eyebrow">Restricted area</div><h1>Admin access required</h1><p>This area requires a trusted Supabase Auth app_metadata role claim set to admin. A client-side profile field is not sufficient.</p></section><div class="formula-note">An authorized project administrator must assign app_metadata.role = "admin" in Supabase Auth for the intended administrator account.</div>';return;}
    $("page").innerHTML='<section class="hero"><h1>Academy Admin CMS</h1><p>Loading protected content…</p></section>';
    try{await loadData();render();status("Protected records loaded. Database policies control every write.");}
    catch(e){$("page").innerHTML='<section class="hero"><h1>Admin CMS</h1><p>Could not load protected records.</p></section><div class="formula-note">'+esc(e.message||"Check the admin role claim and Supabase RLS policies.")+'</div>';}
  }
  window.utmaOpenAdmin=()=>openAdmin();
  document.addEventListener("DOMContentLoaded",()=>{
    refreshAdminNav();
    window.addEventListener("utma:auth-updated",refreshAdminNav);
    window.addEventListener("utma:admin-open",openAdmin);
    const nav=$("academyNav");if(nav)nav.addEventListener("click",e=>{const b=e.target.closest('[data-section="admin"]');if(b)openAdmin();});
  });
})();
