"use client";

import React, { useState, useEffect, useRef } from "react";
import type { ResumeData } from "@/lib/resume-types";
import { detectHonestyGaps } from "@/lib/honesty-checker";

interface GrillMeSessionProps {
  resumeText: string;
  resumeData: ResumeData | null;
}

interface QuestionItem {
  id: number;
  question: string;
  targetClaim: string;
  source: "metric" | "honesty-gap" | "weak-starter" | "general";
}

interface EvaluationResult {
  score: number;
  verdict: "Approved" | "Borderline" | "Cooked";
  feedback: string;
}

export default function GrillMeSession({ resumeText, resumeData }: GrillMeSessionProps) {
  const [questions, setQuestions] = useState<QuestionItem[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  
  // Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  // Submission & Eval States
  const [loading, setLoading] = useState(false);
  const [evalResult, setEvalResult] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<Array<{ q: QuestionItem; answer: string; result: EvaluationResult }>>([]);

  // Compile Grilling Questions based on resume
  useEffect(() => {
    const list: QuestionItem[] = [];
    let idCounter = 1;

    if (resumeData) {
      // 1. Honesty Gaps check
      const honestyGaps = detectHonestyGaps(resumeData);
      if (honestyGaps.length > 0) {
        honestyGaps.slice(0, 2).forEach(gap => {
          list.push({
            id: idCounter++,
            question: `You listed "${gap.skill}" in your skills section but there is absolutely zero mention of it in your experience bullets or projects. Walk me through a concrete project where you used this technology and how you handled its core architecture.`,
            targetClaim: `Listed Skill: ${gap.skill}`,
            source: "honesty-gap"
          });
        });
      }

      // 2. Metric claims check
      const metricRegex = /(\d+%|\$\d+|\b\d+\s+(hours|users|pages|days|months|years|percent|percentile)\b)/i;
      let metricCount = 0;
      resumeData.experience.forEach(exp => {
        exp.bullets.forEach(b => {
          if (metricRegex.test(b) && metricCount < 2) {
            const match = b.match(metricRegex)?.[0] || "";
            list.push({
              id: idCounter++,
              question: `You claimed: "${b}". An experienced interviewer will immediately check if this is made up. Explain the exact baseline before you started, what benchmarking/profiling tools you used, and how you calculated this ${match} improvement.`,
              targetClaim: b,
              source: "metric"
            });
            metricCount++;
          }
        });
      });

      // 3. Weak starters check
      const weakStarterRegex = /^(worked on|helped with|responsible for|assisted in|participated in|handled)\s+/i;
      let weakCount = 0;
      resumeData.experience.forEach(exp => {
        exp.bullets.forEach(b => {
          if (weakStarterRegex.test(b) && weakCount < 1) {
            list.push({
              id: idCounter++,
              question: `You wrote: "${b}". Words like "helped" or "assisted" make you sound like a passive bystander. What was your specific, single-handed contribution to this codebase, and how did you verify it compiled without issues?`,
              targetClaim: b,
              source: "weak-starter"
            });
            weakCount++;
          }
        });
      });
    }

    // Default questions if resume details are missing or too few
    if (list.length < 3) {
      list.push({
        id: idCounter++,
        question: "Walk me through the scaling limit of the most complex application you have built. If you received 10x the concurrent traffic today, what component bottleneck would crash first, and how would you redesign it?",
        targetClaim: "General Engineering Capability",
        source: "general"
      });
      list.push({
        id: idCounter++,
        question: "Describe a major technical disagreement you had with another engineer on design patterns or database choices. What state or database constraints did you argue about, and how did you resolve it?",
        targetClaim: "Collaborative Engineering Trade-offs",
        source: "general"
      });
    }

    setQuestions(list);
    setCurrentIdx(0);
    setAnswer("");
    setEvalResult(null);
    setHistory([]);
  }, [resumeData, resumeText]);

  // Setup Web Speech API for recording
  useEffect(() => {
    if (typeof window !== "undefined") {
      const Speech = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (Speech) {
        const rec = new Speech();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "en-US";

        rec.onresult = (event: any) => {
          let transcript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript;
          }
          setAnswer(transcript);
        };

        rec.onerror = (e: any) => {
          console.error("Speech recognition error:", e);
          setIsRecording(false);
        };

        rec.onend = () => {
          setIsRecording(false);
        };

        setRecognition(rec);
      }
    }
  }, []);

  const toggleRecording = () => {
    if (!recognition) {
      alert("Web Speech API voice transcription is not supported in this browser. Please type your defense below.");
      return;
    }

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setAnswer("");
      setIsRecording(true);
      recognition.start();
    }
  };

  const handleSubmitDefense = async () => {
    if (!answer.trim()) return;

    setLoading(true);
    setEvalResult(null);

    const questionObj = questions[currentIdx];

    try {
      const res = await fetch("/api/evaluate-defense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: questionObj.question,
          defense: answer.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to assess response.");
      }

      const result: EvaluationResult = data;
      setEvalResult(result);
      setHistory(prev => [...prev, { q: questionObj, answer: answer.trim(), result }]);
    } catch (err) {
      console.error(err);
      alert("Evaluation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleNextQuestion = () => {
    setAnswer("");
    setEvalResult(null);
    setCurrentIdx(prev => prev + 1);
  };

  const activeQuestion = questions[currentIdx];
  const isFinished = currentIdx >= questions.length;
  const averageScore = history.length > 0
    ? Math.round(history.reduce((sum, h) => sum + h.result.score, 0) / history.length)
    : 0;

  return (
    <div className="grill-container" style={{ padding: "20px", maxWidth: "800px", margin: "0 auto" }}>
      {/* Intro Header */}
      <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "16px", marginBottom: "20px" }}>
        <h2 style={{ fontFamily: "Oswald", textTransform: "uppercase", fontSize: "24px", color: "var(--paper)", display: "flex", alignItems: "center", gap: "10px" }}>
          🔥 Grilling Practice Console
        </h2>
        <p className="hint" style={{ margin: "6px 0 0 0", lineHeight: "1.4" }}>
          This console compiles target interview questions based specifically on your resume's weaknesses (unsupported skills, metric claims, passive starters). Speak or type your defense to see if you can hold up in a technical screen.
        </p>
      </div>

      {!isFinished && activeQuestion && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {/* Progress header */}
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "var(--ash)", fontFamily: "monospace" }}>
            <span>Question {currentIdx + 1} of {questions.length}</span>
            <span style={{ color: "var(--flame)" }}>Focus: {activeQuestion.source.toUpperCase()}</span>
          </div>

          {/* Question Display Card */}
          <div style={{ background: "rgba(196, 52, 31, 0.04)", border: "1px solid rgba(196, 52, 31, 0.15)", borderRadius: "6px", padding: "20px" }}>
            <div style={{ fontSize: "10px", color: "var(--burnt)", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "6px" }}>
              Target claim: "{activeQuestion.targetClaim}"
            </div>
            <h3 style={{ margin: 0, fontSize: "16px", color: "var(--paper)", lineHeight: "1.45" }}>
              "{activeQuestion.question}"
            </h3>
          </div>

          {/* Answer Input Console */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--ash)" }}>Your Defense:</span>
              <button
                type="button"
                className={`mic-btn ${isRecording ? "active" : ""}`}
                style={{
                  background: isRecording ? "var(--burnt)" : "rgba(255,255,255,0.05)",
                  color: isRecording ? "var(--paper)" : "var(--flame)",
                  border: isRecording ? "1px solid var(--burnt)" : "1px solid rgba(255, 90, 31, 0.2)",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow: isRecording ? "0 0 12px var(--burnt)" : "none"
                }}
                onClick={toggleRecording}
              >
                {isRecording ? (
                  <>
                    <span className="recording-indicator" />
                    🎙️ Stop Recording
                  </>
                ) : (
                  "🎙️ Answer Out Loud"
                )}
              </button>
            </div>

            <textarea
              className="maker-textarea"
              style={{ minHeight: "120px", fontSize: "13.5px", lineHeight: "1.45" }}
              placeholder={isRecording ? "Listening to your spoken answer... (mic is live)" : "Type your technical defense here, or click the mic button to speak your answer."}
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
            />

            {!evalResult && (
              <button
                type="button"
                className="optimizer-btn"
                style={{ width: "100%", height: "42px", fontSize: "14px" }}
                disabled={loading || !answer.trim()}
                onClick={handleSubmitDefense}
              >
                {loading ? "Interviewer Evaluating..." : "Submit Answer to Roaster"}
              </button>
            )}
          </div>

          {/* Grilling Assessment Card */}
          {evalResult && (
            <div 
              className="eval-card"
              style={{
                background: "var(--char-2)",
                border: `1.5px solid ${evalResult.verdict === "Approved" ? "var(--herb)" : evalResult.verdict === "Borderline" ? "var(--butter)" : "var(--burnt)"}`,
                borderRadius: "6px",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                animation: "fadeIn 0.25s ease-out"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "12px", fontFamily: "Oswald", textTransform: "uppercase", color: "var(--ash)" }}>
                  Interviewer Assessment
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ fontSize: "20px", fontWeight: "bold", fontFamily: "monospace", color: evalResult.verdict === "Approved" ? "var(--herb)" : evalResult.verdict === "Borderline" ? "var(--butter)" : "var(--burnt)" }}>
                    {evalResult.score}%
                  </span>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    padding: "2px 8px",
                    borderRadius: "3px",
                    background: evalResult.verdict === "Approved" ? "rgba(122,155,87,0.15)" : evalResult.verdict === "Borderline" ? "rgba(244,185,66,0.15)" : "rgba(196,52,31,0.15)",
                    color: evalResult.verdict === "Approved" ? "var(--herb)" : evalResult.verdict === "Borderline" ? "var(--butter)" : "var(--burnt)"
                  }}>
                    {evalResult.verdict}
                  </span>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: "13px", lineHeight: "1.45", color: "var(--paper-dim)" }}>
                {evalResult.feedback}
              </p>

              <button
                type="button"
                className="optimizer-btn"
                style={{ width: "100%", height: "36px", marginTop: "10px", background: "transparent", border: "1px solid var(--flame)", color: "var(--flame)" }}
                onClick={handleNextQuestion}
              >
                {currentIdx + 1 < questions.length ? "Proceed to Next Question" : "View Final Session Report"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Final Summary Screen */}
      {isFinished && (
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", background: "var(--char-2)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "8px", padding: "24px", textAlign: "center" }}>
          <div style={{ fontSize: "40px" }}>🏆</div>
          <h3 style={{ margin: 0, fontFamily: "Oswald", textTransform: "uppercase", fontSize: "22px", color: "var(--paper)" }}>
            Grilling Session Complete!
          </h3>

          <div style={{ width: "120px", height: "120px", borderRadius: "50%", border: `4px solid ${averageScore >= 80 ? "var(--herb)" : averageScore >= 55 ? "var(--butter)" : "var(--burnt)"}`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", margin: "10px auto" }}>
            <span style={{ fontSize: "28px", fontWeight: "bold", fontFamily: "monospace", color: averageScore >= 80 ? "var(--herb)" : averageScore >= 55 ? "var(--butter)" : "var(--burnt)" }}>
              {averageScore}%
            </span>
            <span style={{ fontSize: "9px", color: "var(--ash)", textTransform: "uppercase" }}>Average Score</span>
          </div>

          <p style={{ margin: 0, fontSize: "14px", lineHeight: "1.45", color: "var(--paper-dim)" }}>
            {averageScore >= 80 
              ? "Incredible job! You defended your resume claims with solid technical details. Hiring managers will have a tough time finding holes." 
              : averageScore >= 55 
              ? "Decent defense, but you left some openings. Try to frame your answers with more caching, CDNs, profiling databases, or exact architectures." 
              : "You got cooked. Several of your defenses were vague or ducked the question. Reword thin bullets or practice detailing your exact stack contributions."}
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", textAlign: "left", marginTop: "16px", borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: "16px" }}>
            <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", textTransform: "uppercase", color: "var(--ash)", fontFamily: "monospace" }}>Session Grilling Log:</h4>
            {history.map((h, i) => (
              <div key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "10px", marginBottom: "6px" }}>
                <div style={{ fontSize: "12.5px", fontWeight: "bold", color: "var(--paper)" }}>Q: {h.q.question}</div>
                <div style={{ fontSize: "12px", color: "var(--ash)", fontStyle: "italic", marginTop: "4px" }}>Your Answer: "{h.answer}"</div>
                <div style={{ fontSize: "11.5px", color: h.result.verdict === "Approved" ? "var(--herb)" : h.result.verdict === "Borderline" ? "var(--butter)" : "var(--burnt)", marginTop: "4px", fontWeight: "bold" }}>
                  Result: {h.result.verdict} ({h.result.score}%) — {h.result.feedback}
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            className="optimizer-btn"
            style={{ width: "100%", marginTop: "14px" }}
            onClick={() => {
              setCurrentIdx(0);
              setAnswer("");
              setEvalResult(null);
              setHistory([]);
            }}
          >
            Restart Grilling Prep Session
          </button>
        </div>
      )}
    </div>
  );
}
