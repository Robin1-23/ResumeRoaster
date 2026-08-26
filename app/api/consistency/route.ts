import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { analyzeConsistencyHeuristic } from "@/lib/consistency";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { resumeText = "", linkedinText = "", githubText = "", portfolioText = "" } = body;

    const cleanResume = resumeText.trim().substring(0, 6000);
    const cleanLinkedin = linkedinText.trim().substring(0, 4000);
    const cleanGithub = githubText.trim().substring(0, 5000);
    const cleanPortfolio = portfolioText.trim().substring(0, 3000);

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    let parsedData: any = null;

    const systemPrompt = `
    You are a professional technical recruiter and profile auditor. 
    Compare the candidate's Resume against their pasted LinkedIn text, GitHub public repository summary, and Portfolio text.
    Check for:
    1. Timeline consistency (employment dates, company match, gaps).
    2. Role/Title alignment (exact titles, seniority).
    3. Technical proof & skills coverage (skills claimed in resume versus visible work on GitHub/portfolio).
    
    You must respond with a JSON object in this exact schema:
    {
      "overallScore": <number 0-100 representing overall profile consistency>,
      "categories": {
        "timeline": {
          "score": <number 0-100>,
          "status": "PASS" | "WARN" | "FAIL",
          "findings": [<list of timeline discrepancies or confirmations>]
        },
        "titles": {
          "score": <number 0-100>,
          "status": "PASS" | "WARN" | "FAIL",
          "findings": [<list of title mismatches or confirmations>]
        },
        "skills": {
          "score": <number 0-100>,
          "status": "PASS" | "WARN" | "FAIL",
          "findings": [<list of skill verification findings, highlighting unbacked skills or validated skills>]
        }
      },
      "suggestions": [<list of clear, actionable suggestions to resolve profile discrepancies>]
    }
    `;

    const userPrompt = `
    Resume Text:
    ${cleanResume}

    LinkedIn Profile Text:
    ${cleanLinkedin || "(Not provided)"}

    GitHub Profile & Repositories Summary:
    ${cleanGithub || "(Not provided)"}

    Portfolio Website Content:
    ${cleanPortfolio || "(Not provided)"}
    `;

    if (openaiApiKey) {
      try {
        const { OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: openaiApiKey });

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ],
          response_format: { type: "json_object" }
        });

        const responseText = response.choices[0].message.content || "{}";
        parsedData = JSON.parse(responseText);
      } catch (err) {
        console.error("OpenAI consistency check failed, trying Gemini:", err);
      }
    }

    if (!parsedData && geminiApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        const aiResult = await model.generateContent(`${systemPrompt}\n\nCandidate Profiles:\n${userPrompt}`);
        const responseText = aiResult.response.text();
        parsedData = JSON.parse(responseText);
      } catch (err) {
        console.error("Gemini consistency check failed:", err);
      }
    }

    if (!parsedData) {
      console.log("No API keys found or model generation failed. Falling back to local heuristic consistency checker.");
      parsedData = analyzeConsistencyHeuristic(cleanResume, cleanLinkedin, cleanGithub, cleanPortfolio);
    }

    return NextResponse.json(parsedData);
  } catch (err: any) {
    console.error("Root consistency API error:", err);
    return NextResponse.json(
      { error: "Consistency review failed. " + (err.message || "") },
      { status: 500 }
    );
  }
}
