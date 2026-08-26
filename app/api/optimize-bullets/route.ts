import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { rewriteBulletsRoleSpecificHeuristic } from "@/lib/bullet-rewriter";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bullets = [], jd = "" } = body;

    if (!Array.isArray(bullets)) {
      return NextResponse.json({ error: "bullets must be an array of strings." }, { status: 400 });
    }

    const cleanJd = jd.trim().substring(0, 3000);
    const openaiApiKey = process.env.OPENAI_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    let parsedData: any = null;

    const systemPrompt = `
    You are an expert resume writer and recruiter coach.
    Take the candidate's experience or project bullet points and rewrite them to specifically align with the priorities of the provided Job Description (JD).
    1. Identify the role domain (e.g. systems/backend scale, frontend UI responsiveness, startup sales/growth metrics).
    2. Rewrite each bullet point to speak the vocabulary of that domain (e.g. distributed systems, bundle size, conversion funnel).
    3. Keep the original achievements and facts, but reposition the framing to be high-impact. Do not fabricate lies or fake metrics.
    
    You must respond with a JSON object in this exact schema:
    {
      "bullets": ["rewritten bullet point 1", "rewritten bullet point 2", ...]
    }
    `;

    const userPrompt = `
    Bullets to rewrite:
    ${bullets.map((b, i) => `${i + 1}. ${b}`).join("\n")}

    Target Job Description (JD):
    ${cleanJd || "General Tech Role"}
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
        console.error("OpenAI bullet optimization failed, trying Gemini:", err);
      }
    }

    if (!parsedData && geminiApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        const aiResult = await model.generateContent(`${systemPrompt}\n\nInput Context:\n${userPrompt}`);
        const responseText = aiResult.response.text();
        parsedData = JSON.parse(responseText);
      } catch (err) {
        console.error("Gemini bullet optimization failed:", err);
      }
    }

    if (!parsedData || !Array.isArray(parsedData.bullets)) {
      console.log("No API keys found or model generation failed. Falling back to local role-specific rewriter.");
      const optimized = rewriteBulletsRoleSpecificHeuristic(bullets, cleanJd);
      parsedData = { bullets: optimized };
    }

    return NextResponse.json(parsedData);
  } catch (err: any) {
    console.error("Root bullet optimization API error:", err);
    return NextResponse.json(
      { error: "Bullet optimization failed. " + (err.message || "") },
      { status: 500 }
    );
  }
}
