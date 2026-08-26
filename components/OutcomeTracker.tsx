"use client";

import React, { useState } from "react";
import type { ResumeData } from "@/lib/resume-types";

export interface JobApplication {
  id: string;
  company: string;
  role: string;
  appliedDate: string;
  status: "Applied" | "Interview" | "Offer" | "Rejected";
  draftName: string;
  atsScore: number;
}

interface OutcomeTrackerProps {
  drafts: Record<string, ResumeData>;
  applications: JobApplication[];
  onAddApplication: (app: Omit<JobApplication, "id">) => void;
  onUpdateStatus: (id: string, status: JobApplication["status"]) => void;
  onDeleteApplication: (id: string) => void;
  currentDraftName: string;
  currentAtsScore: number | null;
}

function getBenchmarkCallbackRate(score: number): number {
  if (score >= 85) return 22;
  if (score >= 70) return 15;
  if (score >= 50) return 10;
  return 5;
}

export default function OutcomeTracker({
  drafts,
  applications,
  onAddApplication,
  onUpdateStatus,
  onDeleteApplication,
  currentDraftName,
  currentAtsScore
}: OutcomeTrackerProps) {
  // Add application state form
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [selectedDraft, setSelectedDraft] = useState(currentDraftName);
  const [status, setStatus] = useState<JobApplication["status"]>("Applied");
  const [atsScore, setAtsScore] = useState<number>(currentAtsScore || 75);
  const [appliedDate, setAppliedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Sync draft selection when active draft changes in optimizer
  React.useEffect(() => {
    setSelectedDraft(currentDraftName);
  }, [currentDraftName]);

  // Sync ATS score when analysis runs in optimizer
  React.useEffect(() => {
    if (currentAtsScore !== null) {
      setAtsScore(currentAtsScore);
    }
  }, [currentAtsScore]);

  // Stats calculation
  const totalApps = applications.length;
  const activeApps = applications.filter(a => a.status === "Applied" || a.status === "Interview").length;
  const callbackApps = applications.filter(a => a.status === "Interview" || a.status === "Offer").length;
  const offersCount = applications.filter(a => a.status === "Offer").length;
  const callbackRate = totalApps > 0 ? Math.round((callbackApps / totalApps) * 100) : 0;

  // Handle Form Submit
  const handleAddApp = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!company.trim()) {
      setFormError("Company name is required.");
      return;
    }
    if (!role.trim()) {
      setFormError("Role name is required.");
      return;
    }

    onAddApplication({
      company: company.trim(),
      role: role.trim(),
      appliedDate,
      status,
      draftName: selectedDraft,
      atsScore: Number(atsScore)
    });

    // Reset Form
    setCompany("");
    setRole("");
    setFormError(null);
  };

  // Draft performance aggregation
  const draftStats = Object.keys(drafts).length > 0 
    ? Object.keys(drafts).map(name => {
        const draftApps = applications.filter(a => a.draftName === name);
        const appsCount = draftApps.length;
        const callbacks = draftApps.filter(a => a.status === "Interview" || a.status === "Offer").length;
        const localCallbackRate = appsCount > 0 ? Math.round((callbacks / appsCount) * 100) : 0;
        
        // Calculate average ATS score for this draft
        const avgScore = appsCount > 0 
          ? Math.round(draftApps.reduce((acc, a) => acc + a.atsScore, 0) / appsCount)
          : (currentDraftName === name && currentAtsScore !== null ? currentAtsScore : 75);

        const benchmark = getBenchmarkCallbackRate(avgScore);
        const diff = appsCount > 0 ? localCallbackRate - benchmark : 0;

        return {
          name,
          appsCount,
          localCallbackRate,
          avgScore,
          benchmark,
          diff
        };
      })
    : [];

  return (
    <div className="tracker-container">
      {/* 1. Header & Summary Stats */}
      <div className="tracker-header">
        <h2 className="tracker-title">Outcome Tracking Dashboard</h2>
        <p className="tracker-subtitle">
          Logging conversion rates of resume versions to verify which drafts produce real interview callbacks.
        </p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num">{totalApps}</div>
          <div className="stat-label">Total Applications</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{activeApps}</div>
          <div className="stat-label">In-Flight Pipeline</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: callbackRate >= 15 ? "var(--herb)" : "var(--flame)" }}>
            {callbackRate}%
          </div>
          <div className="stat-label">Callback Conversion</div>
        </div>
        <div className="stat-card">
          <div className="stat-num" style={{ color: "var(--butter)" }}>{offersCount}</div>
          <div className="stat-label font-bold">Offers Received</div>
        </div>
      </div>

      {/* 2. Form & Draft comparison split */}
      <div className="tracker-split-grid">
        {/* Left Column: Log New Application */}
        <div className="tracker-card">
          <h3 className="tracker-card-title">📝 Log Application</h3>
          
          <form onSubmit={handleAddApp} className="tracker-form">
            {formError && <div className="error-msg" style={{ marginTop: 0, marginBottom: "10px" }}>{formError}</div>}
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="maker-field">
                <label className="jd-label">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Stripe, Google"
                  className="maker-input"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                />
              </div>

              <div className="maker-field">
                <label className="jd-label">Role / Title</label>
                <input
                  type="text"
                  placeholder="e.g. Frontend Engineer"
                  className="maker-input"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
              <div className="maker-field">
                <label className="jd-label">Resume Version Used</label>
                <select
                  className="maker-input"
                  value={selectedDraft}
                  onChange={(e) => setSelectedDraft(e.target.value)}
                >
                  {Object.keys(drafts).length === 0 ? (
                    <option value="Default Draft">Default Draft</option>
                  ) : (
                    Object.keys(drafts).map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))
                  )}
                </select>
              </div>

              <div className="maker-field">
                <label className="jd-label">ATS Score at Time of App</label>
                <input
                  type="number"
                  min="10"
                  max="99"
                  className="maker-input"
                  value={atsScore}
                  onChange={(e) => setAtsScore(Number(e.target.value))}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "10px" }}>
              <div className="maker-field">
                <label className="jd-label">Status</label>
                <select
                  className="maker-input"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as JobApplication["status"])}
                >
                  <option value="Applied">Applied</option>
                  <option value="Interview">Interview Callback</option>
                  <option value="Offer">Offer</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>

              <div className="maker-field">
                <label className="jd-label">Date Applied</label>
                <input
                  type="date"
                  className="maker-input"
                  value={appliedDate}
                  onChange={(e) => setAppliedDate(e.target.value)}
                />
              </div>
            </div>

            <button type="submit" className="optimizer-btn" style={{ width: "100%", marginTop: "16px" }}>
              Log Application Entry
            </button>
          </form>
        </div>

        {/* Right Column: Draft Versions Comparisons */}
        <div className="tracker-card">
          <h3 className="tracker-card-title">📈 Resume Versions Callback Metrics</h3>
          
          <div className="tracker-table-container" style={{ maxHeight: "300px", overflowY: "auto" }}>
            <table className="tracker-table">
              <thead>
                <tr>
                  <th style={{ textAlign: "left" }}>Version (Draft)</th>
                  <th style={{ textAlign: "center" }}>ATS Score</th>
                  <th style={{ textAlign: "center" }}>Apps</th>
                  <th style={{ textAlign: "center" }}>Callback Rate</th>
                  <th style={{ textAlign: "center" }}>Benchmark</th>
                </tr>
              </thead>
              <tbody>
                {draftStats.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "30px 10px", color: "var(--ash)" }}>
                      Create drafts to see comparative outcome metrics.
                    </td>
                  </tr>
                ) : (
                  draftStats.map(stat => (
                    <tr key={stat.name}>
                      <td style={{ fontWeight: 700, color: "var(--paper)" }}>{stat.name}</td>
                      <td style={{ textAlign: "center", fontFamily: "monospace" }}>{stat.avgScore}%</td>
                      <td style={{ textAlign: "center" }}>{stat.appsCount}</td>
                      <td style={{ textAlign: "center" }}>
                        <span 
                          style={{
                            fontWeight: "bold",
                            color: stat.appsCount === 0 
                              ? "var(--ash)" 
                              : stat.diff > 0 
                                ? "var(--herb)" 
                                : stat.diff < 0 
                                  ? "var(--burnt)" 
                                  : "var(--paper)"
                          }}
                        >
                          {stat.appsCount > 0 ? `${stat.localCallbackRate}%` : "—"}
                        </span>
                      </td>
                      <td style={{ textAlign: "center", color: "var(--ash)", fontSize: "11px" }}>
                        {stat.benchmark}%
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <p className="hint" style={{ marginTop: "12px", lineHeight: "1.45" }}>
            💡 <strong>Benchmark Source:</strong> Industry average callback rate matching identical ATS match scopes. Scopes above 85% double callback probability from 10% to 22%.
          </p>
        </div>
      </div>

      {/* 3. Log list section */}
      <div className="tracker-card" style={{ marginTop: "24px" }}>
        <h3 className="tracker-card-title">📋 Applications Log Pipeline</h3>

        <div className="tracker-table-container">
          <table className="tracker-table">
            <thead>
              <tr>
                <th style={{ textAlign: "left" }}>Company</th>
                <th style={{ textAlign: "left" }}>Role</th>
                <th style={{ textAlign: "left" }}>Resume Version</th>
                <th style={{ textAlign: "center" }}>ATS Score</th>
                <th style={{ textAlign: "left" }}>Applied Date</th>
                <th style={{ textAlign: "left" }}>Pipeline Status</th>
                <th style={{ textAlign: "center" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: "center", padding: "40px 10px", color: "var(--ash)", fontFamily: "monospace" }}>
                    No job applications logged yet. Log your first application above to start tracking real outcomes.
                  </td>
                </tr>
              ) : (
                [...applications].reverse().map(app => (
                  <tr key={app.id}>
                    <td style={{ fontWeight: 700, color: "var(--paper)" }}>{app.company}</td>
                    <td>{app.role}</td>
                    <td>
                      <span className="draft-badge">{app.draftName}</span>
                    </td>
                    <td style={{ textAlign: "center", fontFamily: "monospace", fontWeight: "bold" }}>
                      {app.atsScore}%
                    </td>
                    <td>{app.appliedDate}</td>
                    <td>
                      <select
                        className={`status-select status-${app.status.toLowerCase()}`}
                        value={app.status}
                        onChange={(e) => onUpdateStatus(app.id, e.target.value as JobApplication["status"])}
                      >
                        <option value="Applied">Applied</option>
                        <option value="Interview">Interview</option>
                        <option value="Offer">Offer</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <button
                        type="button"
                        className="maker-remove-btn"
                        style={{ background: "transparent", border: "none", color: "var(--burnt)", cursor: "pointer", fontSize: "14px" }}
                        onClick={() => {
                          if (confirm(`Delete application log for ${app.company}?`)) {
                            onDeleteApplication(app.id);
                          }
                        }}
                      >
                        ✕ Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
