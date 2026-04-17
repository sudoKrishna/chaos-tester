"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Finding, ScanReport } from "../../types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function FindingsPage() {
  const searchParams = useSearchParams();
  const reportId = searchParams.get("reportId");
  const [data, setData] = useState<Finding[]>([]);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [filter, setFilter] = useState<string>("all");
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
        setReport(report);
        setData(report.findings);
        setError("");
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [reportId]);

  const filtered =
    filter === "all" ? data : data.filter((finding) => finding.severity === filter);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ed_100%)] p-6 space-y-4 text-slate-900">
      <h1 className="text-xl font-bold">All Findings</h1>
      {!reportId ? <p className="text-sm text-slate-500">No report selected yet.</p> : null}
      {report ? (
        <p className="text-sm text-slate-500">
          {report.totalFindings} findings across {report.totalEndpoints} endpoints
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <div className="flex gap-2">
        {["all", "critical", "high", "medium", "info"].map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className="rounded-full border border-amber-200 px-3 py-1 text-sm"
          >
            {value}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {report && filtered.length === 0 ? (
          <Card className="p-4 text-sm text-slate-600">
            No findings matched this report{filter !== "all" ? ` for "${filter}"` : ""}.
          </Card>
        ) : null}

        {filtered.map((finding, index) => (
          <Link
            key={`${finding.endpoint}-${index}`}
            href={`/findings/${index}?reportId=${reportId}`}
          >
            <Card className="p-3">
              <div className="flex justify-between">
                <div>
                  <div className="font-semibold">{finding.title}</div>
                  <div className="text-sm text-slate-500">{finding.endpoint}</div>
                </div>
                <Badge variant={finding.severity}>{finding.severity}</Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
