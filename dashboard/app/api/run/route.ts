import path from "path";
import fs from "fs/promises";
import { mkdir } from "fs/promises";
import { parseOpenAPI } from "@/app/lib/parser";
import { runFullScan } from "@/app/lib/engine";

export async function POST(req: Request) {
  try {
    const { fileId, baseUrl } = await req.json();

    if (!fileId) {
      return Response.json({ error: "Missing file id." }, { status: 400 });
    }

    const filePath = path.join(process.cwd(), "uploads", `${fileId}.yaml`);
    const parsed = await parseOpenAPI(filePath, baseUrl);
    const resolvedBaseUrl = baseUrl || parsed.baseUrl;
    const scanResult = await runFullScan(parsed, resolvedBaseUrl);
    const report = {
      ...scanResult,
      totalEndpoints: parsed.endpoints.length,
    };

    const reportId = fileId;
    const reportDir = path.join(process.cwd(), "report-store");
    const outPath = path.join(reportDir, `${reportId}.json`);

    await mkdir(reportDir, { recursive: true });
    await fs.writeFile(outPath, JSON.stringify(report, null, 2));

    return Response.json({ reportId });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to run scan.";

    return Response.json({ error: message }, { status: 500 });
  }
}
