import { createClient } from "npm:@supabase/supabase-js@2";
const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, x-client-info, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json; charset=utf-8"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:corsHeaders});
const url=Deno.env.get("SUPABASE_URL")??"";
const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"Use POST."},405);
 try{
  if(!url||!secret)return json({error:"Certificate verification service is not configured."},500);
  const body=await req.json().catch(()=>({}));
  const number=String(body.certificate_number||"").trim().toUpperCase();
  if(!/^UTMA-\d{4}-[A-F0-9]{12}$/.test(number))return json({found:false,error:"Enter a valid certificate number."},400);
  const {data,error}=await admin.from("course_certificates").select("certificate_number,recipient_name,course_title,score,issued_at,revoked_at,revocation_reason").eq("certificate_number",number).maybeSingle();
  if(error)throw error;
  if(!data)return json({found:false,status:"not_found",message:"No certificate matches this number."},404);
  return json({found:true,status:data.revoked_at?"revoked":"valid",certificate_number:data.certificate_number,recipient_name:data.recipient_name,course_title:data.course_title,score:data.score,issued_at:data.issued_at,revoked_at:data.revoked_at,revocation_reason:data.revocation_reason||null});
 }catch(error){console.error("verify-certificate error",error);return json({error:"Verification could not be completed right now."},500);}
});
