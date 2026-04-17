"use client";

import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { Finding, ScanReport } from "../../../types";
import { Card } from "@/components/ui/card";

export default function FindingDetail() {
  const { id } = useParams();
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const [finding, setFinding] = useState<Finding | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!reportId) {
      return;
    }

    fetch(`/api/report?id=${reportId}`)
      .then(async (response) => {
        if (!response.ok) {
          const payload = await response.json();
          throw new Error(payload.error || "Unable to load report.");
        }

        return response.json();
      })
      .then((report: ScanReport) => {
        setFinding(report.findings[Number(id)] || null);
        setError("");
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [id, reportId]);

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  if (!finding) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-xl font-bold">{finding.title}</h1>

      <Card className="p-4 text-black">
        <h2 className="font-semibold">Description</h2>
        <p>{finding.description}</p>
      </Card>

      <Card className="p-4 text-black">
        <h2 className="font-semibold">Curl</h2>
        <pre className="overflow-x-auto text-xs">{finding.curlCommand}</pre>
      </Card>

      <Card className="p-4 text-black">
        <h2 className="font-semibold">Request</h2>
        <pre className="text-xs">{JSON.stringify(finding.request, null, 2)}</pre>
      </Card>

      <Card className="p-4 text-black">
        <h2 className="font-semibold">Response</h2>
        <pre className="text-xs">{JSON.stringify(finding.response, null, 2)}</pre>
      </Card>
    </div>
  );
}
