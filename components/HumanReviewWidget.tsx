"use client";

import React, { useState, useEffect } from "react";

interface HumanReviewWidgetProps {
  resumeText: string;
  atsScore: number;
}

interface ReviewerReport {
  reviewerName: string;
  reviewerRole: string;
  vibe: string;
  formatting: string;
  technical: string;
  closing: string;
}

const REPORTS_DB: Record<string, ReviewerReport> = {
  recruiter: {
    reviewerName: "Sarah Jenkins",
    reviewerRole: "Ex-Meta Technical Recruiter",
    vibe: "Honestly? Your experience reads like a list of tasks, not achievements. You say you 'assisted with Kubernetes' which basically tells me you watched someone else deploy it and didn't touch it yourself. Recruiters spend 6 seconds scanning. If we don't see impact metrics, you go directly into the rejection pile.",
    formatting: "Your margins are too tight—it looks like a wall of text. Let it breathe. Standardize your bullet point endings (some have periods, some don't). Grammatical inconsistency screams 'careless' to a recruiter.",
    technical: "You listed 'Python' and 'React' in skills, but you have no links to verify this. Add a LinkedIn profile or GitHub link that actually has these languages tagged on public repos. Right now, it looks like keyword stuffing.",
    closing: "Reword passive bullets. E.g. replace 'assisted team' with 'Coordinated deployment of 3 key features' and make sure you highlight metrics in the first 3 words of every bullet point."
  },
  techlead: {
    reviewerName: "Alex Mercer",
    reviewerRole: "Tech Lead @ Stripe",
    vibe: "The architecture of your bullet points is weak. You say you 'built a responsive website' but don't explain the stack choices or constraints. Tech leads check resumes for engineering maturity. Tell me *why* you chose React over Svelte, or what the scale constraints were.",
    formatting: "Clean and compact layout. But you're wasting page real estate on contact details. Group your header links into a single line to maximize experience space.",
    technical: "You claim systems design capabilities but don't explain how you handled state or caching. Did you use Redis? Postgres? Explain the database schema or the message broker. Don't just say 'created an API'.",
    closing: "Link your GitHub repository! Engineers want to see code. If we can't click to see your project repos, we assume the code is either spaghetti or non-existent."
  },
  founder: {
    reviewerName: "Dave Chen",
    reviewerRole: "Y-Combinator Founder & CEO",
    vibe: "This resume looks like it was written for a corporate mainframe job in 2012. It's way too slow. Startups move fast. I don't care that you 'aligned corporate stakeholders'. Did you ship code that made users happy? Show me traction.",
    formatting: "Classic layout is okay, but it lacks energy. Put your projects section above education. I care about what you've built recently, not what classes you took.",
    technical: "Too many generic frameworks listed. Highlight how you solved product-market-fit issues: e.g. 'Optimized signup flow, increasing conversions by 18%' or 'Built MVP in 3 weeks using Next.js'.",
    closing: "Move fast, trim the corporate fluff, and highlight product impact over process. I want builders, not managers."
  }
};

export default function HumanReviewWidget({ resumeText, atsScore }: HumanReviewWidgetProps) {
  const [status, setStatus] = useState<"idle" | "modal" | "submitting" | "queue" | "delivered">("idle");
  const [email, setEmail] = useState("");
  const [focus, setFocus] = useState<"recruiter" | "techlead" | "founder">("recruiter");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Queue state
  const [queueStep, setQueueStep] = useState(0); // 0: Broadcasted, 1: Claimed, 2: Reviewing, 3: Done
  const [queuePosition, setQueuePosition] = useState(2);
  const [timeElapsed, setTimeElapsed] = useState(0);

  // Load status from local storage on mount (so queue status survives refresh)
  useEffect(() => {
    const savedStatus = localStorage.getItem("resumeroaster_human_status");
    const savedTime = localStorage.getItem("resumeroaster_human_time");
    const savedFocus = localStorage.getItem("resumeroaster_human_focus");
    
    if (savedStatus === "queue" && savedTime) {
      const elapsed = Math.round((Date.now() - Number(savedTime)) / 1000);
      if (elapsed >= 45) {
        setStatus("delivered");
      } else {
        setStatus("queue");
        setTimeElapsed(elapsed);
        setFocus((savedFocus as any) || "recruiter");
        // Calculate step based on elapsed
        if (elapsed >= 30) {
          setQueueStep(2);
          setQueuePosition(0);
        } else if (elapsed >= 15) {
          setQueueStep(1);
          setQueuePosition(0);
        } else if (elapsed >= 8) {
          setQueueStep(0);
          setQueuePosition(1);
        } else {
          setQueueStep(0);
          setQueuePosition(2);
        }
      }
    } else if (savedStatus === "delivered") {
      setStatus("delivered");
      if (savedFocus) setFocus(savedFocus as any);
    }
  }, []);

  // Queue simulation loop
  useEffect(() => {
    if (status !== "queue") return;

    const timer = setInterval(() => {
      setTimeElapsed(prev => {
        const nextTime = prev + 1;
        
        // Progress Queue steps
        if (nextTime === 8) {
          setQueuePosition(1);
        } else if (nextTime === 15) {
          setQueueStep(1); // Claimed
          setQueuePosition(0);
        } else if (nextTime === 30) {
          setQueueStep(2); // Reviewing
        } else if (nextTime === 45) {
          setQueueStep(3); // Done
          setStatus("delivered");
          localStorage.setItem("resumeroaster_human_status", "delivered");
          clearInterval(timer);
        }
        
        return nextTime;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [status]);

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setStatus("submitting");

    try {
      // Trigger backend webhook API
      const res = await fetch("/api/human-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim(),
          focus,
          notes: notes.trim(),
          resumeText,
          atsScore
        })
      });

      if (!res.ok) {
        throw new Error("Failed to submit request.");
      }

      // Enter Queue State
      setStatus("queue");
      setQueueStep(0);
      setQueuePosition(2);
      setTimeElapsed(0);
      localStorage.setItem("resumeroaster_human_status", "queue");
      localStorage.setItem("resumeroaster_human_time", Date.now().toString());
      localStorage.setItem("resumeroaster_human_focus", focus);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Submission failed. Please try again.");
      setStatus("modal");
    }
  };

  const handleReset = () => {
    setStatus("idle");
    setEmail("");
    setNotes("");
    setError(null);
    localStorage.removeItem("resumeroaster_human_status");
    localStorage.removeItem("resumeroaster_human_time");
    localStorage.removeItem("resumeroaster_human_focus");
  };

  const report = REPORTS_DB[focus];

  return (
    <div className="diag-section" style={{ borderTop: "1px dashed rgba(255, 255, 255, 0.1)", paddingTop: "16px", marginTop: "16px" }}>
      {/* Idle / Call to Action */}
      {status === "idle" && (
        <div 
          className="human-cta-card"
          style={{
            background: "linear-gradient(135deg, rgba(255,90,31,0.06) 0%, rgba(244,185,66,0.03) 100%)",
            border: "1px solid rgba(255, 90, 31, 0.15)",
            borderRadius: "6px",
            padding: "16px",
            display: "flex",
            flexDirection: "column",
            gap: "10px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--butter)", fontFamily: "Oswald", textTransform: "uppercase", letterSpacing: "0.05em", fontWeight: 700 }}>
              👥 Human Vibe Check
            </span>
            <span style={{ fontSize: "10px", color: "var(--herb)", background: "rgba(122,155,87,0.1)", padding: "1px 6px", borderRadius: "3px", fontWeight: "bold" }}>
              Active Pool
            </span>
          </div>
          <h4 style={{ margin: 0, fontSize: "15px", color: "var(--paper)" }}>Get a Human Review in Minutes</h4>
          <p className="hint" style={{ margin: 0, lineHeight: "1.4" }}>
            AI scans keywords, but humans check formatting vibes and code quality. Get a brutal review from an ex-FAANG recruiter or startup founder.
          </p>
          <button 
            type="button" 
            className="optimizer-btn"
            style={{ width: "100%", height: "34px", padding: "0", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", background: "transparent", border: "1px solid var(--flame)", color: "var(--flame)" }}
            onClick={() => setStatus("modal")}
          >
            Submit for Human Roast ($5)
          </button>
        </div>
      )}

      {/* Modal Dialog Form */}
      {status === "modal" && (
        <div className="human-modal-overlay">
          <div className="human-modal">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ margin: 0, fontFamily: "Oswald", textTransform: "uppercase", fontSize: "18px", color: "var(--paper)" }}>
                Submit for Human Roast
              </h3>
              <button 
                type="button" 
                style={{ background: "transparent", border: "none", color: "var(--ash)", cursor: "pointer", fontSize: "18px" }}
                onClick={() => setStatus("idle")}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "rgba(122,155,87,0.08)", border: "1px solid rgba(122,155,87,0.2)", borderRadius: "4px", padding: "8px 12px", fontSize: "11px", color: "var(--herb)", marginBottom: "16px", fontFamily: "monospace" }}>
              💡 Demo Mode Enabled: Review submission is simulated for free. No credit card required.
            </div>

            {error && <div className="error-msg" style={{ marginBottom: "12px", marginTop: 0 }}>{error}</div>}

            <form onSubmit={handleSubmitRequest} className="tracker-form">
              <div className="maker-field">
                <label className="jd-label">Email Address (to receive full PDF report)</label>
                <input
                  type="email"
                  className="maker-input"
                  required
                  placeholder="e.g. dev@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="maker-field" style={{ marginTop: "10px" }}>
                <label className="jd-label">Reviewer Focus Persona</label>
                <select
                  className="maker-input"
                  value={focus}
                  onChange={(e) => setFocus(e.target.value as any)}
                >
                  <option value="recruiter">Ex-Meta Technical Recruiter (Vibe, Format, Metrics)</option>
                  <option value="techlead">Tech Lead @ Stripe (Code Quality, stack choice, schemas)</option>
                  <option value="founder">Y-Combinator Founder (Speed, impact, product builder)</option>
                </select>
              </div>

              <div className="maker-field" style={{ marginTop: "10px" }}>
                <label className="jd-label">Notes or questions for the Roaster</label>
                <textarea
                  className="maker-input"
                  style={{ height: "60px", fontSize: "12px" }}
                  placeholder="e.g. 'I want to target backend Go roles', 'Is my project too simple?'"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="optimizer-btn"
                style={{ width: "100%", marginTop: "16px" }}
              >
                Enter Reviewer Queue
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Submitting Loading State */}
      {status === "submitting" && (
        <div style={{ textAlign: "center", padding: "20px", background: "var(--char-2)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "6px" }}>
          <div className="spinner" style={{ margin: "0 auto 12px auto" }} />
          <div style={{ color: "var(--paper)", fontSize: "13px", fontFamily: "monospace" }}>
            Broadcasting profile data to active reviewer pool...
          </div>
        </div>
      )}

      {/* Active Queue Tracker */}
      {status === "queue" && (
        <div 
          className="queue-box"
          style={{
            background: "var(--char-2)",
            border: "1px solid rgba(255, 90, 31, 0.2)",
            borderRadius: "6px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--flame)", fontFamily: "Oswald", textTransform: "uppercase", fontWeight: 700 }}>
              ⏱️ Active Review Queue
            </span>
            <span style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--paper)" }}>
              Ticket: RR-{1000 + timeElapsed}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", background: "rgba(0,0,0,0.15)", padding: "10px 14px", borderRadius: "4px" }}>
            <div style={{ textAlign: "center", borderRight: "1px dashed rgba(255,255,255,0.1)" }}>
              <div style={{ fontSize: "20px", fontWeight: "bold", fontFamily: "monospace", color: "var(--paper)" }}>
                {queuePosition > 0 ? `#${queuePosition}` : "Claimed"}
              </div>
              <div style={{ fontSize: "9px", color: "var(--ash)", textTransform: "uppercase" }}>Queue Position</div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: "20px", fontWeight: "bold", fontFamily: "monospace", color: "var(--butter)" }}>
                {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, "0")}
              </div>
              <div style={{ fontSize: "9px", color: "var(--ash)", textTransform: "uppercase" }}>Time Elapsed</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", paddingLeft: "4px" }}>
            <div className="scan-step" style={{ fontSize: "12px" }}>
              <span className={`step-dot status-done`} />
              <span style={{ color: "var(--ash)" }}>Ticket Broadcasted to Reviewers</span>
            </div>
            <div className="scan-step" style={{ fontSize: "12px" }}>
              <span className={`step-dot status-${queueStep >= 1 ? "done" : "running"}`} />
              <span style={{ color: queueStep >= 1 ? "var(--ash)" : "var(--paper)" }}>
                {queueStep >= 1 ? "Claimed by Reviewer @Alex" : "Waiting for Claim (Estimating: 15s)"}
              </span>
            </div>
            <div className="scan-step" style={{ fontSize: "12px" }}>
              <span className={`step-dot status-${queueStep === 2 ? "running" : queueStep > 2 ? "done" : "pending"}`} />
              <span style={{ color: queueStep === 2 ? "var(--paper)" : queueStep > 2 ? "var(--ash)" : "var(--char-dim)" }}>
                Reviewer analyzing resume formatting & claims
              </span>
            </div>
            <div className="scan-step" style={{ fontSize: "12px" }}>
              <span className={`step-dot status-${queueStep === 3 ? "done" : "pending"}`} />
              <span style={{ color: queueStep === 3 ? "var(--paper)" : "var(--char-dim)" }}>
                Critique finalized and delivered
              </span>
            </div>
          </div>

          <div style={{ fontSize: "10px", color: "var(--ash)", textAlign: "center", fontStyle: "italic", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "10px" }}>
            Estimated review duration: 45 seconds in Demo Mode.
          </div>
        </div>
      )}

      {/* Delivered Critique Report */}
      {status === "delivered" && report && (
        <div 
          className="report-box"
          style={{
            background: "var(--char-2)",
            border: "1px solid rgba(122, 155, 87, 0.2)",
            borderRadius: "6px",
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "11px", color: "var(--herb)", fontFamily: "Oswald", textTransform: "uppercase", fontWeight: 700 }}>
              📝 Human Roast Delivered
            </span>
            <button 
              type="button"
              style={{ background: "transparent", border: "none", color: "var(--ash)", fontSize: "11px", cursor: "pointer", textDecoration: "underline" }}
              onClick={handleReset}
            >
              Order New Review
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
            <div 
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "50%",
                background: "var(--flame)",
                color: "var(--char)",
                fontSize: "18px",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Oswald"
              }}
            >
              {report.reviewerName.split(" ").map(n => n[0]).join("")}
            </div>
            <div>
              <div style={{ fontWeight: "bold", color: "var(--paper)", fontSize: "14px" }}>{report.reviewerName}</div>
              <div style={{ fontSize: "11px", color: "var(--ash)" }}>{report.reviewerRole}</div>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "12.5px", lineHeight: "1.45" }}>
            <div>
              <strong style={{ color: "var(--flame)", textTransform: "uppercase", fontSize: "9.5px", fontFamily: "Oswald", letterSpacing: "0.02em", display: "block", marginBottom: "3px" }}>
                Vibe & Impact Audit
              </strong>
              <p style={{ margin: 0, color: "var(--paper-dim)" }}>{report.vibe}</p>
            </div>

            <div>
              <strong style={{ color: "var(--flame)", textTransform: "uppercase", fontSize: "9.5px", fontFamily: "Oswald", letterSpacing: "0.02em", display: "block", marginBottom: "3px" }}>
                Formatting & Hierarchy
              </strong>
              <p style={{ margin: 0, color: "var(--paper-dim)" }}>{report.formatting}</p>
            </div>

            <div>
              <strong style={{ color: "var(--flame)", textTransform: "uppercase", fontSize: "9.5px", fontFamily: "Oswald", letterSpacing: "0.02em", display: "block", marginBottom: "3px" }}>
                Technical claims verify
              </strong>
              <p style={{ margin: 0, color: "var(--paper-dim)" }}>{report.technical}</p>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)", padding: "10px", borderRadius: "4px", fontSize: "12px", fontStyle: "italic", color: "var(--paper)" }}>
              🚩 <strong>Roaster Action Item:</strong> {report.closing}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
