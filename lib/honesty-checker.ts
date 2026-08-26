import type { ResumeData } from "./resume-types";

export interface HonestyIssue {
  skill: string;
  roast: string;
}

const ROASTS: Record<string, string[]> = {
  python: [
    "Listed Python in skills but zero evidence of it. Did you print 'Hello World' once and call it a day?",
    "Claimed Python but forgot to mention where or how you used it. A classic keyword-stuffer move."
  ],
  react: [
    "Claims React skills but no React projects or bullets. Are you sure you didn't just import it and close the tab?",
    "Claims React but zero React context elsewhere. Recruiters will smell this bluff instantly."
  ],
  docker: [
    "Docker is in your skills but missing in experiences. Can you write a multi-stage Dockerfile or did you just pull hello-world?",
    "Claimed Docker but no evidence. You're containerizing nothing but lies."
  ],
  kubernetes: [
    "Kubernetes listed but absent in work history. Did you spin up a minikube cluster on localhost once?",
    "Kubernetes in skills, zero mentions in bullets. Don't let recruiters check your pod logs."
  ],
  golang: [
    "Go listed but zero references in bullets. Go directly to jail, do not pass Go, do not collect $200."
  ],
  aws: [
    "AWS listed, zero mentions in bullet points. Deploying to Vercel isn't cloud architecture."
  ],
  typescript: [
    "TypeScript in skills but not mentioned in experience. Are you just writing JavaScript with type: any?"
  ],
  javascript: [
    "JavaScript listed but not in bullet points. Let's hope you know what 'this' means."
  ],
  rust: [
    "Rust in skills but zero mentions. Let me guess, you read the Book but never compiled a line."
  ]
};

const DEFAULT_ROASTS = [
  "Listed in skills but never mentioned in your experience, projects, or education. Recruiters will grill you on this.",
  "Listed as a skill with absolutely zero evidence in the rest of your resume. Are you just keyword-stuffing?",
  "Listed in your skills section but has 0 supporting mentions in your bullets. Looks like an empty claim."
];

function getRandomRoast(skill: string): string {
  const normalized = skill.toLowerCase().trim();
  const matched = ROASTS[normalized];
  if (matched && matched.length > 0) {
    return matched[Math.floor(Math.random() * matched.length)];
  }
  const randomDefault = DEFAULT_ROASTS[Math.floor(Math.random() * DEFAULT_ROASTS.length)];
  return `"${skill}" is listed as a skill but has zero backing evidence. ${randomDefault}`;
}

export function detectHonestyGaps(resumeData: ResumeData): HonestyIssue[] {
  if (!resumeData) return [];

  // Construct a search corpus of everything outside the skills section
  const contactText = resumeData.contact.links?.join(" ") || "";
  const expText = resumeData.experience.map(e => `${e.organization} ${e.role} ${e.dates} ${e.bullets.join(" ")}`).join(" ");
  const projText = resumeData.projects?.map(p => `${p.name} ${p.dates} ${p.bullets.join(" ")}`).join(" ") || "";
  const eduText = resumeData.education.map(e => `${e.school} ${e.degree} ${e.dates} ${e.details?.join(" ") || ""}`).join(" ");
  const summaryText = resumeData.summary || "";
  const certsText = resumeData.certifications?.join(" ") || "";

  const corpus = `${contactText} ${expText} ${projText} ${eduText} ${summaryText} ${certsText}`.toLowerCase();

  const issues: HonestyIssue[] = [];

  resumeData.skills.forEach(group => {
    group.items.forEach(skill => {
      const cleanSkill = skill.trim();
      if (!cleanSkill) return;

      const skillLower = cleanSkill.toLowerCase();
      
      let hasEvidence = false;
      try {
        if (/^[a-zA-Z0-9]+$/.test(skillLower)) {
          const regex = new RegExp(`\\b${skillLower}\\b`, "i");
          hasEvidence = regex.test(corpus);
        } else {
          hasEvidence = corpus.includes(skillLower);
        }
      } catch (e) {
        hasEvidence = corpus.includes(skillLower);
      }

      if (!hasEvidence) {
        issues.push({
          skill: cleanSkill,
          roast: getRandomRoast(cleanSkill)
        });
      }
    });
  });

  return issues;
}

export function detectHonestyGapsRaw(rawText: string): HonestyIssue[] {
  const text = rawText.replace(/\r/g, "");

  // Look for a skills section: e.g. "SKILLS", "TECHNICAL SKILLS", "TECHNOLOGIES"
  const skillsHeaderRegex = /(?:technical\s+)?(?:skills|technologies|expertise|proficiencies|tools)\b/gi;
  let match;
  let skillsSection = "";
  let skillsStartIndex = -1;

  while ((match = skillsHeaderRegex.exec(text)) !== null) {
    skillsStartIndex = match.index + match[0].length;
  }

  if (skillsStartIndex === -1) return [];

  // Get content from the skills section starting index to the next section or end of text.
  const nextSectionRegex = /\n\s*(?:experience|projects|education|employment|work|history|certifications|awards|summary)\b/i;
  const remainingText = text.substring(skillsStartIndex);
  const nextMatch = nextSectionRegex.exec(remainingText);
  
  if (nextMatch) {
    skillsSection = remainingText.substring(0, nextMatch.index);
  } else {
    skillsSection = remainingText;
  }

  // Split skillsSection by commas, semicolons, bullets, and newlines
  const rawSkills = skillsSection
    .split(/[,\n•*|●■▪◦○♦✓\t]/)
    .map(s => s.trim())
    .filter(s => s.length > 1 && s.length < 30); // skip very short or long fragments

  // Search corpus is everything *outside* the skills section
  const searchCorpus = (text.substring(0, skillsStartIndex - 5) + 
                        (nextMatch ? remainingText.substring(nextMatch.index) : "")).toLowerCase();

  const issues: HonestyIssue[] = [];

  rawSkills.forEach(skill => {
    const skillLower = skill.toLowerCase();
    const stopWords = ["and", "or", "with", "other", "using", "proficient", "intermediate", "advanced", "knowledge", "working"];
    if (stopWords.includes(skillLower)) return;

    let hasEvidence = false;
    try {
      if (/^[a-zA-Z0-9]+$/.test(skillLower)) {
        const regex = new RegExp(`\\b${skillLower}\\b`, "i");
        hasEvidence = regex.test(searchCorpus);
      } else {
        hasEvidence = searchCorpus.includes(skillLower);
      }
    } catch (e) {
      hasEvidence = searchCorpus.includes(skillLower);
    }

    if (!hasEvidence) {
      issues.push({
        skill,
        roast: getRandomRoast(skill)
      });
    }
  });

  return issues;
}
