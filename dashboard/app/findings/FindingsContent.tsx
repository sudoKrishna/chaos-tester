"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Finding, ScanReport } from "../../types";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";

export default function FindingsPage() {
  const [reportId, setReportId] = useState("");
  const [data, setData] = useState<Finding[]>([]);
  const [report, setReport] = useState<ScanReport | null>(null);
  const [filter, setFilter] = useState<string>("all");
  const [error, setError] = useState("");

  // ✅ SAFE browser-only query param handling
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("reportId") || "";

    if (!id) return;

    setReportId(id);

    fetch(`/api/report?id=${id}`)
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
  }, []);

  const filtered =
    filter === "all"
      ? data
      : data.filter((finding) => finding.severity === filter);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffdf8_0%,#fff7ed_100%)] p-6 space-y-4 text-slate-900">
      <h1 className="text-xl font-bold">All Findings</h1>

      {!reportId ? (
        <p className="text-sm text-slate-500">
          No report selected yet.
        </p>
      ) : null}

      {report ? (
        <p className="text-sm text-slate-500">
          {report.totalFindings} findings across{" "}
          {report.totalEndpoints} endpoints
        </p>
      ) : null}

      {error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : null}

      <div className="flex gap-2 flex-wrap">
        {["all", "critical", "high", "medium", "info"].map((value) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            className={`rounded-full border px-3 py-1 text-sm transition ${
              filter === value
                ? "bg-amber-500 text-white border-amber-500"
                : "border-amber-200 hover:bg-amber-50"
            }`}
          >
            {value}
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {report && filtered.length === 0 ? (
          <Card className="p-4 text-sm text-slate-600">
            No findings matched this report
            {filter !== "all" ? ` for "${filter}"` : ""}.
          </Card>
        ) : null}

        {filtered.map((finding, index) => (
          <Link
            key={`${finding.endpoint}-${index}`}
            href={`/findings/${index}?reportId=${reportId}`}
          >
            <Card className="p-3 transition hover:shadow-md hover:border-amber-300">
              <div className="flex justify-between items-center">
                <div>
                  <div className="font-semibold">
                    {finding.title}
                  </div>

                  <div className="text-sm text-slate-500">
                    {finding.endpoint}
                  </div>
                </div>

                <Badge variant={finding.severity}>
                  {finding.severity}
                </Badge>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}