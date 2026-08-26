"use client";

import React, { useState } from "react";
import type { ConsistencyResult } from "@/lib/consistency";

interface ConsistencyCheckerProps {
  resumeText: string;
}

interface ScanStep {
  label: string;
  status: "pending" | "running" | "done" | "error";
}

export default function ConsistencyChecker({ resumeText }: ConsistencyCheckerProps) {
  const [linkedinText, setLinkedinText] = useState("");
  const [githubUsername, setGithubUsername] = useState("");
  const [portfolioText, setPortfolioText] = useState("");

  const [loading, setLoading] = useState(false);
  const [steps, setSteps] = useState<ScanStep[]>([]);
  const [result, setResult] = useState<ConsistencyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleRunAudit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const activeSteps: ScanStep[] = [
      { label: "Validating inputs", status: "running" },
      { label: "Fetching GitHub profile data", status: "pending" },
      { label: "Auditing timelines and job periods", status: "pending" },
      { label: "Comparing job titles and seniority", status: "pending" },
      { label: "Evaluating skills against public code repositories", status: "pending" }
    ];
    setSteps([...activeSteps]);

    try {
      if (!resumeText.trim()) {
        throw new Error("No resume text found. Please upload or create a resume in the Optimizer first.");
      }

      // Step 1: Validating inputs done
      activeSteps[0].status = "done";
      activeSteps[1].status = "running";
      setSteps([...activeSteps]);

      // Step 2: Fetch GitHub details if username is present
      let githubText = "";
      if (githubUsername.trim()) {
        try {
          const userRes = await fetch(`https://api.github.com/users/${githubUsername.trim()}`);
          let userBio = "";
          if (userRes.ok) {
            const userData = await userRes.json();
            userBio = userData.bio || "";
          }

          const reposRes = await fetch(
            `https://api.github.com/users/${githubUsername.trim()}/repos?per_page=60&sort=updated`
          );
          if (reposRes.ok) {
            const repos = await reposRes.json();
            const reposSummary = repos
              .map(
                (r: any) =>
                  `- ${r.name}: ${r.language || "Unknown"}, ${r.stargazers_count} stars, Desc: ${r.description || ""}`
              )
              .join("\n");
            
            githubText = `GitHub Profile Bio: ${userBio}\nPublic Repos:\n${reposSummary}`;
          }
          activeSteps[1].status = "done";
        } catch (gitErr) {
          console.error("Failed to fetch from GitHub API:", gitErr);
          githubText = `Error fetching GitHub info: ${githubUsername.trim()}`;
          activeSteps[1].status = "error";
        }
      } else {
        activeSteps[1].status = "done"; // skipped but marked done
      }

      // Start analyzing
      activeSteps[2].status = "running";
      activeSteps[3].status = "running";
      activeSteps[4].status = "running";
      setSteps([...activeSteps]);

      // Send to API
      const res = await fetch("/api/consistency", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          linkedinText,
          githubText,
          portfolioText
        })
      });

      if (!res.ok) {
        throw new Error("API failed to score consistency profile.");
      }

      const auditData = await res.json();
      setResult(auditData);

      activeSteps[2].status = "done";
      activeSteps[3].status = "done";
      activeSteps[4].status = "done";
      setSteps([...activeSteps]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during the consistency audit.");
      // Set remaining steps to error
      setSteps(prev => prev.map(s => s.status === "running" || s.status === "pending" ? { ...s, status: "error" } : s));
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: "PASS" | "WARN" | "FAIL") => {
    if (status === "PASS") return "var(--herb)";
    if (status === "WARN") return "var(--butter)";
    return "var(--burnt)";
  };

  return (
    <div className="consistency-container">
      {/* 1. Header */}
      <div className="tracker-header">
        <h2 className="tracker-title">Cross-Platform Consistency Audit</h2>
        <p className="tracker-subtitle">
          Recruiters check your LinkedIn and GitHub in tandem with your resume. Scan all three platforms for conflicts.
        </p>
      </div>

      {/* 2. Grid split */}
      <div className="tracker-split-grid">
        {/* Left column: Paste Profile Text */}
        <div className="tracker-card">
          <h3 className="tracker-card-title">🔗 Paste Profile Information</h3>
          
          <form onSubmit={handleRunAudit} className="tracker-form">
            <div className="maker-field">
              <label className="jd-label">Pasted Resume Scope</label>
              <div 
                style={{
                  padding: "10px",
                  background: "rgba(255,255,255,0.02)",
                  border: "1px dashed rgba(255,255,255,0.1)",
                  borderRadius: "4px",
                  fontSize: "12px",
                  color: "var(--ash)"
                }}
              >
                {resumeText.trim() ? (
                  <span>
                    ✅ Connected: Active resume loaded ({resumeText.split(/\s+/).length} words).
                  </span>
                ) : (
                  <span style={{ color: "var(--burnt)" }}>
                    ⚠️ No resume loaded. Go to the Resume Optimizer and upload a PDF first.
                  </span>
                )}
              </div>
            </div>

            <div className="maker-field" style={{ marginTop: "10px" }}>
              <label className="jd-label">
                LinkedIn Profile Text 
                <span className="hint" style={{ float: "right", textTransform: "none" }}>
                  (Copy "About" + "Experience" sections)
                </span>
              </label>
              <textarea
                className="maker-input"
                style={{ height: "120px", fontFamily: "monospace", fontSize: "12px" }}
                placeholder="Paste raw text copied from your LinkedIn profile page or PDF printout..."
                value={linkedinText}
                onChange={(e) => setLinkedinText(e.target.value)}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1.1fr", gap: "12px", marginTop: "10px" }}>
              <div className="maker-field">
                <label className="jd-label">GitHub Username</label>
                <input
                  type="text"
                  placeholder="e.g. Robin1-23"
                  className="maker-input"
                  value={githubUsername}
                  onChange={(e) => setGithubUsername(e.target.value)}
                />
              </div>

              <div className="maker-field">
                <label className="jd-label">Portfolio Site Content</label>
                <input
                  type="text"
                  placeholder="e.g. Pasted bio / project listings"
                  className="maker-input"
                  value={portfolioText}
                  onChange={(e) => setPortfolioText(e.target.value)}
                />
              </div>
            </div>

            <button 
              type="submit" 
              className="optimizer-btn" 
              style={{ width: "100%", marginTop: "16px" }}
              disabled={loading || !resumeText.trim()}
            >
              {loading ? "Analyzing Alignment..." : "Run Cross-Platform Audit"}
            </button>
          </form>
        </div>

        {/* Right column: Audit Status Output */}
        <div className="tracker-card" style={{ display: "flex", flexDirection: "column", justifyContent: "flex-start" }}>
          <h3 className="tracker-card-title">🔍 Alignment Audit Results</h3>

          {error && <div className="error-msg" style={{ marginTop: 0 }}>{error}</div>}

          {!loading && !result && !error && (
            <div style={{ display: "flex", flex: 1, flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "220px", color: "var(--ash)", textAlign: "center" }}>
              <div style={{ fontSize: "40px", marginBottom: "12px" }}>🔍</div>
              <p style={{ maxWidth: "320px", fontSize: "13px" }}>
                Fill in your social handles or profiles and click <strong>"Run Cross-Platform Audit"</strong> to check for discrepancies.
              </p>
            </div>
          )}

          {loading && (
            <div className="scan-progress-box">
              <div style={{ fontWeight: "bold", fontSize: "14px", color: "var(--paper)", marginBottom: "16px" }}>
                Analyzing Profile Consistency...
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {steps.map((step, idx) => (
                  <div key={idx} className="scan-step">
                    <span className={`step-dot status-${step.status}`} />
                    <span 
                      style={{ 
                        color: step.status === "running" 
                          ? "var(--paper)" 
                          : step.status === "done" 
                            ? "var(--ash)" 
                            : "var(--char-dim)" 
                      }}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {result && !loading && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Circular Gauge / Percentage Indicator */}
              <div className="consistency-score-block" style={{ display: "flex", alignItems: "center", gap: "20px", background: "rgba(0,0,0,0.15)", padding: "16px", borderRadius: "6px" }}>
                <div 
                  className="score-circle" 
                  style={{
                    width: "80px",
                    height: "80px",
                    borderRadius: "50%",
                    border: `6px solid ${result.overallScore >= 85 ? "var(--herb)" : result.overallScore >= 60 ? "var(--butter)" : "var(--burnt)"}`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "24px",
                    fontFamily: "Oswald",
                    fontWeight: 700,
                    color: "var(--paper)"
                  }}
                >
                  {result.overallScore}%
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "16px", color: "var(--paper)" }}>Profile Consistency Score</h4>
                  <p className="hint" style={{ margin: "4px 0 0 0", lineHeight: "1.3" }}>
                    {result.overallScore >= 85 
                      ? "Perfect alignment! Recruiters checking your LinkedIn/GitHub won't flag conflicts."
                      : result.overallScore >= 60
                        ? "Moderate alignment. Minor timeline or title discrepancies detected."
                        : "High risk! Out-of-sync dates or unbacked skills could cause recruiter suspicion."
                    }
                  </p>
                </div>
              </div>

              {/* Checklist Breakdown */}
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {/* Timeline Category */}
                <div style={{ borderLeft: `3px solid ${getStatusColor(result.categories.timeline.status)}`, paddingLeft: "12px", margin: "4px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "var(--paper)", fontSize: "13px" }}>Timeline & Dates</strong>
                    <span 
                      style={{ 
                        fontSize: "10px", 
                        padding: "1px 6px", 
                        borderRadius: "3px", 
                        fontWeight: "bold",
                        background: result.categories.timeline.status === "PASS" ? "rgba(122,155,87,0.1)" : "rgba(196,52,31,0.1)",
                        color: getStatusColor(result.categories.timeline.status)
                      }}
                    >
                      {result.categories.timeline.status}
                    </span>
                  </div>
                  <ul style={{ margin: "6px 0 0 0", paddingLeft: "14px", fontSize: "12px", color: "var(--ash)" }}>
                    {result.categories.timeline.findings.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>

                {/* Titles Category */}
                <div style={{ borderLeft: `3px solid ${getStatusColor(result.categories.titles.status)}`, paddingLeft: "12px", margin: "4px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "var(--paper)", fontSize: "13px" }}>Job Roles & Titles</strong>
                    <span 
                      style={{ 
                        fontSize: "10px", 
                        padding: "1px 6px", 
                        borderRadius: "3px", 
                        fontWeight: "bold",
                        background: result.categories.titles.status === "PASS" ? "rgba(122,155,87,0.1)" : "rgba(196,52,31,0.1)",
                        color: getStatusColor(result.categories.titles.status)
                      }}
                    >
                      {result.categories.titles.status}
                    </span>
                  </div>
                  <ul style={{ margin: "6px 0 0 0", paddingLeft: "14px", fontSize: "12px", color: "var(--ash)" }}>
                    {result.categories.titles.findings.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>

                {/* Skills Category */}
                <div style={{ borderLeft: `3px solid ${getStatusColor(result.categories.skills.status)}`, paddingLeft: "12px", margin: "4px 0" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <strong style={{ color: "var(--paper)", fontSize: "13px" }}>Technical Claims & Verification</strong>
                    <span 
                      style={{ 
                        fontSize: "10px", 
                        padding: "1px 6px", 
                        borderRadius: "3px", 
                        fontWeight: "bold",
                        background: result.categories.skills.status === "PASS" ? "rgba(122,155,87,0.1)" : "rgba(196,52,31,0.1)",
                        color: getStatusColor(result.categories.skills.status)
                      }}
                    >
                      {result.categories.skills.status}
                    </span>
                  </div>
                  <ul style={{ margin: "6px 0 0 0", paddingLeft: "14px", fontSize: "12px", color: "var(--ash)" }}>
                    {result.categories.skills.findings.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                </div>
              </div>

              {/* Suggestions */}
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", padding: "16px", borderRadius: "6px" }}>
                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "var(--paper)" }}>🔧 Action Recommendations</h4>
                <ul style={{ margin: 0, paddingLeft: "14px", fontSize: "12px", color: "var(--paper-dim)", display: "flex", flexDirection: "column", gap: "6px" }}>
                  {result.suggestions.map((s, i) => <li key={i}>{s}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
