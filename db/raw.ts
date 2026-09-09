import {env} from "cloudflare:workers";
export function database(){if(!env.DB)throw Error("Database unavailable");return env.DB;}
export function sameOrigin(req:Request){const o=req.headers.get("Origin");return !o||o===new URL(req.url).origin;}
