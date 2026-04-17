import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const id = randomUUID();
  const uploadDir = path.join(process.cwd(), "uploads");
  const filePath = path.join(uploadDir, `${id}.yaml`);

  await mkdir(uploadDir, { recursive: true });

  const contentType = req.headers.get("content-type") || "";
  let buffer: Buffer;

  if (contentType.includes("application/json")) {
    const { content } = await req.json();

    if (!content || typeof content !== "string") {
      return Response.json(
        { error: "Please provide pasted YAML or JSON content." },
        { status: 400 }
      );
    }

    buffer = Buffer.from(content, "utf-8");
  } else {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Please upload a YAML or JSON file." },
        { status: 400 }
      );
    }

    buffer = Buffer.from(await file.arrayBuffer());
  }

  await writeFile(filePath, buffer);

  return Response.json({ fileId: id });
}
