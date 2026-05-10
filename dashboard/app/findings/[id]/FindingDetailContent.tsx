"use client";

import { useEffect, useState } from "react";
import { Finding, ScanReport } from "../../../types";
import { Card } from "@/components/ui/card";

export default function FindingDetail() {
  const [finding, setFinding] = useState<Finding | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;

    // ✅ get id from URL path
    const pathParts = window.location.pathname.split("/");
    const id = pathParts[pathParts.length - 1];

    // ✅ get reportId from query
    const params = new URLSearchParams(window.location.search);
    const reportId = params.get("reportId");

    if (!reportId) return;

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
  }, []);

  if (error) {
    return (
      <div className="p-6 text-red-600">
        {error}
      </div>
    );
  }

  if (!finding) {
    return (
      <div className="flex min-h-screen items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black p-6 text-white space-y-4">
      <h1 className="text-3xl font-bold text-green-400">
        {finding.title}
      </h1>

      <Card className="p-4 bg-zinc-900 border border-green-500/20 text-white">
        <h2 className="font-semibold text-green-400 mb-2">
          Description
        </h2>

        <p>{finding.description}</p>
      </Card>

      <Card className="p-4 bg-zinc-900 border border-green-500/20 text-white">
        <h2 className="font-semibold text-green-400 mb-2">
          Curl Command
        </h2>

        <pre className="overflow-x-auto text-xs whitespace-pre-wrap">
          {finding.curlCommand}
        </pre>
      </Card>

      <Card className="p-4 bg-zinc-900 border border-green-500/20 text-white">
        <h2 className="font-semibold text-green-400 mb-2">
          Request
        </h2>

        <pre className="overflow-x-auto text-xs whitespace-pre-wrap">
          {JSON.stringify(finding.request, null, 2)}
        </pre>
      </Card>

      <Card className="p-4 bg-zinc-900 border border-green-500/20 text-white">
        <h2 className="font-semibold text-green-400 mb-2">
          Response
        </h2>

        <pre className="overflow-x-auto text-xs whitespace-pre-wrap">
          {JSON.stringify(finding.response, null, 2)}
        </pre>
      </Card>
    </div>
  );
}