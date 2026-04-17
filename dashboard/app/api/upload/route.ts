import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const id = randomUUID();
  const contentType = req.headers.get("content-type") || "";
  let content: string;
  let filename: string | undefined;

  if (contentType.includes("application/json")) {
    const body = await req.json();

    if (!body.content || typeof body.content !== "string") {
      return Response.json(
        { error: "Please provide pasted YAML or JSON content." },
        { status: 400 }
      );
    }

    content = body.content;
  } else {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return Response.json(
        { error: "Please upload a YAML or JSON file." },
        { status: 400 }
      );
    }

    filename = file.name;
    content = Buffer.from(await file.arrayBuffer()).toString("utf-8");
  }

  await prisma.uploadedSpec.create({
    data: {
      id,
      filename,
      content,
    },
  });

  return Response.json({ fileId: id });
}
