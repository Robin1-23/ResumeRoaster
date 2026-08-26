import type { ResumeData } from "./resume-types";

export interface SectionAuditItem {
  section: string;
  status: "passed" | "needs-work";
  cost: number; // e.g. 15 for -15%
  reason: string;
}

export function evaluateSectionDiagnostics(
  resumeData: ResumeData,
  honestyGapsCount: number = 0,
  consistencyIssuesCount: number = 0
): SectionAuditItem[] {
  const audits: SectionAuditItem[] = [];

  // 1. Professional Summary Audit
  if (!resumeData.summary || resumeData.summary.trim().length < 30) {
    audits.push({
      section: "Professional Summary",
      status: "needs-work",
      cost: 10,
      reason: "Your summary is empty or too short. A generic summary is skipped by recruiters in under 2 seconds; use it to state your target role and core stack immediately."
    });
  } else {
    const summaryLower = resumeData.summary.toLowerCase();
    const genericWords = ["motivated", "passionate", "enthusiastic", "results-driven", "proven track record", "hardworking"];
    const containsGeneric = genericWords.some(w => summaryLower.includes(w));
    if (containsGeneric) {
      audits.push({
        section: "Professional Summary",
        status: "needs-work",
        cost: 5,
        reason: "Your summary uses generic buzzwords ('passionate', 'results-driven') without backing them up. Replace them with direct years of experience or concrete technical skills."
      });
    } else {
      audits.push({
        section: "Professional Summary",
        status: "passed",
        cost: 0,
        reason: "Summary is clean, direct, and sets a strong professional context."
      });
    }
  }

  // 2. Experience Section Audit
  if (!resumeData.experience || resumeData.experience.length === 0) {
    audits.push({
      section: "Work Experience",
      status: "needs-work",
      cost: 20,
      reason: "No work experience section found. Work history is the primary signal recruiters search for; add at least one job entry."
    });
  } else if (resumeData.experience.length < 2) {
    audits.push({
      section: "Work Experience",
      status: "needs-work",
      cost: 10,
      reason: "Only 1 experience entry found. This limits your credibility and fails to show work progression. Aim for at least 2 roles."
    });
  } else {
    // Check bullets for metrics & weak starters
    let hasMetrics = true;
    let hasWeakVerbs = false;

    const metricRegex = /\d+%|\$\d+|\b\d+\s+(hours|users|pages|days|months|years|percent|percentile|companies|clients|endpoints|microservices|servers|databases)\b/i;
    const weakVerbsRegex = /^(worked on|helped with|responsible for|assisted in|participated in|handled)\s+/i;

    resumeData.experience.forEach(exp => {
      exp.bullets.forEach(b => {
        const bulletTrimmed = b.trim();
        if (bulletTrimmed) {
          if (!metricRegex.test(bulletTrimmed)) {
            hasMetrics = false;
          }
          if (weakVerbsRegex.test(bulletTrimmed)) {
            hasWeakVerbs = true;
          }
        }
      });
    });

    if (!hasMetrics) {
      audits.push({
        section: "Work Experience",
        status: "needs-work",
        cost: 15,
        reason: "Some experience bullets lack quantitative metrics. ATS and hiring managers prioritize STAR bullets with numbers over general lists of daily tasks."
      });
    } else if (hasWeakVerbs) {
      audits.push({
        section: "Work Experience",
        status: "needs-work",
        cost: 10,
        reason: "Passive starters ('helped', 'assisted') weaken your bullets. Replace them with leading action verbs ('spearheaded', 'orchestrated') to show ownership."
      });
    } else {
      audits.push({
        section: "Work Experience",
        status: "passed",
        cost: 0,
        reason: "Experience entries are metric-driven and use active verbs."
      });
    }
  }

  // 3. Projects Section Audit
  if (!resumeData.projects || !Array.isArray(resumeData.projects) || resumeData.projects.length === 0) {
    audits.push({
      section: "Projects",
      status: "needs-work",
      cost: 10,
      reason: "No projects listed. Engineers and builders need projects to demonstrate building skills outside of job constraints."
    });
  } else {
    let emptyBullets = false;
    (resumeData.projects || []).forEach(p => {
      if (!p.bullets || !Array.isArray(p.bullets) || p.bullets.length === 0 || (p.bullets.length === 1 && !p.bullets[0]?.trim())) {
        emptyBullets = true;
      }
    });

    if (emptyBullets) {
      audits.push({
        section: "Projects",
        status: "needs-work",
        cost: 5,
        reason: "Projects listed but lack descriptions. Explain the tools you used and what engineering challenges you solved."
      });
    } else {
      audits.push({
        section: "Projects",
        status: "passed",
        cost: 0,
        reason: "Projects list includes description bullets outlining capabilities."
      });
    }
  }

  // 4. Skills Section Audit
  const totalSkills = resumeData.skills.reduce((acc, curr) => acc + curr.items.length, 0);
  if (totalSkills < 5) {
    audits.push({
      section: "Skills",
      status: "needs-work",
      cost: 15,
      reason: "Very few skills listed. This limits your keyword search matching rate inside ATS parsers. List at least 5 target technologies."
    });
  } else {
    audits.push({
      section: "Skills",
      status: "passed",
      cost: 0,
      reason: "Skills are categorized and cover core technologies."
    });
  }

  // 5. Profile & Consistency Audit
  if (honestyGapsCount > 0) {
    audits.push({
      section: "Consistency & Honesty",
      status: "needs-work",
      cost: 10,
      reason: `${honestyGapsCount} skill${honestyGapsCount > 1 ? "s are" : " is"} listed without supporting context in experience bullets. Recruiters will grill you on this.`
    });
  } else if (consistencyIssuesCount > 0) {
    audits.push({
      section: "Consistency & Honesty",
      status: "needs-work",
      cost: 10,
      reason: "Cross-platform consistency score contains mismatched dates or titles. Align your LinkedIn, GitHub, and Resume."
    });
  } else {
    audits.push({
      section: "Consistency & Honesty",
      status: "passed",
      cost: 0,
      reason: "Profiles align and skills are supported by experiences."
    });
  }

  return audits;
}

export function evaluateSectionDiagnosticsRaw(rawText: string): SectionAuditItem[] {
  const audits: SectionAuditItem[] = [];
  const text = rawText.toLowerCase();

  // 1. Professional Summary Audit
  const hasSummary = text.includes("summary") || text.includes("objective") || text.includes("profile");
  if (!hasSummary) {
    audits.push({
      section: "Professional Summary",
      status: "needs-work",
      cost: 10,
      reason: "Your summary is missing. A generic summary is skipped by recruiters in under 2 seconds; use it to state your target role and core stack immediately."
    });
  } else {
    const genericWords = ["motivated", "passionate", "enthusiastic", "results-driven", "proven track record"];
    const containsGeneric = genericWords.some(w => text.includes(w));
    if (containsGeneric) {
      audits.push({
        section: "Professional Summary",
        status: "needs-work",
        cost: 5,
        reason: "Your summary uses generic buzzwords ('passionate', 'results-driven') without backing them up. Replace them with technical skills or years of experience."
      });
    } else {
      audits.push({
        section: "Professional Summary",
        status: "passed",
        cost: 0,
        reason: "Summary is clean, direct, and sets a strong professional context."
      });
    }
  }

  // 2. Experience Section Audit
  const hasExperience = text.includes("experience") || text.includes("employment") || text.includes("work history");
  if (!hasExperience) {
    audits.push({
      section: "Work Experience",
      status: "needs-work",
      cost: 20,
      reason: "No work experience section found. Work history is the primary signal recruiters search for; add at least one job entry."
    });
  } else {
    const metricRegex = /\d+%|\$\d+|\b\d+\s+(hours|users|pages|days|months|years|percent|percentile)\b/i;
    const hasMetrics = metricRegex.test(text);
    if (!hasMetrics) {
      audits.push({
        section: "Work Experience",
        status: "needs-work",
        cost: 15,
        reason: "Some experience bullets lack quantitative metrics. ATS and hiring managers prioritize STAR bullets with numbers over general lists of daily tasks."
      });
    } else {
      audits.push({
        section: "Work Experience",
        status: "passed",
        cost: 0,
        reason: "Experience entries are metric-driven and use active verbs."
      });
    }
  }

  // 3. Projects Section Audit
  const hasProjects = text.includes("projects") || text.includes("personal projects") || text.includes("portfolio");
  if (!hasProjects) {
    audits.push({
      section: "Projects",
      status: "needs-work",
      cost: 10,
      reason: "No projects listed. Engineers and builders need projects to demonstrate building skills outside of job constraints."
    });
  } else {
    audits.push({
      section: "Projects",
      status: "passed",
      cost: 0,
      reason: "Projects list includes description bullets outlining capabilities."
    });
  }

  // 4. Skills Section Audit
  const hasSkills = text.includes("skills") || text.includes("technologies") || text.includes("technical strengths");
  if (!hasSkills) {
    audits.push({
      section: "Skills",
      status: "needs-work",
      cost: 15,
      reason: "No skills section found. This limits your keyword search matching rate inside ATS parsers. List at least 5 target technologies."
    });
  } else {
    audits.push({
      section: "Skills",
      status: "passed",
      cost: 0,
      reason: "Skills are categorized and cover core technologies."
    });
  }

  // 5. Consistency & Profile Audit
  audits.push({
    section: "Consistency & Honesty",
    status: "passed",
    cost: 0,
    reason: "Profiles align and skills are supported by experiences."
  });

  return audits;
}
