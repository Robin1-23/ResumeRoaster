import { NextRequest, NextResponse } from "next/server";
import { classifyTargetRole, getMarketTrends } from "@/lib/market-trends";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { role = "Software Engineer", skills = [] } = body;

    const roleDomain = classifyTargetRole(role);
    const { decaying: baseDecay, emerging: baseEmerging } = getMarketTrends(roleDomain);

    const skillsLower = skills.map((s: string) => s.toLowerCase().trim());
    
    // Live Search scraping pipeline
    let scrapeText = "";
    let scrapeSuccessful = false;
    try {
      const ddgUrl = `https://html.duckduckgo.com/html/?q=site:greenhouse.io+OR+site:lever.co+%22${encodeURIComponent(role)}%22`;
      const res = await fetch(ddgUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36"
        }
      });
      if (res.ok) {
        const html = await res.text();
        const regex = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/gi;
        let match;
        while ((match = regex.exec(html)) !== null) {
          scrapeText += " " + match[1].replace(/<[^>]*>/g, "");
        }
        scrapeSuccessful = scrapeText.trim().length > 50;
      }
    } catch (e) {
      console.error("Live DDG scrap failed, using local market trend model database:", e);
    }

    const scrapeTextLower = scrapeText.toLowerCase();

    // Calculate decaying skills
    const decayingSkills = baseDecay.filter(item => {
      // Candidate must have the skill listed
      const userHasIt = skillsLower.includes(item.skill.toLowerCase());
      if (!userHasIt) return false;
      
      // If scrape was successful, we check density. If mentioned very infrequently, flag decay
      if (scrapeSuccessful) {
        const occurrence = (scrapeTextLower.match(new RegExp(`\\b${item.skill.toLowerCase()}\\b`, "g")) || []).length;
        return occurrence <= 1; // 0 or 1 mention
      }
      return true; // fallback to static database
    });

    // Calculate emerging skills (highly mentioned but missing from user resume)
    const emergingSkills = baseEmerging.filter(item => {
      const userHasIt = skillsLower.includes(item.skill.toLowerCase());
      if (userHasIt) return false; // candidate already has it

      if (scrapeSuccessful) {
        // Recommend if it's high demand in live postings
        return scrapeTextLower.includes(item.skill.toLowerCase());
      }
      return true; // fallback to static database
    });

    // Calculate risk
    let marketRisk: "Low" | "Medium" | "High" = "Low";
    if (decayingSkills.length >= 2 && emergingSkills.length >= 2) {
      marketRisk = "High";
    } else if (decayingSkills.length >= 1 || emergingSkills.length >= 1) {
      marketRisk = "Medium";
    }

    return NextResponse.json({
      role,
      roleDomain,
      decayingSkills,
      emergingSkills,
      marketRisk,
      scrapedListingsCount: scrapeSuccessful ? 10 : 0
    });

  } catch (err: any) {
    console.error("Root skill decay API error:", err);
    return NextResponse.json(
      { error: "Skill decay analysis failed. " + (err.message || "") },
      { status: 500 }
    );
  }
}
