import type { ResumeData } from "./resume-types";

export interface RecruiterPersona {
  id: string;
  name: string;
  role: string;
  avatar: string;
  bias: string;
  score: number;
  verdict: "Approved" | "Borderline" | "Rejected";
  innerMonologue: string;
}

export function simulateRecruiterPanels(
  resumeData: ResumeData | null,
  originalText: string | null
): RecruiterPersona[] {
  // Construct search corpus
  let corpus = "";
  let companyCount = 0;
  let hasProjects = false;
  let projectCount = 0;
  let skillsCount = 0;

  if (resumeData) {
    const contactText = `${resumeData.contact.name} ${resumeData.contact.title || ""} ${resumeData.contact.links?.join(" ") || ""}`;
    const expText = resumeData.experience.map(e => `${e.organization} ${e.role} ${e.bullets.join(" ")}`).join(" ");
    const projText = resumeData.projects?.map(p => `${p.name} ${p.bullets.join(" ")}`).join(" ") || "";
    const eduText = resumeData.education.map(e => `${e.school} ${e.degree} ${e.details?.join(" ") || ""}`).join(" ");
    const skillsText = resumeData.skills.map(s => `${s.category} ${s.items.join(" ")}`).join(" ");
    
    corpus = `${contactText} ${expText} ${projText} ${eduText} ${skillsText}`.toLowerCase();
    companyCount = resumeData.experience.length;
    hasProjects = (resumeData.projects || []).length > 0;
    projectCount = (resumeData.projects || []).length;
    skillsCount = resumeData.skills.reduce((sum, curr) => sum + curr.items.length, 0);
  } else if (originalText) {
    corpus = originalText.toLowerCase();
    companyCount = (corpus.match(/experience|employment|work history/g) || []).length > 0 ? 2 : 1;
    hasProjects = corpus.includes("project") || corpus.includes("portfolio");
    projectCount = hasProjects ? 2 : 0;
    skillsCount = 8; // assume average
  }

  // 1. FAANG Recruiter (Sarah)
  let faangScore = 60;
  const faangBrands = ["google", "meta", "facebook", "apple", "amazon", "microsoft", "netflix", "stripe", "uber", "airbnb"];
  const eliteSchools = ["mit", "stanford", "harvard", "berkeley", "cmu", "caltech", "yale", "princeton", "columbia", "cornell"];
  
  const foundBrands = faangBrands.filter(b => corpus.includes(b));
  const foundSchools = eliteSchools.filter(s => corpus.includes(s));

  faangScore += foundBrands.length * 12;
  faangScore += foundSchools.length * 8;
  if (skillsCount > 12) faangScore += 8;
  if (companyCount < 2) faangScore -= 15;
  faangScore = Math.min(100, Math.max(10, faangScore));

  let faangMonologue = "";
  if (foundBrands.length > 0) {
    faangMonologue = `\"Nice! I spotted ${foundBrands[0].toUpperCase()} on their resume immediately. That brand stamp alone will make it easy to pass them past my recruiting manager. Education section looks standard. Pushing them to the top of the queue for a phone screen!\"`;
  } else if (foundSchools.length > 0) {
    faangMonologue = `\"They went to ${foundSchools[0].toUpperCase()}—that's a top feeder school. No FAANG internships, but they listed standard keywords like TypeScript and Kubernetes. We need headcount, so I'll pass them along to the technical screen.\"`;
  } else {
    faangMonologue = `\"The formatting is clean, but there are zero Tier-1 brand names or feeder schools on here. I have to read 200 of these a day. Without a brand pedigree, it's hard to justify referrals. Probably a pass unless a referral vouches for them.\"`;
  }

  // 2. Startup Founder (Dave)
  let startupScore = 55;
  if (hasProjects) startupScore += 15;
  if (projectCount >= 2) startupScore += 10;
  
  const scrappyKeywords = ["mvp", "0 to 1", "launched", "bootstrapped", "optimized", "scale", "user", "api", "growth", "pmf"];
  const foundScrappy = scrappyKeywords.filter(k => corpus.includes(k));
  startupScore += foundScrappy.length * 4;

  const corporateFluff = ["stakeholder", "alignment", "coordinated", "facilitated", "compliance", "assisted"];
  const foundFluff = corporateFluff.filter(f => corpus.includes(f));
  startupScore -= foundFluff.length * 5;
  startupScore = Math.min(100, Math.max(10, startupScore));

  let startupMonologue = "";
  if (hasProjects && foundScrappy.length > 2) {
    startupMonologue = `\"I don't care about their degrees or corporate titles. Look at their projects—they launched ResumeRoaster and talked about optimization. They can ship features fast. That's what a seed-stage startup needs. Get them on a call today.\"`;
  } else if (foundFluff.length > 2) {
    startupMonologue = `\"This reads like a corporate textbook. Lots of 'aligned stakeholders' and 'assisted with processes'—which is code for 'I sit in meetings all day'. I need builders who write code, not managers who look busy. Pass.\"`;
  } else {
    startupMonologue = `\"It's a decent resume, but it lacks a scrappy builder vibe. There aren't many independent side projects or launch metrics listed. Let's keep it in reserve, but look for candidates who built cool apps on GitHub first.\"`;
  }

  // 3. Corporate HR (Linda)
  let corpScore = 65;
  const isA4Compliant = corpus.includes("location") || corpus.includes("email") || corpus.includes("phone");
  if (isA4Compliant) corpScore += 10;
  if (skillsCount >= 8 && skillsCount <= 20) corpScore += 15;
  if (companyCount >= 2) corpScore += 10;
  if (corpus.includes("assisted") || corpus.includes("helped")) corpScore -= 10; // passive verbs
  corpScore = Math.min(100, Math.max(10, corpScore));

  let corpMonologue = "";
  if (corpScore >= 80) {
    corpMonologue = `\"The document structure parses perfectly into our Workday ATS software. Header information is complete. Standard headings (Experience, Education, Skills) are present. Meets the basic checklist requirement. Approved for hiring manager review.\"`;
  } else {
    corpMonologue = `\"This layout looks a bit customized. The skills list isn't matching our standard parser fields cleanly, or contact links are formatted strangely. I can't confirm they have all required keyword stamps. Rejecting to keep the pipeline clean.\"`;
  }

  // 4. Engineering Hiring Manager (Alex)
  let engScore = 50;
  const systemsTerms = ["concurrency", "distributed", "latency", "redis", "postgres", "microservices", "async", "cache", "testing", "docker", "kubernetes", "typescript"];
  const foundSystems = systemsTerms.filter(t => corpus.includes(t));
  engScore += foundSystems.length * 5;

  const weakBullets = ["worked on", "helped", "fixed bugs", "participated"];
  const hasWeak = weakBullets.some(w => corpus.includes(w));
  if (hasWeak) engScore -= 15;
  engScore = Math.min(100, Math.max(10, engScore));

  let engMonologue = "";
  if (foundSystems.length >= 4) {
    engMonologue = `\"They didn't just write code; they optimized database queries and talked about caching. They listed ${foundSystems.slice(0, 3).join(", ").toUpperCase()}. That shows engineering maturity and systems-level thinking. Pushing to technical panel interview.\"`;
  } else if (hasWeak) {
    engMonologue = `\"The bullets are too shallow. They say they 'worked on frontend' or 'helped maintain code'—but what was the engineering challenge? How did they solve state or memory bottlenecks? Pass. I need engineers, not script typers.\"`;
  } else {
    engMonologue = `\"This is a clean resume, but it lacks depth. They list the frameworks but don't explain the trade-offs they made. I'll pass them to the coding test, but they need to talk about architecture in the interview.\"`;
  }

  const getVerdict = (score: number) => {
    if (score >= 80) return "Approved";
    if (score >= 55) return "Borderline";
    return "Rejected";
  };

  return [
    {
      id: "faang",
      name: "Sarah Jenkins",
      role: "FAANG Technical Recruiter",
      avatar: "SJ",
      bias: "Cares about brand-name companies, elite universities, keyword densities, and clean structures.",
      score: faangScore,
      verdict: getVerdict(faangScore),
      innerMonologue: faangMonologue
    },
    {
      id: "startup",
      name: "Dave Chen",
      role: "Series-A Startup Founder",
      avatar: "DC",
      bias: "Cares about scrappy side projects, MVP speed, user growth traction, and raw shipping capability.",
      score: startupScore,
      verdict: getVerdict(startupScore),
      innerMonologue: startupMonologue
    },
    {
      id: "corp",
      name: "Linda Foster",
      role: "Corporate HR Screener",
      avatar: "LF",
      bias: "Cares about keyword compliance checklist, clear standard headings, and layout parsing stability.",
      score: corpScore,
      verdict: getVerdict(corpScore),
      innerMonologue: corpMonologue
    },
    {
      id: "eng",
      name: "Alex Mercer",
      role: "Engineering Hiring Manager",
      avatar: "AM",
      bias: "Cares about database scaling, latency optimizations, testing coverage, and architectural trade-offs.",
      score: engScore,
      verdict: getVerdict(engScore),
      innerMonologue: engMonologue
    }
  ];
}
