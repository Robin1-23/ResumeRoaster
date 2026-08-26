export interface ConsistencyResult {
  overallScore: number;
  categories: {
    timeline: {
      score: number;
      status: "PASS" | "WARN" | "FAIL";
      findings: string[];
    };
    titles: {
      score: number;
      status: "PASS" | "WARN" | "FAIL";
      findings: string[];
    };
    skills: {
      score: number;
      status: "PASS" | "WARN" | "FAIL";
      findings: string[];
    };
  };
  suggestions: string[];
}

export function analyzeConsistencyHeuristic(
  resumeText: string,
  linkedinText: string,
  githubText: string,
  portfolioText: string
): ConsistencyResult {
  const resumeLower = resumeText.toLowerCase();
  const linkedinLower = linkedinText.toLowerCase();
  const githubLower = githubText.toLowerCase();
  const portfolioLower = portfolioText.toLowerCase();

  const timelineFindings: string[] = [];
  const titlesFindings: string[] = [];
  const skillsFindings: string[] = [];
  const suggestions: string[] = [];

  let timelineScore = 100;
  let titlesScore = 100;
  let skillsScore = 100;

  // --- 1. TIMELINE & COMPANY ANALYSIS ---
  // Look for common years in text
  const years = Array.from({ length: 10 }, (_, i) => (2018 + i).toString());
  const resumeYears = years.filter(y => resumeLower.includes(y));
  const linkedinYears = years.filter(y => linkedinLower.includes(y));

  if (linkedinText.trim().length > 10) {
    const missingYears = resumeYears.filter(y => !linkedinYears.includes(y));
    if (missingYears.length > 0) {
      timelineScore -= missingYears.length * 10;
      timelineFindings.push(
        `Resume active timeline includes years (${missingYears.join(", ")}) which are not mentioned in your pasted LinkedIn profile.`
      );
      suggestions.push(
        `Ensure your LinkedIn profile covers the same work periods (specifically ${missingYears.join(", ")}) as your resume.`
      );
    }
  } else {
    timelineFindings.push("LinkedIn profile text not provided. Skipping detailed timeline matching.");
    timelineScore = 80;
  }

  // Check for common large tech companies or typical resume organizations if mentioned
  const commonTech = [
    "google", "meta", "netflix", "stripe", "amazon", "microsoft", "apple", "uber", "airbnb", "salesforce",
    "shopify", "coinbase", "tesla", "twitter", "bytedance", "zoom", "adobe", "figma", "github", "gitlab"
  ];
  
  const resumeCompanies = commonTech.filter(c => resumeLower.includes(c));
  if (linkedinText.trim().length > 10 && resumeCompanies.length > 0) {
    const missingComps = resumeCompanies.filter(c => !linkedinLower.includes(c));
    if (missingComps.length > 0) {
      timelineScore -= missingComps.length * 15;
      missingComps.forEach(comp => {
        timelineFindings.push(
          `Resume lists experience at "${comp.toUpperCase()}", which is missing from your LinkedIn text.`
        );
        suggestions.push(
          `Add your employment at ${comp.toUpperCase()} to your LinkedIn experience section to prevent recruiter mismatch flags.`
        );
      });
    }
  }

  if (timelineFindings.length === 0 && linkedinText.trim().length > 10) {
    timelineFindings.push("Work experience timeline and companies match cleanly between Resume and LinkedIn.");
  }

  // --- 2. ROLES / JOB TITLE ALIGNMENT ---
  const roles = ["frontend", "backend", "fullstack", "software engineer", "developer", "architect", "data scientist", "product manager", "analyst"];
  const resumeRoles = roles.filter(r => resumeLower.includes(r));
  const linkedinRoles = roles.filter(r => linkedinLower.includes(r));

  if (linkedinText.trim().length > 10) {
    const missingRoles = resumeRoles.filter(r => !linkedinRoles.includes(r));
    if (missingRoles.length > 0) {
      titlesScore -= missingRoles.length * 10;
      titlesFindings.push(
        `Job role terms claimed on resume (${missingRoles.map(r => `"${r}"`).join(", ")}) do not appear in your LinkedIn titles/bio.`
      );
      missingRoles.forEach(role => {
        suggestions.push(
          `Incorporate the role title "${role.toUpperCase()}" into your LinkedIn headline or past job titles to establish consistency.`
        );
      });
    }
  } else {
    titlesFindings.push("LinkedIn profile text not provided. Skipping detailed job title alignment check.");
    titlesScore = 80;
  }

  if (titlesFindings.length === 0 && linkedinText.trim().length > 10) {
    titlesFindings.push("Core job titles and primary technical roles align correctly across platforms.");
  }

  // --- 3. SKILLS & GITHUB PROOF ---
  const coreTech = [
    "react", "angular", "vue", "typescript", "javascript", "python", "golang", "rust",
    "kubernetes", "docker", "aws", "gcp", "node", "django", "graphql", "sql", "nosql"
  ];
  const resumeSkills = coreTech.filter(s => resumeLower.includes(s));
  const githubSkills = coreTech.filter(s => githubLower.includes(s));

  if (githubText.trim().length > 10) {
    // Check if skills on resume are backed by GitHub projects
    const unprovenSkills = resumeSkills.filter(s => !githubSkills.includes(s));
    if (unprovenSkills.length > 0) {
      skillsScore -= unprovenSkills.length * 8;
      skillsFindings.push(
        `Resume emphasizes skills (${unprovenSkills.join(", ")}) which are not backed by any visible repositories on GitHub.`
      );
      unprovenSkills.forEach(skill => {
        suggestions.push(
          `Pin or create public repositories on GitHub demonstrating your work with ${skill.toUpperCase()} to provide proof of skills.`
        );
      });
    }

    const provenSkills = resumeSkills.filter(s => githubSkills.includes(s));
    if (provenSkills.length > 0) {
      skillsFindings.push(
        `Proven: Technical claims for ${provenSkills.join(", ")} are verified by your public GitHub repositories.`
      );
    }
  } else {
    skillsFindings.push("GitHub username not provided. Cannot verify skills using public repository data.");
    skillsScore = 70;
  }

  // Check Portfolio website if provided
  if (portfolioText.trim().length > 10) {
    const portfolioSkills = coreTech.filter(s => portfolioLower.includes(s));
    const missingInPortfolio = resumeSkills.filter(s => !portfolioSkills.includes(s));
    if (missingInPortfolio.length > 3) {
      skillsScore -= 10;
      skillsFindings.push(
        `Your portfolio website is missing mentions of key skills listed on your resume (e.g. ${missingInPortfolio.slice(0, 3).join(", ")}).`
      );
      suggestions.push(
        `Update the bio/skills section of your personal portfolio website to include ${missingInPortfolio.slice(0, 3).join(", ")}.`
      );
    }
  }

  // Normalize scores between 10 and 100
  timelineScore = Math.max(10, Math.min(100, timelineScore));
  titlesScore = Math.max(10, Math.min(100, titlesScore));
  skillsScore = Math.max(10, Math.min(100, skillsScore));

  const overallScore = Math.round((timelineScore + titlesScore + skillsScore) / 3);

  const getStatus = (score: number) => {
    if (score >= 85) return "PASS";
    if (score >= 60) return "WARN";
    return "FAIL";
  };

  return {
    overallScore,
    categories: {
      timeline: {
        score: timelineScore,
        status: getStatus(timelineScore),
        findings: timelineFindings
      },
      titles: {
        score: titlesScore,
        status: getStatus(titlesScore),
        findings: titlesFindings
      },
      skills: {
        score: skillsScore,
        status: getStatus(skillsScore),
        findings: skillsFindings
      }
    },
    suggestions: suggestions.length > 0 ? suggestions : ["Your profiles look perfectly aligned across platforms! Good job."]
  };
}
