/* UT Masterclass Academy — fresh UI controller */
(function () {
  "use strict";
  var D = window.UTMA_DATA || {methods:[],modules:[],formulas:[],knowledge:[],videos:[],quiz:[]};
  var root = document.getElementById("appContent");
  var activeView = "home";
  var searchOpen = false;
  var searchValue = "";
  var methodFilter = "all";
  var moduleFilter = "all";
  var quizIndex = 0;
  var quizScore = 0;
  var quizAnswered = false;
  var quizChoice = -1;
  var quizOrder = [];
  var progress = loadProgress();
  var supabaseClient = null;
  var currentUser = null;
  var authMode = "login";

  function esc(v) { return String(v == null ? "" : v).replace(/[&<>"']/g, function (c) { return ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[c]; }); }
  function loadProgress() { try { return JSON.parse(localStorage.getItem("utma-redesign-progress") || "{}"); } catch (e) { return {}; } }
  function saveProgress() { try { localStorage.setItem("utma-redesign-progress", JSON.stringify(progress)); } catch (e) { console.warn("Local progress could not be saved.", e); } updateProgressBadge(); }
  function isComplete(id) { return !!(progress.completed && progress.completed[id]); }
  function markComplete(id) { progress.completed = progress.completed || {}; progress.completed[id] = true; saveProgress(); syncModuleProgress(id); }
  async function syncModuleProgress(id) {
    if (!supabaseClient || !currentUser || !id) return;
    var now = new Date().toISOString();
    var result = await supabaseClient.from("academy_module_progress").upsert({
      user_id: currentUser.id, module_id: String(id), completed: true,
      completed_at: now, updated_at: now
    }, { onConflict: "user_id,module_id" });
    if (result.error) console.warn("Cloud module progress could not be saved.", result.error.message);
  }
  async function loadCloudProgress() {
    if (!supabaseClient || !currentUser) return;
    try {
      var modulesResult = await supabaseClient.from("academy_module_progress").select("module_id,completed").eq("user_id", currentUser.id);
      if (modulesResult.error) throw modulesResult.error;
      var cloudCompleted = {};
      (modulesResult.data || []).forEach(function (row) { if (row.completed) cloudCompleted[row.module_id] = true; });
      progress.completed = cloudCompleted;
      var attemptsResult = await supabaseClient.from("academy_quiz_attempts").select("score_percent,created_at").eq("user_id", currentUser.id).order("created_at", {ascending:false}).limit(100);
      if (attemptsResult.error) throw attemptsResult.error;
      var attempts = attemptsResult.data || [];
      progress.quizBest = attempts.reduce(function (best, row) { return Math.max(best, Number(row.score_percent) || 0); }, 0);
      progress.quizLast = attempts.length ? (Number(attempts[0].score_percent) || 0) : 0;
      saveProgress();
      if (activeView === "progress") renderProgress();
      else if (activeView === "home") renderHome();
    } catch (e) {
      console.warn("Cloud progress could not be loaded.", e.message || e);
    }
  }
  async function recordQuizAttempt(correctAnswers, totalQuestions) {
    if (!supabaseClient || !currentUser || !totalQuestions) return;
    var result = await supabaseClient.from("academy_quiz_attempts").insert({
      user_id: currentUser.id, quiz_type: "practice",
      correct_answers: correctAnswers, total_questions: totalQuestions
    });
    if (result.error) { console.warn("Quiz attempt could not be saved to the cloud.", result.error.message); return; }
    await loadCloudProgress();
  }
  function allModulesDone() { return D.modules.filter(function(m){return isComplete(m.id);}).length; }
  function updateProgressBadge() { var el = document.getElementById("progressBadge"); if (el) el.textContent = allModulesDone() + "/" + D.modules.length; }
  function byId(id) { return D.modules.find(function(m){return m.id === id;}) || D.modules[0]; }
  function methodById(id) { return D.methods.find(function(m){return m.id === id;}) || D.methods[0]; }
  function go(view, arg) {
    activeView = view;
    document.querySelectorAll("[data-view]").forEach(function(b){ b.classList.toggle("active", b.getAttribute("data-view") === (view === "method" ? "methods" : view)); });
    document.querySelectorAll(".main-nav").forEach(function(n){ n.classList.remove("open"); });
    if (view === "lesson") renderLesson(arg || "ut");
    else if (view === "method") renderMethodDetail(arg || "ut");
    else if (view === "methods") renderMethods();
    else if (view === "academy") renderAcademy();
    else if (view === "formulas") renderFormulas();
    else if (view === "knowledge") renderKnowledge();
    else if (view === "videos") renderVideos();
    else if (view === "quiz") startQuiz();
    else if (view === "progress") renderProgress();
    else if (view === "about") renderAbout();
    else if (view === "search") renderSearchResults(searchValue);
    else renderHome();
    window.scrollTo({top:0,behavior:window.matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});
  }
  function crumb(label) { return '<div class="breadcrumbs"><span>Academy</span> &nbsp;/&nbsp; ' + esc(label) + '</div>'; }
  function pageHero(kicker,title,desc) { return '<section class="page-hero"><div class="eyebrow">' + esc(kicker) + '</div><h1>' + esc(title) + '</h1><p>' + esc(desc) + '</p></section>'; }
  function sectionHead(kicker,title,desc,link,label) { return '<div class="section-head"><div><div class="section-kicker">' + esc(kicker) + '</div><h2>' + title + '</h2><p>' + desc + '</p></div>' + (link ? '<button class="text-link" data-go="' + esc(link) + '">' + esc(label || "Explore all") + ' ↗</button>' : '') + '</div>'; }
  function iconSvg(name) {
    var paths = {
      search:'<circle cx="11" cy="11" r="7"></circle><path d="m16 16 4 4"></path>',
      book:'<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21z"></path><path d="M4 5.5v13A2.5 2.5 0 0 1 6.5 16H20"></path>',
      play:'<path d="m8 5 11 7-11 7z" fill="currentColor" stroke="none"></path>',
      flask:'<path d="M9 3h6M10 3v6L4.5 18.1A2 2 0 0 0 6.2 21h11.6a2 2 0 0 0 1.7-2.9L14 9V3"></path><path d="M7 15h10"></path>',
      chart:'<path d="M4 19V5M4 19h17"></path><path d="m7 15 4-5 3 2 5-7"></path>',
      shield:'<path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11z"></path><path d="m9 12 2 2 4-4"></path>',
      arrow:'<path d="M5 12h14M13 6l6 6-6 6"></path>',
      check:'<path d="m5 12 4 4L19 6"></path>',
      clock:'<circle cx="12" cy="12" r="9"></circle><path d="M12 7v5l3 2"></path>',
      layers:'<path d="m12 3 9 5-9 5-9-5z"></path><path d="m3 12 9 5 9-5M3 16l9 5 9-5"></path>',
      menu:'<path d="M4 7h16M4 12h16M4 17h16"></path>',
      close:'<path d="m6 6 12 12M18 6 6 18"></path>',
      bookmark:'<path d="M6 4h12v17l-6-4-6 4z"></path>',
      warning:'<path d="m12 3 10 18H2z"></path><path d="M12 9v4M12 17h.01"></path>'
    };
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (paths[name] || paths.book) + '</svg>';
  }
  function heroDiagram() {
    return '<svg viewBox="0 0 440 280" role="img" aria-label="Original illustration of an ultrasonic probe sending sound pulses into a metal component"><defs><linearGradient id="metal" x1="0" x2="1"><stop stop-color="#f8c7a4"/><stop offset="1" stop-color="#c65d24"/></linearGradient><linearGradient id="probe" x1="0" x2="1"><stop stop-color="#d5dce4"/><stop offset="1" stop-color="#78899a"/></linearGradient></defs><g opacity=".35" stroke="#fff" stroke-width="1"><path d="M20 40h400M20 80h400M20 120h400M20 160h400M20 200h400M20 240h400"/><path d="M60 20v240M100 20v240M140 20v240M180 20v240M220 20v240M260 20v240M300 20v240M340 20v240M380 20v240"/></g><rect x="64" y="153" width="310" height="76" rx="10" fill="url(#metal)" stroke="#ffe3d0" stroke-width="2"/><path d="M64 180h310M64 204h310" stroke="#8d3c26" stroke-opacity=".25"/><rect x="164" y="119" width="78" height="25" rx="5" fill="url(#probe)" stroke="#fff" stroke-width="1.5"/><path d="M179 119v-22h48v22" fill="#8d9eaf" stroke="#fff" stroke-width="1.5"/><path d="M203 97V71" stroke="#f4b183" stroke-width="5" stroke-linecap="round"/><path d="M170 148 Q202 168 234 148 M170 148 Q202 184 234 148 M170 148 Q202 200 234 148" fill="none" stroke="#fff4e7" stroke-width="2.2" stroke-linecap="round"/><path d="M202 149v57" stroke="#fff" stroke-width="2" stroke-dasharray="4 4"/><path d="M194 199l8 10 8-10" fill="none" stroke="#fff" stroke-width="2"/><rect x="186" y="198" width="32" height="5" rx="2" fill="#4a1020"/><path d="M260 168h58" stroke="#fff" stroke-width="1.5"/><circle cx="260" cy="168" r="4" fill="#fff"/><text x="324" y="164" fill="#fff" font-size="10" font-weight="700">Reflector</text><text x="203" y="252" fill="#fff1e8" font-size="11" font-weight="700" text-anchor="middle">Test component</text><text x="203" y="56" fill="#ffc6a6" font-size="11" font-weight="700" text-anchor="middle">Ultrasonic probe</text><text x="275" y="125" fill="#fff" font-size="10">Couplant</text><path d="M245 130h25" stroke="#fff" stroke-width="1.5"/></svg>';
  }
  function methodDiagram(kind) {
    if (kind === "rt") return '<svg viewBox="0 0 600 210" role="img" aria-label="Radiography schematic showing source, component and detector"><rect x="45" y="35" width="55" height="55" rx="8" fill="#4a1020"/><circle cx="72" cy="62" r="9" fill="#f4b183"/><path d="M100 62 260 125M100 62 260 92M100 62 260 158" stroke="#c65d24" stroke-width="2" stroke-dasharray="5 4"/><rect x="260" y="50" width="82" height="115" rx="7" fill="#e4a16f" stroke="#4a1020" stroke-width="2"/><path d="M281 50v115M302 50v115M323 50v115" stroke="#a64a26" stroke-width="1.5" opacity=".55"/><rect x="450" y="35" width="55" height="145" rx="7" fill="#4a1020"/><path d="M460 50h35M460 70h35M460 90h35M460 110h35M460 130h35M460 150h35" stroke="#f4b183"/><text x="72" y="108" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Source</text><text x="301" y="185" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Component</text><text x="478" y="197" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Detector</text></svg>';
    if (kind === "tofd") return '<svg viewBox="0 0 600 210" role="img" aria-label="TOFD transmitter and receiver with diffraction signals"><rect x="55" y="90" width="490" height="85" rx="7" fill="#e8b08a" stroke="#8f482e" stroke-width="2"/><rect x="160" y="62" width="55" height="22" rx="5" fill="#4a1020"/><rect x="385" y="62" width="55" height="22" rx="5" fill="#4a1020"/><path d="M188 84 300 135 412 84" fill="none" stroke="#c65d24" stroke-width="2.5"/><path d="M188 84 412 84" fill="none" stroke="#a84b28" stroke-width="2" stroke-dasharray="5 4"/><path d="M300 135 300 175" stroke="#4a1020" stroke-width="3"/><circle cx="300" cy="135" r="5" fill="#fff" stroke="#4a1020" stroke-width="2"/><text x="188" y="49" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Transmit</text><text x="412" y="49" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Receive</text><text x="300" y="197" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Diffracted tip signal</text></svg>';
    if (kind === "paut") return '<svg viewBox="0 0 600 210" role="img" aria-label="Phased array probe steering multiple beams"><rect x="170" y="35" width="260" height="32" rx="7" fill="#4a1020"/><g fill="#f4b183" stroke="#fff"><rect x="182" y="41" width="17" height="20" rx="2"/><rect x="204" y="41" width="17" height="20" rx="2"/><rect x="226" y="41" width="17" height="20" rx="2"/><rect x="248" y="41" width="17" height="20" rx="2"/><rect x="270" y="41" width="17" height="20" rx="2"/><rect x="292" y="41" width="17" height="20" rx="2"/><rect x="314" y="41" width="17" height="20" rx="2"/><rect x="336" y="41" width="17" height="20" rx="2"/><rect x="358" y="41" width="17" height="20" rx="2"/><rect x="380" y="41" width="17" height="20" rx="2"/><rect x="402" y="41" width="17" height="20" rx="2"/></g><rect x="65" y="150" width="470" height="37" rx="5" fill="#e8b08a" stroke="#8f482e" stroke-width="2"/><path d="M185 68 120 149M210 68 200 149M235 68 280 149M260 68 360 149M285 68 435 149M310 68 500 149" stroke="#c65d24" stroke-width="2" fill="none"/><text x="300" y="207" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Electronic delay steers beam angles</text></svg>';
    if (kind === "et") return '<svg viewBox="0 0 600 210" role="img" aria-label="Eddy current coil inducing current loops in a conductive surface"><rect x="45" y="135" width="510" height="50" rx="8" fill="#e8b08a" stroke="#8f482e" stroke-width="2"/><path d="M210 80c0-45 180-45 180 0v35c0 45-180 45-180 0z" fill="none" stroke="#4a1020" stroke-width="12"/><path d="M235 140c-55 28-25 50 30 30s75-16 100 0 50-5 8-28M260 145c-20 15 0 25 30 15s55-8 75 2" stroke="#c65d24" stroke-width="3" fill="none"/><text x="300" y="40" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Alternating-current coil</text><text x="300" y="205" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Conductive test material</text></svg>';

    if (kind === "visual") return '<svg viewBox="0 0 600 210" role="img" aria-label="Visual inspection using an optical aid"><rect x="55" y="120" width="490" height="55" rx="8" fill="#e8b08a" stroke="#8f482e" stroke-width="2"/><path d="M120 145h120M260 145h95" stroke="#8f482e" stroke-width="3"/><circle cx="300" cy="70" r="28" fill="#fff" stroke="#4a1020" stroke-width="6"/><circle cx="300" cy="70" r="11" fill="#f4b183"/><path d="M320 91 350 120" stroke="#4a1020" stroke-width="8" stroke-linecap="round"/><path d="M342 115 382 145" stroke="#c65d24" stroke-width="2" stroke-dasharray="5 4"/><text x="300" y="30" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Optical aid / camera</text><text x="300" y="198" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Visible surface</text></svg>';
    if (kind === "pt") return '<svg viewBox="0 0 600 210" role="img" aria-label="Penetrant entering a surface-breaking crack"><rect x="40" y="110" width="520" height="65" rx="6" fill="#e8b08a" stroke="#8f482e" stroke-width="2"/><path d="M295 110 310 160 324 110" fill="#4a1020"/><path d="M265 65c0-20 70-20 70 0v28h-70z" fill="#c65d24" opacity=".9"/><path d="M280 93v14M300 93v14M320 93v14" stroke="#c65d24" stroke-width="3" stroke-linecap="round"/><circle cx="285" cy="126" r="4" fill="#c65d24"/><circle cx="300" cy="141" r="4" fill="#c65d24"/><circle cx="315" cy="126" r="4" fill="#c65d24"/><text x="300" y="45" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Penetrant application</text><text x="300" y="198" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Surface-breaking discontinuity</text></svg>';
    if (kind === "mt") return '<svg viewBox="0 0 600 210" role="img" aria-label="Magnetic particle indication at a surface crack"><rect x="45" y="110" width="510" height="65" rx="6" fill="#e8b08a" stroke="#8f482e" stroke-width="2"/><path d="M300 110v45" stroke="#4a1020" stroke-width="4"/><path d="M160 95c30-60 250-60 280 0M190 95c35-40 185-40 220 0M225 95c30-22 120-22 150 0" fill="none" stroke="#c65d24" stroke-width="2"/><g fill="#4a1020"><circle cx="286" cy="103" r="3"/><circle cx="292" cy="99" r="3"/><circle cx="300" cy="96" r="3"/><circle cx="308" cy="100" r="3"/><circle cx="315" cy="104" r="3"/></g><text x="300" y="35" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Magnetic flux and leakage field</text><text x="300" y="198" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Particles collect at the discontinuity</text></svg>';
    if (kind === "irt") return '<svg viewBox="0 0 600 210" role="img" aria-label="Infrared camera viewing a thermal pattern"><rect x="45" y="130" width="510" height="45" rx="7" fill="#4a1020"/><rect x="240" y="135" width="120" height="35" rx="5" fill="#c65d24"/><rect x="255" y="140" width="25" height="25" fill="#f4b183"/><rect x="282" y="140" width="25" height="25" fill="#e99a6b"/><rect x="309" y="140" width="25" height="25" fill="#f8d3a5"/><path d="M180 70 255 130M210 70 285 130M240 70 315 130" stroke="#c65d24" stroke-width="2" stroke-dasharray="5 4"/><rect x="150" y="25" width="110" height="45" rx="8" fill="#4a1020"/><circle cx="205" cy="47" r="12" fill="#f4b183"/><text x="330" y="47" fill="#4a1020" font-size="12" font-weight="700">Thermal pattern</text><text x="300" y="198" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Temperature contrast depends on emissivity and setup</text></svg>';
    if (kind === "lt") return '<svg viewBox="0 0 600 210" role="img" aria-label="Leak testing with bubbles at a joint"><rect x="55" y="90" width="490" height="70" rx="12" fill="#e8b08a" stroke="#8f482e" stroke-width="2"/><rect x="260" y="78" width="80" height="94" rx="7" fill="#4a1020"/><path d="M300 78v94" stroke="#f4b183" stroke-width="2" stroke-dasharray="4 4"/><g fill="#fff" stroke="#c65d24" stroke-width="2"><circle cx="315" cy="65" r="9"/><circle cx="333" cy="45" r="6"/><circle cx="352" cy="28" r="4"/></g><path d="M300 70v-18" stroke="#c65d24" stroke-width="2"/><text x="300" y="190" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Leak path at a boundary joint</text></svg>';
    if (kind === "ae") return '<svg viewBox="0 0 600 210" role="img" aria-label="Acoustic emission sensors detecting waves from an active source"><rect x="50" y="100" width="500" height="65" rx="7" fill="#e8b08a" stroke="#8f482e" stroke-width="2"/><rect x="105" y="75" width="45" height="25" rx="5" fill="#4a1020"/><rect x="450" y="75" width="45" height="25" rx="5" fill="#4a1020"/><circle cx="300" cy="130" r="5" fill="#4a1020"/><g fill="none" stroke="#c65d24" stroke-width="2"><circle cx="300" cy="130" r="22"/><circle cx="300" cy="130" r="42"/><circle cx="300" cy="130" r="62"/></g><path d="M127 75v-20h346v20" fill="none" stroke="#4a1020" stroke-width="2" stroke-dasharray="5 4"/><text x="127" y="42" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Sensor</text><text x="472" y="42" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Sensor</text><text x="300" y="195" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Active event emits elastic waves</text></svg>';
    if (kind === "guided") return '<svg viewBox="0 0 600 210" role="img" aria-label="Guided wave screening along a pipe"><rect x="50" y="75" width="500" height="90" rx="18" fill="#e8b08a" stroke="#8f482e" stroke-width="3"/><ellipse cx="85" cy="120" rx="28" ry="45" fill="#4a1020"/><ellipse cx="85" cy="120" rx="15" ry="29" fill="#f4b183"/><path d="M125 100h330M125 120h330M125 140h330" stroke="#c65d24" stroke-width="3" stroke-dasharray="10 8"/><path d="M440 90l18 10-18 10M440 110l18 10-18 10" fill="none" stroke="#4a1020" stroke-width="2"/><text x="300" y="48" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Guided wave travels along pipe wall</text><text x="300" y="195" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Long-range screening · follow-up may be required</text></svg>';
    if (kind === "materials") return '<svg viewBox="0 0 600 210" role="img" aria-label="Schematic material microstructure with grains and a crack"><rect x="45" y="35" width="510" height="140" rx="7" fill="#f4c8a6" stroke="#8f482e" stroke-width="2"/><g fill="none" stroke="#c65d24" stroke-width="2"><path d="M45 75 120 35 155 95 110 175M120 35 250 60 230 130 155 95M250 60 350 35 380 100 310 140 230 130M350 35 470 65 455 135 380 100M470 65 555 35M455 135 555 175M310 140 380 175"/></g><path d="M295 50 278 80 301 99 286 125 310 145" stroke="#4a1020" stroke-width="5" fill="none"/><text x="300" y="198" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Microstructure and damage influence NDT response</text></svg>';
    return '<svg viewBox="0 0 600 210" role="img" aria-label="Ultrasonic pulse echo diagram showing probe, sound path and reflector"><rect x="50" y="135" width="500" height="50" rx="7" fill="#e8b08a" stroke="#8f482e" stroke-width="2"/><rect x="250" y="88" width="100" height="30" rx="5" fill="#4a1020"/><path d="M265 118 190 135M285 118 260 135M315 118 340 135M335 118 410 135" stroke="#c65d24" stroke-width="2" fill="none"/><path d="M300 119v35" stroke="#fff" stroke-width="2" stroke-dasharray="4 4"/><circle cx="300" cy="155" r="6" fill="#fff" stroke="#4a1020" stroke-width="2"/><text x="300" y="75" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Probe + couplant</text><text x="300" y="205" text-anchor="middle" fill="#4a1020" font-size="12" font-weight="700">Sound enters component and returns as an echo</text></svg>';
  }
  function renderHome() {
    var done = allModulesDone();
    var paths = [
      {num:"01",symbol:"01",tag:"Start here",title:"Foundation",desc:"Build the physics, maths and material knowledge behind reliable NDT decisions.",filter:"Foundation"},
      {num:"02",symbol:"02",tag:"Core methods",title:"Inspection Methods",desc:"Study UT, VT, PT, MT, RT and ET with principles, equipment and process steps.",filter:"Core Methods"},
      {num:"03",symbol:"03",tag:"Advanced",title:"Advanced Ultrasonics",desc:"Progress into PAUT, TOFD, encoded inspection and emerging NDT methods.",filter:"Advanced"}
    ];
    var pathHtml = paths.map(function(p){return '<article class="path-card" data-number="' + p.num + '"><div class="path-top"><span class="pill">' + p.tag + '</span><span class="path-symbol">' + p.symbol + '</span></div><h3>' + p.title + '</h3><p>' + p.desc + '</p><div class="card-foot"><span>Self-paced theory</span><button class="arrow-link" data-filter-modules="' + p.filter + '">Explore pathway →</button></div></article>';}).join("");
    var methods = D.methods.slice(0,8).map(methodCard).join("");
    var videos = D.videos.filter(function(v){return !!v.embedId;}).slice(0,3).map(videoCard).join("");
    root.innerHTML = crumb("Home") +
      '<section class="hero"><div><div class="eyebrow">Engineering knowledge. Inspection confidence.</div><h1>Understand the science behind <em>every signal.</em></h1><p>A self-paced NDT learning environment for students, technicians and engineers. Learn the principles, interpret the signals, practise the calculations and understand the limits of each method.</p><div class="hero-actions"><button class="btn btn-primary" data-go="academy">Start learning ' + iconSvg("arrow") + '</button><button class="btn btn-glass" data-go="formulas">' + iconSvg("flask") + ' Explore Formula Library</button></div></div><div class="hero-art">' + heroDiagram() + '<div class="hero-note"><span class="hero-note-icon">↗</span><span>UT fundamentals<small>Wave physics · Calibration · A-scan</small></span></div></div></section>' +
      '<div class="stat-row"><div class="stat"><div class="stat-icon">' + iconSvg("book") + '</div><div><strong>' + D.modules.length + '</strong><span>Structured learning modules</span></div></div><div class="stat"><div class="stat-icon">' + iconSvg("layers") + '</div><div><strong>' + D.methods.length + '</strong><span>Inspection method guides</span></div></div><div class="stat"><div class="stat-icon">' + iconSvg("flask") + '</div><div><strong>' + D.formulas.length + '</strong><span>Technical formulas</span></div></div><div class="stat"><div class="stat-icon">' + iconSvg("chart") + '</div><div><strong>' + done + '/' + D.modules.length + '</strong><span>Modules completed</span></div></div></div>' +
      '<section class="section">' + sectionHead("A guided learning journey","Learn in a clear sequence","Start with fundamentals, build method knowledge, then progress into advanced ultrasonic inspection and professional practice.","academy","View curriculum") + '<div class="path-grid">' + pathHtml + '</div></section>' +
      '<section class="section">' + sectionHead("Explore the methods","Choose an inspection method","Every guide explains the physical principle, typical equipment, workflow, strengths, limitations and relevant indication types.","methods","All methods") + '<div class="method-grid">' + methods + '</div></section>' +
      '<section class="section"><div class="split-feature"><article class="feature-card"><div class="feature-icon">' + iconSvg("flask") + '</div><h3>Formula Library & calculators</h3><p>Look up equations, understand every symbol and unit, review assumptions and test common calculations without signing in.</p><button class="btn btn-light" data-go="formulas">Open formula library ' + iconSvg("arrow") + '</button><svg class="feature-decoration" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="white" stroke-width="2"><circle cx="100" cy="100" r="25"/><circle cx="100" cy="100" r="50"/><circle cx="100" cy="100" r="75"/><path d="M20 100h160M100 20v160M43 43l114 114M157 43 43 157"/></g></svg></article><article class="feature-card orange"><div class="feature-icon">' + iconSvg("chart") + '</div><h3>Practise. Review. Improve.</h3><p>Check your understanding with method-based questions, receive explanations and track completed lessons on this device.</p><button class="btn btn-light" data-go="quiz">Start a knowledge check ' + iconSvg("arrow") + '</button><svg class="feature-decoration" viewBox="0 0 200 200" aria-hidden="true"><g fill="none" stroke="white" stroke-width="2"><path d="M20 160 65 115 92 135 145 55 180 70"/><path d="M20 180h160M20 20v160"/></g></svg></article></div></section>' +
      '<section class="section">' + sectionHead("Watch and explore","Visual learning matters","Use technical illustrations and curated source links to connect theory with real inspection systems. Source availability can change.","videos","Open media library") + '<div class="media-grid">' + videos + '</div></section>' +
      '<div class="note-banner">' + iconSvg("warning") + '<div><strong>Educational scope and safety.</strong> This platform supports theory learning and practice. It does not grant external NDT personnel certification or authorize independent production inspection. Always follow the applicable approved procedure, governing standard, radiation or site safety rules and qualified supervision.</div></div>';
  }
  function methodCard(m) {
    var diagram = methodDiagram(m.id);
    return '<article class="method-card"><div class="method-visual">' + diagram + '</div><div class="method-body"><div class="method-meta"><span class="method-code">' + esc(m.short) + ' · ' + esc(m.type) + '</span><span class="method-level">' + esc(m.level) + '</span></div><h3>' + esc(m.name) + '</h3><p>' + esc(m.summary) + '</p><button class="arrow-link" data-method="' + esc(m.id) + '">Study method →</button></div></article>';
  }
  function videoCard(v) {
    var img = v.topic.indexOf("RT") >= 0 ? "photo-1518770660439-4636190af475" : v.topic.indexOf("UT") >= 0 ? "photo-1581092160607-ee22621dd758" : "photo-1581092160562-40aa08e78837";
    var media = v.embedId
      ? '<div class="media-thumb has-video"><iframe loading="lazy" src="https://www.youtube-nocookie.com/embed/' + esc(v.embedId) + '" title="' + esc(v.title) + '" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe></div>'
      : '<div class="media-thumb"><img loading="lazy" src="https://images.unsplash.com/' + img + '?auto=format&fit=crop&w=700&q=75" alt="Engineering and inspection learning visual" onerror="this.style.display=\'none\'"><span class="play-button">' + iconSvg("play") + '</span></div>';
    return '<article class="media-card">' + media + '<div class="media-content"><small>' + esc(v.source) + ' · ' + esc(v.topic) + '</small><h3>' + esc(v.title) + '</h3><p>' + esc(v.note) + '</p><a href="' + esc(v.url) + '" target="_blank" rel="noopener noreferrer">Open source resource ↗</a></div></article>';
  }
  function renderMethods() {
    root.innerHTML = crumb("NDT Methods") + pageHero("Method directory","Explore NDT methods","Choose a method to understand its physical principle, equipment, workflow, applications, strengths, limitations and common target discontinuities.") +
      '<div class="toolbar"><input class="field" id="methodSearch" type="search" placeholder="Search methods, applications or limitations…" value="' + esc(searchValue) + '" aria-label="Search methods"><select class="select" id="methodLevel"><option value="all">All levels</option><option>Foundation</option><option>Core</option><option>Advanced</option></select><span class="result-count" id="methodCount"></span></div><div class="methods-layout" id="methodResults"></div>';
    function filter() {
      var q = document.getElementById("methodSearch").value.toLowerCase();
      var level = document.getElementById("methodLevel").value;
      var items = D.methods.filter(function(m){return (level==="all"||m.level===level) && (m.name+" "+m.summary+" "+m.type+" "+m.defects+" "+m.applications).toLowerCase().indexOf(q)>=0;});
      document.getElementById("methodResults").innerHTML = items.map(methodCard).join("") || '<div class="empty-state">No method matches that search. Try a broader term.</div>';
      document.getElementById("methodCount").textContent = items.length + " methods";
    }
    document.getElementById("methodSearch").addEventListener("input",filter);
    document.getElementById("methodLevel").addEventListener("change",filter);
    filter();
  }

  function renderMethodDetail(id) {
    var m=methodById(id);
    var lessonMap={visual:"vt",guided:"advanced",materials:"materials",ut:"ut",paut:"paut",tofd:"tofd",rt:"rt",mt:"mt",pt:"pt",et:"et",irt:"irt",lt:"lt",ae:"ae"};
    var related=byId(lessonMap[m.id]||"intro");
    root.innerHTML=crumb(m.name)+"<div class=\"lesson-shell\"><article class=\"lesson-main\"><div class=\"eyebrow\" style=\"color:var(--orange)\">"+esc(m.level)+" · "+esc(m.type)+"</div><h1>"+esc(m.name)+"</h1><p class=\"lesson-lead\">"+esc(m.summary)+"</p><div class=\"diagram-panel\"><h3>Conceptual method diagram</h3>"+methodDiagram(m.id)+"<div class=\"diagram-caption\">Original educational schematic, not a qualified inspection setup or acceptance reference.</div></div><section class=\"lesson-section\"><h2>Physical principle</h2><p>"+esc(m.principle)+"</p></section><section class=\"lesson-section\"><h2>Typical equipment</h2><p>"+esc(m.equipment)+"</p></section><section class=\"lesson-section\"><h2>General workflow</h2><ul>"+m.workflow.map(function(s){return "<li>"+esc(s)+"</li>";}).join("")+"</ul></section><section class=\"lesson-section\"><h2>Strengths</h2><p>"+esc(m.strengths)+"</p></section><section class=\"lesson-section\"><h2>Limitations and influencing factors</h2><p>"+esc(m.limits)+"</p></section><section class=\"lesson-section\"><h2>Common target discontinuities</h2><p>"+esc(m.defects)+"</p></section><div class=\"formula-callout\"><span class=\"small-muted\" style=\"color:#ffc6a6\">RELATED LEARNING</span><strong>"+esc(related.title)+"</strong><p>"+esc(related.summary)+"</p><button class=\"btn btn-light\" style=\"margin-top:12px\" data-module=\""+esc(related.id)+"\">Study related lesson →</button></div><div class=\"lesson-footer-actions\"><button class=\"btn btn-primary\" data-go=\"academy\">Browse full curriculum</button><button class=\"btn btn-outline\" data-go=\"videos\">Explore videos & media</button></div></article><aside class=\"lesson-aside\"><div class=\"aside-label\">Method at a glance</div><div class=\"aside-title\">"+esc(m.short)+" · "+esc(m.type)+"</div><p class=\"aside-copy\">"+esc(m.tag||m.level)+"</p><ul class=\"aside-list\"><li>Understand the physical principle</li><li>Confirm material and geometry suitability</li><li>Verify calibration and technique</li><li>Document coverage and limitations</li></ul><div class=\"aside-label\">Professional note</div><p class=\"aside-copy\">Use qualified personnel and the applicable approved procedure. This guide is an educational overview, not an inspection instruction or acceptance decision.</p></aside></div>";
  }
  function renderAcademy() {
    var filter = moduleFilter;
    var items = D.modules.filter(function(m){return filter==="all" || (filter==="Advanced" ? m.phase.indexOf("Advanced")===0 : m.phase===filter);});
    var groups = [];
    D.modules.forEach(function(m){if(groups.indexOf(m.phase)<0)groups.push(m.phase);});
    root.innerHTML = crumb("Learning Academy") + pageHero("Self-paced curriculum","Learning Academy","Follow a structured curriculum from maths and materials to inspection methods, advanced ultrasonics, measurement quality and professional practice.") +
      '<div class="toolbar"><input class="field" id="moduleSearch" type="search" placeholder="Search modules or learning objectives…" aria-label="Search learning modules"><select class="select" id="modulePhase"><option value="all">All learning phases</option><option value="Advanced"' + (filter==="Advanced"?" selected":"") + '>Advanced pathways</option>' + groups.map(function(g){return '<option value="' + esc(g) + '"' + (g===filter?' selected':'') + '>' + esc(g) + '</option>';}).join("") + '</select><span class="result-count" id="moduleCount"></span></div><div class="module-grid" id="moduleResults"></div><div class="note-banner">' + iconSvg("warning") + '<div><strong>Learning note.</strong> Lesson summaries are educational explanations. Inspection decisions must be made using the applicable procedure and acceptance criteria.</div></div>';
    function filterModules() {
      var q = document.getElementById("moduleSearch").value.toLowerCase();
      var phase = document.getElementById("modulePhase").value;
      var results = D.modules.filter(function(m){return (phase==="all" || (phase==="Advanced" ? m.phase.indexOf("Advanced")===0 : m.phase===phase)) && (m.title+" "+m.summary+" "+m.phase+" "+m.objectives.join(" ")).toLowerCase().indexOf(q)>=0;});
      document.getElementById("moduleResults").innerHTML = results.map(function(m,i){return '<article class="module-card"><div class="module-top"><span class="module-number">' + String(D.modules.indexOf(m)+1).padStart(2,"0") + '</span><span class="pill">' + esc(m.level) + '</span></div><h3>' + esc(m.title) + (isComplete(m.id)?' <span style="color:#2e7652;font-size:11px">✓</span>':'') + '</h3><p>' + esc(m.summary) + '</p><div class="module-meta"><span>' + esc(m.phase) + ' · ' + esc(m.time) + '</span><button class="arrow-link" data-module="' + esc(m.id) + '">Open lesson →</button></div></article>';}).join("") || '<div class="empty-state">No modules match those filters.</div>';
      document.getElementById("moduleCount").textContent = results.length + " of " + D.modules.length + " modules";
    }
    document.getElementById("moduleSearch").addEventListener("input",filterModules);
    document.getElementById("modulePhase").addEventListener("change",function(){moduleFilter=this.value;filterModules();});
    filterModules();
  }
  function renderLesson(id) {
    var m = byId(id);
    var index = D.modules.indexOf(m);
    var done = isComplete(m.id);
    var next = D.modules[index+1];
    var previous = D.modules[index-1];
    var sections = m.sections.map(function(s){return '<section class="lesson-section"><h2>' + esc(s[0]) + '</h2><p>' + esc(s[1]) + '</p></section>';}).join("");
    var diagramKind = m.diagram || ({vt:"visual",guided:"guided",materials:"materials"}[m.id] || m.id);
    var diagram = '<div class="diagram-panel"><h3>Technical schematic · conceptual illustration</h3>' + methodDiagram(diagramKind) + '<div class="diagram-caption">Original schematic for learning. It is not a scale drawing, qualified scan plan or acceptance reference.</div></div>';
    var formulas = D.formulas.filter(function(f){return f.method.indexOf(m.id.toUpperCase())>=0 || (m.id==="physics"&&f.category==="Wave & acoustics") || (m.id==="math"&&f.category==="Materials");}).slice(0,3);
    var formulaBox = formulas.length ? '<div class="formula-callout"><span class="small-muted" style="color:#ffc6a6">RELATED EQUATION</span><strong>' + esc(formulas[0].equation) + '</strong><p>' + esc(formulas[0].description) + '</p></div>' : "";
    root.innerHTML = crumb(m.title) + '<div class="lesson-shell"><article class="lesson-main"><div class="eyebrow" style="color:var(--orange)">' + esc(m.phase) + ' · ' + esc(m.level) + '</div><h1>' + esc(m.title) + '</h1><p class="lesson-lead">' + esc(m.summary) + '</p><section class="lesson-section"><h2>Learning objectives</h2><ul>' + m.objectives.map(function(o){return '<li>' + esc(o) + '</li>';}).join("") + '</ul></section>' + diagram + sections + formulaBox + '<section class="lesson-section"><h2>Key takeaway</h2><p>' + esc(m.key || "Follow the approved procedure and record the inspection limitations.") + '</p></section><div class="lesson-footer-actions"><button class="btn ' + (done?'btn-outline':'btn-primary') + '" id="markLesson">' + (done?'✓ Completed — mark again':'Mark lesson complete') + '</button><button class="btn btn-outline" data-go="quiz">Practise knowledge check</button>' + (previous?'<button class="btn btn-outline" data-module="' + esc(previous.id) + '">← Previous lesson</button>':'') + (next?'<button class="btn btn-outline" data-module="' + esc(next.id) + '">Next lesson →</button>':'') + '</div></article><aside class="lesson-aside"><div class="aside-label">Lesson guide</div><div class="aside-title">' + esc(m.title) + '</div><p class="aside-copy">' + esc(m.time) + ' · Self-paced theory</p><ul class="aside-list">' + m.objectives.map(function(o){return '<li>' + esc(o) + '</li>';}).join("") + '</ul><div class="aside-label">Related method</div><p class="aside-copy">' + esc(m.phase) + ' lessons are intended to be studied alongside relevant procedures, standards and instructor guidance.</p><button class="btn btn-outline" style="width:100%;margin-top:15px" data-go="videos">Related videos ↗</button></aside></div>';
    document.getElementById("markLesson").addEventListener("click",function(){markComplete(m.id);renderLesson(m.id);});
  }
  function renderFormulas() {
    root.innerHTML = crumb("Formula Library") + pageHero("Engineering reference desk","Formula Library","Search equations, understand variables and units, review assumptions, and use the small calculators for theory practice. Results are not acceptance decisions.") +
      '<div class="toolbar"><input class="field" id="formulaSearch" type="search" placeholder="Search formula, symbol, topic or method…" aria-label="Search formulas"><select class="select" id="formulaCategory"><option value="all">All categories</option>' + Array.from(new Set(D.formulas.map(function(f){return f.category;}))).map(function(c){return '<option>' + esc(c) + '</option>';}).join("") + '</select><select class="select" id="formulaMethod"><option value="all">All methods</option>' + Array.from(new Set(D.formulas.map(function(f){return f.method;}))).map(function(c){return '<option>' + esc(c) + '</option>';}).join("") + '</select><span class="result-count" id="formulaCount"></span></div><div class="formula-grid" id="formulaResults"></div><div class="note-banner">' + iconSvg("warning") + '<div><strong>Calculation safety.</strong> Confirm material properties, wave mode, geometry, units and procedure before applying a formula. Simplified equations do not replace validated instrument software or approved inspection methods.</div></div>';
    function render() {
      var q = document.getElementById("formulaSearch").value.toLowerCase();
      var c = document.getElementById("formulaCategory").value;
      var meth = document.getElementById("formulaMethod").value;
      var items = D.formulas.filter(function(f){return (c==="all"||f.category===c)&&(meth==="all"||f.method===meth)&&(f.name+" "+f.equation+" "+f.description+" "+f.variables+" "+f.category+" "+f.method).toLowerCase().indexOf(q)>=0;});
      document.getElementById("formulaResults").innerHTML = items.map(function(f){return '<article class="formula-card"><div class="formula-card-top"><span class="pill">' + esc(f.category) + '</span><span class="method-code">' + esc(f.method) + '</span></div><h3>' + esc(f.name) + '</h3><div class="equation" aria-label="Equation">' + esc(f.equation) + '</div><p>' + esc(f.description) + '</p><div class="formula-vars">' + esc(f.variables) + '</div><p><strong>Assumptions:</strong> ' + esc(f.assumptions) + '</p><p><strong>Worked example:</strong> ' + esc(f.example) + '</p>' + calculatorFor(f) + '</article>';}).join("") || '<div class="empty-state">No formula found. Try a different term.</div>';
      document.getElementById("formulaCount").textContent = items.length + " formulas";
      document.querySelectorAll("[data-calc]").forEach(function(b){b.addEventListener("click",function(){calculate(b.getAttribute("data-calc"));});});
    }
    document.getElementById("formulaSearch").addEventListener("input",render);
    document.getElementById("formulaCategory").addEventListener("change",render);
    document.getElementById("formulaMethod").addEventListener("change",render);
    render();
  }
  function calculatorFor(f) {
    var fields = "";
    if (f.id==="thickness") fields = '<label>Velocity (m/s)<input type="number" step="any" id="v-' + f.id + '" value="5920"></label><label>Round-trip time (µs)<input type="number" step="any" id="t-' + f.id + '" value="10"></label>';
    else if (f.id==="wave-speed") fields = '<label>Frequency (MHz)<input type="number" step="any" id="f-' + f.id + '" value="2"></label><label>Wavelength (mm)<input type="number" step="any" id="l-' + f.id + '" value="2.95"></label>';
    else if (f.id==="wavelength") fields = '<label>Velocity (m/s)<input type="number" step="any" id="v-' + f.id + '" value="5920"></label><label>Frequency (MHz)<input type="number" step="any" id="f-' + f.id + '" value="5"></label>';
    else if (f.id==="frequency") fields = '<label>Period (µs)<input type="number" step="any" id="t-' + f.id + '" value="0.5"></label>';
    else if (f.id==="distance") fields = '<label>Velocity (m/s)<input type="number" step="any" id="v-' + f.id + '" value="3230"></label><label>Time (µs)<input type="number" step="any" id="t-' + f.id + '" value="20"></label>';
    else if (f.id==="impedance") fields = '<label>Density (kg/m³)<input type="number" step="any" id="rho-' + f.id + '" value="7850"></label><label>Velocity (m/s)<input type="number" step="any" id="v-' + f.id + '" value="5920"></label>';
    else if (f.id==="db") fields = '<label>Amplitude A₂<input type="number" step="any" id="a2-' + f.id + '" value="2"></label><label>Amplitude A₁<input type="number" step="any" id="a1-' + f.id + '" value="1"></label>';
    else if (f.id==="tof-angle") fields = '<label>Thickness (mm)<input type="number" step="any" id="th-' + f.id + '" value="20"></label><label>Angle (degrees)<input type="number" step="any" id="ang-' + f.id + '" value="60"></label>';
    else if (f.id==="stress") fields = '<label>Force (N)<input type="number" step="any" id="force-' + f.id + '" value="10000"></label><label>Area (mm²)<input type="number" step="any" id="area-' + f.id + '" value="100"></label>';
    else if (f.id==="strain") fields = '<label>Change in length (mm)<input type="number" step="any" id="dl-' + f.id + '" value="0.2"></label><label>Original length (mm)<input type="number" step="any" id="l0-' + f.id + '" value="100"></label>';
    else if (f.id==="thermal-expansion") fields = '<label>α (per °C)<input type="number" step="any" id="alpha-' + f.id + '" value="0.000012"></label><label>Original length (m)<input type="number" step="any" id="l0-' + f.id + '" value="1"></label><label>Temperature change (°C)<input type="number" step="any" id="dt-' + f.id + '" value="50"></label>';
    else return '<div class="calc-panel"><details><summary>Calculator not available for this equation</summary><p class="small-muted">Use the equation and worked example above; verify assumptions and units.</p></details></div>';
    return '<div class="calc-panel"><details><summary>Open interactive calculator</summary><div class="calc-fields">' + fields + '</div><button class="btn btn-primary" style="margin-top:10px" data-calc="' + esc(f.id) + '">Calculate</button><div class="calc-result" id="result-' + esc(f.id) + '" aria-live="polite">Enter values and calculate.</div></details></div>';
  }
  function val(id) { var el=document.getElementById(id); return el ? Number(el.value) : NaN; }
  function calculate(id) {
    var result, unit, explain;
    if (id==="thickness") { result=val("v-"+id)*val("t-"+id)*1e-6/2*1000; unit="mm"; explain="v × round-trip time ÷ 2; assumes correct velocity and zero correction."; }
    else if (id==="wave-speed") { result=val("f-"+id)*1e6*val("l-"+id)*1e-3; unit="m/s"; explain="Frequency in Hz multiplied by wavelength in metres."; }
    else if (id==="wavelength") { result=val("v-"+id)/(val("f-"+id)*1e6)*1000; unit="mm"; explain="Velocity divided by frequency, converted to millimetres."; }
    else if (id==="frequency") { result=1/(val("t-"+id)*1e-6)/1e6; unit="MHz"; explain="Frequency is the reciprocal of period."; }
    else if (id==="distance") { result=val("v-"+id)*val("t-"+id)*1e-6*1000; unit="mm"; explain="Velocity multiplied by elapsed travel time."; }
    else if (id==="impedance") { result=val("rho-"+id)*val("v-"+id)/1e6; unit="MRayl"; explain="Density multiplied by velocity; displayed in megarayls."; }
    else if (id==="db") { result=20*Math.log10(val("a2-"+id)/val("a1-"+id)); unit="dB"; explain="20 log10(A₂/A₁), for comparable amplitude measurements."; }
    else if (id==="tof-angle") { result=val("th-"+id)*Math.tan(val("ang-"+id)*Math.PI/180); unit="mm"; explain="Idealized half-skip geometry with angle measured from the normal."; }
    else if (id==="stress") { result=val("force-"+id)/(val("area-"+id)*1e-6)/1e6; unit="MPa"; explain="Force divided by original area."; }
    else if (id==="strain") { result=val("dl-"+id)/val("l0-"+id); unit="strain"; explain="Change in length divided by original length."; }
    else if (id==="thermal-expansion") { result=val("alpha-"+id)*val("l0-"+id)*val("dt-"+id)*1000; unit="mm"; explain="Linear expansion approximation; coefficient must match the material."; }
    var box=document.getElementById("result-"+id);
    if (!box) return;
    var inputs = box.parentElement.querySelectorAll("input[type=number]");
    var nums = Array.from(inputs).map(function(el){return Number(el.value);});
    if (!Number.isFinite(result) || nums.some(function(n){return !Number.isFinite(n);}) || nums.some(function(n){return n===0;}) && ["wavelength","frequency","db","stress","strain","thermal-expansion"].indexOf(id)>=0) {
      box.textContent = "Enter valid finite values. Denominators must not be zero."; return;
    }
    box.innerHTML = "<strong>Result: " + esc(Number(result.toPrecision(7))) + " " + esc(unit) + "</strong><br>" + esc(explain);
  }
  function renderKnowledge() {
    root.innerHTML = crumb("Knowledge Centre") + pageHero("Quick reference","Knowledge Centre","A searchable glossary of common NDT terms. Definitions are concise learning aids; confirm terminology in the applicable procedure and standard.") +
      '<div class="toolbar"><input class="field" id="knowledgeSearch" type="search" placeholder="Search a term or definition…" aria-label="Search glossary"><span class="result-count" id="knowledgeCount"></span></div><div class="knowledge-grid" id="knowledgeResults"></div>';
    function filter() { var q=document.getElementById("knowledgeSearch").value.toLowerCase();var items=D.knowledge.filter(function(k){return (k.term+" "+k.definition).toLowerCase().indexOf(q)>=0;});document.getElementById("knowledgeResults").innerHTML=items.map(function(k){return '<article class="knowledge-item"><h3>' + esc(k.term) + '</h3><p>' + esc(k.definition) + '</p></article>';}).join("")||'<div class="empty-state">No glossary term found.</div>';document.getElementById("knowledgeCount").textContent=items.length+" terms";}
    document.getElementById("knowledgeSearch").addEventListener("input",filter);filter();
  }
  function renderVideos() {
    root.innerHTML = crumb("Videos & Media") + pageHero("Visual learning library","Videos, diagrams & demonstrations","Curated source links and original technical schematics help connect theory with inspection practice. External media can change; links open at their source and should be checked for licensing and suitability.") +
      '<div class="toolbar"><input class="field" id="videoSearch" type="search" placeholder="Search video title, topic or source…" aria-label="Search videos"><span class="result-count" id="videoCount"></span></div><div class="media-grid" id="videoResults"></div><section class="section"><div class="section-head"><div><div class="section-kicker">Media standards</div><h2>How to use external media</h2><p>Source links are not endorsements. Check instructor qualifications, publication date, method setup, captions and technical context. Images and videos are supplementary; approved procedures remain authoritative.</p></div></div><div class="note-banner">' + iconSvg("warning") + '<div><strong>Licensing and attribution.</strong> The Academy links to source pages and topic-specific searches instead of copying third-party video files. Availability and reuse permissions must be verified before embedding or redistributing any asset.</div></div></section>';
    function filter(){var q=document.getElementById("videoSearch").value.toLowerCase();var items=D.videos.filter(function(v){return (v.title+" "+v.topic+" "+v.source+" "+v.note).toLowerCase().indexOf(q)>=0;});document.getElementById("videoResults").innerHTML=items.map(videoCard).join("")||'<div class="empty-state">No media result found.</div>';document.getElementById("videoCount").textContent=items.length+" resources";}
    document.getElementById("videoSearch").addEventListener("input",filter);filter();
  }
  function startQuiz() { quizIndex=0;quizScore=0;quizAnswered=false;quizChoice=-1;quizOrder=D.quiz.map(function(q,i){return i;}).sort(function(){return Math.random()-.5;}).slice(0,5);renderQuiz(); }
  function renderQuiz() {
    if (quizIndex >= quizOrder.length) {
      var pct=Math.round(quizScore/quizOrder.length*100);
      progress.quizBest=Math.max(progress.quizBest||0,pct);progress.quizLast=pct;saveProgress();recordQuizAttempt(quizScore,quizOrder.length);
      root.innerHTML=crumb("Practice quiz") + pageHero("Knowledge check complete","Practice results","Review the score, then retake the quiz or return to the lessons you want to strengthen.") + '<div class="quiz-card"><div class="section-kicker">Your result</div><div class="progress-number">' + pct + '%</div><p style="font-size:13px;line-height:1.8;color:var(--muted)">You answered ' + quizScore + ' of ' + quizOrder.length + ' questions correctly. This practice score is for learning only and is not an official certification exam.</p><div class="quiz-actions"><button class="btn btn-primary" data-action="retake">Retake quiz</button><button class="btn btn-outline" data-go="academy">Review curriculum</button><button class="btn btn-outline" data-go="progress">View progress</button></div></div>';
      return;
    }
    var q=D.quiz[quizOrder[quizIndex]];
    root.innerHTML=crumb("Practice quiz") + pageHero("Practice & revision","Check your understanding","Choose the best answer. You will receive an explanation after submitting each response.") + '<div class="quiz-card"><div class="section-kicker">Question ' + (quizIndex+1) + ' of ' + quizOrder.length + '</div><div class="quiz-progress"><span style="width:' + (quizIndex/quizOrder.length*100) + '%"></span></div><h2>' + esc(q.q) + '</h2><div class="quiz-options">' + q.options.map(function(o,i){var cls="quiz-option";if(quizAnswered&&i===q.answer)cls+=" correct";else if(quizAnswered&&i===quizChoice&&i!==q.answer)cls+=" incorrect";else if(i===quizChoice)cls+=" selected";return '<button class="' + cls + '" data-choice="' + i + '"' + (quizAnswered?' disabled':'') + '><span class="option-letter">' + String.fromCharCode(65+i) + '</span><span>' + esc(o) + '</span></button>';}).join("") + '</div>' + (quizAnswered?'<div class="quiz-feedback ' + (quizChoice===q.answer?'good':'bad') + '">' + (quizChoice===q.answer?'<strong>Correct.</strong> ':'<strong>Not quite.</strong> ') + esc(q.explain) + '</div>':'') + '<div class="quiz-actions"><button class="btn btn-outline" data-go="academy">Exit practice</button>' + (quizAnswered?'<button class="btn btn-primary" data-action="next">' + (quizIndex===quizOrder.length-1?'See results':'Next question') + ' →</button>':'<button class="btn btn-primary" id="submitAnswer" ' + (quizChoice<0?'disabled':'') + '>Check answer</button>') + '</div></div>';
  }
  function answerQuiz() { if(quizAnswered||quizChoice<0)return;var q=D.quiz[quizOrder[quizIndex]];quizAnswered=true;if(quizChoice===q.answer)quizScore++;renderQuiz();}
  function renderProgress() {
    var done=allModulesDone(),pct=Math.round(done/D.modules.length*100),best=progress.quizBest||0,last=progress.quizLast||0;
    root.innerHTML=crumb("My progress") + pageHero("Learning dashboard","Your learning progress",currentUser?"Your module completion and practice quiz scores sync to your signed-in account.":"Progress is saved locally in this browser. Sign in to sync module completion and practice quiz scores across devices.") + '<div class="progress-panel"><article class="progress-card"><div class="section-kicker">Curriculum completion</div><div class="progress-number">' + pct + '%</div><div class="progress-track"><span style="width:' + pct + '%"></span></div><p>' + done + ' of ' + D.modules.length + ' modules marked complete.</p><button class="btn btn-primary" data-go="academy">Continue learning</button></article><article class="progress-card"><div class="section-kicker">Practice quiz</div><div class="progress-number">' + best + '%</div><p>Best score: ' + best + '% · Latest score: ' + last + '%</p><button class="btn btn-outline" data-go="quiz">Practise again</button></article></div><section class="section">' + sectionHead("Your modules","Completed and remaining lessons","Open a lesson to review it or mark it complete when you finish studying.","academy","All lessons") + '<div class="module-grid">' + D.modules.map(function(m){return '<article class="module-card"><div class="module-top"><span class="module-number">' + (isComplete(m.id)?'✓':String(D.modules.indexOf(m)+1).padStart(2,"0")) + '</span><span class="pill">' + (isComplete(m.id)?'Completed':esc(m.level)) + '</span></div><h3>' + esc(m.title) + '</h3><p>' + esc(m.summary) + '</p><div class="module-meta"><span>' + esc(m.time) + '</span><button class="arrow-link" data-module="' + esc(m.id) + '">Open →</button></div></article>';}).join("") + '</div>';
  }
  function renderSearchResults(q) {
    q=(q||"").trim().toLowerCase();
    var modules=D.modules.filter(function(m){return (m.title+" "+m.summary+" "+m.phase+" "+m.objectives.join(" ")).toLowerCase().indexOf(q)>=0;});
    var methods=D.methods.filter(function(m){return (m.name+" "+m.summary+" "+m.defects+" "+m.principle).toLowerCase().indexOf(q)>=0;});
    var formulas=D.formulas.filter(function(f){return (f.name+" "+f.equation+" "+f.description+" "+f.category).toLowerCase().indexOf(q)>=0;});
    root.innerHTML=crumb("Search") + pageHero("Academy search","Search the learning library",q?"Results for “"+q+"”":"Search across methods, lessons and formulas.") + '<div class="toolbar"><input class="field" id="searchPageInput" type="search" value="' + esc(q) + '" placeholder="Enter a topic, formula or method…" aria-label="Search all learning content"><button class="btn btn-primary" id="searchPageGo">Search</button></div>' + sectionHead("Lessons","Learning modules",modules.length+" matches","academy","All lessons") + '<div class="module-grid">' + modules.map(function(m){return '<article class="module-card"><span class="pill">' + esc(m.phase) + '</span><h3>' + esc(m.title) + '</h3><p>' + esc(m.summary) + '</p><div class="module-meta"><span>' + esc(m.time) + '</span><button class="arrow-link" data-module="' + esc(m.id) + '">Open →</button></div></article>';}).join("") + '</div>' + sectionHead("Methods","Inspection methods",methods.length+" matches","methods","All methods") + '<div class="methods-layout">' + methods.map(methodCard).join("") + '</div>' + sectionHead("Equations","Formula matches",formulas.length+" matches","formulas","Formula library") + '<div class="formula-grid">' + formulas.map(function(f){return '<article class="formula-card"><span class="pill">' + esc(f.category) + '</span><h3>' + esc(f.name) + '</h3><div class="equation">' + esc(f.equation) + '</div><p>' + esc(f.description) + '</p></article>';}).join("") + '</div>';
    document.getElementById("searchPageGo").addEventListener("click",function(){searchValue=document.getElementById("searchPageInput").value;go("search");});
    document.getElementById("searchPageInput").addEventListener("keydown",function(e){if(e.key==="Enter"){searchValue=this.value;go("search");}});
  }
  function renderAbout() {
    root.innerHTML=crumb("About") + pageHero("About the Academy","Learn the science. Respect the limits.","UT Masterclass Academy is a self-paced technical learning platform for NDT theory, method awareness, formulas, calculations and revision.") + '<section class="section"><div class="split-feature"><article class="feature-card"><div class="feature-icon">' + iconSvg("book") + '</div><h3>Learning philosophy</h3><p>Start with fundamentals, explain the physical principle, show the equipment and signals, work through calculations, then state assumptions and limitations. Technical diagrams are conceptual unless explicitly identified otherwise.</p></article><article class="feature-card orange"><div class="feature-icon">' + iconSvg("shield") + '</div><h3>Technical responsibility</h3><p>Inspection results depend on qualified personnel, validated techniques, applicable standards, procedures, calibration, coverage and evaluation criteria. Course completion does not create an external qualification.</p></article></div></section><section class="section">' + sectionHead("Reference approach","Sources and attribution","NDE Ed is the requested primary educational reference. Where the original page is inaccessible, the Academy should use verifiable open educational resources and cite them rather than inventing source details.") + '<div class="source-list"><article class="source-item"><div><h3>NDE Ed — Nondestructive Evaluation education</h3><p>Requested primary reference. Access to the About page was rejected during the initial web check; verify individual pages and media before finalizing references.</p></div><a href="https://nde-ed.org/About/index.xhtml" target="_blank" rel="noopener noreferrer">Visit NDE Ed ↗</a></article><article class="source-item"><div><h3>Pacific Northwest National Laboratory — Guide to NDE techniques</h3><p>Overview of method selection, general NDE science and technique considerations.</p></div><a href="https://www.pnnl.gov/publications/guide-nondestructive-evaluation-techniques" target="_blank" rel="noopener noreferrer">Open source ↗</a></article><article class="source-item"><div><h3>NASA NESC Academy — NDE video catalog</h3><p>Public educational videos and engineering inspection presentations.</p></div><a href="https://nescacademy.nasa.gov/catalogs/nde" target="_blank" rel="noopener noreferrer">Open video catalog ↗</a></article><article class="source-item"><div><h3>ASNT — What is NDT?</h3><p>Industry overview of common methods and NDT/NDE/NDI terminology.</p></div><a href="https://www.asnt.org/what-is-nondestructive-testing" target="_blank" rel="noopener noreferrer">Open source ↗</a></article></div></section>';
  }
  function showAuth() {
    var modal=document.getElementById("authModal");
    if(!modal)return;
    modal.classList.add("open");
    document.getElementById("authTitle").textContent=authMode==="signup"?"Create learner account":authMode==="reset"?"Reset password":"Sign in";
    document.getElementById("authName").style.display=authMode==="signup"?"block":"none";
    document.getElementById("authSubmit").textContent=authMode==="signup"?"Create account":authMode==="reset"?"Send reset link":"Sign in";
    document.getElementById("authStatus").textContent="";
  }
  async function submitAuth() {
    var status=document.getElementById("authStatus");
    var email=document.getElementById("authEmail").value.trim();
    var password=document.getElementById("authPassword").value;
    if(!supabaseClient){status.textContent="Sign-in needs the configured Supabase browser client. Learning and calculators remain available without an account.";return;}
    try {
      if(authMode==="signup"){
        if(password.length<8)throw new Error("Use at least 8 characters for the password.");
        var name=document.getElementById("authName").value.trim();
        var s=await supabaseClient.auth.signUp({email:email,password:password,options:{data:{full_name:name,learner_type:"Self-paced learner"},emailRedirectTo:window.location.href.split("#")[0]}});
        if(s.error)throw s.error;
        if(s.data.session){currentUser=s.data.session.user;await loadCloudProgress();}
        status.textContent=s.data.session?"Account created.":"Check your email for the verification link.";
      } else if(authMode==="reset"){
        var r=await supabaseClient.auth.resetPasswordForEmail(email,{redirectTo:window.location.href.split("#")[0]});
        if(r.error)throw r.error;
        status.textContent="If the account exists, a password reset email has been sent.";
      } else {
        var l=await supabaseClient.auth.signInWithPassword({email:email,password:password});
        if(l.error)throw l.error;
        currentUser=l.data.user;
        await loadCloudProgress();
        document.getElementById("authModal").classList.remove("open");
        document.getElementById("signinBtn").textContent="Signed in";
        status.textContent="Signed in. Your module completion and practice quiz scores now sync to your account.";
      }
    } catch(e){status.textContent=e.message||"Authentication could not be completed.";}
  }
  function bindGlobalEvents() {
    document.addEventListener("click",function(e){
      var viewBtn=e.target.closest("[data-view]");if(viewBtn){go(viewBtn.getAttribute("data-view"));return;}
      var goBtn=e.target.closest("[data-go]");if(goBtn){if(goBtn.tagName==="A")e.preventDefault();go(goBtn.getAttribute("data-go"));return;}
      var moduleBtn=e.target.closest("[data-module]");if(moduleBtn){go("lesson",moduleBtn.getAttribute("data-module"));return;}
      var methodBtn=e.target.closest("[data-method]");if(methodBtn){go("method",methodBtn.getAttribute("data-method"));return;}
      var filterBtn=e.target.closest("[data-filter-modules]");if(filterBtn){moduleFilter=filterBtn.getAttribute("data-filter-modules");go("academy");return;}
      var choice=e.target.closest("[data-choice]");if(choice&&!quizAnswered){quizChoice=Number(choice.getAttribute("data-choice"));renderQuiz();return;}
      var action=e.target.closest("[data-action]");if(action){if(action.getAttribute("data-action")==="next"){quizIndex++;quizAnswered=false;quizChoice=-1;renderQuiz();}else if(action.getAttribute("data-action")==="retake")startQuiz();return;}
    });
    document.addEventListener("click",function(e){if(e.target&&e.target.id==="submitAnswer")answerQuiz();});
    document.getElementById("mobileMenu").addEventListener("click",function(){document.querySelector(".main-nav").classList.toggle("open");});
    document.getElementById("searchToggle").addEventListener("click",function(){searchOpen=!searchOpen;var box=document.getElementById("globalSearchBox");box.style.display=searchOpen?"flex":"none";if(searchOpen)document.getElementById("globalSearchInput").focus();});
    document.getElementById("globalSearchInput").addEventListener("keydown",function(e){if(e.key==="Enter"){searchValue=this.value;go("search");document.getElementById("globalSearchBox").style.display="none";}});
    document.getElementById("globalSearchGo").addEventListener("click",function(){searchValue=document.getElementById("globalSearchInput").value;go("search");document.getElementById("globalSearchBox").style.display="none";});
    document.getElementById("signinBtn").addEventListener("click",function(){if(currentUser&&supabaseClient){supabaseClient.auth.signOut().then(function(){currentUser=null;document.getElementById("signinBtn").textContent="Sign in";});}else showAuth();});
    document.getElementById("authClose").addEventListener("click",function(){document.getElementById("authModal").classList.remove("open");});
    document.getElementById("authModal").addEventListener("click",function(e){if(e.target===this)this.classList.remove("open");});
    document.getElementById("authSubmit").addEventListener("click",submitAuth);
    document.getElementById("authSwitch").addEventListener("click",function(){authMode=authMode==="signup"?"login":"signup";showAuth();});
    document.getElementById("authReset").addEventListener("click",function(){authMode="reset";showAuth();});
  }
  function initSupabase() {
    var cfg=window.UT_SUPABASE_CONFIG;
    if(window.supabase&&window.supabase.createClient&&cfg&&cfg.url&&cfg.anonKey){
      try {
        supabaseClient=window.supabase.createClient(cfg.url,cfg.anonKey);
        supabaseClient.auth.onAuthStateChange(function(event, session){
          currentUser=session?session.user:null;
          var button=document.getElementById("signinBtn");
          if(button) button.textContent=currentUser?"Signed in":"Sign in";
          if(currentUser) window.setTimeout(function(){loadCloudProgress();},0);
        });
        supabaseClient.auth.getSession().then(function(r){
          if(r.data&&r.data.session){currentUser=r.data.session.user;document.getElementById("signinBtn").textContent="Signed in";loadCloudProgress();}
        }).catch(function(e){console.warn("Supabase session could not be restored.",e);});
      } catch(e){console.warn("Supabase browser client unavailable",e);}
    }
  }
  document.addEventListener("DOMContentLoaded",function(){
    bindGlobalEvents();
    initSupabase();
    renderHome();
    updateProgressBadge();
  });
})();