import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) {
    return Response.json({ error: "Missing report id." }, { status: 400 });
  }

  const report = await prisma.report.findUnique({
    where: { id },
  });

  if (!report) {
    return Response.json({ error: "Report not found." }, { status: 404 });
  }

  const { baseUrl, totalEndpoints, totalFindings, findings } = report;

  return Response.json({ baseUrl, totalEndpoints, totalFindings, findings });
}
