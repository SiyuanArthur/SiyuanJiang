import {z} from "zod";
import {database,sameOrigin} from "@/db/raw";
export async function GET(){try{const data=await database().prepare("SELECT * FROM items ORDER BY created DESC").all();return Response.json(data.results,{headers:{"Cache-Control":"no-store"}});}catch(e){console.error(e);return Response.json({error:"读取失败"},{status:503})}}
export async function POST(req:Request){
 if(!sameOrigin(req))return new Response("Forbidden",{status:403});
 try{
 const parsed=z.object({id:z.string().nullable().optional(),kind:z.enum(["task","note","skill"]),title:z.string().trim().min(1).max(200),body:z.string().max(50000),date:z.string().regex(/^\d{4}-\d{2}-\d{2}$/),done:z.number().int().min(0).max(1).optional(),count:z.number().int().nonnegative().optional()}).safeParse(await req.json());if(!parsed.success)return new Response("Invalid input",{status:400});const x=parsed.data;if(!["task","note","skill"].includes(x.kind)||typeof x.title!=="string"||!x.title.trim()||x.title.length>200||typeof x.body!=="string"||x.body.length>50000||typeof x.date!=="string"||!/^\d{4}-\d{2}-\d{2}$/.test(x.date))return new Response("Invalid input",{status:400});
 const db=database();
 if(x.id){
 const old=await db.prepare("SELECT kind FROM items WHERE id = ?").bind(x.id).first();
 if(!old||old.kind!==x.kind)return new Response("Not found",{status:404});
 await db.prepare("UPDATE items SET title=?,body=?,date=?,done=COALESCE(?,done),count=COALESCE(?,count) WHERE id=?").bind(x.title.trim(),x.body,x.date,x.done===undefined?null:x.done?1:0,x.count??null,x.id).run();
 }else{await db.prepare("INSERT INTO items (id,kind,title,body,date,created) VALUES (?,?,?,?,?,?)").bind(crypto.randomUUID(),x.kind,x.title.trim(),x.body,x.date,new Date().toISOString()).run();}
 return Response.json({ok:true});
 }catch(e){console.error(e);return Response.json({error:"保存失败"},{status:503});}
}
