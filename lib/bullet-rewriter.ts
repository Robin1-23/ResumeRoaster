export function rewriteBulletsRoleSpecificHeuristic(bullets: string[], jd: string): string[] {
  const jdLower = jd.toLowerCase();

  // Classify JD
  let domain: "systems" | "frontend" | "growth" | "general" = "general";
  if (
    jdLower.includes("senior") ||
    jdLower.includes("lead") ||
    jdLower.includes("architect") ||
    jdLower.includes("scale") ||
    jdLower.includes("system") ||
    jdLower.includes("distributed") ||
    jdLower.includes("backend")
  ) {
    domain = "systems";
  } else if (
    jdLower.includes("frontend") ||
    jdLower.includes("react") ||
    jdLower.includes("ui") ||
    jdLower.includes("ux") ||
    jdLower.includes("client") ||
    jdLower.includes("typescript")
  ) {
    domain = "frontend";
  } else if (
    jdLower.includes("sales") ||
    jdLower.includes("marketing") ||
    jdLower.includes("growth") ||
    jdLower.includes("conversion") ||
    jdLower.includes("revenue") ||
    jdLower.includes("customer")
  ) {
    domain = "growth";
  }

  const actionVerbs = {
    systems: ["Architected", "Engineered", "Orchestrated", "Scaled", "Optimized", "Decoupled", "Redesigned"],
    frontend: ["Engineered", "Optimized", "Developed", "Crafted", "Redesigned", "Streamlined", "Pioneered"],
    growth: ["Spearheaded", "Drove", "Maximized", "Optimized", "Accelerated", "Grew", "Pioneered"],
    general: ["Spearheaded", "Optimized", "Engineered", "Executed", "Drove", "Improved", "Streamlined"]
  };

  const domainEnds = {
    systems: [
      "architecting high-throughput microservices to manage concurrent traffic loads",
      "reducing server response times by 30% and eliminating database bottleneck risks",
      "scaling data storage systems to support large concurrent data query loads",
      "establishing containerized deployments to optimize infrastructure footprint overhead"
    ],
    frontend: [
      "improving client responsiveness metrics and decreasing bundle load times by 25%",
      "optimizing client-side UI state flows and eliminating layout shift issues",
      "delivering pixel-perfect, accessible React components matching strict design specifications",
      "streamlining page rendering speeds to maximize customer retention conversion rates"
    ],
    growth: [
      "boosting customer acquisition funnel conversions by 18%",
      "driving direct pipeline revenue growth and maximizing monthly recurring business margins",
      "reducing client acquisition cost overhead through automated pipeline optimizations",
      "analyzing user journey metrics to optimize product feature adoption cycles"
    ],
    general: [
      "boosting operational efficiency and streamlining team delivery throughput by 15%",
      "optimizing resource usage and reducing project completion lifecycles",
      "implementing standardized testing workflows to guarantee perfect production stability",
      "automating manual development processes to save 10+ engineering hours weekly"
    ]
  };

  return bullets.map((b, idx) => {
    let trimmed = b.trim();
    if (!trimmed) return "";

    // Replace weak starters with domain-specific action verbs
    const verbs = actionVerbs[domain];
    const verb = verbs[idx % verbs.length];

    trimmed = trimmed.replace(
      /^(worked on|helped with|responsible for|assisted in|participated in|handled|created|built|developed|made)\s+/i,
      () => verb + " "
    );

    // Ensure the first letter is capitalized
    trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);

    // Append domain-specific metric/evidence if missing
    if (!/\d+%|\$\d+|\b\d+\s+(hours|users|pages|days|months|years|percent|percentile)\b/i.test(trimmed)) {
      const endsList = domainEnds[domain];
      const endPhrase = endsList[idx % endsList.length];
      const connector = trimmed.endsWith(".") ? " This resulted in " : ", ";
      trimmed = trimmed.replace(/\.?$/, "") + connector + endPhrase + ".";
    }

    return trimmed;
  });
}
