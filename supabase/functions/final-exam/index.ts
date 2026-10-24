import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, apikey, x-client-info, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8"
};
const PASS_MARK = 50;
const MAX_ATTEMPTS = 2;
const DURATION_MINUTES = 60;
const COURSE_KEY = "ndt-foundations";
const COURSE_TITLE = "NDT Methods — Foundations to Advanced Theory";

type Question = { id:string; method:string; question:string; options:string[]; answer:number; explanation:string };
const bank: Question[] = [
{id:"q01",method:"UT fundamentals",question:"Which relationship connects wave velocity, frequency and wavelength?",options:["v = f × λ","v = f / λ","v = λ / f","v = f + λ"],answer:0,explanation:"Wave velocity equals frequency multiplied by wavelength when units are consistent."},
{id:"q02",method:"UT fundamentals",question:"What is the SI unit of frequency?",options:["Metre","Hertz","Pascal","Rayl"],answer:1,explanation:"Frequency is measured in hertz (Hz), or cycles per second."},
{id:"q03",method:"UT fundamentals",question:"For a fixed material and wave mode, increasing frequency generally causes wavelength to:",options:["Increase in the same proportion","Remain constant","Decrease","Become infinite"],answer:2,explanation:"At fixed velocity, wavelength λ = v/f, so increasing frequency decreases wavelength."},
{id:"q04",method:"UT fundamentals",question:"Which wave mode has particle motion parallel to the direction of propagation?",options:["Longitudinal","Shear","Surface only","Lamb only"],answer:0,explanation:"In a longitudinal wave, particle motion is parallel to propagation."},
{id:"q05",method:"UT fundamentals",question:"Which factor can cause ultrasonic attenuation?",options:["Absorption and scattering","Only screen colour","Only probe serial number","Only report format"],answer:0,explanation:"Absorption, scattering and other losses reduce sound amplitude with propagation."},
{id:"q06",method:"UT fundamentals",question:"Acoustic impedance for a specified medium and wave mode is:",options:["Z = ρv","Z = ρ/v","Z = fλ","Z = v/t"],answer:0,explanation:"Specific acoustic impedance is density multiplied by sound velocity."},
{id:"q07",method:"UT equipment",question:"What is the main purpose of couplant in contact UT?",options:["Reduce the air gap and transmit sound","Set the acceptance criteria","Replace calibration","Change the component density"],answer:0,explanation:"Air between the probe and component transmits ultrasound poorly; couplant improves acoustic transmission."},
{id:"q08",method:"UT equipment",question:"Which probe feature most directly describes the number of separately controlled array elements?",options:["Array element count","Couplant viscosity","Cable colour","Report revision"],answer:0,explanation:"PAUT arrays contain multiple elements that can be controlled with timing delays."},
{id:"q09",method:"UT equipment",question:"What should be checked before scanning with a probe?",options:["Probe condition, cables, setup and calibration status","Only the instrument colour","Only the operator's preferred gain","Nothing if the screen turns on"],answer:0,explanation:"Probe condition, connections, calibration and setup are basic pre-scan checks."},
{id:"q10",method:"UT equipment",question:"Why can a dual-element probe help with some thickness measurements?",options:["Separate transmitting and receiving elements can improve near-surface performance in suitable designs","It removes the need for calibration","It measures without sound","It works only with radiography"],answer:0,explanation:"Dual-element geometry can improve performance in some near-surface/thickness applications; suitability is technique-dependent."},
{id:"q11",method:"Calibration",question:"Time-base or range calibration relates echo time to:",options:["Known sound path or distance","Only colour palette","Only material hardness","Only file size"],answer:0,explanation:"Range calibration maps time to sound path or depth using known references and the correct velocity."},
{id:"q12",method:"Calibration",question:"What is a reference block used for?",options:["Providing known geometry/reflectors for setup checks","Replacing the inspection procedure","Guaranteeing every flaw is found","Storing user passwords"],answer:0,explanation:"Reference blocks provide known dimensions or reflectors for calibration and performance checks."},
{id:"q13",method:"Calibration",question:"For comparable amplitude quantities, a 6 dB increase is approximately:",options:["Half the amplitude","Double the amplitude","Ten times the amplitude","No amplitude change"],answer:1,explanation:"20 log10(2) is approximately 6.02 dB, so a 6 dB increase is about a twofold amplitude ratio."},
{id:"q14",method:"Calibration",question:"DAC is commonly used to represent:",options:["Reference response versus sound path","Date and calibration only","Water temperature only","Robot payload"],answer:0,explanation:"Distance-amplitude correction represents reference responses over sound path, as specified by the procedure."},
{id:"q15",method:"Calibration",question:"What is the purpose of calibration verification during an inspection?",options:["Confirm the setup remains within specified requirements","Avoid recording setup changes","Replace post-inspection checks in all cases","Change acceptance criteria"],answer:0,explanation:"Verification confirms that calibration/performance remains acceptable at required intervals."},
{id:"q16",method:"Signal interpretation",question:"An A-scan normally plots:",options:["Amplitude versus time or sound path","Temperature versus colour only","Robot torque versus age","Radiation dose versus density"],answer:0,explanation:"An A-scan displays signal amplitude against time or calibrated sound path."},
{id:"q17",method:"Signal interpretation",question:"An intermediate echo should be treated as:",options:["A response requiring interpretation in context","Always a confirmed crack","Always harmless geometry","Automatic acceptance"],answer:0,explanation:"Echoes can arise from discontinuities, geometry, coupling or other sources and require context."},
{id:"q18",method:"Signal interpretation",question:"What is signal-to-noise ratio intended to compare?",options:["Signal magnitude with representative noise magnitude","Probe weight with cable length","Course score with age","Density with frequency"],answer:0,explanation:"SNR compares signal and noise levels; the exact definition must be applied consistently."},
{id:"q19",method:"Signal interpretation",question:"Why is a back-wall echo useful in thickness measurement?",options:["Its round-trip time can be related to thickness when velocity and zero are correct","It proves the component has no defects","It removes the need to know material velocity","It measures surface colour"],answer:0,explanation:"Thickness can be estimated from a valid back-wall round-trip time using the correct velocity and zero."},
{id:"q20",method:"Signal interpretation",question:"What is a safe response to an unexpected signal change?",options:["Check coupling, setup, calibration and scan position, then follow the procedure","Increase gain until it disappears","Delete the data","Assume the component passes"],answer:0,explanation:"Investigate and document unexpected changes; never tune away a response to force acceptance."},
{id:"q21",method:"Inspection techniques",question:"In pulse-echo thickness measurement, why is distance divided by two?",options:["The sound travels to the back wall and returns","The frequency doubles","The couplant is halved","The echo amplitude is squared"],answer:0,explanation:"The measured time covers the outgoing and return path, so one-way thickness is half the total travel distance."},
{id:"q22",method:"Inspection techniques",question:"Through-transmission UT typically uses:",options:["A transmitter and a receiver on opposite sides","Only one probe detecting its own echo","Magnetic particles","An infrared camera only"],answer:0,explanation:"Through-transmission detects energy received across the part from a separate transmitter."},
{id:"q23",method:"Inspection techniques",question:"What does scan indexing describe?",options:["The step between adjacent scan paths or positions","A type of couplant","The frequency unit","A certificate number"],answer:0,explanation:"Indexing defines the offset between successive scan paths and contributes to coverage."},
{id:"q24",method:"Inspection techniques",question:"A scan plan should define:",options:["Coverage, probe orientation, scan paths and recording method","Only the final report colour","Only the operator's initials","Only the machine brand"],answer:0,explanation:"A scan plan establishes how the required volume or area will be covered and documented."},
{id:"q25",method:"Inspection techniques",question:"Which is the correct source of acceptance criteria for a real inspection?",options:["Applicable approved procedure and governing requirements","A generic online quiz","The highest signal seen in a previous job","Personal preference"],answer:0,explanation:"Acceptance criteria come from the applicable code/specification and approved procedure."},
{id:"q26",method:"PAUT",question:"How does PAUT steer or focus a beam?",options:["By applying timing delays across array elements","By changing the material density","By using penetrant developer","By rotating radiographic film"],answer:0,explanation:"Controlled element delays create the desired beam steering and focusing."},
{id:"q27",method:"PAUT",question:"What is a focal law?",options:["A set of element timing parameters for a beam condition","A radiation permit","A chemical safety sheet","A C-scan colour legend only"],answer:0,explanation:"Focal laws define the timing of array elements for a particular beam angle/focus."},
{id:"q28",method:"PAUT",question:"What is one benefit of encoded PAUT data?",options:["Traceable signal data linked to scan position","It guarantees every defect is found","It eliminates calibration","It automatically grants certification"],answer:0,explanation:"Encoded data associates acquisition with position, supporting review and coverage documentation."},
{id:"q29",method:"PAUT",question:"Why must the scan plan and focal laws be validated?",options:["Incorrect laws or coverage can produce misleading inspection data","To make the display brighter only","To avoid using a reference block","To increase course completion percentage"],answer:0,explanation:"Technique validation checks that the planned beams and scan coverage meet the application requirements."},
{id:"q30",method:"PAUT",question:"A sectorial scan displays:",options:["Responses across a range of beam angles","Only a list of passwords","Only a thermal image","Only the component's weight"],answer:0,explanation:"A sectorial scan presents data acquired across a selected range of beam angles."},
{id:"q31",method:"TOFD",question:"TOFD primarily uses which signal phenomenon for sizing concepts?",options:["Diffraction from discontinuity tips","Magnetic particle accumulation","Surface colour contrast","Radioactive decay"],answer:0,explanation:"TOFD interprets diffracted signals from flaw tips within a defined setup."},
{id:"q32",method:"TOFD",question:"What is a TOFD lateral wave?",options:["A signal travelling near the component surface between probes","A back-wall echo from the far surface only","A magnetic field","A thermal reflection"],answer:0,explanation:"The lateral wave travels near the surface between transmitter and receiver and is used as a time reference."},
{id:"q33",method:"TOFD",question:"Which limitation needs consideration in TOFD?",options:["Near-surface dead zones and technique geometry","It can only inspect transparent materials","It requires magnetic particles","It has no signal interpretation"],answer:0,explanation:"Near-surface dead zones and geometry affect TOFD coverage and interpretation."},
{id:"q34",method:"Immersion & automated UT",question:"Why should water path be stable in immersion or squirter UT?",options:["Water-path changes alter time of flight and repeatability","It changes the steel density","It replaces the encoder","It removes all attenuation"],answer:0,explanation:"The water path contributes to travel time and must be controlled or compensated."},
{id:"q35",method:"Immersion & automated UT",question:"What does a C-scan commonly show?",options:["A plan-view map of selected UT data across the scan area","Only an A-scan waveform","Only the operator's notes","Only a radiographic exposure chart"],answer:0,explanation:"A C-scan maps a selected signal feature or gate response over scan coordinates."},
{id:"q36",method:"Immersion & automated UT",question:"What can an encoder help establish in automated UT?",options:["Position associated with acquired data","The acoustic impedance automatically","The acceptance standard automatically","The probe's piezoelectric material"],answer:0,explanation:"Encoder position associates data with scanner or robot coordinates."},
{id:"q37",method:"Composites",question:"Why can composite materials require special UT interpretation?",options:["Anisotropy, attenuation and layered construction affect sound propagation","All composites have the same velocity","They cannot be inspected ultrasonically","They always require magnetic particles"],answer:0,explanation:"Composite layup, anisotropy, interfaces and attenuation affect the ultrasonic response."},
{id:"q38",method:"Composites",question:"Which discontinuity may be relevant in a composite laminate?",options:["Delamination","Only magnetic flux leakage","Only radioactive contamination","Only surface colour variation"],answer:0,explanation:"Delamination is separation between laminate plies and may be detectable using a suitable UT technique."},
{id:"q39",method:"Composites",question:"What should be considered before interpreting a composite C-scan?",options:["Reference response, material architecture, gate settings and scan coverage","Only the colour of the component","Only the file name","Only the operator's guess"],answer:0,explanation:"C-scan interpretation depends on validated setup, material architecture and the signal feature displayed."},
{id:"q40",method:"Radiographic testing",question:"What physical radiation is used in RT?",options:["X-rays or gamma rays","Only sound waves","Only visible light","Only magnetic fields"],answer:0,explanation:"Radiographic testing uses ionizing X-ray or gamma radiation to form an image."},
{id:"q41",method:"Radiographic testing",question:"What is a critical RT safety control?",options:["Controlled radiation area and authorized radiation-protection procedures","Only gloves","Turning up UT gain","Using water couplant"],answer:0,explanation:"Ionizing radiation requires controlled areas, monitoring and legally compliant protection."},
{id:"q42",method:"Magnetic particle testing",question:"MT is suitable primarily for:",options:["Ferromagnetic materials","All nonconductive plastics","Only transparent glass","Any material without magnetization"],answer:0,explanation:"Magnetic particle testing relies on magnetization and is used on ferromagnetic materials."},
{id:"q43",method:"Liquid penetrant testing",question:"PT can reveal discontinuities that are:",options:["Open to the surface on compatible nonporous material","Deep inside with no surface opening","Only in ferromagnetic material","Only hotter than the surroundings"],answer:0,explanation:"Penetrant must enter a surface-opening discontinuity to produce an indication."},
{id:"q44",method:"Eddy current testing",question:"ET relies on:",options:["Induced eddy currents in electrically conductive material","Acoustic echoes only","Penetrant capillary action","Ionizing radiation only"],answer:0,explanation:"Alternating electromagnetic fields induce eddy currents in conductive materials."},
{id:"q45",method:"Visual testing",question:"A fundamental limitation of VT is that:",options:["The feature must be visible/accessibly viewed","It always detects internal flaws","It always requires ionizing radiation","It cannot assess surfaces"],answer:0,explanation:"Visual testing requires adequate visibility, access and lighting."},
{id:"q46",method:"Acoustic emission",question:"AE sensors primarily detect:",options:["Transient elastic waves from active sources","Static colour differences only","Only radiographic density","Only penetrant residue"],answer:0,explanation:"Acoustic emission monitors transient elastic waves generated by active damage or other sources."},
{id:"q47",method:"Infrared thermography",question:"What can influence infrared thermography readings?",options:["Emissivity, reflections and environmental conditions","Only UT frequency","Only magnetic permeability","Only probe index pitch"],answer:0,explanation:"Emissivity, reflected radiation, viewing geometry and environment influence apparent temperature."},
{id:"q48",method:"Reporting & safety",question:"A traceable inspection report should include, as required:",options:["Setup/calibration, coverage, findings and component identification","Only a cropped screenshot","Only a pass/fail word","Only the operator's first name"],answer:0,explanation:"Traceability and evidence are needed to support review and repeatability."},
{id:"q49",method:"Reporting & safety",question:"Does passing this Academy exam grant ASNT or ISO 9712 personnel certification?",options:["Yes, automatically","No; it is an Academy learning assessment only","Only if the user prints the certificate","Only if the score is 50%"],answer:1,explanation:"External personnel certification requires its own applicable qualification and certification process."},
{id:"q50",method:"Reporting & safety",question:"What should a technician do if the applicable procedure is unclear or unavailable?",options:["Stop and seek clarification through the authorized quality/technical process","Invent acceptance criteria","Copy a result from another component","Ignore calibration"],answer:0,explanation:"Do not invent acceptance criteria or proceed without the required approved instructions."}
,
{id:"q51",method:"Mathematics",question:"If frequency is 2 MHz, what is the period?",options:["0.5 microseconds","2 seconds","2 milliseconds","5 microseconds"],answer:0,explanation:"The period is 1/f. At 2 MHz, T = 0.5 μs."},
{id:"q52",method:"Wave propagation",question:"At an ideal normal-incidence interface, the pressure reflection coefficient depends on:",options:["The acoustic impedances of the two media","Only the colour of the material","Only the scan speed","Only the probe cable length"],answer:0,explanation:"The ideal normal-incidence pressure reflection coefficient is determined by the impedance mismatch."},
{id:"q53",method:"Wave propagation",question:"What does Snell's law relate in ultrasonic inspection?",options:["Incident and refracted angles to wave velocities","Gain to battery level","Radiation dose to exposure time only","Penetrant dwell time to viscosity only"],answer:0,explanation:"Snell's law relates incident and refracted angles to propagation velocities at an interface."},
{id:"q54",method:"Magnetic particle testing",question:"Why may magnetization in more than one direction be needed in MT?",options:["Discontinuity response depends on the magnetic field direction","It changes the material into a nonmagnetic metal","It removes the need for cleaning","It replaces lighting controls"],answer:0,explanation:"Crack detectability depends on the relation between discontinuity orientation and magnetic field."},
{id:"q55",method:"Liquid penetrant testing",question:"What is the purpose of developer in PT?",options:["Help draw out penetrant and improve indication visibility","Magnetize the component","Measure ultrasonic time of flight","Create an X-ray image"],answer:0,explanation:"Developer assists indication formation and contrast after excess penetrant is removed."},
{id:"q56",method:"Eddy current testing",question:"What is lift-off in ET?",options:["A change in probe-to-surface spacing","The acoustic back-wall echo","A radiographic image-quality indicator","A penetrant dwell timer"],answer:0,explanation:"Lift-off is a change in coil spacing from the conductive surface and affects the measured response."},
{id:"q57",method:"Visual testing",question:"Which condition is essential for reliable VT?",options:["Adequate access, visibility and lighting","An ultrasonic couplant layer","A magnetic field in every case","A radiation source"],answer:0,explanation:"Visual examination depends on access, visibility, suitable lighting and the defined inspection criteria."},
{id:"q58",method:"Acoustic emission",question:"Why is background-noise assessment important in AE?",options:["Noise can mask or imitate event signals","Noise determines acoustic impedance exactly","Noise replaces sensor coupling","Noise automatically sizes a crack"],answer:0,explanation:"Background noise can obscure relevant events or create false triggers, so it must be assessed."},
{id:"q59",method:"Infrared thermography",question:"In active thermography, what is typically used to reveal thermal response differences?",options:["Controlled thermal excitation followed by infrared observation","A magnetic particle bath only","A UT reference block only","An ionizing source in every case"],answer:0,explanation:"Active thermography applies controlled heating or cooling and observes the resulting thermal response."},
{id:"q60",method:"Reporting & quality",question:"Why should inspection data and report revisions be traceable?",options:["To support review, repeatability and accountability","To avoid recording the equipment used","To replace the approved procedure","To guarantee all flaws are detected"],answer:0,explanation:"Traceable records help reviewers understand what was inspected, how it was inspected and what was reported."}
];

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: corsHeaders });
const shuffle = <T>(items:T[]) => { const a=[...items]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];} return a; };
const secret = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const url = Deno.env.get("SUPABASE_URL") ?? "";
const admin = createClient(url, secret, { auth: { persistSession: false, autoRefreshToken: false } });

async function getUser(req: Request) {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if(!token) return {user:null,error:"Sign in before starting the final exam."};
  const {data,error} = await admin.auth.getUser(token);
  if(error || !data.user) return {user:null,error:"Your session could not be verified. Please sign in again."};
  return {user:data.user,error:null};
}
async function eligible(userId:string) {
  const {data,error} = await admin.from("course_progress").select("completed,passed_quizzes").eq("user_id",userId).maybeSingle();
  if(error) throw error;
  const completed = new Set(Array.isArray(data?.completed)?data.completed:[]);
  const passed = new Set(Array.isArray(data?.passed_quizzes)?data.passed_quizzes:[]);
  const missingLessons = Array.from({length:24},(_,i)=>i+1).filter(n=>!completed.has(n));
  const missingQuizzes = Array.from({length:24},(_,i)=>i+1).filter(n=>!passed.has(n));
  return {ok:missingLessons.length===0&&missingQuizzes.length===0,missingLessons,missingQuizzes};
}
function publicQuestion(id:string) {
  const q=bank.find(item=>item.id===id);
  return q?{id:q.id,method:q.method,question:q.question,options:q.options}:null;
}
Deno.serve(async (req:Request) => {
  if(req.method==="OPTIONS") return new Response("ok",{headers:corsHeaders});
  if(req.method!=="POST") return json({error:"Use POST."},405);
  try {
    if(!secret || !url) return json({error:"The exam service is not configured. An administrator must check Supabase Edge Function secrets."},500);
    const {user,error:authError}=await getUser(req);
    if(authError||!user) return json({error:authError||"Unauthorized."},401);
    const body=await req.json().catch(()=>({}));
    const action=String(body.action||"");
    if(action==="start") {
      const eligibility=await eligible(user.id);
      if(!eligibility.ok) return json({error:"Complete all 24 lessons and pass all 24 lesson quizzes before starting the final exam.",missing_lessons:eligibility.missingLessons,missing_quizzes:eligibility.missingQuizzes},403);
      const {data:existingCert,error:certError}=await admin.from("course_certificates").select("certificate_number,score,issued_at,course_title,revoked_at").eq("user_id",user.id).eq("course_key",COURSE_KEY).is("revoked_at",null).maybeSingle();
      if(certError) throw certError;
      if(existingCert) return json({already_passed:true,certificate:existingCert,pass_mark:PASS_MARK});
      const {data:attemptRows,error:attemptError}=await admin.from("exam_attempts").select("id,question_ids,started_at,expires_at,submitted_at").eq("user_id",user.id).eq("course_key",COURSE_KEY).order("started_at",{ascending:false});
      if(attemptError) throw attemptError;
      const rows=attemptRows||[];
      const active=rows.find(a=>!a.submitted_at&&new Date(a.expires_at).getTime()>Date.now());
      if(active) return json({attempt_id:active.id,started_at:active.started_at,expires_at:active.expires_at,pass_mark:PASS_MARK,attempts_used:rows.length,attempts_remaining:Math.max(0,MAX_ATTEMPTS-rows.length),duration_minutes:DURATION_MINUTES,questions:active.question_ids.map(publicQuestion)});
      if(rows.length>=MAX_ATTEMPTS) return json({error:"You have used both final-exam attempts.",attempts_used:rows.length,attempts_remaining:0},403);
      const ordered=shuffle(bank).slice(0,50).map(q=>q.id);
      const startedAt=new Date();
      const expiresAt=new Date(startedAt.getTime()+DURATION_MINUTES*60*1000);
      const {data:attempt,error:insertError}=await admin.from("exam_attempts").insert({user_id:user.id,course_key:COURSE_KEY,question_ids:ordered,answers:{},started_at:startedAt.toISOString(),expires_at:expiresAt.toISOString()}).select("id,started_at,expires_at").single();
      if(insertError) throw insertError;
      return json({attempt_id:attempt.id,started_at:attempt.started_at,expires_at:attempt.expires_at,pass_mark:PASS_MARK,attempts_used:rows.length+1,attempts_remaining:MAX_ATTEMPTS-rows.length-1,duration_minutes:DURATION_MINUTES,questions:ordered.map(publicQuestion)});
    }
    if(action==="submit") {
      const attemptId=String(body.attempt_id||"");
      const answers=body.answers&&typeof body.answers==="object"?body.answers:{};
      if(!attemptId) return json({error:"Missing exam attempt ID."},400);
      const {data:attempt,error:readError}=await admin.from("exam_attempts").select("id,user_id,course_key,question_ids,started_at,expires_at,submitted_at").eq("id",attemptId).eq("user_id",user.id).single();
      if(readError||!attempt) return json({error:"Exam attempt not found for this account."},404);
      if(attempt.submitted_at) return json({error:"This attempt has already been submitted."},409);
      const now=new Date();
      const expired=now.getTime()>new Date(attempt.expires_at).getTime();
      const ids=Array.isArray(attempt.question_ids)?attempt.question_ids:[];
      const missing=ids.filter((id:string)=>!Number.isInteger(answers[id]));
      if(!expired&&missing.length) return json({error:"Answer all 50 questions before submitting.",unanswered:missing.length},400);
      let correct=0;
      if(!expired) for(const id of ids){const q=bank.find(item=>item.id===id);if(q&&Number(answers[id])===q.answer)correct++;}
      const score=expired?0:Math.round(correct/ids.length*100);
      const passed=!expired&&score>=PASS_MARK;
      const resultSummary={total:ids.length,correct,pass_mark:PASS_MARK,expired,course_title:COURSE_TITLE};
      const {error:updateError}=await admin.from("exam_attempts").update({answers,submitted_at:now.toISOString(),score,passed,result_summary:resultSummary}).eq("id",attempt.id).eq("user_id",user.id);
      if(updateError) throw updateError;
      const {data:attemptRows,error:attemptCountError}=await admin.from("exam_attempts").select("id").eq("user_id",user.id).eq("course_key",COURSE_KEY);
      if(attemptCountError) throw attemptCountError;
      const attemptsUsed=(attemptRows||[]).length;
      let certificate=null;
      if(passed) {
        const {data:profile}=await admin.from("profiles").select("display_name").eq("id",user.id).maybeSingle();
        const recipient=String(profile?.display_name||user.user_metadata?.full_name||user.email?.split("@")[0]||"Learner").slice(0,120);
        const {data:prior}=await admin.from("course_certificates").select("certificate_number,score,issued_at,course_title,revoked_at").eq("user_id",user.id).eq("course_key",COURSE_KEY).is("revoked_at",null).maybeSingle();
        if(prior) certificate=prior;
        else {
          const number="UTMA-"+new Date().getUTCFullYear()+"-"+crypto.randomUUID().replaceAll("-","").slice(0,12).toUpperCase();
          const {data:issued,error:issueError}=await admin.from("course_certificates").insert({certificate_number:number,user_id:user.id,recipient_name:recipient,course_key:COURSE_KEY,course_title:COURSE_TITLE,exam_attempt_id:attempt.id,score,issued_at:now.toISOString()}).select("certificate_number,recipient_name,course_title,score,issued_at,revoked_at").single();
          if(issueError) throw issueError;
          certificate=issued;
        }
        await admin.from("course_progress").update({certificate_record:{certificate_number:certificate.certificate_number,score:certificate.score,issued_at:certificate.issued_at,course_title:certificate.course_title},last_exam_result:{score,passed,submitted_at:now.toISOString(),attempts_used:attemptsUsed},saved_at:now.toISOString()}).eq("user_id",user.id);
      } else {
        await admin.from("course_progress").update({last_exam_result:{score,passed,submitted_at:now.toISOString(),attempts_used:attemptsUsed,expired},saved_at:now.toISOString()}).eq("user_id",user.id);
      }
      return json({score,correct,total:ids.length,passed,pass_mark:PASS_MARK,expired,attempts_used:attemptsUsed,attempts_remaining:Math.max(0,MAX_ATTEMPTS-attemptsUsed),certificate});
    }
    return json({error:"Unsupported action. Use start or submit."},400);
  } catch(error) {
    console.error("final-exam error",error);
    return json({error:"The exam service could not complete this request. Please retry or contact the academy administrator."},500);
  }
});
