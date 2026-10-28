import { createClient } from "npm:@supabase/supabase-js@2";
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";
import QRCode from "npm:qrcode@1.5.4";
const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, apikey, x-client-info, content-type","Access-Control-Allow-Methods":"POST, OPTIONS","Content-Type":"application/json; charset=utf-8"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:corsHeaders});
const url=Deno.env.get("SUPABASE_URL")??"";
const secret=Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")??"";
const admin=createClient(url,secret,{auth:{persistSession:false,autoRefreshToken:false}});
const VERIFY_BASE="https://rahulk2oo4.github.io/ut-masterclass-academy-NDT/verify-certificate.html";
const maroon=rgb(74/255,16/255,32/255),orange=rgb(198/255,93/255,36/255),muted=rgb(105/255,88/255,80/255);
function wrap(text:string,font:any,size:number,maxWidth:number){const words=text.split(/\s+/);const lines:string[]=[];let line="";for(const word of words){const next=line?line+" "+word:word;if(font.widthOfTextAtSize(next,size)>maxWidth&&line){lines.push(line);line=word;}else line=next;}if(line)lines.push(line);return lines;}
async function getUser(req:Request){const auth=req.headers.get("Authorization")??"";const token=auth.startsWith("Bearer ")?auth.slice(7):"";if(!token)return {user:null,error:"Sign in to download your private certificate PDF."};const {data,error}=await admin.auth.getUser(token);if(error||!data.user)return {user:null,error:"Your session could not be verified. Sign in again."};return {user:data.user,error:null};}
Deno.serve(async(req:Request)=>{
 if(req.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
 if(req.method!=="POST")return json({error:"Use POST."},405);
 try{
  if(!url||!secret)return json({error:"Certificate PDF service is not configured."},500);
  const {user,error:authError}=await getUser(req);if(authError||!user)return json({error:authError||"Unauthorized."},401);
  const body=await req.json().catch(()=>({}));const number=String(body.certificate_number||"").trim().toUpperCase();
  if(!/^UTMA-\d{4}-[A-F0-9]{12}$/.test(number))return json({error:"Invalid certificate number."},400);
  const {data:cert,error}=await admin.from("course_certificates").select("certificate_number,user_id,recipient_name,course_title,score,issued_at,revoked_at,pdf_storage_path").eq("certificate_number",number).eq("user_id",user.id).maybeSingle();
  if(error)throw error;if(!cert)return json({error:"Certificate not found for this account."},404);if(cert.revoked_at)return json({error:"This certificate has been revoked; its PDF cannot be downloaded."},403);
  const bucket=admin.storage.from("academy-certificates");
  if(cert.pdf_storage_path){const {data:signed,error:signedError}=await bucket.createSignedUrl(cert.pdf_storage_path,600,{download:number+".pdf"});if(!signedError&&signed?.signedUrl)return json({certificate_number:number,signed_url:signed.signedUrl,expires_in_seconds:600});}
  const pdf=await PDFDocument.create();const page=pdf.addPage([842,595]);const regular=await pdf.embedFont(StandardFonts.Helvetica);const bold=await pdf.embedFont(StandardFonts.HelveticaBold);const italic=await pdf.embedFont(StandardFonts.HelveticaOblique);
  page.drawRectangle({x:20,y:20,width:802,height:555,borderColor:maroon,borderWidth:4});page.drawRectangle({x:31,y:31,width:780,height:533,borderColor:orange,borderWidth:1.5});
  page.drawRectangle({x:386,y:500,width:70,height:54,color:orange});page.drawText("UT",{x:405,y:518,size:19,font:bold,color:rgb(1,1,1)});
  page.drawText("NDT MASTERCLASS ACADEMY",{x:421,y:474,size:13,font:bold,color:maroon});page.drawText("CERTIFICATE OF COURSE COMPLETION",{x:421,y:450,size:10,font:bold,color:orange});page.drawText("Certificate of Achievement",{x:421,y:410,size:29,font:bold,color:maroon});page.drawText("This certificate is awarded to",{x:421,y:375,size:13,font:regular,color:muted});
  const nameSize=Math.min(28,Math.max(16,680/Math.max(1,regular.widthOfTextAtSize(cert.recipient_name,28))*28));page.drawText(cert.recipient_name,{x:421-regular.widthOfTextAtSize(cert.recipient_name,nameSize)/2,y:333,size:nameSize,font:italic,color:maroon});page.drawLine({start:{x:115,y:322},end:{x:727,y:322},thickness:1,color:rgb(0.84,0.72,0.66)});
  const completion="for successful completion of the educational assessment";page.drawText(completion,{x:421-regular.widthOfTextAtSize(completion,12)/2,y:296,size:12,font:regular,color:muted});
  const courseSize=Math.min(21,Math.max(13,640/Math.max(1,bold.widthOfTextAtSize(cert.course_title,21))*21));page.drawText(cert.course_title,{x:421-bold.widthOfTextAtSize(cert.course_title,courseSize)/2,y:255,size:courseSize,font:bold,color:maroon});
  page.drawText("Exam score: "+cert.score+"%",{x:145,y:204,size:12,font:bold,color:maroon});page.drawText("Date issued: "+new Date(cert.issued_at).toISOString().slice(0,10),{x:345,y:204,size:12,font:bold,color:maroon});page.drawText("Certificate ID: "+number,{x:145,y:178,size:11,font:bold,color:maroon});
  const disclaimer="This is an Academy educational course-completion record, not ASNT, ISO 9712 or another external NDT personnel certification, and not authorization to inspect production components independently.";wrap(disclaimer,regular,8.5,570).forEach((line,i)=>page.drawText(line,{x:145,y:142-i*13,size:8.5,font:regular,color:muted}));
  const verifyUrl=VERIFY_BASE+"?number="+encodeURIComponent(number);const qrData=await QRCode.toDataURL(verifyUrl,{width:180,margin:1,errorCorrectionLevel:"M"});const qrBytes=Uint8Array.from(atob(qrData.split(",")[1]),ch=>ch.charCodeAt(0));const qr=await pdf.embedPng(qrBytes);page.drawImage(qr,{x:650,y:54,width:105,height:105});page.drawText("Scan to verify",{x:650,y:43,size:8,font:regular,color:muted});
  const bytes=await pdf.save();const path=user.id+"/"+number+".pdf";const {error:uploadError}=await bucket.upload(path,bytes,{contentType:"application/pdf",upsert:true,cacheControl:"0"});if(uploadError)throw uploadError;
  const {error:updateError}=await admin.from("course_certificates").update({pdf_storage_path:path}).eq("certificate_number",number).eq("user_id",user.id);if(updateError)throw updateError;
  const {data:signed,error:signedError}=await bucket.createSignedUrl(path,600,{download:number+".pdf"});if(signedError||!signed?.signedUrl)throw signedError||new Error("Could not create a signed download URL.");
  return json({certificate_number:number,signed_url:signed.signedUrl,expires_in_seconds:600,stored_privately:true});
 }catch(error){console.error("certificate-pdf error",error);return json({error:"Could not generate the private certificate PDF. Please retry or contact the academy administrator."},500);}
});
