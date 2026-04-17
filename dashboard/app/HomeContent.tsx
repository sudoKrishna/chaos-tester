"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { Finding, ScanReport } from "../types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Home() {
  const searchParams = useSearchParams();
  const [specText, setSpecText] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [reportId, setReportId] = useState(searchParams.get("reportId") || "");
  const [report, setReport] = useState<ScanReport | null>(null);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const currentReportId = searchParams.get("reportId");

    if (!currentReportId) {
      return;
    }

    setReportId(currentReportId);

    fetch(`/api/report?id=${currentReportId}`)
      .then(async (res) => {
        if (!res.ok) {
          const payload = await res.json();
          throw new Error(payload.error || "Unable to load report.");
        }

        return res.json();
      })
      .then((data: ScanReport) => {
        setReport(data);
        setBaseUrl(data.baseUrl);
        setError("");
      })
      .catch((err: Error) => {
        setError(err.message);
      });
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      let fileId = "";

      if (specText.trim()) {
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ content: specText }),
        });

        const uploadPayload = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadPayload.error || "Unable to upload pasted spec.");
        }

        fileId = uploadPayload.fileId;
      } else if (selectedFile) {
        const formData = new FormData();
        formData.append("file", selectedFile);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadPayload = await uploadResponse.json();

        if (!uploadResponse.ok) {
          throw new Error(uploadPayload.error || "Unable to upload file.");
        }

        fileId = uploadPayload.fileId;
      } else {
        throw new Error("Paste a YAML/JSON spec or choose a file first.");
      }

      const runResponse = await fetch("/api/run", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileId,
          baseUrl,
        }),
      });

      const runPayload = await runResponse.json();

      if (!runResponse.ok) {
        throw new Error(runPayload.error || "Unable to run scan.");
      }

      const nextReportId = runPayload.reportId;
      setReportId(nextReportId);
      window.history.replaceState({}, "", `/?reportId=${nextReportId}`);

      const reportResponse = await fetch(`/api/report?id=${nextReportId}`);
      const reportPayload = await reportResponse.json();

      if (!reportResponse.ok) {
        throw new Error(reportPayload.error || "Unable to load report.");
      }

      setReport(reportPayload);
    } catch (err) {
      setReport(null);
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSubmitting(false);
    }
  }

  const data: Finding[] = report?.findings || [];
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    info: 0,
  };

  data.forEach((finding) => counts[finding.severity]++);

  const chartData = Object.entries(counts).map(([name, value]) => ({
    name,
    value,
  }));
  const hasReport = Boolean(report);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,#fef3c7,transparent_30%),linear-gradient(180deg,#fffdf8_0%,#fff7ed_100%)] px-4 py-8 text-slate-900">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
            Chaos Tester
          </p>
          <h1 className="text-4xl font-bold">Paste a spec. Run a scan. See the report here.</h1>
          <p className="max-w-3xl text-sm text-slate-600">
            Upload or paste your OpenAPI YAML/JSON, add the API base URL, and the scan result will render in the web app without editing files in code.
          </p>
        </div>

        <Card className="border-amber-200/80 bg-white/90 p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">API base URL</span>
                <input
                  className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 outline-none transition focus:border-amber-400"
                  placeholder="https://api.example.com"
                  value={baseUrl}
                  onChange={(event) => setBaseUrl(event.target.value)}
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">Upload YAML/JSON file</span>
                <input
                  className="block w-full rounded-xl border border-dashed border-amber-300 bg-amber-50 px-4 py-3 text-sm"
                  type="file"
                  accept=".yaml,.yml,.json,application/json"
                  onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium text-slate-700">Or paste YAML/JSON</span>
              <textarea
                className="min-h-72 w-full rounded-2xl border border-amber-200 bg-slate-950 px-4 py-3 font-mono text-sm text-amber-100 outline-none transition focus:border-amber-400"
                placeholder={"openapi: 3.0.0\ninfo:\n  title: Demo API\n  version: 1.0.0"}
                value={specText}
                onChange={(event) => setSpecText(event.target.value)}
              />
            </label>

            <div className="flex flex-wrap items-center gap-3">
              <button
                className="rounded-full bg-amber-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-amber-600 disabled:cursor-not-allowed disabled:bg-amber-300"
                disabled={isSubmitting}
                type="submit"
              >
                {isSubmitting ? "Running scan..." : "Run scan"}
              </button>

              {reportId ? (
                <Link
                  className="text-sm font-medium text-amber-700 underline-offset-4 hover:underline"
                  href={`/findings?reportId=${reportId}`}
                >
                  Open full findings
                </Link>
              ) : null}
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        </Card>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {Object.entries(counts).map(([key, val]) => (
            <Card key={key} className="border-amber-100 p-4">
              <div className="text-sm text-slate-500">{key}</div>
              <div className="text-2xl font-bold">{val}</div>
            </Card>
          ))}
        </div>

        <Card className="border-amber-100 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Severity overview</h2>
            <span className="text-sm text-slate-500">
              {report
                ? `${report.totalFindings} findings across ${report.totalEndpoints} endpoints`
                : "No report yet"}
            </span>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="border-amber-100 p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-xl font-semibold">Latest findings</h2>
            {reportId ? (
              <Link
                className="text-sm font-medium text-amber-700 underline-offset-4 hover:underline"
                href={`/findings?reportId=${reportId}`}
              >
                View all
              </Link>
            ) : null}
          </div>

          <div className="space-y-3">
            {!hasReport ? (
              <p className="text-sm text-slate-500">
                Run a scan and the results will appear here.
              </p>
            ) : null}

            {hasReport && data.length === 0 ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                Scan completed successfully. No findings were generated for the
                current target.
              </div>
            ) : null}

            {data.slice(0, 10).map((finding, index) => (
              <Link
                key={`${finding.endpoint}-${index}`}
                href={`/findings/${index}?reportId=${reportId}`}
              >
                <Card className="flex items-center justify-between border-amber-100 p-3 transition hover:border-amber-300 hover:shadow-md">
                  <div>
                    <div className="font-medium">{finding.endpoint}</div>
                    <div className="text-sm text-slate-500">{finding.title}</div>
                  </div>
                  <Badge variant={finding.severity}>{finding.severity}</Badge>
                </Card>
              </Link>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
