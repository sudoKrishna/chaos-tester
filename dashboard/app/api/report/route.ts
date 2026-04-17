import path from "path";
import fs from "fs/promises";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing report id." }, { status: 400 });
  }

  const filePath = path.join(process.cwd(), "report-store", `${id}.json`);

  try {
    const data = await fs.readFile(filePath, "utf-8");
    return Response.json(JSON.parse(data));
  } catch {
    return Response.json({ error: "Report not found." }, { status: 404 });
  }
}
