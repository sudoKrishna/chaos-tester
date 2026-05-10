"use client";

import Link from "next/link";
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
  const [specText, setSpecText] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [reportId, setReportId] = useState("");
  const [report, setReport] = useState<ScanReport | null>(null);

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ✅ SAFE: replace useSearchParams with browser-only logic
  useEffect(() => {
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get("reportId") || "";

    if (!id) return;

    setReportId(id);

    fetch(`/api/report?id=${id}`)
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
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      let fileId = "";

      if (specText.trim()) {
        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileId, baseUrl }),
      });

      const runPayload = await runResponse.json();

      if (!runResponse.ok) {
        throw new Error(runPayload.error || "Unable to run scan.");
      }

      const nextReportId = runPayload.reportId;

      setReportId(nextReportId);

      // ✅ safe URL update (no SSR issues)
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

  data.forEach((finding) => {
    counts[finding.severity]++;
  });

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
          <h1 className="text-4xl font-bold">
            Paste a spec. Run a scan. See the report here.
          </h1>
        </div>

        {/* FORM */}
        <Card className="border-amber-200/80 bg-white/90 p-6">
          <form className="space-y-4" onSubmit={handleSubmit}>
            <input
              placeholder="API base URL"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full border p-3 rounded"
            />

            <textarea
              value={specText}
              onChange={(e) => setSpecText(e.target.value)}
              className="w-full h-48 border p-3 rounded"
              placeholder="Paste YAML/JSON"
            />

            <button
              disabled={isSubmitting}
              className="bg-amber-500 text-white px-4 py-2 rounded"
            >
              {isSubmitting ? "Running..." : "Run scan"}
            </button>

            {error && <p className="text-red-500">{error}</p>}
          </form>
        </Card>

        {/* STATS */}
        <div className="grid grid-cols-4 gap-4">
          {Object.entries(counts).map(([key, val]) => (
            <Card key={key} className="p-4">
              <div>{key}</div>
              <div className="text-xl font-bold">{val}</div>
            </Card>
          ))}
        </div>

        {/* CHART */}
        <Card className="p-4 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* FINDINGS */}
        <Card className="p-4">
          <h2 className="font-bold mb-2">Latest findings</h2>

          {!hasReport && (
            <p className="text-gray-500">No report yet</p>
          )}

          {data.slice(0, 10).map((f, i) => (
            <div key={i} className="border-b py-2">
              <div className="font-medium">{f.endpoint}</div>
              <div className="text-sm text-gray-500">{f.title}</div>
            </div>
          ))}
        </Card>

      </div>
    </div>
  );
}