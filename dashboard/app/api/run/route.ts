import { parseOpenAPI } from "@/app/lib/parser";
import { runFullScan } from "@/app/lib/engine";
import { prisma } from "@/lib/prisma";


export async function POST(req: Request) {
  try {
    const { fileId, baseUrl } = await req.json();

    if (!fileId) {
      return Response.json({ error: "Missing file id." }, { status: 400 });
    }

    const uploadedSpec = await prisma.uploadedSpec.findUnique({
      where: { id: fileId },
    });

    if (!uploadedSpec) {
      return Response.json({ error: "Spec not found." }, { status: 404 });
    }

    const parsed = await parseOpenAPI(uploadedSpec.content, baseUrl);
    const resolvedBaseUrl = baseUrl || parsed.baseUrl;
    const scanResult = await runFullScan(parsed, resolvedBaseUrl);
    const report = {
      ...scanResult,
      totalEndpoints: parsed.endpoints.length,
    };

    const reportId = fileId;

    await prisma.report.upsert({
      where: { id: reportId },
      create: {
        id: reportId,
        specId: fileId,
        baseUrl: resolvedBaseUrl,
        totalEndpoints: report.totalEndpoints,
        totalFindings: report.totalFindings,
        findings: JSON.parse(JSON.stringify(report.findings))
      },
      update: {
        baseUrl: resolvedBaseUrl,
        totalEndpoints: report.totalEndpoints,
        totalFindings: report.totalFindings,
        findings: JSON.parse(JSON.stringify(report.findings))
      },
    });

    return Response.json({ reportId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to run scan.";

    return Response.json({ error: message }, { status: 500 });
  }
}
