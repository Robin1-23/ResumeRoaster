import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question = "", defense = "" } = body;

    if (!question.trim() || !defense.trim()) {
      return NextResponse.json({ error: "question and defense strings are required." }, { status: 400 });
    }

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    let parsedData: any = null;

    const systemPrompt = `
    You are an elite technical interviewer grilling a candidate on their resume claims.
    Evaluate the candidate's spoken or typed defense to a tough follow-up question.
    
    Question asked: "${question}"
    Candidate's defense: "${defense}"
    
    Judge if the candidate gave a concrete, technically detailed answer (approved) or if they gave a vague, buzzword-heavy response that dodges the question (cooked).
    
    You must respond with a JSON object in this exact schema:
    {
      "score": 85, // number between 0 and 100
      "verdict": "Approved", // "Approved" | "Borderline" | "Cooked"
      "feedback": "detailed plain-English feedback on their defense."
    }
    `;

    if (openaiApiKey) {
      try {
        const { OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: openaiApiKey });

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: systemPrompt }],
          response_format: { type: "json_object" }
        });

        const responseText = response.choices[0].message.content || "{}";
        parsedData = JSON.parse(responseText);
      } catch (err) {
        console.error("OpenAI defense evaluation failed, trying Gemini:", err);
      }
    }

    if (!parsedData && geminiApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        const aiResult = await model.generateContent(systemPrompt);
        const responseText = aiResult.response.text();
        parsedData = JSON.parse(responseText);
      } catch (err) {
        console.error("Gemini defense evaluation failed:", err);
      }
    }

    // Heuristic Offline Fallback
    if (!parsedData) {
      console.log("No API keys found or model generation failed. Falling back to local defense evaluator heuristics.");
      
      const defenseLower = defense.toLowerCase();
      const length = defense.trim().length;

      let score = 50;
      let verdict: "Approved" | "Borderline" | "Cooked" = "Borderline";
      let feedback = "";

      if (length < 25) {
        score = 25;
        verdict = "Cooked";
        feedback = "Your defense is way too short. You gave a single-word or extremely brief response. In a real interview, this shows you either don't know the tech or fabricated the bullet point.";
      } else if (length < 75) {
        score = 55;
        verdict = "Borderline";
        feedback = "You gave a basic answer but failed to explain the engineering trade-offs, metrics, or technologies used. Make it more detailed to sound convincing.";
      } else {
        // Check for technical buzzwords
        const techKeywords = [
          "because", "specifically", "lighthouse", "webpack", "latency", "redis", "cache", "profiling", 
          "index", "query", "docker", "kubernetes", "layer", "pod", "async", "components", "measured"
        ];
        const matchCount = techKeywords.filter(k => defenseLower.includes(k)).length;

        if (matchCount >= 2) {
          score = 85;
          verdict = "Approved";
          feedback = "Excellent defense! You provided specific details, used technical terminology, and outlined how or why you made the claim. This is exactly how you handle tough interviewers.";
        } else {
          score = 65;
          verdict = "Borderline";
          feedback = "Your defense has good length, but it sounds like a generic explanation. Try to focus more on the concrete actions you took and the technical tooling used.";
        }
      }

      parsedData = { score, verdict, feedback };
    }

    return NextResponse.json(parsedData);
  } catch (err: any) {
    console.error("Root defense evaluation API error:", err);
    return NextResponse.json(
      { error: "Defense evaluation failed. " + (err.message || "") },
      { status: 500 }
    );
  }
}
