"use client";

import Spline from "@splinetool/react-spline";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);

          // small delay so 100% is visible briefly
          setTimeout(() => setLoaded(true), 300);

          return 100;
        }
        return prev + 1;
      });
    }, 20);

    return () => clearInterval(interval);
  }, []);

  return (
    <main
      style={{
        height: "100vh",
        width: "100vw",
        position: "relative",
        overflow: "hidden",
        background: "#052e16",
      }}
    >
      {/* Spline background (only show after load) */}
      {loaded && (
        <Spline scene="https://prod.spline.design/Q7oABQD7Nb1hc5X1/scene.splinecode" />
      )}

      {/* Loading screen */}
      {!loaded && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "radial-gradient(circle at top, #052e16, #000)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#22c55e",
            fontFamily: "monospace",
            fontSize: 18,
          }}
        >
          <div
            style={{
              position: "absolute",
              bottom: 20,
              right: 20,
            }}
          >
            Loading... {progress}%
          </div>
        </div>
      )}

      {/* Left center content (only after load) */}
      {loaded && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "8%",
            transform: "translateY(-50%)",
            color: "#22c55e",
            maxWidth: "420px",
          }}
        >
          <h1
            style={{
              fontSize: "48px",
              fontFamily: "cursive",
              fontWeight: "bold",
              marginBottom: 10,
            }}
          >
            Chaos Tester
          </h1>

          <p
            style={{
              color: "#86efac",
              fontFamily: "cursive",
              fontSize: "18px",
            }}
          >
            Scan APIs. Detect vulnerabilities. Generate intelligent reports in seconds.
          </p>

<button
  onClick={() => router.push("/dashboard")}
  style={{
    marginTop: 25,
    padding: "14px 26px",
    fontSize: "16px",
    fontFamily: "cursive",
    color: "#dcfce7",

    // 🧊 glass effect
    background: "rgba(34, 197, 94, 0.25)",
    border: "1px solid rgba(34, 197, 94, 0.5)",
    borderRadius: "16px",

    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",

    // ✨ makes it feel solid, not weak
    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.25)",

    cursor: "pointer",
    transition: "all 0.3s ease",
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.background = "rgba(34, 197, 94, 0.4)";
    e.currentTarget.style.transform = "scale(1.05)";
    e.currentTarget.style.boxShadow =
      "0 10px 40px rgba(34, 197, 94, 0.25)";
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.background = "rgba(34, 197, 94, 0.25)";
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0, 0, 0, 0.25)";
  }}
>
  Enter App
</button>
        </div>
      )}
    </main>
  );
}