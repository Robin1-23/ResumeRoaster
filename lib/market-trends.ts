export interface SkillTrend {
  skill: string;
  trend: "declining" | "emerging";
  description: string;
}

const FE_DECAY: SkillTrend[] = [
  { skill: "jquery", trend: "declining", description: "jQuery demand has decayed to support legacy only. Modern roles expect React, Next.js, or Svelte." },
  { skill: "webpack", trend: "declining", description: "Webpack is dropping in new setups. Vite or Turbopack are preferred for speed." },
  { skill: "bootstrap", trend: "declining", description: "Bootstrap is being replaced by TailwindCSS and headless component libraries (shadcn/ui)." },
  { skill: "redux", trend: "declining", description: "Redux is falling out of favor for lighter state tools like Zustand, Jotai, or React Context." }
];

const FE_EMERGING: SkillTrend[] = [
  { skill: "next.js", trend: "emerging", description: "Next.js App Router and Server Actions are in huge demand for modern production stacks." },
  { skill: "tailwind css", trend: "emerging", description: "Tailwind has become the default styling tool across startups and enterprise setups." },
  { skill: "zustand", trend: "emerging", description: "Zustand is highly valued for simple, fast, and light frontend state management." },
  { skill: "typescript", trend: "emerging", description: "TypeScript is now a hard filter for over 85% of frontend role postings." }
];

const BE_DECAY: SkillTrend[] = [
  { skill: "php", trend: "declining", description: "PHP (outside of Laravel) is seeing declining share in new startup infrastructures." },
  { skill: "rest", trend: "declining", description: "Basic REST is losing share to GraphQL and type-safe protocols like tRPC or gRPC." },
  { skill: "java 8", trend: "declining", description: "Companies are upgrading legacy systems to Java 17/21 or moving services to Go." }
];

const BE_EMERGING: SkillTrend[] = [
  { skill: "go", trend: "emerging", description: "Go is fast becoming the default language for scalable backend microservices." },
  { skill: "trpc", trend: "emerging", description: "tRPC is highly sought after for end-to-end type safety between Next.js and backends." },
  { skill: "vector databases", trend: "emerging", description: "Pinecone, Pgvector, and Chroma are surging due to AI RAG integrations." },
  { skill: "rust", trend: "emerging", description: "Rust is trending up for memory-safety and CPU-bound infrastructure tooling." }
];

const DO_DECAY: SkillTrend[] = [
  { skill: "jenkins", trend: "declining", description: "Jenkins is dropping. Modern setups require declarative YAML configs like GitHub Actions." },
  { skill: "chef", trend: "declining", description: "Chef and Puppet are falling behind declarative IaC tools like Terraform and Ansible." }
];

const DO_EMERGING: SkillTrend[] = [
  { skill: "terraform", trend: "emerging", description: "Terraform is a mandatory filter for modern Infrastructure-as-Code roles." },
  { skill: "kubernetes", trend: "emerging", description: "Kubernetes knowledge is demanded for almost all scale orchestration roles." },
  { skill: "github actions", trend: "emerging", description: "GitHub Actions leads modern cloud-native CI/CD automation pipelines." }
];

const PM_DECAY: SkillTrend[] = [
  { skill: "waterfall", trend: "declining", description: "Waterfall PM methodologies have completely decayed in favor of agile iterations." },
  { skill: "microsoft project", trend: "declining", description: "Standard MS Project has lost the startup market to Jira, Notion, or Linear." }
];

const PM_EMERGING: SkillTrend[] = [
  { skill: "figma", trend: "emerging", description: "Product Managers are expected to review designs and edit wireframes directly in Figma." },
  { skill: "posthog", trend: "emerging", description: "Data-driven product analytics (PostHog, Mixpanel) are highly sought after." },
  { skill: "linear", trend: "emerging", description: "Linear is highly trending for high-speed startup issue tracking." }
];

const GEN_DECAY: SkillTrend[] = [
  { skill: "svn", trend: "declining", description: "Subversion is entirely obsolete. Git is the universal version control default." },
  { skill: "ftp", trend: "declining", description: "Direct FTP uploads are replaced by CI/CD git-push deployments." }
];

const GEN_EMERGING: SkillTrend[] = [
  { skill: "git", trend: "emerging", description: "Git version control and pull request workflows are mandatory prerequisites." },
  { skill: "docker", trend: "emerging", description: "Container containerization is expected of all modern developer roles." }
];

export function classifyTargetRole(title: string): string {
  const t = title.toLowerCase();
  if (t.includes("frontend") || t.includes("react") || t.includes("web developer")) {
    return "frontend";
  }
  if (t.includes("backend") || t.includes("systems") || t.includes("software engineer") || t.includes("developer")) {
    return "backend";
  }
  if (t.includes("devops") || t.includes("infrastructure") || t.includes("cloud") || t.includes("sre")) {
    return "devops";
  }
  if (t.includes("product manager") || t.includes("pm") || t.includes("scrum")) {
    return "product";
  }
  return "general";
}

export function getMarketTrends(roleDomain: string): { decaying: SkillTrend[]; emerging: SkillTrend[] } {
  switch (roleDomain) {
    case "frontend":
      return { decaying: FE_DECAY, emerging: FE_EMERGING };
    case "backend":
      return { decaying: BE_DECAY, emerging: BE_EMERGING };
    case "devops":
      return { decaying: DO_DECAY, emerging: DO_EMERGING };
    case "product":
      return { decaying: PM_DECAY, emerging: PM_EMERGING };
    default:
      return { decaying: GEN_DECAY, emerging: GEN_EMERGING };
  }
}
