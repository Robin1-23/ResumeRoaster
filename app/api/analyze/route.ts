import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { analyzeResume } from "@/lib/analyze";
import { getCachedResponse, setCachedResponse, generateCacheKey, cleanAndTruncateText } from "@/lib/api-cache";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("resume") as File | null;
    const jd = formData.get("jd") as string || "";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are accepted." },
        { status: 400 }
      );
    }

    const MAX_SIZE = 8 * 1024 * 1024; // 8MB
    if (file.size > MAX_SIZE) {
      return NextResponse.json(
        { error: "File too large. Keep it under 8MB." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Custom page renderer to reconstruct spaces between words that have absolute layout
    const renderPage = (pageData: any): Promise<string> => {
      const render_options = {
        normalizeWhitespace: false,
        disableCombineTextItems: false
      };

      return pageData.getTextContent(render_options)
        .then(function(textContent: any) {
          let lastY = null;
          let lastX = null;
          let lastWidth = null;
          let text = "";

          for (const item of textContent.items) {
            const x = item.transform[4];
            const y = item.transform[5];
            const width = item.width;
            const fontSize = item.transform[0];

            if (lastY === null) {
              text += item.str;
            } else if (Math.abs(lastY - y) > 2) {
              text += "\n" + item.str;
            } else {
              const gap = x - (lastX + lastWidth);
              if (gap >= fontSize * 0.15 && text.length > 0 && text[text.length - 1] !== " ") {
                text += " ";
              }
              text += item.str;
            }

            lastY = y;
            lastX = x;
            lastWidth = width;
          }
          return text;
        });
    };

    // pdf-parse is CommonJS; dynamic import avoids bundling issues on the server.
    const pdfParse = (await import("pdf-parse")).default;
    const data = await pdfParse(buffer, { pagerender: renderPage });
    const text = data.text?.trim() || "";

    if (text.length < 20) {
      return NextResponse.json(
        {
          error:
            "Couldn't read any real text from that PDF. If it's a scanned image, it needs OCR first — this MVP only reads text-based PDFs."
        },
        { status: 422 }
      );
    }

    // Server-side cache lookup to optimize tokens usage and prevent server API limit crashes
    const cacheKey = generateCacheKey(text, jd);
    const cached = getCachedResponse(cacheKey);
    if (cached) {
      console.log("Serving /api/analyze from memory cache.");
      return NextResponse.json({
        originalText: text,
        score: cached.score,
        missingKeywords: cached.missingKeywords || [],
        suggestions: cached.suggestions || [],
        actionVerbs: cached.actionVerbs || []
      });
    }

    // Clean and compress text to minimize API token cost
    const cleanedResume = cleanAndTruncateText(text, 6000);
    const cleanedJd = cleanAndTruncateText(jd, 3000);

    const openaiApiKey = process.env.OPENAI_API_KEY;
    const geminiApiKey = process.env.GEMINI_API_KEY;

    let parsedData: any = null;

    if (openaiApiKey) {
      try {
        // Call OpenAI API
        const { OpenAI } = await import("openai");
        const openai = new OpenAI({ apiKey: openaiApiKey });

        let systemPrompt = "You are an expert ATS (Applicant Tracking System) optimizer and professional resume consultant. Perform a thorough comparative analysis of the candidate resume against the Job Description (JD). You must respond with a JSON object containing the fields: 'score' (number 10-99), 'missingKeywords' (string[]), 'suggestions' (string[]), 'actionVerbs' (string[]).";
        let userPrompt = "";

        if (cleanedJd.trim().length > 5) {
          userPrompt = `Resume Text:\n${cleanedResume}\n\nJob Description:\n${cleanedJd}`;
        } else {
          systemPrompt = "You are an expert resume reviewer. Perform a general analysis of the resume against industry best practices. You must respond with a JSON object containing the fields: 'score' (number 10-99), 'missingKeywords' (string[]), 'suggestions' (string[]), 'actionVerbs' (string[]).";
          userPrompt = `Resume Text:\n${cleanedResume}`;
        }

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
      } catch (apiErr) {
        console.error("OpenAI analysis failed, falling back to heuristics:", apiErr);
      }
    } else if (geminiApiKey) {
      try {
        // Call Gemini API
        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({
          model: "gemini-2.5-flash",
          generationConfig: { responseMimeType: "application/json" }
        });

        let prompt = "";
        if (cleanedJd.trim().length > 5) {
          prompt = `
    You are an expert ATS (Applicant Tracking System) optimizer and professional resume consultant.
    Perform a thorough comparative analysis of the following candidate resume against the provided Job Description (JD).

    Resume Text:
    ${cleanedResume}

    Job Description:
    ${cleanedJd}

    Respond with a JSON object in this exact schema:
    {
      "score": <number between 10 and 99 representing the ATS match level (higher is closer to the JD requirements)>,
      "missingKeywords": [<list of key skills, frameworks, tools, methodologies, or terms from the JD that are not mentioned or weak in the resume>],
      "suggestions": [<list of specific recommendations to improve experience paragraphs, structure, format, or sections to better fit the JD>],
      "actionVerbs": [<list of passive, repetitive, or weak verbs to replace (e.g. "assisted", "helped", "participated") with suggestions for stronger action verbs (e.g. "orchestrated", "engineered")>]
    }
    `;
        } else {
          prompt = `
    You are an expert resume reviewer. Perform a general analysis of the following resume text to assess its overall structural and content strength.

    Resume Text:
    ${cleanedResume}

    Since no Job Description (JD) was provided, review the resume against standard industry best practices for high-impact visual, grammatical, and content performance.

    Respond with a JSON object in this exact schema:
    {
      "score": <number between 10 and 99 representing the general resume quality score>,
      "missingKeywords": [<list of standard high-demand tools, practices, or skills relevant to the candidate's career line that could strengthen their profile>],
      "suggestions": [<list of specific formatting, section flow, structural, or clarity recommendations>],
      "actionVerbs": [<list of passive, repetitive, or weak verbs to replace with suggestion of stronger action verbs>]
    }
    `;
        }

        const aiResult = await model.generateContent(prompt);
        const responseText = aiResult.response.text();
        parsedData = JSON.parse(responseText);
      } catch (apiErr) {
        console.error("Gemini analysis failed, falling back to heuristics:", apiErr);
      }
    }

    // Heuristic Fallback if API keys are missing or API calls failed
    if (!parsedData) {
      console.log("Using offline local heuristic scoring engine.");
      const localResult = analyzeResume(text);

      let missingKeywords: string[] = [];
      if (jd.trim().length > 5) {
        const jdWords = jd.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9+#.-]/g, "")).filter(w => w.length > 2);
        const resumeWords = text.toLowerCase().split(/\s+/).map(w => w.replace(/[^a-z0-9+#.-]/g, ""));
        const stopWords = new Set(["the", "and", "for", "with", "this", "that", "you", "your", "from", "are", "about", "will", "our", "their", "more", "can", "into", "they", "them", "have", "has", "had", "been", "was", "were", "but", "not", "she", "her", "his", "its", "their", "whose", "what", "which", "who", "whom", "this", "that", "these", "those", "am", "is", "are", "was", "were", "be", "been", "being", "have", "has", "had", "having", "do", "does", "did", "doing", "would", "should", "could", "ought", "i'm", "you're", "he's", "she's", "it's", "we're", "they're", "i've", "you've", "we've", "they've", "i'd", "you'd", "he'd", "she'd", "we'd", "they'd", "i'll", "you'll", "he'll", "she'll", "we'll", "they'll", "isn't", "aren't", "wasn't", "weren't", "hasn't", "haven't", "hadn't", "doesn't", "don't", "didn't", "won't", "wouldn't", "shan't", "shouldn't", "can't", "cannot", "couldn't", "mustn't", "let's", "that's", "who's", "what's", "here's", "there's", "when's", "where's", "why's", "how's", "a", "an", "the", "and", "but", "if", "or", "because", "as", "until", "while", "of", "at", "by", "for", "with", "about", "against", "between", "into", "through", "during", "before", "after", "above", "below", "to", "from", "up", "down", "in", "out", "on", "off", "over", "under", "again", "further", "then", "once", "here", "there", "when", "where", "why", "how", "all", "any", "both", "each", "few", "more", "most", "other", "some", "such", "no", "nor", "not", "only", "own", "same", "so", "than", "too", "very", "s", "t", "can", "will", "just", "don", "should", "now"]);
        
        const commonTech = new Set([
          "react", "vue", "angular", "svelte", "next.js", "nextjs", "nuxt", "node", "nodejs",
          "express", "fastify", "django", "flask", "springboot", "laravel", "ruby", "rails",
          "python", "javascript", "typescript", "golang", "rust", "java", "c++", "c#", "php",
          "html", "css", "sass", "tailwind", "bootstrap", "graphql", "rest", "api", "apis",
          "sql", "mysql", "postgresql", "postgres", "mongodb", "redis", "elasticsearch",
          "docker", "kubernetes", "k8s", "aws", "gcp", "azure", "ci/cd", "git", "github",
          "jenkins", "terraform", "ansible", "linux", "agile", "scrum", "jira"
        ]);
        
        const missingSet = new Set<string>();
        for (const word of jdWords) {
          if (commonTech.has(word) && !resumeWords.includes(word)) {
            missingSet.add(word);
          }
        }
        missingKeywords = Array.from(missingSet).map(w => w.charAt(0).toUpperCase() + w.slice(1));
        if (missingKeywords.length === 0) {
          const uniqueWords = Array.from(new Set(jdWords)).filter(w => !stopWords.has(w) && !resumeWords.includes(w));
          missingKeywords = uniqueWords.slice(0, 5).map(w => w.charAt(0).toUpperCase() + w.slice(1));
        }
      } else {
        missingKeywords = ["Docker", "TypeScript", "CI/CD", "Unit Testing", "Kubernetes"];
      }

      const suggestions = localResult.checks
        .filter(c => c.status !== "pass")
        .map(c => `${c.label}: ${c.note}`);

      const actionVerbs = [
        "Bullet Strength: Replace passive terms with active verbs like: Led, Architected, Engineered, Spearheaded, Optimized."
      ];

      parsedData = {
        score: localResult.score,
        missingKeywords,
        suggestions,
        actionVerbs
      };
    }

    // Save to server-side cache for future quick matches
    if (parsedData) {
      setCachedResponse(cacheKey, parsedData);
    }

    return NextResponse.json({
      originalText: text,
      score: parsedData.score,
      missingKeywords: parsedData.missingKeywords || [],
      suggestions: parsedData.suggestions || [],
      actionVerbs: parsedData.actionVerbs || []
    });

  } catch (err) {
    console.error("analyze route error:", err);
    return NextResponse.json(
      { error: "Something went wrong while analyzing the file." },
      { status: 500 }
    );
  }
}
