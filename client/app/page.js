"use client";

import { useState, useRef } from "react";
import axios from "axios";

import Header from "../components/Header";
import URLInput from "../components/URLInput";
import GenerateButton from "../components/GenerateButton";
import LoadingSteps from "../components/LoadingSteps";
import ResultPanel from "../components/ResultPanel";
import FeaturePills from "../components/FeaturePills";

export default function HomePage() {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const resultRef = useRef(null);

  const startStepTimer = () => {
    let step = 0;
    const durations = [4000, 6000, 8000, 5000];
    const advance = () => {
      step++;
      if (step < 4) {
        setLoadingStep(step);
        setTimeout(advance, durations[step]);
      }
    };
    setTimeout(advance, durations[0]);
  };

  const handleGenerate = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setLoadingStep(0);
    startStepTimer();
    try {
      const res = await axios.post("/api/generate", { url: url.trim() });
      setResult(res.data);
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 300);
    } catch (err) {
      setError(err.response?.data?.error || err.message || "Something went wrong.");
    } finally {
      setLoading(false);
      setLoadingStep(0);
    }
  };

  return (
    <div className="relative min-h-screen overflow-x-hidden" style={{ background: "var(--c-bg)" }}>
      <div className="orb" style={{ width: 600, height: 600, top: -100, left: -200, background: "radial-gradient(circle, rgba(124,58,237,0.25) 0%, transparent 70%)", animationDelay: "0s" }} />
      <div className="orb" style={{ width: 500, height: 500, top: 200, right: -150, background: "radial-gradient(circle, rgba(59,130,246,0.2) 0%, transparent 70%)", animationDelay: "3s" }} />
      <div className="orb" style={{ width: 400, height: 400, bottom: 100, left: "30%", background: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)", animationDelay: "6s" }} />

      <div className="relative z-10 flex flex-col items-center px-4 pb-24">
        <Header />

        <section className="w-full max-w-2xl mt-16 mb-12 text-center">
          <div className="inline-flex items-center gap-2 mb-6 px-4 py-2 rounded-full glass text-sm font-medium text-purple-300 border border-purple-500/20">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            AI-Powered · No video cloning · Original content only
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-extrabold leading-tight mb-5" style={{ letterSpacing: "-0.02em" }}>
            Turn <span className="gradient-text glow-text">Any Video</span><br />Into a Viral Reel
          </h1>
          <p className="text-lg text-gray-400 max-w-xl mx-auto leading-relaxed">
            Paste a YouTube link. We extract the ideas, rewrite them into a viral script, add a voiceover, and export a ready-to-post{" "}
            <span className="text-purple-400 font-medium">9:16 vertical video</span> with captions.
          </p>
        </section>

        <div className="w-full max-w-2xl">
          <div className="gradient-border p-[1px]">
            <div className="rounded-2xl p-8" style={{ background: "var(--c-elevated)" }}>
              <URLInput value={url} onChange={setUrl} disabled={loading} />
              <GenerateButton onClick={handleGenerate} loading={loading} disabled={!url.trim() || loading} />
              {error && (
                <div className="mt-4 flex items-start gap-3 p-4 rounded-xl bg-red-950/40 border border-red-800/50">
                  <span className="text-red-400 mt-0.5">⚠</span>
                  <p className="text-sm text-red-300">{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading && (
          <div className="w-full max-w-2xl mt-8">
            <LoadingSteps currentStep={loadingStep} />
          </div>
        )}

        {result && !loading && (
          <div ref={resultRef} className="w-full max-w-5xl mt-12">
            <ResultPanel result={result} />
          </div>
        )}

        {!loading && !result && (
          <div className="mt-16">
            <FeaturePills />
          </div>
        )}
      </div>
    </div>
  );
}