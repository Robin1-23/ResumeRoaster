import type { ResumeData } from "./resume-types";

export interface RedFlagIssue {
  id: string;
  name: string;
  passed: boolean;
  message: string;
}

const PASSIVE_WORDS = ["helped", "assisted", "worked", "responsible", "handled", "collaborated", "participated", "supported"];
const PRONOUNS = ["i", "my", "we", "our", "their", "the", "a", "an", "this"];
const PRESENT_TENSE_VERBS = ["develop", "implement", "manage", "create", "build", "maintain", "lead", "coordinate", "support", "design", "write"];

export function auditRedFlags(resumeData: ResumeData | null, rawText: string | null): RedFlagIssue[] {
  const issues: RedFlagIssue[] = [];

  // 1. Missing Contact Details
  let hasEmail = false;
  let hasPhone = false;
  if (resumeData) {
    hasEmail = !!resumeData.contact.email?.trim();
    hasPhone = !!resumeData.contact.phone?.trim();
  } else if (rawText) {
    const textLower = rawText.toLowerCase();
    hasEmail = /[\w.-]+@[\w.-]+\.\w+/.test(textLower);
    hasPhone = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\+?\d{1,4}[-.\s]?\d{1,10}\b/.test(textLower);
  }
  issues.push({
    id: "contact",
    name: "Contact Information",
    passed: hasEmail && hasPhone,
    message: !hasEmail && !hasPhone 
      ? "Both email and phone number are missing from your contact details."
      : !hasEmail 
      ? "Email address is missing. Recruiters cannot reach out to schedule screens."
      : !hasPhone 
      ? "Phone number is missing. Automated parsers frequently reject empty contact sections."
      : "Email and phone numbers are present and parsed correctly."
  });

  // 2. Resume Word Count / Page Length
  let wordCount = 0;
  if (resumeData) {
    const dataStr = JSON.stringify(resumeData);
    wordCount = (dataStr.match(/\b\w+\b/g) || []).length;
  } else if (rawText) {
    wordCount = (rawText.match(/\b\w+\b/g) || []).length;
  }
  const lengthPassed = wordCount <= 850;
  issues.push({
    id: "length",
    name: "Resume Word Count",
    passed: lengthPassed,
    message: lengthPassed 
      ? `Word count is optimal (${wordCount} words). Fit for a single A4 page.`
      : `Resume has ${wordCount} words. High risk of exceeding 1 page. Trim corporate jargon.`
  });

  // 3. Missing Dates on Experience
  let datesPassed = true;
  let dateMessage = "All experience entries include dates.";
  if (resumeData) {
    const missingDateEntries = resumeData.experience.filter(exp => !exp.dates?.trim());
    if (missingDateEntries.length > 0) {
      datesPassed = false;
      dateMessage = `Missing dates in experience: "${missingDateEntries.map(e => e.organization).join(", ")}". Employment dates are mandatory for background verification.`;
    }
  } else if (rawText) {
    // Basic search check: find lines without numeric years
    const lines = rawText.split("\n");
    const experienceLineIdx = lines.findIndex(l => /experience|employment|history/i.test(l));
    if (experienceLineIdx !== -1) {
      const expSection = lines.slice(experienceLineIdx, experienceLineIdx + 15).join("\n");
      const hasYear = /\b(19|20)\d{2}\b/g.test(expSection);
      if (!hasYear) {
        datesPassed = false;
        dateMessage = "No employment years (e.g. 2024, 2025) found in the parsed text.";
      }
    }
  }
  issues.push({
    id: "dates",
    name: "Employment Timelines",
    passed: datesPassed,
    message: dateMessage
  });

  // 4. Passive Language Overload
  let passivePassed = true;
  let passiveMessage = "Good starting verb selection. No passive language overload detected.";
  if (resumeData) {
    let passiveCount = 0;
    let totalBullets = 0;
    resumeData.experience.forEach(exp => {
      exp.bullets.forEach(b => {
        totalBullets++;
        const words = b.toLowerCase().split(/\s+/);
        if (PASSIVE_WORDS.includes(words[0])) {
          passiveCount++;
        }
      });
    });

    if (totalBullets > 0) {
      const ratio = passiveCount / totalBullets;
      if (ratio > 0.3) {
        passivePassed = false;
        passiveMessage = `${Math.round(ratio * 100)}% of bullets start with passive phrases (helped, assisted, worked on). Replace with action verbs like "engineered" or "spearheaded".`;
      }
    }
  }
  issues.push({
    id: "passive",
    name: "Passive Language Check",
    passed: passivePassed,
    message: passiveMessage
  });

  // 5. Missing Action Verbs (Bullets starting with pronouns or articles)
  let actionPassed = true;
  let actionMessage = "No pronoun/article starters found. Bullets begin with direct tech verbs.";
  if (resumeData) {
    const invalidBullets: string[] = [];
    resumeData.experience.forEach(exp => {
      exp.bullets.forEach(b => {
        const firstWord = b.trim().toLowerCase().split(/\s+/)[0];
        if (PRONOUNS.includes(firstWord)) {
          invalidBullets.push(b);
        }
      });
    });

    if (invalidBullets.length > 0) {
      actionPassed = false;
      actionMessage = `Found bullets starting with pronouns or articles (e.g. "${invalidBullets[0].substring(0, 30)}..."). Bullets must start directly with verbs.`;
    }
  }
  issues.push({
    id: "action-starters",
    name: "Action Verb Starters",
    passed: actionPassed,
    message: actionMessage
  });

  // 6. Inconsistent Tense (Past jobs using present-tense verbs)
  let tensePassed = true;
  let tenseMessage = "Tense matches job timelines (past jobs use past-tense verbs).";
  if (resumeData) {
    const mismatchedCompanies: string[] = [];
    resumeData.experience.forEach(exp => {
      const isPastJob = exp.dates && 
                        exp.dates.toLowerCase().includes("20") && 
                        !exp.dates.toLowerCase().includes("present") && 
                        !exp.dates.toLowerCase().includes("current");
      if (isPastJob) {
        exp.bullets.forEach(b => {
          const firstWord = b.trim().toLowerCase().split(/\s+/)[0];
          if (PRESENT_TENSE_VERBS.includes(firstWord)) {
            mismatchedCompanies.push(exp.organization);
          }
        });
      }
    });

    if (mismatchedCompanies.length > 0) {
      tensePassed = false;
      tenseMessage = `Past role at "${mismatchedCompanies[0]}" contains present-tense bullets (e.g. "Develop", "Manage"). Use past-tense ("Developed", "Managed").`;
    }
  }
  issues.push({
    id: "tense",
    name: "Verb Tense Consistency",
    passed: tensePassed,
    message: tenseMessage
  });

  return issues;
}
