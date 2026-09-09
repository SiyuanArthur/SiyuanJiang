import {env} from "cloudflare:workers";
import {database,sameOrigin} from "@/db/raw";
export async function POST(req:Request){
 if(!sameOrigin(req))return new Response("Forbidden",{status:403});
 try{
 if(Number(req.headers.get("content-length"))>21*1024*1024)return new Response("Too large",{status:413});
 const form=await req.formData();const file=form.get("file");
 if(!(file instanceof File)||file.size>20*1024*1024)return new Response("Invalid file",{status:400});
 if(!env.BUCKET)throw Error("Storage unavailable");
 const id=crypto.randomUUID();await env.BUCKET.put(id,file.stream(),{httpMetadata:{contentType:"application/octet-stream"}});
 try{await database().prepare("INSERT INTO items (id,kind,title,date,name,size,created) VALUES (?,?,?,?,?,?,?)").bind(id,"file",file.name,new Date().toISOString().slice(0,10),file.name,file.size,new Date().toISOString()).run();}catch(e){await env.BUCKET.delete(id);throw e;}
 return Response.json({ok:true});
 }catch(e){console.error(e);return Response.json({error:"上传失败"},{status:503});}
}
export async function GET(req:Request){try{
 const id=new URL(req.url).searchParams.get("id");if(!id)return new Response("Not found",{status:404});
 const row=await database().prepare("SELECT name FROM items WHERE id=? AND kind='file'").bind(id).first<{name:string}>();
 if(!row||!env.BUCKET)return new Response("Not found",{status:404});const object=await env.BUCKET.get(id);if(!object)return new Response("Not found",{status:404});
 return new Response(object.body,{headers:{"Content-Type":"application/octet-stream","Content-Disposition":"attachment; filename*=UTF-8''"+encodeURIComponent(row.name),"X-Content-Type-Options":"nosniff","Cache-Control":"private, no-store"}});
 }catch(e){console.error(e);return new Response("Storage unavailable",{status:503});}}
