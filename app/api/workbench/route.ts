import { database } from "@/db/raw";
import { workspaceSchema } from "@/lib/workbench";
import { z } from "zod";

export async function GET() {
  try {
    const row = await database()
      .prepare("SELECT payload, revision FROM workbench WHERE id = ?")
      .bind("workspace")
      .first<{ payload: string; revision: number }>();
    return Response.json(
      {
        workspace: row ? JSON.parse(row.payload) : null,
        revision: row?.revision ?? 0,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (e) {
    console.error("Workspace read failed", e);
    return Response.json(
      { error: "工作台暂时无法连接，请稍后重试。" },
      { status: 503 },
    );
  }
}
export async function PUT(req: Request) {
  if (req.headers.get("Origin") !== new URL(req.url).origin)
    return new Response("Forbidden", { status: 403 });
  try {
    const raw = await req.text();
    if (raw.length > 1500000) return new Response("内容过大", { status: 413 });
    let input: unknown;
    try {
      input = JSON.parse(raw);
    } catch {
      return Response.json({ error: "文件不是有效的 JSON。" }, { status: 400 });
    }
    const parsed = z
      .object({
        revision: z.number().int().nonnegative(),
        workspace: workspaceSchema,
      })
      .safeParse(input);
    if (!parsed.success)
      return Response.json(
        { error: "内容格式不正确，请检查日期和输入。" },
        { status: 400 },
      );
    const { revision, workspace } = parsed.data;
    const payload = JSON.stringify(workspace);
    const now = new Date().toISOString();
    const result =
      revision === 0
        ? await database()
            .prepare(
              "INSERT OR IGNORE INTO workbench (id,payload,revision,updated) VALUES (?,?,1,?)",
            )
            .bind("workspace", payload, now)
            .run()
        : await database()
            .prepare(
              "UPDATE workbench SET payload=?,revision=revision+1,updated=? WHERE id=? AND revision=?",
            )
            .bind(payload, now, "workspace", revision)
            .run();
    if (!result.meta.changes)
      return Response.json(
        { error: "另一个页面更新了工作台。请刷新后再保存；输入内容仍保留。" },
        { status: 409 },
      );
    return Response.json({ revision: revision + 1 });
  } catch (e) {
    console.error("Workspace save failed", e);
    return Response.json({ error: "保存失败，请重试。" }, { status: 503 });
  }
}
