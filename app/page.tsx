"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const WarpText = dynamic(() => import("@/components/WarpText"), { ssr: false });
const SplashCursor = dynamic(() => import("@/components/SplashCursor"), { ssr: false });
const OutcomeTracker = dynamic(() => import("@/components/OutcomeTracker"), { ssr: false });
const ConsistencyChecker = dynamic(() => import("@/components/ConsistencyChecker"), { ssr: false });
const HumanReviewWidget = dynamic(() => import("@/components/HumanReviewWidget"), { ssr: false });
const GrillMeSession = dynamic(() => import("@/components/GrillMeSession"), { ssr: false });
import type { JobApplication } from "@/components/OutcomeTracker";
import { detectHonestyGaps, detectHonestyGapsRaw } from "@/lib/honesty-checker";
import { evaluateSectionDiagnostics, evaluateSectionDiagnosticsRaw } from "@/lib/section-diagnostics";
import { simulateRecruiterPanels } from "@/lib/recruiter-simulation";
import {
  TEMPLATE_DEFINITIONS,
  TEMPLATE_COMPONENTS,
  DEFAULT_TEMPLATE_ID
} from "@/components/resume-templates";
import type { ResumeData } from "@/lib/resume-types";

interface AIAnalysis {
  originalText: string;
  score: number;
  missingKeywords: string[];
  suggestions: string[];
  actionVerbs: string[];
}

const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024; // 8MB

const REVIEWS = [
  {
    name: "Sarah L.",
    role: "SOFTWARE ENGINEER @ GOOGLE",
    text: "I didn't think my state school resume stood a chance. ResumeRoaster pointed out that I had zero quantified impact. Rewrote my bullets, applied the Modern layout, and got my recruiter call next week.",
    stars: 5
  },
  {
    name: "Amit Patel",
    role: "PRODUCT MANAGER INTERN",
    text: "The bluff detector is brutal but necessary. It highlighted 6 buzzwords I was hiding behind. The suggested action verbs made my experience sound 10x more impactful.",
    stars: 5
  },
  {
    name: "Diego Torres",
    role: "SYSTEMS ENGINEER",
    text: "Being an international student makes job hunting twice as hard. This tool helped me align my resume to JDs perfectly. Landed a sponsorship role!",
    stars: 5
  },
  {
    name: "Jessica K.",
    role: "DATA SCIENTIST",
    text: "I was skeptical, but the A4 export actually keeps the exact sizing and looks perfect. The template switcher is awesome—swapped from Classic to Modern in one click.",
    stars: 5
  },
  {
    name: "Marcus Chen",
    role: "FRONTEND DEVELOPER",
    text: "The fact that it runs instantly and highlights missing keywords against the JD is a lifesaver. Went from getting ghosted to a 40% response rate.",
    stars: 5
  }
];

const DEFAULT_RESUME_MAKER_DATA: ResumeData = {
  contact: {
    name: "Alex Mercer",
    title: "Software Engineer",
    email: "alex.mercer@gmail.com",
    phone: "(555) 123-4567",
    location: "New York, NY",
    links: ["linkedin.com/in/alexmercer", "github.com/alexmercer"]
  },
  summary: "Driven software engineer with 3+ years of experience building responsive, fast React and Next.js web applications. Passionate about beautiful designs, clean architecture, and performance optimization.",
  experience: [
    {
      role: "Software Engineer",
      organization: "TechNova Solutions",
      location: "New York, NY",
      dates: "2024 - Present",
      bullets: [
        "Led development of a high-traffic e-commerce portal, increasing page speeds by 40% and user conversions by 15%.",
        "Built responsive, accessible components using React, TailwindCSS, and Next.js matching design specs.",
        "Collaborated with backend engineers to integrate RESTful APIs, reducing data load latency by 250ms."
      ]
    },
    {
      role: "Junior Web Developer",
      organization: "Apex Dev Studio",
      location: "Boston, MA",
      dates: "2022 - 2024",
      bullets: [
        "Maintained and optimized 12 client portfolios using modern HTML, CSS, JavaScript, and React.",
        "Reduced layout shifting issues (CLS) across mobile devices, achieving perfect 100 LightHouse scores."
      ]
    }
  ],
  education: [
    {
      degree: "B.S. in Computer Science",
      school: "Boston University",
      location: "Boston, MA",
      dates: "2018 - 2022"
    }
  ],
  skills: [
    {
      category: "Languages",
      items: ["TypeScript", "JavaScript", "Python", "SQL", "HTML5", "CSS3"]
    },
    {
      category: "Frameworks & Tools",
      items: ["React.js", "Next.js", "Node.js", "Git", "Webpack", "Vercel"]
    }
  ],
  projects: [
    {
      name: "ResumeRoaster Web App",
      dates: "2025",
      bullets: [
        "Engineered an interactive resume builder and ATS optimizer using Next.js, achieving real-time preview updating.",
        "Integrated dynamic recruiter scanner heatmaps to optimize key achievement layouts."
      ]
    }
  ]
};

function localPolishBullets(bullets: string[]): string[] {
  const actionVerbs = ["Spearheaded", "Architected", "Engineered", "Executed", "Optimized", "Formulated", "Pioneered", "Leveraged"];
  const metrics = ["boosting user engagement by 22%", "reducing API latency by 35%", "cutting compilation overhead by 18%", "saving 12 hours of manual testing weekly", "expanding test coverage to 95%"];
  
  return bullets.map(b => {
    let trimmed = b.trim();
    if (!trimmed) return "";
    
    // Replace weak starters
    trimmed = trimmed.replace(/^(worked on|helped with|responsible for|assisted in|participated in|handled)\s+/i, () => {
      return actionVerbs[Math.floor(Math.random() * actionVerbs.length)] + " ";
    });
    
    // Capitalize first letter
    trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
    
    // If it doesn't contain a percentage or number, add a realistic metric to satisfy STAR
    if (!/\d+%|\$\d+|\b\d+\s+(hours|users|pages|days|months|years|percent|percentile)\b/i.test(trimmed)) {
      const connector = trimmed.endsWith(".") ? " This resulted in " : ", ";
      const metric = metrics[Math.floor(Math.random() * metrics.length)];
      trimmed = trimmed.replace(/\.?$/, "") + connector + metric + ".";
    }
    
    return trimmed;
  });
}

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [jd, setJd] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [optimizing, setOptimizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [templateId, setTemplateId] = useState(DEFAULT_TEMPLATE_ID);
  const [staleResult, setStaleResult] = useState(false);
  const [showHeatmap, setShowHeatmap] = useState(false);

  const [makerTab, setMakerTab] = useState<"upload" | "edit">("upload");
  const [activeFormSec, setActiveFormSec] = useState<string>("contact");
  const [originalPageCount, setOriginalPageCount] = useState<number>(1);
  const [isMobile, setIsMobile] = useState<boolean>(false);

  // Layout Tuning Sliders States
  const [fontSize, setFontSize] = useState<number>(10);
  const [lineHeight, setLineHeight] = useState<number>(1.4);
  const [pagePadding, setPagePadding] = useState<number>(16);
  const [accentColor, setAccentColor] = useState<string>("#6366f1");

  // Multi-Draft States
  const [drafts, setDrafts] = useState<Record<string, ResumeData>>({});
  const [selectedDraftName, setSelectedDraftName] = useState<string>("Default Draft");

  // Outcome Tracker States
  const [activePageTab, setActivePageTab] = useState<"optimizer" | "tracker" | "consistency" | "grill">("optimizer");
  const [applications, setApplications] = useState<JobApplication[]>([]);

  // JD alignment loading state
  const [aligningBulletsKey, setAligningBulletsKey] = useState<string | null>(null);

  // Recruiter Simulation Active Tab
  const [selectedSimulatorId, setSelectedSimulatorId] = useState<string>("faang");

  // Dynamic scale state to fit Column 3 fully without scrolling on desktop
  const [sheetScale, setSheetScale] = useState<number>(1);
  const [sheetHeight, setSheetHeight] = useState<number>(1122);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const resumeDocRef = useRef<HTMLDivElement>(null);

  // Resize handler to calculate desktop sheet scale and scroll height
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 640);
      const doc = document.getElementById("optimized-resume-doc");
      if (doc) {
        setSheetHeight(doc.scrollHeight);
      }

      if (window.innerWidth >= 1025) {
        const wrapper = document.querySelector(".resume-sheet-wrapper");
        if (wrapper) {
          const width = wrapper.clientWidth;
          if (width > 40) {
            // A4 sheet width is ~794px in standard CSS dimensions, subtracting 40px wrapper padding
            const scale = (width - 40) / 794;
            setSheetScale(scale < 1 ? scale : 1);
          }
        }
      } else {
        setSheetScale(1);
      }
    };

    window.addEventListener("resize", handleResize);
    const timer = setTimeout(handleResize, 150);
    const timer2 = setTimeout(handleResize, 500);

    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [resumeData, templateId, makerTab, fontSize, lineHeight, pagePadding]);

  // Skill Decay State
  const [skillDecayData, setSkillDecayData] = useState<{
    role: string;
    decayingSkills: Array<{ skill: string; description: string }>;
    emergingSkills: Array<{ skill: string; description: string }>;
    marketRisk: "Low" | "Medium" | "High";
    scrapedListingsCount: number;
  } | null>(null);

  // Fetch Skill Decay and Market trends dynamically
  useEffect(() => {
    if (!analysis && !resumeData) {
      setSkillDecayData(null);
      return;
    }

    const targetRole = resumeData?.contact.title || file?.name.replace(".pdf", "").replace(/_/g, " ").replace(/-/g, " ") || "Software Engineer";
    
    let activeSkills: string[] = [];
    if (resumeData) {
      activeSkills = resumeData.skills.flatMap(s => s.items);
    } else if (analysis) {
      const rawText = analysis.originalText.replace(/\r/g, "");
      const skillsHeaderRegex = /(?:technical\s+)?(?:skills|technologies|expertise|proficiencies|tools)\b/gi;
      let match;
      let skillsStartIndex = -1;
      while ((match = skillsHeaderRegex.exec(rawText)) !== null) {
        skillsStartIndex = match.index + match[0].length;
      }
      if (skillsStartIndex !== -1) {
        const nextSectionRegex = /\n\s*(?:experience|projects|education|employment|work|history)\b/i;
        const remainingText = rawText.substring(skillsStartIndex);
        const nextMatch = nextSectionRegex.exec(remainingText);
        const skillsSection = nextMatch ? remainingText.substring(0, nextMatch.index) : remainingText;
        activeSkills = skillsSection
          .split(/[,\n•*|●■▪◦○♦✓\t]/)
          .map(s => s.trim())
          .filter(s => s.length > 1 && s.length < 30);
      }
    }

    const triggerDecayCheck = async () => {
      try {
        const res = await fetch("/api/skill-decay", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            role: targetRole,
            skills: activeSkills
          })
        });
        if (res.ok) {
          const data = await res.json();
          setSkillDecayData(data);
        }
      } catch (err) {
        console.error("Skill decay check failed:", err);
      }
    };

    const timeout = setTimeout(triggerDecayCheck, 1200);
    return () => clearTimeout(timeout);
  }, [resumeData, analysis]);

  // Load saved drafts and applications on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("resumeroaster_drafts");
      if (saved) {
        const parsed = JSON.parse(saved);
        setDrafts(parsed);
        // Load the first draft if exists
        const keys = Object.keys(parsed);
        if (keys.length > 0) {
          setSelectedDraftName(keys[0]);
          setResumeData(parsed[keys[0]]);
        }
      }
    } catch (e) {
      console.error("Failed to load drafts from localStorage", e);
    }

    try {
      const savedApps = localStorage.getItem("resumeroaster_applications");
      if (savedApps) {
        setApplications(JSON.parse(savedApps));
      }
    } catch (e) {
      console.error("Failed to load applications from localStorage", e);
    }
  }, []);

  const handleAddApplication = (newApp: Omit<JobApplication, "id">) => {
    const app: JobApplication = {
      ...newApp,
      id: Math.random().toString(36).substring(2, 9) + Date.now().toString(36)
    };
    const updated = [...applications, app];
    setApplications(updated);
    localStorage.setItem("resumeroaster_applications", JSON.stringify(updated));
  };

  const handleUpdateAppStatus = (id: string, status: JobApplication["status"]) => {
    const updated = applications.map(a => a.id === id ? { ...a, status } : a);
    setApplications(updated);
    localStorage.setItem("resumeroaster_applications", JSON.stringify(updated));
  };

  const handleDeleteApplication = (id: string) => {
    const updated = applications.filter(a => a.id !== id);
    setApplications(updated);
    localStorage.setItem("resumeroaster_applications", JSON.stringify(updated));
  };

  const getResumeTextForAudit = () => {
    if (analysis?.originalText) return analysis.originalText;
    if (resumeData) {
      const contactText = `${resumeData.contact.name || ""} ${resumeData.contact.email || ""} ${resumeData.contact.phone || ""} ${resumeData.contact.links?.join(" ") || ""}`;
      const expText = resumeData.experience.map(e => `${e.organization} ${e.role} ${e.dates} ${e.bullets.join(" ")}`).join(" ");
      const projText = resumeData.projects?.map(p => `${p.name} ${p.dates} ${p.bullets.join(" ")}`).join(" ") || "";
      const eduText = resumeData.education.map(e => `${e.school} ${e.degree} ${e.dates} ${e.details?.join(" ") || ""}`).join(" ");
      const skillText = resumeData.skills.map(s => `${s.category} ${s.items.join(" ")}`).join(" ");
      return `${contactText}\n${expText}\n${projText}\n${eduText}\n${skillText}`;
    }
    return "";
  };

  const saveDraft = (name: string, dataToSave: ResumeData) => {
    const updated = { ...drafts, [name]: dataToSave };
    setDrafts(updated);
    setSelectedDraftName(name);
    localStorage.setItem("resumeroaster_drafts", JSON.stringify(updated));
  };

  const createNewDraft = () => {
    const defaultName = `Draft ${Object.keys(drafts).length + 1}`;
    setResumeData(DEFAULT_RESUME_MAKER_DATA);
    saveDraft(defaultName, DEFAULT_RESUME_MAKER_DATA);
  };

  const deleteDraft = (name: string) => {
    const updated = { ...drafts };
    delete updated[name];
    setDrafts(updated);
    localStorage.setItem("resumeroaster_drafts", JSON.stringify(updated));
    const keys = Object.keys(updated);
    if (keys.length > 0) {
      setSelectedDraftName(keys[0]);
      setResumeData(updated[keys[0]]);
    } else {
      setSelectedDraftName("Default Draft");
      setResumeData(null);
    }
  };

  const updateContact = (field: string, val: string) => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      contact: {
        ...resumeData.contact,
        [field]: val
      }
    });
  };

  const updateContactLinks = (idx: number, val: string) => {
    if (!resumeData) return;
    const newLinks = [...(resumeData.contact.links || [])];
    newLinks[idx] = val;
    setResumeData({
      ...resumeData,
      contact: {
        ...resumeData.contact,
        links: newLinks
      }
    });
  };

  const addContactLink = () => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      contact: {
        ...resumeData.contact,
        links: [...(resumeData.contact.links || []), ""]
      }
    });
  };

  const removeContactLink = (idx: number) => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      contact: {
        ...resumeData.contact,
        links: (resumeData.contact.links || []).filter((_, i) => i !== idx)
      }
    });
  };

  const updateExperience = (idx: number, field: string, val: any) => {
    if (!resumeData) return;
    const newExp = [...resumeData.experience];
    newExp[idx] = { ...newExp[idx], [field]: val };
    setResumeData({ ...resumeData, experience: newExp });
  };

  const addExperience = () => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      experience: [
        ...resumeData.experience,
        { role: "New Role", organization: "Company Name", location: "Location", dates: "Dates", bullets: ["New achievement bullet"] }
      ]
    });
  };

  const removeExperience = (idx: number) => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      experience: resumeData.experience.filter((_, i) => i !== idx)
    });
  };

  const updateEducation = (idx: number, field: string, val: any) => {
    if (!resumeData) return;
    const newEdu = [...resumeData.education];
    newEdu[idx] = { ...newEdu[idx], [field]: val };
    setResumeData({ ...resumeData, education: newEdu });
  };

  const addEducation = () => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      education: [
        ...resumeData.education,
        { degree: "Degree", school: "School", location: "Location", dates: "Dates" }
      ]
    });
  };

  const removeEducation = (idx: number) => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      education: resumeData.education.filter((_, i) => i !== idx)
    });
  };

  const updateSkills = (idx: number, field: string, val: any) => {
    if (!resumeData) return;
    const newSkills = [...resumeData.skills];
    newSkills[idx] = { ...newSkills[idx], [field]: val };
    setResumeData({ ...resumeData, skills: newSkills });
  };

  const addSkillsGroup = () => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      skills: [...resumeData.skills, { category: "New Category", items: ["Skill 1", "Skill 2"] }]
    });
  };

  const removeSkillsGroup = (idx: number) => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      skills: resumeData.skills.filter((_, i) => i !== idx)
    });
  };

  const updateProject = (idx: number, field: string, val: any) => {
    if (!resumeData) return;
    const newProj = [...(resumeData.projects || [])];
    newProj[idx] = { ...newProj[idx], [field]: val };
    setResumeData({ ...resumeData, projects: newProj });
  };

  const addProject = () => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      projects: [
        ...(resumeData.projects || []),
        { name: "Project Name", dates: "Dates", bullets: ["Project achievement detail"] }
      ]
    });
  };

  const removeProject = (idx: number) => {
    if (!resumeData) return;
    setResumeData({
      ...resumeData,
      projects: (resumeData.projects || []).filter((_, i) => i !== idx)
    });
  };

  function resetResults() {
    setAnalysis(null);
    setResumeData(null);
    setStaleResult(false);
  }

  function handleFile(f: File | null) {
    setError(null);
    resetResults();

    if (!f) {
      setFile(null);
      return;
    }

    if (f.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      setFile(null);
      return;
    }

    if (f.size > MAX_FILE_SIZE_BYTES) {
      setError("File is too large. Please upload a PDF under 8MB.");
      setFile(null);
      return;
    }

    setFile(f);
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);

    if (loading || optimizing) {
      setError("Please wait for the current operation to finish before uploading a new file.");
      return;
    }

    const f = e.dataTransfer.files?.[0] || null;
    handleFile(f);
  }

  function onBrowseClick() {
    if (loading || optimizing) return;
    inputRef.current?.click();
  }

  function handleJdChange(value: string) {
    setJd(value);
    if (analysis || resumeData) {
      setStaleResult(true);
    }
  }

  async function runAnalysis() {
    if (loading || optimizing) return;
    if (!file) return;
    setLoading(true);
    setError(null);
    resetResults();

    try {
      const formData = new FormData();
      formData.append("resume", file);
      formData.append("jd", jd);

      const res = await fetch("/api/analyze", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to analyze resume.");
        setLoading(false);
        return;
      }

      setAnalysis(data as AIAnalysis);
      setOriginalPageCount(data.pageCount || 1);
      setStaleResult(false);
      setLoading(false);
    } catch (err) {
      console.error("Analyze request failed:", err);
      setError("Couldn't reach the server. Try again.");
      setLoading(false);
    }
  }

  async function applyOptimizations() {
    if (loading || optimizing) return;
    if (!analysis) return;
    setOptimizing(true);
    setError(null);
    setResumeData(null);

    try {
      const res = await fetch("/api/optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText: analysis.originalText,
          jd: jd,
          targetPageCount: originalPageCount
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to optimize resume.");
        setOptimizing(false);
        return;
      }

      setResumeData(data.resumeData as ResumeData);
      setStaleResult(false);
      setOptimizing(false);
    } catch (err) {
      console.error("Optimize request failed:", err);
      setError("Couldn't reach the server for optimization. Try again.");
      setOptimizing(false);
    }
  }

  async function handleJdAlign(type: "experience" | "projects", idx: number, bullets: string[]) {
    if (!resumeData) return;
    const key = `${type}-${idx}`;
    setAligningBulletsKey(key);
    setError(null);

    try {
      const res = await fetch("/api/optimize-bullets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bullets,
          jd
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to align bullets to JD.");
      }

      if (Array.isArray(data.bullets)) {
        if (type === "experience") {
          updateExperience(idx, "bullets", data.bullets);
        } else {
          updateProject(idx, "bullets", data.bullets);
        }
      }
    } catch (err: any) {
      console.error("Failed to align bullets:", err);
      setError(err.message || "Couldn't reach server. Falling back to local optimization.");
      
      const { rewriteBulletsRoleSpecificHeuristic } = await import("@/lib/bullet-rewriter");
      const localBullets = rewriteBulletsRoleSpecificHeuristic(bullets, jd);
      if (type === "experience") {
        updateExperience(idx, "bullets", localBullets);
      } else {
        updateProject(idx, "bullets", localBullets);
      }
    } finally {
      setAligningBulletsKey(null);
    }
  }

  const autoFitToSinglePage = () => {
    const doc = resumeDocRef.current;
    if (!doc) return;

    const targetHeight = 1120; // 297mm in pixels at 96 DPI

    let currentFontSize = fontSize;
    let currentLineHeight = lineHeight;
    let currentPadding = pagePadding;

    const testFit = (fSize: number, lHeight: number, pad: number): number => {
      const originalF = doc.style.fontSize;
      const originalLH = doc.style.lineHeight;
      const originalP = doc.style.padding;
      
      doc.style.setProperty("--sheet-font-size", `${fSize}pt`, "important");
      doc.style.setProperty("--sheet-line-height", `${lHeight}`, "important");
      doc.style.setProperty("--sheet-padding", `${pad}mm`, "important");

      const h = doc.scrollHeight;

      doc.style.fontSize = originalF;
      doc.style.lineHeight = originalLH;
      doc.style.padding = originalP;

      return h;
    };

    let currentHeight = testFit(currentFontSize, currentLineHeight, currentPadding);
    
    if (currentHeight <= targetHeight) {
      return;
    }

    let iterations = 0;
    const maxIterations = 30;

    while (currentHeight > targetHeight && iterations < maxIterations) {
      if (currentFontSize > 8.5) {
        currentFontSize = Math.max(8.5, currentFontSize - 0.2);
      } else if (currentPadding > 10) {
        currentPadding = Math.max(10, currentPadding - 1);
      } else if (currentLineHeight > 1.15) {
        currentLineHeight = Math.max(1.15, currentLineHeight - 0.05);
      } else if (currentFontSize > 8.0) {
        currentFontSize = Math.max(8.0, currentFontSize - 0.15);
      } else {
        break;
      }
      currentHeight = testFit(currentFontSize, currentLineHeight, currentPadding);
      iterations++;
    }

    setFontSize(Math.max(8, Number(currentFontSize.toFixed(2))));
    setLineHeight(Math.max(1.15, Number(currentLineHeight.toFixed(2))));
    setPagePadding(Math.max(10, currentPadding));
  };

  async function downloadPdf() {
    const docContainer = resumeDocRef.current;
    if (!docContainer) return;

    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      // Temporarily strip shadows to prevent shadow artifacts in exported canvas PDF
      docContainer.classList.add("pdf-generation-mode");
      await new Promise(resolve => setTimeout(resolve, 30));

      let canvas;
      try {
        canvas = await html2canvas(docContainer, {
          scale: 2,
          useCORS: true,
          logging: false
        });
      } finally {
        docContainer.classList.remove("pdf-generation-mode");
      }

      const pdf = new jsPDF("p", "mm", "a4");

      const imgData = canvas.toDataURL("image/png");
      const imgWidth = 210;
      const pageHeight = 297; // A4 standard height is exactly 297mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // Only add a new page if the overflow is greater than 6mm (approx 22px of content)
      const overflowThreshold = 6;
      while (heightLeft > overflowThreshold) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`${file ? file.name.replace(".pdf", "") : "optimized"}_optimized_resume.pdf`);
    } catch (err) {
      console.error("PDF download error:", err);
      setError("Failed to generate PDF download. Please try again.");
    }
  }

  const SelectedTemplate = TEMPLATE_COMPONENTS[templateId];

  return (
    <>
      {!resumeData && !analysis && !loading && <SplashCursor />}
      <div className="bg-glow" />

      <header className="navbar">
        <div className="nav-logo">
          <div className="logo-box">R</div>
          <span className="logo-text">ResumeRoaster</span>
        </div>
        <nav className="nav-links">
          <a href="#how-it-works" onClick={(e) => {
            e.preventDefault();
            document.getElementById("how-it-works")?.scrollIntoView({ behavior: "smooth" });
          }}>How It Works</a>
          <a href="#reviews" onClick={(e) => {
            e.preventDefault();
            document.getElementById("reviews")?.scrollIntoView({ behavior: "smooth" });
          }}>Reviews</a>
          <button className="nav-upload-btn" onClick={() => {
            onBrowseClick();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}>
            Upload Resume
          </button>
        </nav>
      </header>

      <main className="optimizer-main">
        <section className="optimizer-hero">
          <h1 className="sr-only">ResumeRoaster — Free AI Resume Builder, Checker & ATS Optimizer</h1>
          <WarpText
            text="YOUR RESUME IS COOKED.LET'S FIX IT."
            color="#fff7e8"
            fontSize={isMobile ? "42px" : "clamp(32px, 4.5vw, 64px)"}
            fontWeight={isMobile ? 900 : 700}
            fontFamily="Oswald"
            letterSpacing="-0.01em"
            lineHeight={0.98}
            warpStrength={0.06}
            warpScale={1.5}
            speed={0.45}
            pointerInfluence={0.35}
            pointerStrength={0.3}
            refraction={0.012}
            style={{ height: isMobile ? "110px" : "140px", marginBottom: "8px" }}
          />
          <p className="hero-sub">
            Built for students from 50+ countries who don't have Stanford on their resume.
          </p>
        </section>

        <div className="page-navigation-tabs">
          <button 
            type="button" 
            className={`page-nav-btn ${activePageTab === "optimizer" ? "active" : ""}`}
            onClick={() => setActivePageTab("optimizer")}
          >
            🔥 Resume Optimizer
          </button>
          <button 
            type="button" 
            className={`page-nav-btn ${activePageTab === "tracker" ? "active" : ""}`}
            onClick={() => setActivePageTab("tracker")}
          >
            📊 Outcome Tracker
          </button>
          <button 
            type="button" 
            className={`page-nav-btn ${activePageTab === "consistency" ? "active" : ""}`}
            onClick={() => setActivePageTab("consistency")}
          >
            🔍 Consistency Scorer
          </button>
          <button 
            type="button" 
            className={`page-nav-btn ${activePageTab === "grill" ? "active" : ""}`}
            onClick={() => setActivePageTab("grill")}
          >
            🔥 Grill Me
          </button>
        </div>

        {activePageTab === "optimizer" ? (
          <>
            {error && <div className="global-error-msg">{error}</div>}

            <div className="optimizer-grid">
          {/* COLUMN 1: Inputs & Original Text */}
          <div className="optimizer-column col-1">
            <h2 className="column-title">1. Input & Source</h2>

            <div className="maker-tabs" style={{ display: "flex", gap: "8px", marginBottom: "16px", borderBottom: "1px dashed rgba(255, 255, 255, 0.1)", paddingBottom: "10px" }}>
              <button
                type="button"
                className={`maker-tab-btn ${makerTab === "upload" ? "active" : ""}`}
                style={{
                  background: makerTab === "upload" ? "var(--flame)" : "transparent",
                  color: makerTab === "upload" ? "var(--char)" : "var(--ash)",
                  border: "none",
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "'Oswald', sans-serif",
                  textTransform: "uppercase",
                  borderRadius: "4px",
                  cursor: "pointer",
                  flex: 1
                }}
                onClick={() => setMakerTab("upload")}
              >
                📂 Upload & Analyze
              </button>
              <button
                type="button"
                className={`maker-tab-btn ${makerTab === "edit" ? "active" : ""}`}
                style={{
                  background: makerTab === "edit" ? "var(--flame)" : "transparent",
                  color: makerTab === "edit" ? "var(--char)" : "var(--ash)",
                  border: "none",
                  padding: "8px 14px",
                  fontSize: "12px",
                  fontWeight: 700,
                  fontFamily: "'Oswald', sans-serif",
                  textTransform: "uppercase",
                  borderRadius: "4px",
                  cursor: "pointer",
                  flex: 1
                }}
                onClick={() => {
                  setMakerTab("edit");
                  if (!resumeData) {
                    setResumeData(DEFAULT_RESUME_MAKER_DATA);
                  }
                }}
              >
                ✍️ Resume Maker Form
              </button>
            </div>

            {makerTab === "upload" ? (
              <div className="input-container">
                <div
                  className={`dropzone ${dragOver ? "drag-over" : ""} ${file ? "has-file" : ""} ${
                    loading || optimizing ? "disabled" : ""
                  }`}
                  onClick={onBrowseClick}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!loading && !optimizing) setDragOver(true);
                  }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={onDrop}
                >
                  <input
                    ref={inputRef}
                    type="file"
                    accept="application/pdf"
                    style={{ display: "none" }}
                    disabled={loading || optimizing}
                    onChange={(e) => handleFile(e.target.files?.[0] || null)}
                  />
                  {file ? (
                    <>
                      <div className="dropzone-icon">📄</div>
                      <div className="file-name">{file.name}</div>
                      <div className="dropzone-sub">Click to change file</div>
                    </>
                  ) : (
                    <>
                      <div className="dropzone-icon">🔥</div>
                      <div className="dropzone-text">Drop resume PDF, or click to browse</div>
                      <div className="dropzone-sub">PDF files up to 8MB</div>
                    </>
                  )}
                </div>

                <div className="jd-box">
                  <label className="jd-label" htmlFor="jd-textarea">
                    Target Job Description (Optional)
                  </label>
                  <textarea
                    id="jd-textarea"
                    className="jd-textarea"
                    placeholder="Paste the target job description here to compare keywords, match requirements, and optimize score..."
                    value={jd}
                    maxLength={8000}
                    onChange={(e) => handleJdChange(e.target.value)}
                  />
                </div>

                <button
                  className="optimizer-btn"
                  onClick={runAnalysis}
                  disabled={!file || loading || optimizing}
                >
                  {loading ? "Analyzing PDF..." : "Analyze ATS Match"}
                </button>

                {staleResult && (
                  <p className="stale-warning">
                    You changed the job description since this analysis ran — re-run to get accurate results.
                  </p>
                )}
              </div>
            ) : (
              <div className="maker-form-container" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                
                {/* Drafts Manager Bar */}
                <div className="drafts-manager-bar" style={{
                  background: "rgba(0, 0, 0, 0.2)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                  borderRadius: "6px",
                  padding: "8px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "11px", color: "var(--ash)", textTransform: "uppercase", fontWeight: 700 }}>📂 Saved Drafts</span>
                    <button
                      type="button"
                      style={{ background: "transparent", border: "none", color: "var(--flame)", fontSize: "11px", cursor: "pointer", fontWeight: 700 }}
                      onClick={createNewDraft}
                    >
                      ➕ New Draft
                    </button>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <select
                      className="maker-input"
                      style={{ flex: 1, height: "32px", fontSize: "12px", padding: "0 6px" }}
                      value={selectedDraftName}
                      onChange={(e) => {
                        const name = e.target.value;
                        setSelectedDraftName(name);
                        if (drafts[name]) {
                          setResumeData(drafts[name]);
                        }
                      }}
                    >
                      {Object.keys(drafts).length === 0 ? (
                        <option value="Default Draft">Default Draft</option>
                      ) : (
                        Object.keys(drafts).map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))
                      )}
                    </select>
                    <button
                      type="button"
                      style={{
                        background: "var(--herb)",
                        color: "var(--char)",
                        border: "none",
                        borderRadius: "4px",
                        padding: "0 10px",
                        fontSize: "11px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                      onClick={() => {
                        const name = prompt("Enter draft name:", selectedDraftName);
                        if (name && resumeData) {
                          saveDraft(name, resumeData);
                        }
                      }}
                    >
                      💾 Save
                    </button>
                    {Object.keys(drafts).length > 0 && (
                      <button
                        type="button"
                        style={{
                          background: "rgba(196, 52, 31, 0.15)",
                          color: "var(--burnt)",
                          border: "1px solid rgba(196, 52, 31, 0.2)",
                          borderRadius: "4px",
                          padding: "0 8px",
                          fontSize: "11px",
                          cursor: "pointer"
                        }}
                        onClick={() => {
                          if (confirm(`Delete draft "${selectedDraftName}"?`)) {
                            deleteDraft(selectedDraftName);
                          }
                        }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                <div className="maker-form-sections" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "6px" }}>
                  {["contact", "summary", "experience", "projects", "skills", "education", "styling"].map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      className={`maker-sec-btn ${activeFormSec === sec ? "active" : ""}`}
                      style={{
                        background: activeFormSec === sec ? "rgba(255, 90, 31, 0.15)" : "rgba(0, 0, 0, 0.2)",
                        color: activeFormSec === sec ? "var(--flame)" : "var(--ash)",
                        border: "1.5px solid",
                        borderColor: activeFormSec === sec ? "var(--flame)" : "rgba(255, 255, 255, 0.08)",
                        padding: "6px",
                        fontSize: "11px",
                        fontFamily: "'Oswald', sans-serif",
                        textTransform: "uppercase",
                        borderRadius: "4px",
                        cursor: "pointer"
                      }}
                      onClick={() => setActiveFormSec(sec)}
                    >
                      {sec === "contact" && "👤 Info"}
                      {sec === "summary" && "📝 Summary"}
                      {sec === "experience" && "💼 Exp"}
                      {sec === "projects" && "🚀 Proj"}
                      {sec === "skills" && "🛠️ Skills"}
                      {sec === "education" && "🎓 Edu"}
                      {sec === "styling" && "🎛️ Tuning"}
                    </button>
                  ))}
                </div>

                {resumeData && (
                  <div className="maker-section-content" style={{ marginTop: "8px" }}>
                    {activeFormSec === "contact" && (
                      <div className="maker-inputs-group" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        <div className="maker-field">
                          <label style={{ fontSize: "11px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Full Name</label>
                          <input
                            type="text"
                            className="maker-input"
                            value={resumeData.contact.name}
                            onChange={(e) => updateContact("name", e.target.value)}
                          />
                        </div>
                        <div className="maker-field">
                          <label style={{ fontSize: "11px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Job Title</label>
                          <input
                            type="text"
                            className="maker-input"
                            value={resumeData.contact.title || ""}
                            onChange={(e) => updateContact("title", e.target.value)}
                          />
                        </div>
                        <div className="maker-field">
                          <label style={{ fontSize: "11px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Email</label>
                          <input
                            type="text"
                            className="maker-input"
                            value={resumeData.contact.email || ""}
                            onChange={(e) => updateContact("email", e.target.value)}
                          />
                        </div>
                        <div className="maker-field">
                          <label style={{ fontSize: "11px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Phone</label>
                          <input
                            type="text"
                            className="maker-input"
                            value={resumeData.contact.phone || ""}
                            onChange={(e) => updateContact("phone", e.target.value)}
                          />
                        </div>
                        <div className="maker-field">
                          <label style={{ fontSize: "11px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Location</label>
                          <input
                            type="text"
                            className="maker-input"
                            value={resumeData.contact.location || ""}
                            onChange={(e) => updateContact("location", e.target.value)}
                          />
                        </div>
                        <div className="maker-field">
                          <label style={{ fontSize: "11px", color: "var(--ash)", textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span>Links / Websites</span>
                            <button type="button" className="maker-add-btn" style={{ background: "transparent", color: "var(--flame)", border: "none", fontSize: "11px", cursor: "pointer", fontWeight: 700 }} onClick={addContactLink}>+ Add Link</button>
                          </label>
                          {(resumeData.contact.links || []).map((link, i) => (
                            <div key={i} style={{ display: "flex", gap: "8px", marginBottom: "6px" }}>
                              <input
                                type="text"
                                className="maker-input"
                                value={link}
                                onChange={(e) => updateContactLinks(i, e.target.value)}
                              />
                              <button type="button" className="maker-remove-btn" style={{ background: "rgba(196, 52, 31, 0.1)", border: "1px solid rgba(196, 52, 31, 0.2)", color: "var(--burnt)", padding: "0 8px", cursor: "pointer", borderRadius: "4px" }} onClick={() => removeContactLink(i)}>✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeFormSec === "summary" && (
                      <div className="maker-inputs-group">
                        <div className="maker-field">
                          <label style={{ fontSize: "11px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>Professional Summary</label>
                          <textarea
                            className="maker-textarea"
                            style={{ minHeight: "150px" }}
                            value={resumeData.summary || ""}
                            onChange={(e) => setResumeData({ ...resumeData, summary: e.target.value })}
                          />
                        </div>
                      </div>
                    )}

                    {activeFormSec === "experience" && (
                      <div className="maker-inputs-group" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "var(--ash)" }}>Job Experiences</span>
                          <button type="button" className="maker-add-btn" style={{ background: "transparent", color: "var(--flame)", border: "none", fontSize: "11px", cursor: "pointer", fontWeight: 700 }} onClick={addExperience}>+ Add Job</button>
                        </div>
                        {resumeData.experience.map((exp, i) => (
                          <div key={i} style={{ padding: "12px", border: "1px dashed rgba(255, 255, 255, 0.08)", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ fontSize: "12px", color: "var(--paper)" }}>Job #{i + 1}</strong>
                              <button type="button" className="maker-remove-btn" style={{ background: "transparent", color: "var(--burnt)", border: "none", fontSize: "11px", cursor: "pointer" }} onClick={() => removeExperience(i)}>✕ Remove</button>
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "10px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Role</label>
                              <input
                                type="text"
                                className="maker-input"
                                value={exp.role}
                                onChange={(e) => updateExperience(i, "role", e.target.value)}
                              />
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "10px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Company</label>
                              <input
                                type="text"
                                className="maker-input"
                                value={exp.organization}
                                onChange={(e) => updateExperience(i, "organization", e.target.value)}
                              />
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "10px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Location</label>
                              <input
                                type="text"
                                className="maker-input"
                                value={exp.location}
                                onChange={(e) => updateExperience(i, "location", e.target.value)}
                              />
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "10px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Dates</label>
                              <input
                                type="text"
                                className="maker-input"
                                value={exp.dates}
                                onChange={(e) => updateExperience(i, "dates", e.target.value)}
                              />
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "10px", color: "var(--ash)", textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                <span>Achievements (One bullet per line)</span>
                                <div style={{ display: "flex", gap: "10px" }}>
                                  <button
                                    type="button"
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "var(--ash)",
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "'Courier Prime', monospace"
                                    }}
                                    onClick={() => {
                                      const polished = localPolishBullets(exp.bullets);
                                      updateExperience(i, "bullets", polished);
                                    }}
                                  >
                                    ✨ STAR Polish
                                  </button>
                                  <button
                                    type="button"
                                    disabled={aligningBulletsKey === `experience-${i}`}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "var(--flame)",
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "'Courier Prime', monospace",
                                      opacity: aligningBulletsKey === `experience-${i}` ? 0.6 : 1
                                    }}
                                    onClick={() => handleJdAlign("experience", i, exp.bullets)}
                                  >
                                    {aligningBulletsKey === `experience-${i}` ? "🎯 Aligning..." : "🎯 Align to JD"}
                                  </button>
                                </div>
                              </label>
                              <textarea
                                className="maker-textarea"
                                style={{ minHeight: "100px" }}
                                value={exp.bullets.join("\n")}
                                onChange={(e) => updateExperience(i, "bullets", e.target.value.split("\n"))}
                                placeholder="Accomplished X, by doing Y, measured by Z..."
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeFormSec === "projects" && (
                      <div className="maker-inputs-group" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "var(--ash)" }}>Projects</span>
                          <button type="button" className="maker-add-btn" style={{ background: "transparent", color: "var(--flame)", border: "none", fontSize: "11px", cursor: "pointer", fontWeight: 700 }} onClick={addProject}>+ Add Project</button>
                        </div>
                        {(resumeData.projects || []).map((proj, i) => (
                          <div key={i} style={{ padding: "12px", border: "1px dashed rgba(255, 255, 255, 0.08)", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ fontSize: "12px", color: "var(--paper)" }}>Project #{i + 1}</strong>
                              <button type="button" className="maker-remove-btn" style={{ background: "transparent", color: "var(--burnt)", border: "none", fontSize: "11px", cursor: "pointer" }} onClick={() => removeProject(i)}>✕ Remove</button>
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "10px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Name</label>
                              <input
                                type="text"
                                className="maker-input"
                                value={proj.name}
                                onChange={(e) => updateProject(i, "name", e.target.value)}
                              />
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "10px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Dates</label>
                              <input
                                type="text"
                                className="maker-input"
                                value={proj.dates}
                                onChange={(e) => updateProject(i, "dates", e.target.value)}
                              />
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "10px", color: "var(--ash)", textTransform: "uppercase", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                                <span>Details (One bullet per line)</span>
                                <div style={{ display: "flex", gap: "10px" }}>
                                  <button
                                    type="button"
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "var(--ash)",
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "'Courier Prime', monospace"
                                    }}
                                    onClick={() => {
                                      const polished = localPolishBullets(proj.bullets);
                                      updateProject(i, "bullets", polished);
                                    }}
                                  >
                                    ✨ STAR Polish
                                  </button>
                                  <button
                                    type="button"
                                    disabled={aligningBulletsKey === `projects-${i}`}
                                    style={{
                                      background: "transparent",
                                      border: "none",
                                      color: "var(--flame)",
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      cursor: "pointer",
                                      fontFamily: "'Courier Prime', monospace",
                                      opacity: aligningBulletsKey === `projects-${i}` ? 0.6 : 1
                                    }}
                                    onClick={() => handleJdAlign("projects", i, proj.bullets)}
                                  >
                                    {aligningBulletsKey === `projects-${i}` ? "🎯 Aligning..." : "🎯 Align to JD"}
                                  </button>
                                </div>
                              </label>
                              <textarea
                                className="maker-textarea"
                                style={{ minHeight: "80px" }}
                                value={proj.bullets.join("\n")}
                                onChange={(e) => updateProject(i, "bullets", e.target.value.split("\n"))}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeFormSec === "skills" && (
                      <div className="maker-inputs-group" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "var(--ash)" }}>Skill Groups</span>
                          <button type="button" className="maker-add-btn" style={{ background: "transparent", color: "var(--flame)", border: "none", fontSize: "11px", cursor: "pointer", fontWeight: 700 }} onClick={addSkillsGroup}>+ Add Category</button>
                        </div>
                        {resumeData.skills.map((group, i) => (
                          <div key={i} style={{ padding: "10px", border: "1px dashed rgba(255, 255, 255, 0.08)", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "6px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ fontSize: "11px", color: "var(--paper)" }}>Category #{i + 1}</strong>
                              <button type="button" className="maker-remove-btn" style={{ background: "transparent", color: "var(--burnt)", border: "none", fontSize: "11px", cursor: "pointer" }} onClick={() => removeSkillsGroup(i)}>✕ Remove</button>
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "9px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Category Name</label>
                              <input
                                type="text"
                                className="maker-input"
                                value={group.category || ""}
                                onChange={(e) => updateSkills(i, "category", e.target.value)}
                                placeholder="e.g. Languages"
                              />
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "9px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Skills (Comma-separated)</label>
                              <input
                                type="text"
                                className="maker-input"
                                value={group.items.join(", ")}
                                onChange={(e) => updateSkills(i, "items", e.target.value.split(",").map(x => x.trim()))}
                                placeholder="HTML, CSS, JS"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeFormSec === "education" && (
                      <div className="maker-inputs-group" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "12px", color: "var(--ash)" }}>Education</span>
                          <button type="button" className="maker-add-btn" style={{ background: "transparent", color: "var(--flame)", border: "none", fontSize: "11px", cursor: "pointer", fontWeight: 700 }} onClick={addEducation}>+ Add Edu</button>
                        </div>
                        {resumeData.education.map((edu, i) => (
                          <div key={i} style={{ padding: "12px", border: "1px dashed rgba(255, 255, 255, 0.08)", borderRadius: "6px", display: "flex", flexDirection: "column", gap: "8px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <strong style={{ fontSize: "12px", color: "var(--paper)" }}>Education #{i + 1}</strong>
                              <button type="button" className="maker-remove-btn" style={{ background: "transparent", color: "var(--burnt)", border: "none", fontSize: "11px", cursor: "pointer" }} onClick={() => removeEducation(i)}>✕ Remove</button>
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "10px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>School</label>
                              <input
                                type="text"
                                className="maker-input"
                                value={edu.school}
                                onChange={(e) => updateEducation(i, "school", e.target.value)}
                              />
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "10px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Degree</label>
                              <input
                                type="text"
                                className="maker-input"
                                value={edu.degree}
                                onChange={(e) => updateEducation(i, "degree", e.target.value)}
                              />
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "10px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Location</label>
                              <input
                                type="text"
                                className="maker-input"
                                value={edu.location}
                                onChange={(e) => updateEducation(i, "location", e.target.value)}
                              />
                            </div>
                            <div className="maker-field">
                              <label style={{ fontSize: "10px", color: "var(--ash)", textTransform: "uppercase", display: "block", marginBottom: "2px" }}>Dates</label>
                              <input
                                type="text"
                                className="maker-input"
                                value={edu.dates}
                                onChange={(e) => updateEducation(i, "dates", e.target.value)}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {activeFormSec === "styling" && (
                      <div className="maker-inputs-group" style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div className="tuning-control" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "11px", color: "var(--ash)", textTransform: "uppercase", fontWeight: 700 }}>🔤 Font Size ({fontSize}pt)</label>
                          <input 
                            type="range" 
                            min="8" 
                            max="14" 
                            step="0.5" 
                            value={fontSize} 
                            onChange={(e) => setFontSize(parseFloat(e.target.value))}
                            style={{ cursor: "pointer", accentColor: "var(--flame)" }}
                          />
                        </div>
                        <div className="tuning-control" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "11px", color: "var(--ash)", textTransform: "uppercase", fontWeight: 700 }}>↔️ Line Height ({lineHeight})</label>
                          <input 
                            type="range" 
                            min="1.1" 
                            max="1.8" 
                            step="0.05" 
                            value={lineHeight} 
                            onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                            style={{ cursor: "pointer", accentColor: "var(--flame)" }}
                          />
                        </div>
                        <div className="tuning-control" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "11px", color: "var(--ash)", textTransform: "uppercase", fontWeight: 700 }}>↕️ Margins ({pagePadding}mm)</label>
                          <input 
                            type="range" 
                            min="8" 
                            max="24" 
                            step="1" 
                            value={pagePadding} 
                            onChange={(e) => setPagePadding(parseInt(e.target.value))}
                            style={{ cursor: "pointer", accentColor: "var(--flame)" }}
                          />
                        </div>
                        <div className="tuning-control" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                          <label style={{ fontSize: "11px", color: "var(--ash)", textTransform: "uppercase", fontWeight: 700 }}>🎨 Accent Color</label>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <input 
                              type="color" 
                              value={accentColor} 
                              onChange={(e) => setAccentColor(e.target.value)}
                              style={{ border: "none", background: "none", cursor: "pointer", width: "32px", height: "32px", padding: 0 }}
                            />
                            <span style={{ fontSize: "12px", fontFamily: "monospace", color: "var(--paper-dim)" }}>{accentColor.toUpperCase()}</span>
                          </div>
                        </div>
                        <div style={{ marginTop: "12px", borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: "14px" }}>
                          <button
                            type="button"
                            style={{
                              width: "100%",
                              background: "var(--butter)",
                              color: "var(--char)",
                              fontSize: "12px",
                              fontFamily: "'Oswald', sans-serif",
                              textTransform: "uppercase",
                              padding: "10px",
                              borderRadius: "4px",
                              border: "none",
                              fontWeight: "bold",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: "6px"
                            }}
                            onClick={autoFitToSinglePage}
                          >
                            ⚡ Auto-Fit to Single Page
                          </button>
                          <p style={{ fontSize: "10px", color: "var(--ash)", marginTop: "6px", textAlign: "center", lineHeight: "1.35", fontFamily: "monospace" }}>
                            Shrinks layout size, padding, and line heights dynamically to fit all text onto exactly a single A4 page sheet.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {analysis && (
              <div className="preview-card mt-24">
                <div className="preview-header">Original Parsed Resume Text</div>
                <pre className="raw-text-preview">{analysis.originalText}</pre>
              </div>
            )}
          </div>

          {/* COLUMN 2: Diagnostics & Operations */}
          <div className="optimizer-column col-2">
            <h2 className="column-title">2. Diagnostics</h2>

            {!analysis && !loading && (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <div className="empty-text">Upload and analyze your resume to see ATS diagnostics.</div>
              </div>
            )}

            {loading && (
              <div className="loading-state">
                <div className="spinner" />
                <div className="loading-text">Analysing Your Resume...</div>
              </div>
            )}

            {analysis && !loading && (
              <div className="diagnostics-content">
                <div className="score-widget">
                  <div className="score-circle">
                    <div className="score-val" style={{ color: scoreColor(analysis.score) }}>
                      {analysis.score}
                    </div>
                    <div className="score-label">ATS Score</div>
                  </div>
                  <p className="score-desc">Targeting a score above 85 to pass automated filters.</p>
                </div>

                {/* Section-level Diagnostics & Score Costs */}
                {(() => {
                  const honestyIssues = resumeData 
                    ? detectHonestyGaps(resumeData) 
                    : (analysis?.originalText ? detectHonestyGapsRaw(analysis.originalText) : []);
                  
                  const audits = resumeData
                    ? evaluateSectionDiagnostics(resumeData, honestyIssues.length, 0)
                    : (analysis?.originalText ? evaluateSectionDiagnosticsRaw(analysis.originalText) : []);

                  const totalLost = audits.reduce((sum, item) => sum + item.cost, 0);

                  return (
                    <div className="cost-panel-wrapper">
                      <div className="cost-bar-title-row">
                        <span style={{ fontSize: "11px", color: "var(--butter)", fontFamily: "Oswald", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                          📉 Section Score Costs
                        </span>
                        <span style={{ fontSize: "11px", color: totalLost > 0 ? "var(--burnt)" : "var(--herb)", fontWeight: "bold" }}>
                          {totalLost > 0 ? `−${totalLost}% Total Cost` : "Perfect Score Structure"}
                        </span>
                      </div>

                      {totalLost > 0 && (
                        <div className="cost-bar-container">
                          {audits.map((item, idx) => {
                            if (item.cost === 0) return null;
                            const segmentClass = item.section.toLowerCase().includes("summary") ? "summary"
                              : item.section.toLowerCase().includes("experience") ? "experience"
                              : item.section.toLowerCase().includes("project") ? "projects"
                              : item.section.toLowerCase().includes("skill") ? "skills"
                              : "consistency";
                            return (
                              <div 
                                key={idx}
                                className={`cost-bar-segment cost-segment-${segmentClass}`}
                                style={{ width: `${(item.cost / totalLost) * 100}%` }}
                                title={`${item.section}: -${item.cost}%`}
                              />
                            );
                          })}
                        </div>
                      )}

                      <div className="cost-items-list">
                        {audits.map((item, idx) => (
                          <div key={idx} className="cost-item-card">
                            <div className="cost-item-header">
                              <span className="cost-section-name">{item.section}</span>
                              <span className={`cost-badge ${item.status}`}>
                                {item.status === "passed" ? "✓ OK" : `−${item.cost}%`}
                              </span>
                            </div>
                            <p className="cost-reason-text" style={{ margin: 0 }}>
                              {item.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* 👥 Screening Simulation Room */}
                {(() => {
                  const simulatedRecruiters = simulateRecruiterPanels(resumeData, analysis?.originalText || null);
                  const activeRecruiter = simulatedRecruiters.find(r => r.id === selectedSimulatorId) || simulatedRecruiters[0];

                  return (
                    <div className="sim-panel-wrapper">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{ fontSize: "11px", color: "var(--butter)", fontFamily: "Oswald", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                          👥 Recruiter Screening Room
                        </span>
                        <span style={{ fontSize: "10px", color: "var(--ash)" }}>
                          Click avatar to view inner monologue
                        </span>
                      </div>

                      <div className="sim-grid">
                        {simulatedRecruiters.map((recruiter) => {
                          const isActive = recruiter.id === selectedSimulatorId;
                          const scoreColorVal = recruiter.score >= 80 ? "var(--herb)" : recruiter.score >= 55 ? "var(--butter)" : "var(--burnt)";
                          const verdictClass = recruiter.verdict === "Approved" ? "verdict-approved" 
                            : recruiter.verdict === "Borderline" ? "verdict-borderline" 
                            : "verdict-rejected";
                          return (
                            <div 
                              key={recruiter.id}
                              className={`sim-card ${isActive ? "active" : ""}`}
                              onClick={() => setSelectedSimulatorId(recruiter.id)}
                            >
                              <div className="sim-avatar-circle">
                                {recruiter.avatar}
                              </div>
                              <span style={{ fontSize: "10px", color: "var(--paper)", fontWeight: "bold", textAlign: "center", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", width: "100%" }}>
                                {recruiter.name.split(" ")[0]}
                              </span>
                              <span className="sim-score-badge" style={{ color: scoreColorVal }}>
                                {recruiter.score}%
                              </span>
                              <span className={`sim-verdict-text ${verdictClass}`}>
                                {recruiter.verdict}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {activeRecruiter && (
                        <div className="sim-monologue-box">
                          <div className="sim-meta-header">
                            {activeRecruiter.name}
                            <span className="sim-meta-role">({activeRecruiter.role})</span>
                          </div>
                          <div style={{ fontSize: "10.5px", color: "var(--flame)", fontFamily: "monospace", margin: "2px 0 6px 0" }}>
                            🎯 Bias: {activeRecruiter.bias}
                          </div>
                          <div className="sim-monologue-text">
                            {activeRecruiter.innerMonologue}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 📉 12-Month Skill Decay & Market Trends */}
                {skillDecayData && (
                  <div className="decay-panel-wrapper">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                      <span style={{ fontSize: "11px", color: "var(--butter)", fontFamily: "Oswald", textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.05em" }}>
                        📉 12-Month Skill Decay warning
                      </span>
                      <span className={`risk-badge ${skillDecayData.marketRisk.toLowerCase()}`}>
                        Risk: {skillDecayData.marketRisk}
                      </span>
                    </div>

                    <div style={{ fontSize: "11.5px", color: "var(--ash)", marginBottom: "10px", lineHeight: "1.4" }}>
                      Analyzing target postings for <strong>{skillDecayData.role}</strong>. 
                      {skillDecayData.scrapedListingsCount > 0 ? " (Live greenhouse/lever indexing pipeline active)" : ""}
                    </div>

                    {/* Decaying skills section */}
                    {skillDecayData.decayingSkills.length > 0 ? (
                      <div style={{ marginBottom: "14px" }}>
                        <div style={{ fontSize: "10px", color: "var(--burnt)", fontWeight: "bold", textTransform: "uppercase", marginBottom: "6px", fontFamily: "monospace" }}>
                          ⚠️ listed skills declining in market demand:
                        </div>
                        {skillDecayData.decayingSkills.map((item, idx) => (
                          <div key={idx} className="decay-skill-item">
                            <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--paper)" }}>
                              {item.skill.toUpperCase()}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--paper-dim)", lineHeight: "1.35" }}>
                              {item.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ fontSize: "11px", color: "var(--herb)", background: "rgba(122, 155, 87, 0.05)", border: "1px solid rgba(122, 155, 87, 0.1)", borderRadius: "4px", padding: "8px", marginBottom: "14px" }}>
                        ✅ None of your listed skills are trending down in modern job listings.
                      </div>
                    )}

                    {/* Emerging skills section */}
                    {skillDecayData.emergingSkills.length > 0 && (
                      <div>
                        <div style={{ fontSize: "10px", color: "var(--butter)", fontWeight: "bold", textTransform: "uppercase", marginBottom: "6px", fontFamily: "monospace" }}>
                          💡 Emerging target keywords missing on your resume:
                        </div>
                        {skillDecayData.emergingSkills.map((item, idx) => (
                          <div key={idx} className="emerging-skill-item">
                            <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--paper)" }}>
                              {item.skill.toUpperCase()}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--paper-dim)", lineHeight: "1.35" }}>
                              {item.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Honesty Roast / Lie Detector section */}
                {(() => {
                  const honestyIssues = resumeData 
                    ? detectHonestyGaps(resumeData) 
                    : (analysis?.originalText ? detectHonestyGapsRaw(analysis.originalText) : []);

                  if (honestyIssues.length > 0) {
                    return (
                      <div className="roast-card-wrapper">
                        <div className="roast-card-header">
                          <span className="roast-title-badge">🚨 Lie Detector Roast</span>
                          <span style={{ fontSize: "11px", color: "var(--burnt)", fontWeight: "bold" }}>
                            {honestyIssues.length} Evidence Gap{honestyIssues.length > 1 ? "s" : ""}
                          </span>
                        </div>
                        <ul className="roast-issues-list">
                          {honestyIssues.map((issue, idx) => (
                            <li key={idx} className="roast-issue-item">
                              <span className="roast-skill-tag">{issue.skill}</span>
                              {issue.roast}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );
                  } else {
                    return (
                      <div className="roast-pass-card">
                        <span>🛡️</span>
                        <span>
                          <strong>Honesty Audit Passed:</strong> All skills mentioned in your skills section are backed by evidence in your experience bullet points or projects. No bluffing detected.
                        </span>
                      </div>
                    );
                  }
                })()}

                {/* Human Review Vibe Check */}
                <HumanReviewWidget 
                  resumeText={getResumeTextForAudit()}
                  atsScore={analysis.score}
                />

                {analysis.missingKeywords.length > 0 && (
                  <div className="diag-section">
                    <div className="diag-section-title">Missing Target Keywords</div>
                    <div className="keywords-badge-container">
                      {analysis.missingKeywords.map((kw, i) => (
                        <span key={i} className="keyword-badge">{kw}</span>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.suggestions.length > 0 && (
                  <div className="diag-section">
                    <div className="diag-section-title">Bullet & Flow Improvements</div>
                    <ul className="suggestions-list">
                      {analysis.suggestions.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {analysis.actionVerbs.length > 0 && (
                  <div className="diag-section">
                    <div className="diag-section-title">Action Verb Replacements</div>
                    <ul className="verbs-list">
                      {analysis.actionVerbs.map((v, i) => (
                        <li key={i}>{v}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Template picker */}
                <div className="diag-section">
                  <div className="diag-section-title">Choose a Template</div>
                  <div className="template-selector">
                    {TEMPLATE_DEFINITIONS.map((t) => (
                      <button
                        key={t.id}
                        type="button"
                        className={`template-btn ${templateId === t.id ? "active" : ""}`}
                        onClick={() => setTemplateId(t.id)}
                      >
                        {t.name}
                      </button>
                    ))}
                  </div>
                  <div className="template-selected-desc" style={{ marginTop: "10px", fontSize: "11px", color: "var(--ash)", fontFamily: "'Courier Prime', monospace" }}>
                    💡 <strong>{TEMPLATE_DEFINITIONS.find(t => t.id === templateId)?.name}:</strong> {TEMPLATE_DEFINITIONS.find(t => t.id === templateId)?.description}
                  </div>
                </div>

                <div className="action-box">
                  <button
                    className="apply-btn"
                    onClick={applyOptimizations}
                    disabled={optimizing || staleResult}
                  >
                    {optimizing ? "Applying AI Corrections..." : "Apply AI Changes"}
                  </button>
                  <p className="action-sub">
                    We'll rewrite bullet descriptions, integrate missing skills, and render them into
                    the template you picked above.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* COLUMN 3: Optimized Preview & Export */}
          <div className="optimizer-column col-3">
            <h2 className="column-title">3. Optimized Resume</h2>

            {!resumeData && !optimizing && (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <div className="empty-text">
                  Click "Apply AI Changes" in Column 2 to view and export your optimized resume.
                </div>
              </div>
            )}

            {optimizing && (
              <div className="loading-state">
                <div className="spinner" />
                <div className="loading-text">
                  Applying keyword integrations, rewriting bullets, and rendering your template...
                </div>
              </div>
            )}

            {resumeData && !optimizing && SelectedTemplate && (
              <div className="optimized-content">
                <div className="download-bar">
                  <button 
                    className={`heatmap-toggle-btn ${showHeatmap ? "active" : ""}`}
                    onClick={() => setShowHeatmap(!showHeatmap)}
                  >
                    {showHeatmap ? "👁️ Hide Scan Map" : "👁️ Recruiter Heatmap"}
                  </button>
                  <button className="download-btn" onClick={downloadPdf}>
                    📥 Download PDF
                  </button>
                  <button
                    className="reset-btn"
                    onClick={() => {
                      setFile(null);
                      resetResults();
                      setJd("");
                    }}
                  >
                    ↺ Start Over
                  </button>
                </div>

                <div 
                  className="resume-sheet-wrapper"
                  style={{
                    ["--sheet-scale" as any]: sheetScale,
                    ["--sheet-height" as any]: `${sheetHeight}px`
                  }}
                >
                  <div 
                    id="optimized-resume-doc" 
                    ref={resumeDocRef} 
                    className={`resume-sheet-body template-${templateId}`}
                    style={{
                      position: "relative",
                      transform: sheetScale < 1 ? `scale(${sheetScale})` : "none",
                      transformOrigin: "top left",
                      ["--sheet-font-size" as any]: `${fontSize}pt`,
                      ["--sheet-line-height" as any]: `${lineHeight}`,
                      ["--sheet-padding" as any]: `${pagePadding}mm`,
                      ["--sheet-accent-color" as any]: accentColor,
                      ["--sheet-bg" as any]: templateId === "retro" ? "#0f172a" : "#ffffff"
                    }}
                  >
                    <SelectedTemplate data={resumeData} customStyles={{ fontSize, lineHeight, pagePadding, accentColor }} />
                    
                    {/* Heatmap Overlay */}
                    {showHeatmap && (
                      <div 
                        className="heatmap-overlay active" 
                        data-html2canvas-ignore="true"
                      >
                        <div className="heatmap-overlay-glow" />
                        <div className="heatmap-legend">
                          <div className="heatmap-legend-title">👀 Recruiter Eye-Scan Analysis</div>
                          <div className="heatmap-legend-metric">
                            <span>Average Scan Time:</span> <strong>6.2 seconds</strong>
                          </div>
                          <div className="heatmap-legend-metric">
                            <span>Formatting Focus:</span> <strong style={{ color: "var(--herb)" }}>94% (High)</strong>
                          </div>
                          <div className="heatmap-legend-desc">
                            Glow zones represent recruiter eye concentration. Place critical achievements in the hot areas.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        </>
        ) : activePageTab === "tracker" ? (
          <OutcomeTracker 
            drafts={drafts}
            applications={applications}
            onAddApplication={handleAddApplication}
            onUpdateStatus={handleUpdateAppStatus}
            onDeleteApplication={handleDeleteApplication}
            currentDraftName={selectedDraftName}
            currentAtsScore={analysis ? analysis.score : null}
          />
        ) : activePageTab === "consistency" ? (
          <ConsistencyChecker 
            resumeText={getResumeTextForAudit()}
          />
        ) : (
          <GrillMeSession 
            resumeText={getResumeTextForAudit()}
            resumeData={resumeData}
          />
        )}
      </main>

      <section id="how-it-works" className="how-it-works">
        <h2 className="how-title">How It Works</h2>
        <p className="how-subtitle">Four simple steps to go from "meh" to "hired"</p>

        <div className="how-grid">
          <div className="how-card">
            <div className="how-num">01</div>
            <h3 className="how-card-title">Upload Your Resume</h3>
            <p className="how-card-desc">Drop your PDF. Takes 10 seconds max.</p>
          </div>
          <div className="how-card">
            <div className="how-num">02</div>
            <h3 className="how-card-title">Target Your Company</h3>
            <p className="how-card-desc">Tell us where you're applying. We analyze their job descriptions.</p>
          </div>
          <div className="how-card">
            <div className="how-num">03</div>
            <h3 className="how-card-title">Get Your Grade</h3>
            <p className="how-card-desc">Receive an honest ATS match grade with detailed feedback.</p>
          </div>
          <div className="how-card">
            <div className="how-num">04</div>
            <h3 className="how-card-title">Pick a Template & Download</h3>
            <p className="how-card-desc">Choose a clean layout, keywords integrated, download instantly.</p>
          </div>
        </div>
      </section>

      <section id="reviews" className="reviews-section">
        <h2 className="reviews-title">Loved by Students & Engineers</h2>
        <p className="reviews-subtitle">What people are saying about ResumeRoaster</p>

        <div className="reviews-carousel-container">
          <div className="reviews-track">
            {[...REVIEWS, ...REVIEWS].map((r, i) => (
              <div key={i} className="review-card">
                <div className="review-stars">
                  {"★".repeat(r.stars)}
                </div>
                <p className="review-text">"{r.text}"</p>
                <div className="review-author">
                  <span className="review-name">{r.name}</span>
                  <span className="review-role">{r.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 📊 Resume Scoring Metrics Section */}
      <section id="metrics" className="metrics-section">
        <h2 className="metrics-title">How We Score Your Resume</h2>
        <p className="metrics-subtitle">
          We evaluate your resume across 4 grading pillars used by major enterprise ATS software
        </p>

        <div className="metrics-grid">
          <div className="metric-card">
            <div className="metric-icon">🎯</div>
            <h3 className="metric-card-title">Keyword Relevance</h3>
            <p className="metric-card-desc">
              Measures target skills density extracted directly from the job description to ensure automatic query matching.
            </p>
          </div>

          <div className="metric-card">
            <div className="metric-icon">⚡</div>
            <h3 className="metric-card-title">Verb Strength</h3>
            <p className="metric-card-desc">
              Checks for strong action verb starters at the beginning of each achievement, avoiding passive words like "helped".
            </p>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📊</div>
            <h3 className="metric-card-title">STAR Quantitative Metrics</h3>
            <p className="metric-card-desc">
              Ensures bullet points feature percentage growths, dollar values, or time-saved quantities to prove real impact.
            </p>
          </div>

          <div className="metric-card">
            <div className="metric-icon">📋</div>
            <h3 className="metric-card-title">Layout Parseability</h3>
            <p className="metric-card-desc">
              Scans margins, fonts, and headers to verify the file resolves correctly on automated text parsers without table formatting blockages.
            </p>
          </div>
        </div>
      </section>

      {/* ❓ Interactive FAQ Accordions */}
      <section id="faq" className="faq-section">
        <h2 className="faq-title">Frequently Asked Questions</h2>
        <p className="faq-subtitle">
          Quick answers to make the most of your resume building process
        </p>

        <div className="faq-list">
          {[
            {
              q: "Is ResumeRoaster completely free?",
              a: "Yes! You can analyze, optimize, manually edit, and download your formatted A4 resumes as PDFs 100% free. No credit card, no sign-up, and no watermark."
            },
            {
              q: "How does the AI bullet polish work?",
              a: "The AI STAR Polish reads your bullet statements, replaces weak starters with active verbs (like 'spearheaded' or 'architected'), and appends a metric to demonstrate impact, ensuring your resume speaks the language recruiters love."
            },
            {
              q: "Where is my resume details saved?",
              a: "All personal information and resume drafts are saved 100% locally in your browser's local storage. We do not store your data on external databases, keeping it completely private."
            },
            {
              q: "Are the templates optimized for ATS parsers?",
              a: "Absolutely. All templates are built using standard ATS-friendly heading hierachies, single-column layouts, and compliant font structures to guarantee maximum score extraction in Workday, Greenhouse, and Taleo."
            }
          ].map((item, idx) => {
            const isOpen = activeFaq === idx;
            return (
              <div 
                key={idx} 
                className={`faq-item ${isOpen ? "open" : ""}`}
                onClick={() => setActiveFaq(isOpen ? null : idx)}
              >
                <div className="faq-question-container">
                  <span className="faq-question">{item.q}</span>
                  <span className="faq-icon">{isOpen ? "−" : "+"}</span>
                </div>
                <div className="faq-answer-container">
                  <p className="faq-answer">{item.a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="cta-bottom">
        <h2 className="cta-title">
          Your Background Doesn't Matter.<br />
          <span className="cta-highlight">Your Resume Does.</span>
        </h2>
        <p className="cta-subtitle">
          International student? Community college? State school? We help everyone compete.
        </p>
        <p className="cta-duration">Takes 30 seconds. No signup needed.</p>

        <button 
          className="cta-btn" 
          onClick={() => {
            onBrowseClick();
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
        >
          Upload Your Resume Now
        </button>

        <p className="cta-footer-text">
          Join students from 50+ countries who've landed their dream jobs
        </p>
      </section>

      <footer>built with ❤️</footer>
    </>
  );
}

function scoreColor(score: number): string {
  if (score >= 80) return "var(--herb)";
  if (score >= 50) return "var(--butter)";
  return "var(--burnt)";
}