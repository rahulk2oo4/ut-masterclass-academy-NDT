/* NDT Masterclass — per-method learning, examinations and educational certificates */
(function(){
"use strict";
var api=window.NDT_MASTERCLASS;
if(!api)return;
var root=document.getElementById("app");
var config=window.UT_SUPABASE_CONFIG||{};
var METHOD_TOPICS=[
["objective","Fundamentals","Objective and inspection scope"],["principle","Fundamentals","Physical principle"],["terminology","Fundamentals","Terminology and relevant physics"],["materials","Fundamentals","Material compatibility"],["targets","Fundamentals","Target discontinuities"],
["capability","Equipment & Setup","Inspection capability"],["equipment","Equipment & Setup","Equipment architecture"],["sensor","Equipment & Setup","Probe, sensor, source or detector selection"],["parameters","Equipment & Setup","Parameter selection and sensitivity"],["calibration","Equipment & Setup","Calibration and reference standards"],
["preparation","Technique & Interpretation","Surface preparation and environment"],["workflow","Technique & Interpretation","Examination workflow"],["signals","Technique & Interpretation","Signal or image formation"],["interpretation","Technique & Interpretation","Indication interpretation"],["sizing","Technique & Interpretation","Sizing and uncertainty"],
["coverage","Quality & Safety","Coverage and access"],["geometry","Quality & Safety","Geometry and orientation"],["false","Quality & Safety","False and misleading indications"],["troubleshooting","Quality & Safety","Troubleshooting and common mistakes"],["safety","Quality & Safety","Safety and consumables"],
["repeatability","Applications & Reporting","Data quality and repeatability"],["applications","Applications & Reporting","Industry applications"],["case","Applications & Reporting","Applied case study"],["reporting","Applications & Reporting","Reporting and acceptance"],["competence","Applications & Reporting","Personnel competence and career relevance"]
];
var ui={
 page:"exams",stack:[],courseMethod:"ut",lessonId:null,
 progress:readLocalProgress(),cloudProgress:{},cloudLoaded:false,user:null,session:null,
 error:"",notice:"",exam:null,result:null,history:[],certificateList:[],historyMethod:"ut",timer:null,submitting:false
};
var answerSaveTimer=null;
function esc(v){return String(v==null?"":v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function methods(){return api.methods||[];}
function getMethod(id){return methods().find(function(m){return m.id===id;})||methods()[0];}
function getTopics(id){
 try{if(window.NDT_MASTERCLASS_PRACTICE&&typeof window.NDT_MASTERCLASS_PRACTICE.getTopics==="function")return window.NDT_MASTERCLASS_PRACTICE.getTopics(id);}
 catch(e){}
 return METHOD_TOPICS.map(function(t){return {id:t[0],group:t[1],title:t[2],text:"Study the "+t[2].toLowerCase()+" of "+getMethod(id).name+" and review the method-specific principles, equipment, inspection workflow, limitations, safety and reporting requirements."};});
}
function readLocalProgress(){try{return JSON.parse(localStorage.getItem("ndtMasterclassMethodProgress")||"{}")||{};}catch(e){return {};}}
function saveLocalProgress(){try{localStorage.setItem("ndtMasterclassMethodProgress",JSON.stringify(ui.progress));}catch(e){}}
function localCount(id){return getTopics(id).filter(function(t){return ui.progress[id]&&ui.progress[id][t.id];}).length;}
function cloudCount(id){return getTopics(id).filter(function(t){return ui.cloudProgress[id]&&ui.cloudProgress[id][t.id];}).length;}
function getClient(){try{return api.getSupabase();}catch(e){return null;}}
async function syncSession(){
 var c=getClient();ui.user=null;ui.session=null;
 if(!c||!c.auth)return;
 try{var r=await c.auth.getSession();if(r.error)throw r.error;ui.session=r.data&&r.data.session||null;ui.user=ui.session&&ui.session.user||null;}
 catch(e){ui.error="Could not read the current sign-in session. Open Sign in / Sync and sign in again.";}
}
async function loadCloudProgress(){
 await syncSession();
 if(!ui.user){ui.cloudProgress={};ui.cloudLoaded=false;return false;}
 var c=getClient();
 try{
  var r=await c.from("academy_method_lesson_progress").select("method_id,lesson_id,completed,completed_at").eq("user_id",ui.user.id);
  if(r.error)throw r.error;
  var next={};
  (r.data||[]).forEach(function(row){if(row.completed){next[row.method_id]=next[row.method_id]||{};next[row.method_id][row.lesson_id]=true;}});
  ui.cloudProgress=next;ui.cloudLoaded=true;return true;
 }catch(e){ui.cloudLoaded=false;ui.error="Signed in, but method progress could not be read from Supabase. Check the database migration and RLS policies.";return false;}
}
async function saveCloudLesson(methodId,lessonId,done){
 await syncSession();
 if(!ui.user)return {ok:false,error:"Sign in to sync lesson completion. Local progress has still been saved."};
 var c=getClient(),now=new Date().toISOString();
 try{
  var row={user_id:ui.user.id,method_id:methodId,lesson_id:lessonId,completed:!!done,completed_at:done?now:null,updated_at:now};
  var r=await c.from("academy_method_lesson_progress").upsert(row,{onConflict:"user_id,method_id,lesson_id"});
  if(r.error)throw r.error;
  ui.cloudProgress[methodId]=ui.cloudProgress[methodId]||{};
  if(done)ui.cloudProgress[methodId][lessonId]=true;else delete ui.cloudProgress[methodId][lessonId];
  return {ok:true};
 }catch(e){return {ok:false,error:"Lesson saved locally, but the cloud save failed. Check the academy_method_lesson_progress RLS policy."};}
}
async function syncLocalProgress(){
 await syncSession();
 if(!ui.user){ui.error="Sign in before syncing local progress.";render();return;}
 if(!window.confirm("Upload the completed lesson markers stored in this browser to the currently signed-in account? This will mark those lessons complete in the account's learning record."))return;
 var rows=[];
 Object.keys(ui.progress).forEach(function(mid){Object.keys(ui.progress[mid]||{}).forEach(function(lid){
  if(ui.progress[mid][lid])rows.push({user_id:ui.user.id,method_id:mid,lesson_id:lid,completed:true,completed_at:new Date().toISOString(),updated_at:new Date().toISOString()});
 });});
 if(!rows.length){ui.notice="No locally completed method lessons were found to sync.";render();return;}
 var c=getClient();
 try{
  var r=await c.from("academy_method_lesson_progress").upsert(rows,{onConflict:"user_id,method_id,lesson_id"});
  if(r.error)throw r.error;
  await loadCloudProgress();ui.notice="Synced "+rows.length+" locally marked lesson(s) to this signed-in account.";ui.error="";render();
 }catch(e){ui.error="Could not sync local progress. Check your connection and Supabase permissions.";render();}
}
function statusBanner(){
 if(ui.error)return '<div class="notice" role="alert">'+esc(ui.error)+'</div>';
 if(ui.notice)return '<div class="notice" role="status">'+esc(ui.notice)+'</div>';
 return "";
}
function crumbs(title){
 return '<div class="breadcrumbs"><button type="button" class="btn btn-outline" data-method-exam-action="back">← Back</button><span>Academy / '+esc(title)+'</span><button type="button" class="btn btn-outline" data-method-exam-action="home">Home</button></div>';
}
function topicComplete(id,tid,cloud){
 return !!((cloud?ui.cloudProgress:ui.progress)[id]&& (cloud?ui.cloudProgress:ui.progress)[id][tid]);
}
function courseCard(m){
 var topics=getTopics(m.id),local=localCount(m.id),cloud=ui.user?cloudCount(m.id):0;
 return '<article class="card exam-course-card"><div class="course-card-top"><span class="tag">'+esc(m.short)+'</span><span class="small">'+esc(m.level||"Course")+'</span></div><h3>'+esc(m.name)+'</h3><p>'+esc(m.intro||m.principle||"Method-specific theory and technical practice.")+'</p><div class="course-progress-row"><span>Account progress</span><strong>'+cloud+'/25</strong></div><div class="progress-track"><span style="width:'+Math.round(cloud/25*100)+'%"></span></div><div class="course-progress-row"><span>Saved in this browser</span><strong>'+local+'/25</strong></div><div class="hero-actions"><button class="btn btn-primary" data-method-exam-action="open-course" data-method="'+esc(m.id)+'">Open course →</button><button class="btn btn-outline" data-method-exam-action="history" data-method="'+esc(m.id)+'">Exam history</button></div></article>';
}
function renderExams(){
 var cards=methods().map(courseCard).join("");
 return crumbs("Final examinations")+'<section class="page-hero"><div class="eyebrow">Independent course assessments</div><h1>Final Examinations</h1><p>Select a method to open its own course dashboard. Each exam is method-specific, contains 100 questions, has a 50% educational pass mark and reveals the answer review only after submission.</p><p class="small">Exam access requires sign-in and all 25 lesson markers for that method saved to your account. Completing lessons or passing an exam does not provide ASNT/ISO personnel certification or work authorisation.</p></section>'+statusBanner()+'<div class="method-exam-toolbar"><div><strong>'+(ui.user?"Signed in":"Not signed in")+'</strong><p class="small">'+(ui.user?esc(ui.user.email||"Learner account"):"Sign in to unlock saved progress, exam attempts and certificates.")+'</p></div><div class="hero-actions"><button type="button" class="btn btn-outline" data-method-exam-action="sync-local">Sync browser progress</button><button type="button" class="btn btn-outline" data-method-exam-action="refresh">Refresh account progress</button></div></div><div class="grid three method-exam-grid">'+cards+'</div><div class="notice"><strong>Question quality:</strong> the current 100-item banks are generated from the method-topic metadata and are a development draft. They need technical review by qualified NDT subject-matter experts before use as a reliable exam-preparation benchmark. They are not copied official ASNT/ISO questions.</div>';
}
function renderCourse(){
 var m=getMethod(ui.courseMethod),topics=getTopics(m.id);
 var local=localCount(m.id),cloud=ui.user?cloudCount(m.id):0;
 var list=topics.map(function(t,i){
  var ld=topicComplete(m.id,t.id,false),cd=topicComplete(m.id,t.id,true);
  return '<div class="method-lesson-row"><div class="lesson-number">'+String(i+1).padStart(2,"0")+'</div><div class="lesson-row-body"><strong>'+esc(t.title)+'</strong><span>'+esc(t.group)+' · '+(cd?'Account complete':ld?'Saved in browser':'Not marked complete')+'</span></div><button class="btn btn-outline" data-method-exam-action="open-lesson" data-method="'+esc(m.id)+'" data-lesson="'+esc(t.id)+'">Study lesson →</button></div>';
 }).join("");
 var eligible=!!ui.user&&cloud===topics.length;
 return crumbs(m.name)+'<section class="page-hero"><div class="eyebrow">'+esc(m.short)+' course dashboard</div><h1>'+esc(m.name)+'</h1><p>'+esc(m.intro||m.principle)+'</p><div class="course-dashboard-metrics"><div><strong>'+topics.length+'</strong><span>lesson topics</span></div><div><strong>'+local+'/25</strong><span>local progress</span></div><div><strong>'+cloud+'/25</strong><span>account progress</span></div></div></section>'+statusBanner()+'<div class="exam-eligibility-card"><div><h2>100-question final examination</h2><p>'+(eligible?'All required lesson markers are saved to this account. The method exam is unlocked.':ui.user?'Complete and save all 25 lessons to your account to unlock this exam.':'Sign in and save lesson completion to your account to unlock the exam.')+'</p><p class="small">50/100 is the Academy&#39;s educational threshold. It is not an official certification pass mark.</p></div><div class="exam-controls"><label class="small" for="methodExamDuration">Time limit</label><select id="methodExamDuration" class="field"><option value="30">30 minutes</option><option value="60" selected>60 minutes</option><option value="90">90 minutes</option><option value="120">120 minutes</option></select><button class="btn btn-primary" data-method-exam-action="start-exam" data-method="'+esc(m.id)+'" '+(eligible?'':'disabled')+'>Start '+esc(m.short)+' examination →</button><button class="btn btn-outline" data-method-exam-action="history" data-method="'+esc(m.id)+'">View attempt history</button></div></div><section class="section"><div class="section-head"><div><div class="kicker">Study sequence</div><h2>Course lessons</h2><p>Open each lesson, study the theory and mark it complete only after you have worked through the material.</p></div></div><div class="method-lesson-list">'+list+'</div></section><div class="notice">This is a theory-learning syllabus. Real NDT work requires applicable procedures, standards, equipment training, supervision and employer authorisation.</div>';
}
function renderLearning(){
 var cards=methods().map(function(m){
  var n=getTopics(m.id).length,cl=ui.user?cloudCount(m.id):0,lo=localCount(m.id);
  return '<article class="card"><span class="tag">'+esc(m.short)+'</span><h3>'+esc(m.name)+'</h3><p class="small">Account: '+cl+'/'+n+' lessons · Browser: '+lo+'/'+n+'</p><div class="progress-track"><span style="width:'+Math.round(cl/n*100)+'%"></span></div><div class="hero-actions"><button class="btn btn-primary" data-method-exam-action="open-course" data-method="'+esc(m.id)+'">Continue course →</button><button class="btn btn-outline" data-method-exam-action="history" data-method="'+esc(m.id)+'">Exam history</button></div></article>';
 }).join("");
 return crumbs("My learning")+'<section class="page-hero"><div class="eyebrow">Your course record</div><h1>My Learning</h1><p>Lesson completion, examination attempts, scores and educational certificates are tracked separately for each method.</p></section>'+statusBanner()+'<div class="method-exam-toolbar"><div><strong>'+(ui.user?"Account connected":"Browser-only mode")+'</strong><p class="small">'+(ui.user?"Cloud progress is scoped to the signed-in user.":"Local progress is stored in this browser and does not unlock a server-checked exam.")+'</p></div><div class="hero-actions"><button class="btn btn-outline" data-method-exam-action="sync-local">Sync browser progress</button><button class="btn btn-outline" data-method-exam-action="refresh">Refresh</button></div></div><div class="grid three method-exam-grid">'+cards+'</div><div class="hero-actions"><button class="btn btn-primary" data-method-exam-nav="exams">Final examinations</button><button class="btn btn-outline" data-method-exam-nav="certificates">Certificates</button></div>';
}
async function loadCertificates(){
 await syncSession();
 if(!ui.user){ui.certificateList=[];return false;}
 try{
  var r=await getClient().from("course_certificates").select("certificate_number,course_key,course_title,score,issued_at,course_completed_at,exam_submitted_at,revoked_at").eq("user_id",ui.user.id).order("issued_at",{ascending:false});
  if(r.error)throw r.error;
  ui.certificateList=r.data||[];return true;
 }catch(e){ui.error="Could not load certificates from the account. Verify certificate table access and RLS.";return false;}
}
function renderCertificates(){
 var cards=ui.certificateList.map(function(c){
  var valid=!c.revoked_at;
  return '<article class="card certificate-record"><div class="course-card-top"><span class="tag">'+(valid?'Education record':'Revoked record')+'</span><span class="small">'+esc(c.score)+'%</span></div><h3>'+esc(c.course_title)+'</h3><p><strong>Certificate ID:</strong> '+esc(c.certificate_number)+'</p><p>Course completion: '+esc(formatDate(c.course_completed_at))+'</p><p>Final exam: '+esc(formatDate(c.exam_submitted_at))+'</p><p>Issued: '+esc(formatDate(c.issued_at))+'</p><div class="hero-actions"><button class="btn btn-primary" data-method-exam-action="download-pdf" data-certificate="'+esc(c.certificate_number)+'" '+(valid?'':'disabled')+'>Download PDF</button><button class="btn btn-outline" data-method-exam-action="verify" data-certificate="'+esc(c.certificate_number)+'">Verify record</button></div></article>';
 }).join("");
 return crumbs("Certificates")+'<section class="page-hero"><div class="eyebrow">Educational course records</div><h1>Certificates</h1><p>Certificates are issued per method only after the required lesson completion and a passing 100-question Academy exam. These are educational completion records, not external personnel certifications.</p></section>'+statusBanner()+(ui.user?'<div class="hero-actions"><button class="btn btn-outline" data-method-exam-action="refresh-certificates">Refresh records</button></div>' : '<div class="notice">Sign in with the account used for the examination to view and download your certificates. <button class="btn btn-outline" data-method-exam-action="sign-in">Sign in / Sync</button></div>')+(ui.certificateList.length?'<div class="grid two certificate-grid">'+cards+'</div>':'<div class="empty">'+(ui.user?'No course-completion certificates have been issued to this account yet. Pass a method exam after completing its lessons.':'Certificate records are not shown until you sign in.')+'</div>')+'<div class="notice">The certificate number can be verified publicly at the Academy record endpoint. Public verification shows only the fields needed to validate this education record.</div>';
}
function formatDate(v){if(!v)return "Not recorded";var d=new Date(v);return Number.isNaN(d.getTime())?"Not recorded":d.toLocaleDateString(undefined,{year:"numeric",month:"short",day:"numeric"});}
function formatDuration(seconds){if(seconds==null||!Number.isFinite(Number(seconds)))return "Not recorded";var n=Math.max(0,Math.round(Number(seconds))),h=Math.floor(n/3600),m=Math.floor((n%3600)/60),se=n%60;return (h?h+"h ":"")+(m||h?String(m).padStart(2,"0")+"m ":"")+String(se).padStart(2,"0")+"s";}
function renderHistory(){
 var m=getMethod(ui.historyMethod);
 var rows=ui.history.map(function(a){
  return '<article class="card history-row"><div><h3>'+esc(m.name)+'</h3><p class="small">Started: '+esc(formatDate(a.started_at))+' · Submitted: '+esc(formatDate(a.submitted_at))+'</p><p><strong>'+(a.score==null?'Not submitted':esc(a.score)+'%')+'</strong> · '+(a.passed?'Passed':a.submitted_at?'Not passed':'In progress')+'</p></div><div class="hero-actions">'+(a.submitted_at?'<button class="btn btn-primary" data-method-exam-action="review-history" data-attempt="'+esc(a.id)+'">Review answers</button>':'<span class="tag">Unsubmitted attempt</span>')+'</div></article>';
 }).join("");
 return crumbs("Exam history")+'<section class="page-hero"><div class="eyebrow">'+esc(m.short)+' assessment record</div><h1>'+esc(m.name)+' — Examination history</h1><p>Past attempts are kept separate from the progress of other methods. Review shows answers and explanations only after submission.</p></section>'+statusBanner()+'<div class="hero-actions"><button class="btn btn-outline" data-method-exam-action="open-course" data-method="'+esc(m.id)+'">Back to course</button></div>'+(rows?'<div class="grid one">'+rows+'</div>':'<div class="empty">No examination attempts are available for this course yet.</div>');
}
function renderExamActive(){
 var ex=ui.exam;if(!ex)return renderCourse();
 var q=ex.questions[ex.index],n=ex.questions.length,answered=Object.keys(ex.answers).length,flagged=ex.flags.size;
 var palette=ex.questions.map(function(item,i){
  var cl="exam-palette-number";
  if(Object.prototype.hasOwnProperty.call(ex.answers,item.id))cl+=" answered";
  if(ex.flags.has(item.id))cl+=" flagged";
  if(i===ex.index)cl+=" current";
  return '<button type="button" class="'+cl+'" data-method-exam-action="goto-question" data-index="'+i+'" aria-label="Go to question '+(i+1)+'">'+(i+1)+'</button>';
 }).join("");
 var options=q.options.map(function(opt,i){
  var picked=ex.answers[q.id]===i;
  return '<button type="button" class="exam-answer'+(picked?' selected':'')+'" data-method-exam-action="choose-answer" data-option="'+i+'"><b>'+String.fromCharCode(65+i)+'</b><span>'+esc(opt)+'</span></button>';
 }).join("");
 return crumbs(getMethod(ex.methodId).name+" examination")+'<div class="exam-live-header"><div><span class="tag">Question '+(ex.index+1)+' of 100</span><h1>'+esc(getMethod(ex.methodId).name)+' Final Examination</h1><p class="small">Answers are saved in this attempt in your browser until submission. The server scores the final result.</p></div><div class="exam-clock"><span>Time remaining</span><strong id="methodExamTimer">--:--</strong></div></div><div class="exam-live-stats"><span>'+answered+'/100 answered</span><span>'+flagged+' flagged</span><span>Pass mark: 50/100</span></div><p class="small exam-autosave-status">'+esc(ex.saveState||"Answers are saved online as you work.")+'</p>'+(ui.submitting?'<div class="notice">Submitting attempt securely and calculating the result…</div>':"")+'<div class="exam-live-layout"><section class="card exam-question-card"><div class="exam-question-meta"><span class="tag">'+esc(q.group)+'</span><span class="tag">'+esc(q.difficulty)+'</span><span class="tag">'+esc(q.kind)+'</span></div><h2>'+esc(q.question)+'</h2><div class="exam-answer-list">'+options+'</div><div class="hero-actions exam-move-actions"><button class="btn btn-outline" data-method-exam-action="previous" '+(ex.index===0?'disabled':'')+'>← Previous</button><button class="btn btn-outline" data-method-exam-action="flag">'+(ex.flags.has(q.id)?'Remove flag':'Flag question')+'</button><button class="btn btn-primary" data-method-exam-action="next" '+(ex.index===n-1?'disabled':'')+'>Next →</button></div></section><aside class="card exam-palette-card"><h3>Question palette</h3><p class="small">Green: answered · Orange border: flagged · Solid outline: current</p><div class="exam-question-palette">'+palette+'</div><div class="exam-palette-legend"><span><i class="answered"></i> Answered</span><span><i class="flagged"></i> Flagged</span><span><i class="current"></i> Current</span></div><button class="btn btn-primary" style="width:100%;margin-top:17px" data-method-exam-action="submit-exam">Submit examination</button><p class="small">Submitting ends this attempt. Unanswered questions count as incorrect. The answer key appears only after submission.</p></aside></div>';
}
function renderResult(){
 var r=ui.result;if(!r)return renderCourse();
 if(r.historyReview){
  var rs=r.review||[];
  return crumbs("Examination review")+'<section class="page-hero"><div class="eyebrow">Submitted attempt review</div><h1>'+esc(r.course_title||getMethod(r.method_id).name)+'</h1><p>Score: '+esc(r.score)+'% · '+(r.passed?'Passed':'Not passed')+' · '+esc(formatDate(r.submitted_at))+' · Time taken: '+esc(formatDuration(r.time_taken_seconds))+'</p></section>'+reviewList(rs)+'<div class="hero-actions"><button class="btn btn-primary" data-method-exam-action="open-course" data-method="'+esc(r.method_id)+'">Back to course</button></div>';
 }
 var pct=Number(r.score)||0;
 var topicRows=(r.topic_performance||[]).map(function(t){return '<tr><td>'+esc(t.topic)+'</td><td>'+esc(t.correct)+'/'+esc(t.total)+'</td><td>'+esc(t.percent)+'%</td></tr>';}).join("");
 var cert=r.certificate;
 var certHtml=cert?'<div class="notice"><strong>Educational completion certificate issued.</strong><p>Reference: '+esc(cert.certificate_number)+'</p><div class="hero-actions"><button class="btn btn-primary" data-method-exam-action="download-pdf" data-certificate="'+esc(cert.certificate_number)+'">Download certificate PDF</button><button class="btn btn-outline" data-method-exam-action="verify" data-certificate="'+esc(cert.certificate_number)+'">Verify certificate</button></div></div>':'<div class="notice">'+(r.passed?'You passed the exam, but the certificate can only issue after this method’s 25 lesson completions are verified in the account.':'You did not reach the 50% educational pass mark. Review weak topics and retake the course examination when ready.')+'</div>';
 return crumbs("Examination result")+'<section class="page-hero"><div class="eyebrow">Exam submitted</div><h1>'+esc(r.course_title||getMethod(r.method_id).name)+'</h1><p>'+esc(formatDate(r.submitted_at))+' · '+esc(r.total||100)+' questions · Pass mark 50/100 · Time taken '+esc(formatDuration(r.time_taken_seconds))+'</p><div class="exam-score-card"><strong>'+pct+'%</strong><span>'+(r.passed?'PASSED':'NOT PASSED')+'</span><p>'+esc(r.correct||0)+' correct · '+esc(r.incorrect||((r.total||100)-(r.correct||0)))+' incorrect · '+(r.expired?'Time expired':'Submitted')+'</p></div></section>'+statusBanner()+certHtml+'<section class="section"><div class="section-head"><div><div class="kicker">Topic-level performance</div><h2>Topics to revisit</h2></div></div><div class="table-scroll"><table class="comparison-table"><thead><tr><th>Topic</th><th>Score</th><th>Percent</th></tr></thead><tbody>'+topicRows+'</tbody></table></div></section><section class="section"><div class="section-head"><div><div class="kicker">Answer key after submission</div><h2>Review all questions</h2><p>Correct options and explanations are only shown after the final result is recorded.</p></div></div>'+reviewList(r.review||[])+'</section><div class="hero-actions"><button class="btn btn-primary" data-method-exam-action="open-course" data-method="'+esc(r.method_id)+'">Back to course</button><button class="btn btn-outline" data-method-exam-action="start-exam" data-method="'+esc(r.method_id)+'">Retake exam</button><button class="btn btn-outline" data-method-exam-action="history" data-method="'+esc(r.method_id)+'">Exam history</button><button class="btn btn-outline" data-method-exam-nav="certificates">Certificates</button></div>';
}
function reviewList(items){
 if(!items||!items.length)return '<div class="empty">No answer review was returned for this record.</div>';
 return '<div class="exam-review-list">'+items.map(function(q,i){
  if(!q)return "";
  var opts=(q.options||[]).map(function(o,j){var cls=j===q.correct_index?'correct':j===q.chosen_index&&j!==q.correct_index?'wrong':'';return '<div class="exam-review-option '+cls+'">'+String.fromCharCode(65+j)+'. '+esc(o)+(j===q.correct_index?' ✓':j===q.chosen_index&&j!==q.correct_index?' — Your answer':'')+'</div>';}).join("");
  return '<details class="exam-review-item" '+(i<3?'open':'')+'><summary><strong>Q'+(i+1)+'. '+esc(q.question)+'</strong><span class="tag">'+(q.correct?'Correct':'Incorrect')+'</span></summary><div class="exam-review-body">'+opts+'<p><strong>Explanation:</strong> '+esc(q.explanation)+'</p><p class="small">'+esc(q.topic_title||q.group||"")+'</p></div></details>';
 }).join("")+'</div>';
}
function render(){
 if(ui.page==="lesson")return;
 window.NDT_MASTERCLASS_CUSTOM_VIEW=true;
 var html="";
 if(ui.page==="exams")html=renderExams();
 else if(ui.page==="course")html=renderCourse();
 else if(ui.page==="learning")html=renderLearning();
 else if(ui.page==="certificates")html=renderCertificates();
 else if(ui.page==="history")html=renderHistory();
 else if(ui.page==="exam-active")html=renderExamActive();
 else if(ui.page==="exam-result")html=renderResult();
 else html=renderExams();
 root.innerHTML=html;
}
function pushPage(page,arg){
 if(ui.page!=="lesson")ui.stack.push({page:ui.page,courseMethod:ui.courseMethod,historyMethod:ui.historyMethod});
}
function setPage(page,opts){
 opts=opts||{};
 if(opts.push!==false)pushPage(page,opts.arg);
 ui.page=page;ui.error="";ui.notice="";
 if(opts.method)ui.courseMethod=opts.method;
 if(page==="lesson"){
  window.NDT_MASTERCLASS_CUSTOM_VIEW=false;
  renderLesson(opts.method,opts.lesson);
  return;
 }
 if(window.NDT_MASTERCLASS_PRACTICE&&window.NDT_MASTERCLASS_PRACTICE.clear)window.NDT_MASTERCLASS_PRACTICE.clear();
 render();
}
function goBack(){
 if(ui.page==="exam-active"){if(window.confirm("Leave this examination screen? Your current answers remain in this browser until you return, but a network interruption may prevent submission.")){setPage("course",{method:ui.exam?ui.exam.methodId:ui.courseMethod,push:false});}return;}
 var prev=ui.stack.pop();
 if(prev){ui.page=prev.page;ui.courseMethod=prev.courseMethod||ui.courseMethod;ui.historyMethod=prev.historyMethod||ui.historyMethod;ui.error="";ui.notice="";if(ui.page==="lesson")ui.page="course";window.NDT_MASTERCLASS_CUSTOM_VIEW=true;render();return;}
 setPage("exams",{push:false});
}
function renderLesson(methodId,lessonId){
 ui.courseMethod=methodId;ui.lessonId=lessonId;
 if(window.NDT_MASTERCLASS_PRACTICE&&window.NDT_MASTERCLASS_PRACTICE.openTopic){
  window.NDT_MASTERCLASS_PRACTICE.openTopic(methodId,lessonId);
 }else{
  window.NDT_MASTERCLASS_CUSTOM_VIEW=false;
  api.openView("method",methodId,true);
 }
 setTimeout(decorateTopic,0);
}
function decorateTopic(){
 var h=root.querySelector(".lesson-content h1");
 var content=root.querySelector(".lesson-content");
 if(!h||!content)return;
 var text=h.textContent.trim();
 var m=methods().find(function(x){return text.indexOf(x.name+": ")===0;});
 if(!m)return;
 var title=text.slice(m.name.length+2);
 var t=getTopics(m.id).find(function(x){return x.title===title;});
 if(!t)return;
 ui.courseMethod=m.id;ui.lessonId=t.id;
 var done=topicComplete(m.id,t.id,false),cloud=topicComplete(m.id,t.id,true);
 var existing=content.querySelector(".method-lesson-progress");
 if(existing){
  var b=existing.querySelector("[data-method-exam-action='mark-complete']");
  if(b){b.textContent=done?"✓ Marked complete — click to undo":"Mark this lesson complete";b.classList.toggle("btn-primary",!done);b.classList.toggle("btn-soft",done);}
  var s=existing.querySelector(".method-lesson-save-status");if(s)s.textContent=ui.user?(cloud?"Saved to your account":"Not yet saved to your account"):"Saved in this browser only. Sign in to sync.";
  return;
 }
 var banner=document.createElement("section");
 banner.className="method-lesson-progress";
 banner.innerHTML='<div><span class="tag">Lesson progress</span><strong>'+esc(t.group)+' · '+esc(t.title)+'</strong><p class="method-lesson-save-status">'+(ui.user?(cloud?"Saved to your account":"Not yet saved to your account"):"Saved in this browser only. Sign in to sync.")+'</p></div><div class="hero-actions"><button type="button" class="btn '+(done?'btn-soft':'btn-primary')+'" data-method-exam-action="mark-complete">'+(done?"✓ Marked complete — click to undo":"Mark this lesson complete")+'</button><button type="button" class="btn btn-outline" data-method-exam-action="back-course" data-method="'+esc(m.id)+'">Back to course dashboard</button></div>';
 content.insertBefore(banner,content.firstChild);
}
var topicObserver=new MutationObserver(function(){if(ui.page==="lesson")decorateTopic();});
topicObserver.observe(root,{childList:true,subtree:true});
function removeTimer(){if(ui.timer){clearInterval(ui.timer);ui.timer=null;}}
function startTimer(){
 removeTimer();
 ui.timer=setInterval(function(){
  if(!ui.exam||ui.page!=="exam-active")return;
  var rem=Math.max(0,new Date(ui.exam.expiresAt).getTime()-Date.now());
  var el=document.getElementById("methodExamTimer");if(el)el.textContent=Math.floor(rem/60000).toString().padStart(2,"0")+":"+Math.floor((rem%60000)/1000).toString().padStart(2,"0");
  if(rem<=0){removeTimer();submitExam(true);}
 },1000);
}
async function functionRequest(name,body){
 await syncSession();
 if(!ui.user||!ui.session||!ui.session.access_token)throw new Error("Sign in to use this feature.");
 if(!config.url||!config.anonKey)throw new Error("Supabase browser configuration is missing.");
 var res=await fetch(config.url.replace(/\/$/,"")+"/functions/v1/"+name,{method:"POST",headers:{"Content-Type":"application/json","apikey":config.anonKey,"Authorization":"Bearer "+ui.session.access_token},body:JSON.stringify(body)});
 var data=await res.json().catch(function(){return {};});
 if(!res.ok)throw new Error(data.error||"The service returned HTTP "+res.status+".");
 return data;
}
async function saveExamProgress(){
 if(!ui.exam)return;
 if(answerSaveTimer)clearTimeout(answerSaveTimer);
 ui.exam.saveState="Waiting to save…";
 var attempt=ui.exam;
 answerSaveTimer=setTimeout(async function(){
  if(!ui.exam||ui.exam.attemptId!==attempt.attemptId)return;
  try{await functionRequest("final-exam",{action:"save-progress",course_key:attempt.methodId,attempt_id:attempt.attemptId,answers:attempt.answers});if(ui.exam&&ui.exam.attemptId===attempt.attemptId)ui.exam.saveState="Saved to your account";}
  catch(e){if(ui.exam&&ui.exam.attemptId===attempt.attemptId)ui.exam.saveState="Online save failed; answers remain in this tab. "+(e.message||"");}
  var status=root.querySelector(".exam-autosave-status");if(status&&ui.exam)status.textContent=ui.exam.saveState||"";
 },450);
}
async function startExam(methodId){
 ui.error="";ui.notice="";ui.courseMethod=methodId||ui.courseMethod;
 var duration=document.getElementById("methodExamDuration");
 var minutes=duration?Number(duration.value):60;
 try{
  await loadCloudProgress();
  if(!ui.user){ui.error="Sign in first. Exam eligibility and scores are stored against your learner account.";render();return;}
  var r=await functionRequest("final-exam",{action:"start",course_key:ui.courseMethod,duration_minutes:minutes});
  ui.exam={methodId:ui.courseMethod,attemptId:r.attempt_id,startedAt:r.started_at,expiresAt:r.expires_at,questions:r.questions||[],answers:r.answers&&typeof r.answers==="object"?r.answers:{},flags:new Set(),index:0,passMark:r.pass_mark||50,attemptsUsed:r.attempts_used||1,saveState:"Answers will be saved to your account as you work."};
  if(!ui.exam.questions||ui.exam.questions.length!==100)throw new Error("The server did not return exactly 100 questions. The attempt was not opened in the interface.");
  ui.page="exam-active";window.NDT_MASTERCLASS_CUSTOM_VIEW=true;render();startTimer();
 }catch(e){ui.error=e.message||"Could not start the examination.";ui.page="course";window.NDT_MASTERCLASS_CUSTOM_VIEW=true;render();}
}
function moveQuestion(n){if(!ui.exam)return;ui.exam.index=Math.max(0,Math.min(99,n));render();}
async function submitExam(auto){
 if(!ui.exam||ui.submitting)return;
 if(answerSaveTimer){clearTimeout(answerSaveTimer);answerSaveTimer=null;}
 var missing=ui.exam.questions.length-Object.keys(ui.exam.answers).length;
 if(!auto&&!window.confirm("Submit this 100-question examination now? "+missing+" question(s) are unanswered. Unanswered questions count as incorrect, and the answer key will be shown after submission."))return;
 ui.submitting=true;ui.error="";render();
 try{
  var r=await functionRequest("final-exam",{action:"submit",course_key:ui.exam.methodId,attempt_id:ui.exam.attemptId,answers:ui.exam.answers});
  r.method_id=ui.exam.methodId;r.course_title=(getMethod(ui.exam.methodId).name+" ("+getMethod(ui.exam.methodId).short+")");
  ui.result=r;ui.exam=null;ui.page="exam-result";ui.submitting=false;removeTimer();window.NDT_MASTERCLASS_CUSTOM_VIEW=true;render();
 }catch(e){
  ui.submitting=false;ui.error=(auto?"Time expired, but the result could not be submitted: ":"Could not submit the examination: ")+(e.message||"Please retry.");
  render();if(ui.exam&&!auto)startTimer();
 }
}
async function loadHistory(methodId){
 ui.historyMethod=methodId||ui.courseMethod;ui.error="";ui.notice="";
 try{
  var r=await functionRequest("final-exam",{action:"history",course_key:ui.historyMethod});
  ui.history=r.attempts||[];setPage("history",{push:true});render();
 }catch(e){ui.error=e.message||"Could not load exam history.";render();}
}
async function reviewHistory(attemptId){
 ui.error="";
 try{
  var r=await functionRequest("final-exam",{action:"history",course_key:ui.historyMethod,include_review:true});
  var a=(r.attempts||[]).find(function(x){return x.id===attemptId;});
  if(!a){ui.error="That examination attempt could not be found.";render();return;}
  ui.result={historyReview:true,method_id:ui.historyMethod,course_title:getMethod(ui.historyMethod).name+" examination",score:a.score,passed:a.passed,submitted_at:a.submitted_at,time_taken_seconds:a.time_taken_seconds,review:a.review||[]};
  setPage("exam-result",{push:true});render();
 }catch(e){ui.error=e.message||"Could not load the answer review.";render();}
}
async function refreshCerts(){
 ui.error="";var ok=await loadCertificates();if(!ok&&!ui.user)ui.error="Sign in to view certificates.";
 ui.page="certificates";window.NDT_MASTERCLASS_CUSTOM_VIEW=true;render();
}
async function downloadPdf(number){
 ui.error="";ui.notice="Preparing your private certificate PDF…";render();
 try{
  var r=await functionRequest("certificate-pdf",{certificate_number:number});
  if(!r.signed_url)throw new Error("No private PDF download link was returned.");
  window.location.href=r.signed_url;
  ui.notice="The certificate PDF download link was opened.";render();
 }catch(e){ui.error=e.message||"Could not generate the certificate PDF.";render();}
}
function verifyCertificate(number){
 var url=location.origin+location.pathname.replace(/[^/]*$/,"")+"verify-certificate.html?number="+encodeURIComponent(number);
 window.open(url,"_blank","noopener");
}
function markLesson(){
 var mid=ui.courseMethod,lid=ui.lessonId;if(!mid||!lid)return;
 var done=!(ui.progress[mid]&&ui.progress[mid][lid]);
 ui.progress[mid]=ui.progress[mid]||{};if(done)ui.progress[mid][lid]=true;else delete ui.progress[mid][lid];
 saveLocalProgress();var b=root.querySelector(".method-lesson-progress [data-method-exam-action='mark-complete']");
 if(b){b.textContent=done?"✓ Marked complete — click to undo":"Mark this lesson complete";b.classList.toggle("btn-primary",!done);b.classList.toggle("btn-soft",done);}
 var msg=root.querySelector(".method-lesson-save-status");if(msg)msg.textContent="Saved in this browser. Syncing to account…";
 saveCloudLesson(mid,lid,done).then(function(result){
  if(msg&&msg.isConnected)msg.textContent=result.ok?(done?"Saved in your account":"Completion cleared in your account"):"Browser save kept. "+result.error;
  if(result.ok&&ui.page==="course"){ui.error="";render();}
 });
}
function openMain(view,arg){
 removeTimer();
 if(window.NDT_MASTERCLASS_PRACTICE&&window.NDT_MASTERCLASS_PRACTICE.clear)window.NDT_MASTERCLASS_PRACTICE.clear();
 ui.page="main";window.NDT_MASTERCLASS_CUSTOM_VIEW=false;
 api.openView(view,arg||null,true);
}
async function handleNav(name){
 if(name==="exams"){await loadCloudProgress();setPage("exams",{push:true});}
 else if(name==="learning"){await loadCloudProgress();setPage("learning",{push:true});}
 else if(name==="certificates"){await loadCertificates();setPage("certificates",{push:true});}
}
function action(ev,b){
 var a=b.getAttribute("data-method-exam-action");
 if(!a)return false;
 ev.preventDefault();ev.stopImmediatePropagation();
 var mid=b.getAttribute("data-method")||ui.courseMethod;
 if(a==="back"){goBack();return true;}
 if(a==="home"){removeTimer();openMain("home");return true;}
 if(a==="open-course"){setPage("course",{method:mid,push:true});return true;}
 if(a==="open-lesson"){ui.courseMethod=mid;ui.lessonId=b.getAttribute("data-lesson");setPage("lesson",{method:mid,lesson:ui.lessonId,push:false});return true;}
 if(a==="back-course"){ui.courseMethod=mid;setPage("course",{method:mid,push:false});return true;}
 if(a==="open-formulas"){openMain("formulas");return true;}
 if(a==="mark-complete"){markLesson();return true;}
 if(a==="start-exam"){startExam(mid);return true;}
 if(a==="previous"){moveQuestion(ui.exam?ui.exam.index-1:0);return true;}
 if(a==="next"){moveQuestion(ui.exam?ui.exam.index+1:0);return true;}
 if(a==="goto-question"){moveQuestion(Number(b.getAttribute("data-index")));return true;}
 if(a==="flag"){if(ui.exam){var q=ui.exam.questions[ui.exam.index];if(ui.exam.flags.has(q.id))ui.exam.flags.delete(q.id);else ui.exam.flags.add(q.id);render();}return true;}
 if(a==="choose-answer"){if(ui.exam){var q=ui.exam.questions[ui.exam.index];ui.exam.answers[q.id]=Number(b.getAttribute("data-option"));render();saveExamProgress();}return true;}
 if(a==="submit-exam"){submitExam(false);return true;}
 if(a==="history"){loadHistory(mid);return true;}
 if(a==="review-history"){reviewHistory(b.getAttribute("data-attempt"));return true;}
 if(a==="sync-local"){syncLocalProgress();return true;}
 if(a==="refresh"){loadCloudProgress().then(function(){ui.error="";ui.notice="Account progress refreshed.";render();});return true;}
 if(a==="refresh-certificates"){refreshCerts();return true;}
 if(a==="download-pdf"){downloadPdf(b.getAttribute("data-certificate"));return true;}
 if(a==="verify"){verifyCertificate(b.getAttribute("data-certificate"));return true;}
 if(a==="sign-in"){var sign=document.getElementById("authOpen");if(sign)sign.click();return true;}
 return true;
}
document.addEventListener("click",function(ev){
 var b=ev.target.closest("button,a");if(!b)return;
 var nav=b.getAttribute("data-method-exam-nav");
 if(nav){ev.preventDefault();ev.stopImmediatePropagation();handleNav(nav);return;}
 if(b.hasAttribute("data-method-exam-action")){action(ev,b);return;}
 if(b.hasAttribute("data-ndt-practice")&&root.querySelector(".lesson-content")){
  ev.preventDefault();ev.stopImmediatePropagation();
  var practiceArgs=(b.getAttribute("data-ndt-practice")||"all|all|all").split("|");
  if(window.NDT_MASTERCLASS_PRACTICE&&window.NDT_MASTERCLASS_PRACTICE.openPractice)window.NDT_MASTERCLASS_PRACTICE.openPractice(practiceArgs[0],practiceArgs[1],practiceArgs[2]);
  return;
 }
 if(b.hasAttribute("data-ndt-action")&&root.querySelector(".lesson-content")){
  ev.preventDefault();ev.stopImmediatePropagation();
  var legacyAction=b.getAttribute("data-ndt-action");
  if(legacyAction==="back"){setPage("course",{method:ui.courseMethod,push:false});return;}
  if(legacyAction==="home"){openMain("home");return;}
  if(legacyAction==="method"){openMain("method",b.getAttribute("data-mid"));return;}
  return;
 }
 if(b.hasAttribute("data-view")){
  if(window.NDT_MASTERCLASS_CUSTOM_VIEW||ui.page==="lesson"){
   ev.preventDefault();ev.stopImmediatePropagation();
   var v=b.getAttribute("data-view");openMain(v==="quiz"?"quiz":v);return;
  }
 }
},true);
window.addEventListener("utma:method-course-progress-refresh",function(){loadCloudProgress().then(render);});
var css=document.createElement("style");
css.textContent=".method-exam-grid{align-items:stretch}.exam-course-card{display:flex;flex-direction:column}.exam-course-card>p{font-size:13px;line-height:1.75;color:var(--muted);flex:1}.course-card-top,.course-progress-row{display:flex;justify-content:space-between;align-items:center;gap:12px}.course-progress-row{font-size:12px;color:var(--muted);margin-top:12px}.course-progress-row strong{color:var(--maroon)}.method-exam-toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap;padding:18px;margin:18px 0;border:1px solid var(--line);border-radius:16px;background:#fff}.method-exam-toolbar p{margin:5px 0 0}.course-dashboard-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-top:22px}.course-dashboard-metrics>div{border:1px solid #eadbd4;background:#fffaf7;padding:15px;border-radius:12px;display:grid;gap:4px}.course-dashboard-metrics strong{font-size:25px;color:var(--maroon)}.course-dashboard-metrics span{font-size:11px;color:var(--muted)}.exam-eligibility-card{display:grid;grid-template-columns:1.3fr 1fr;gap:20px;border:1px solid var(--line);padding:22px;border-radius:18px;background:#fff;margin:22px 0}.exam-eligibility-card h2{color:var(--maroon);margin:0 0 8px}.exam-eligibility-card p{font-size:13px;line-height:1.75}.exam-controls{display:grid;gap:8px;align-content:start}.method-lesson-list{display:grid;gap:9px}.method-lesson-row{display:grid;grid-template-columns:46px minmax(0,1fr) auto;align-items:center;gap:14px;border:1px solid var(--line);border-radius:13px;background:#fff;padding:13px}.lesson-number{font-size:13px;color:var(--orange);font-weight:900}.lesson-row-body{display:grid;gap:5px}.lesson-row-body strong{color:var(--maroon);font-size:14px}.lesson-row-body span{font-size:11px;color:var(--muted)}.method-lesson-progress{display:grid;gap:12px;border:1px solid #e9d3c8;background:#fff8f3;padding:18px;border-radius:15px;margin:16px 0 20px}.method-lesson-progress>div:first-child{display:grid;gap:7px}.method-lesson-progress strong{color:var(--maroon)}.method-lesson-progress p{margin:0;color:var(--muted);font-size:12px}.exam-live-header{display:flex;justify-content:space-between;align-items:center;gap:20px;margin:20px 0}.exam-live-header h1{font-size:clamp(24px,3vw,35px);color:var(--maroon);margin:12px 0}.exam-clock{padding:15px 22px;border:1px solid #e8c9ba;border-radius:15px;background:#fff8f3;min-width:145px;display:grid;gap:5px;text-align:center}.exam-clock span{font-size:11px;color:var(--muted)}.exam-clock strong{font-size:29px;color:var(--maroon);font-variant-numeric:tabular-nums}.exam-live-stats{display:flex;gap:10px;flex-wrap:wrap;margin:12px 0}.exam-live-stats span,.exam-palette-legend span{font-size:12px;color:var(--muted);padding:7px 10px;border:1px solid var(--line);border-radius:8px}.exam-live-layout{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(270px,.8fr);gap:18px;align-items:start}.exam-question-card h2{font-size:21px;line-height:1.55;color:var(--maroon);margin:22px 0}.exam-question-meta{display:flex;gap:6px;flex-wrap:wrap}.exam-answer-list{display:grid;gap:10px}.exam-answer{display:flex;align-items:flex-start;gap:12px;text-align:left;width:100%;padding:14px;border:1px solid var(--line);background:#fff;border-radius:12px;color:var(--ink);cursor:pointer;line-height:1.6}.exam-answer b{width:27px;height:27px;display:grid;place-items:center;border-radius:8px;background:#f4ebe6;color:var(--maroon);flex-shrink:0}.exam-answer.selected{border-color:var(--orange);background:#fff4eb}.exam-answer.selected b{background:var(--orange);color:white}.exam-move-actions{justify-content:space-between;margin-top:24px}.exam-palette-card{position:sticky;top:16px}.exam-question-palette{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin:15px 0}.exam-palette-number{border:1px solid var(--line);border-radius:7px;background:#fff;min-height:36px;font-size:11px;color:var(--ink);cursor:pointer}.exam-palette-number.answered{background:#e5f4e9;border-color:#86b899;color:#245b3b}.exam-palette-number.flagged{box-shadow:inset 0 0 0 2px #e5a16b}.exam-palette-number.current{border:2px solid var(--maroon);font-weight:900}.exam-palette-legend{display:flex;gap:6px;flex-wrap:wrap}.exam-palette-legend span{display:flex;align-items:center;gap:6px}.exam-palette-legend i{display:inline-block;width:10px;height:10px;border-radius:3px;background:#fff;border:1px solid var(--line)}.exam-palette-legend i.answered{background:#e5f4e9}.exam-palette-legend i.flagged{box-shadow:inset 0 0 0 2px #e5a16b}.exam-palette-legend i.current{border:2px solid var(--maroon)}.exam-score-card{display:grid;gap:5px;margin-top:18px;padding:20px;border:1px solid #e8c9ba;background:#fff8f3;border-radius:16px;max-width:320px}.exam-score-card strong{font-size:45px;color:var(--maroon)}.exam-score-card span{font-weight:900;color:var(--orange)}.exam-score-card p{font-size:12px;color:var(--muted)}.exam-review-list{display:grid;gap:9px}.exam-review-item{border:1px solid var(--line);border-radius:12px;background:#fff;overflow:hidden}.exam-review-item summary{padding:14px;cursor:pointer;display:flex;justify-content:space-between;gap:12px;align-items:flex-start;color:var(--maroon);line-height:1.6}.exam-review-body{padding:0 14px 15px}.exam-review-option{border:1px solid var(--line);border-radius:8px;padding:8px 10px;margin:7px 0;font-size:12px;line-height:1.5}.exam-review-option.correct{background:#eef8f0;border-color:#a4c9ad}.exam-review-option.wrong{background:#fff0ed;border-color:#e7aaa0}.exam-review-body p{font-size:13px;line-height:1.75}.certificate-record h3{color:var(--maroon)}.certificate-record p{font-size:12px;line-height:1.7;overflow-wrap:anywhere}.history-row{display:flex;align-items:center;justify-content:space-between;gap:15px}.history-row h3{color:var(--maroon);margin:0 0 8px}.history-row p{font-size:12px;line-height:1.65}.grid.one{grid-template-columns:1fr}.method-exam-grid .hero-actions{margin-top:14px}.method-exam-toolbar .hero-actions{margin:0}.exam-controls .btn:disabled{opacity:.5;cursor:not-allowed}@media(max-width:850px){.exam-live-layout{grid-template-columns:1fr}.exam-palette-card{position:static}.exam-eligibility-card{grid-template-columns:1fr}.history-row{align-items:flex-start;flex-direction:column}}@media(max-width:600px){.method-exam-grid{grid-template-columns:1fr}.method-lesson-row{grid-template-columns:32px minmax(0,1fr);gap:10px}.method-lesson-row button{grid-column:2;justify-self:start}.course-dashboard-metrics strong{font-size:21px}.exam-live-header{align-items:flex-start;flex-direction:column}.exam-clock{min-width:100%;display:flex;align-items:center;justify-content:space-between}.exam-live-stats span{flex:1;text-align:center}.exam-question-card h2{font-size:18px}.exam-move-actions .btn{flex:1}.exam-question-palette{grid-template-columns:repeat(5,minmax(0,1fr))}.history-row .hero-actions{width:100%}.history-row .btn{width:100%}}";
document.head.appendChild(css);
var lessonStyle=document.createElement("style");
lessonStyle.textContent=".lesson-detail-block{margin:20px 0;padding:18px;border:1px solid var(--line);border-radius:14px;background:#fff}.lesson-detail-block h2{margin:0 0 12px;color:var(--maroon);font-size:20px}.lesson-detail-block p,.lesson-detail-block li{font-size:13px;line-height:1.9;color:#4c3b3f}.lesson-detail-block ul,.lesson-detail-block ol{padding-left:22px;margin:10px 0}.lesson-detail-block li{padding:3px 0}.lesson-terms{display:grid;grid-template-columns:minmax(120px,.45fr) 1.4fr;gap:9px 15px;font-size:12px;line-height:1.7}.lesson-terms dt{font-weight:900;color:var(--maroon)}.lesson-terms dd{margin:0;color:var(--muted)}.lesson-formula-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.lesson-formula{border:1px solid #eadbd4;border-radius:11px;padding:13px;background:#fffaf7}.lesson-formula strong{display:block;color:var(--maroon);font-size:13px}.lesson-formula code{display:block;margin:10px 0;padding:9px;background:#f3e7df;border-radius:7px;color:var(--deep);white-space:normal;font-size:14px}.lesson-formula p{font-size:12px}.lesson-summary{border-color:#e6c0ab;background:#fff8f3}@media(max-width:600px){.lesson-detail-block{padding:14px}.lesson-formula-list{grid-template-columns:1fr}.lesson-terms{grid-template-columns:1fr;gap:3px}.lesson-terms dd{margin-bottom:9px}}";
document.head.appendChild(lessonStyle);
if(window.NDT_MASTERCLASS_PRACTICE){
 window.NDT_MASTERCLASS_PRACTICE.openPractice = window.NDT_MASTERCLASS_PRACTICE.openPractice || null;
}
document.addEventListener("DOMContentLoaded",function(){
 syncSession().then(function(){return loadCloudProgress();}).then(function(){if(ui.page==="exams")render();});
});
if(getClient()&&getClient().auth&&getClient().auth.onAuthStateChange){
 getClient().auth.onAuthStateChange(function(){syncSession().then(loadCloudProgress).then(function(){if(ui.page!=="exam-active")render();});});
}
window.NDT_MASTERCLASS_EXAMS={
 open:function(page,methodId){if(page==="certificates")handleNav("certificates");else if(page==="learning")handleNav("learning");else handleNav("exams");},
 getState:function(){return {page:ui.page,method:ui.courseMethod,user:!!ui.user};},
 refresh:function(){return loadCloudProgress().then(render);}
};
setTimeout(function(){if(ui.page==="exams")render();},0);
})();